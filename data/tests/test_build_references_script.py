import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "build_references.py"


def run(*args, cwd):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, check=False, cwd=cwd)


def test_the_script_builds_the_file_from_any_working_directory(tmp_path):
    data = tmp_path / "data"
    data.mkdir()
    (data / "economy.json").write_text(json.dumps([{"source": "MOCK", "source_url": None, "value": 1}]), encoding="utf-8")
    out = data / "references.json"
    result = run(
        "--sources", str(tmp_path / "sources.json"), "--data-dir", str(data), "--terrain-dir", str(tmp_path / "t"),
        "--geo-meta", str(tmp_path / "g.json"), "--out", str(out), cwd=tmp_path,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    doc = json.loads(out.read_text(encoding="utf-8"))
    assert doc["mock"] is True
    assert doc["sources"] == []


def test_the_script_reports_errors_with_exit_1_and_usage_errors_with_exit_2(tmp_path):
    (tmp_path / "sources.json").write_text("[{}]", encoding="utf-8")
    failing = run("--sources", str(tmp_path / "sources.json"), "--data-dir", str(tmp_path), "--out", str(tmp_path / "o.json"), cwd=tmp_path)
    assert failing.returncode == 1
    assert "ERROR sources.json invalid" in failing.stdout
    assert run("--bogus", cwd=tmp_path).returncode == 2
