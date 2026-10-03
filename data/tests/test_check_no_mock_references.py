import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "check_no_mock.py"

SOURCE = {"id": "s:A", "url": "https://example.com/a", "title": "T", "authors_or_publisher": "P"}


def write(tmp_path, *, mock, sources, name="references.json"):
    path = tmp_path / name
    path.write_text(json.dumps({"mock": mock, "sources": sources, "leads": [], "attributions": [], "stats": {}}), encoding="utf-8")
    return path


def run(*args, cwd=None):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, check=False, cwd=cwd)


def test_mock_references_fail_the_gate_and_say_why(tmp_path):
    path = write(tmp_path, mock=True, sources=[SOURCE])
    result = run("--references", str(path))
    assert result.returncode == 1
    assert "references.json has mock: true" in result.stdout
    assert "lists no sources" not in result.stdout


def test_empty_sources_fail_the_gate_and_say_why(tmp_path):
    path = write(tmp_path, mock=False, sources=[])
    result = run("--references", str(path))
    assert result.returncode == 1
    assert "references.json lists no sources" in result.stdout
    assert "mock: true" not in result.stdout


def test_both_conditions_are_reported(tmp_path):
    path = write(tmp_path, mock=True, sources=[])
    result = run("--references", str(path))
    assert result.returncode == 1
    assert "mock: true" in result.stdout
    assert "lists no sources" in result.stdout


def test_real_references_pass(tmp_path):
    path = write(tmp_path, mock=False, sources=[SOURCE])
    result = run("--references", str(path))
    assert result.returncode == 0, result.stdout
    assert result.stdout.strip() == ""


def test_an_explicit_references_file_that_is_missing_fails(tmp_path):
    result = run("--references", str(tmp_path / "missing.json"))
    assert result.returncode == 1
    assert "references file not found" in result.stdout


def test_an_invalid_references_file_exits_2(tmp_path):
    bad = tmp_path / "references.json"
    bad.write_text("{broken", encoding="utf-8")
    assert run("--references", str(bad)).returncode == 2


def test_the_other_checks_still_run_with_the_references_check(tmp_path):
    references = write(tmp_path, mock=False, sources=[SOURCE])
    data = tmp_path / "data"
    data.mkdir()
    (data / "valid.json").write_text('{"source": "MOCK"}', encoding="utf-8")
    result = run(str(data), "--references", str(references))
    assert result.returncode == 1
    assert "source: MOCK" in result.stdout


def test_the_default_run_checks_web_public_data_references_when_it_exists(tmp_path):
    (tmp_path / "web" / "public" / "data").mkdir(parents=True)
    path = tmp_path / "web" / "public" / "data" / "references.json"
    path.write_text(json.dumps({"mock": True, "sources": [], "leads": [], "attributions": [], "stats": {}}), encoding="utf-8")
    result = run(cwd=tmp_path)
    assert result.returncode == 1
    assert "references.json has mock: true" in result.stdout
    path.unlink()
    assert run(cwd=tmp_path).returncode == 0  # absent in a default run: skipped
