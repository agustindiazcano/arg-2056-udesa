import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "check_no_mock.py"

PLACEHOLDER_ERAS = """export const ERAS = [
  { id: 'era-a', startYear: 1880, endYear: 1929, label: 'Era A (placeholder)', source_id: null, placeholder: true },
  {
    id: 'era-b',
    startYear: 1930,
    endYear: 1979,
    label: 'Era B (placeholder)',
    source_id: null,
    placeholder: true
  },
  { id: 'era-c', startYear: 1980, endYear: 2025, label: 'Era C', source_id: 'x:1', placeholder: false }
];
"""

REAL_ERAS = """export const ERAS = [
  { id: 'era-a', startYear: 1880, endYear: 1929, label: 'Real era', source_id: 'x:1', placeholder: false }
];
"""


def run(*args, cwd=None):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, check=False, cwd=cwd)


def make_content(tmp_path, text, name="eras.ts"):
    content = tmp_path / "content"
    content.mkdir()
    (content / name).write_text(text, encoding="utf-8")
    return content


def test_placeholder_entries_fail_the_gate_and_their_ids_are_printed(tmp_path):
    content = make_content(tmp_path, PLACEHOLDER_ERAS)
    result = run("--content", str(content))
    assert result.returncode == 1
    assert "era-a" in result.stdout
    assert "era-b" in result.stdout
    assert "era-c" not in result.stdout  # placeholder: false
    assert "Placeholder content" in result.stdout
    assert "eras.ts" in result.stdout


def test_the_gate_passes_when_no_entry_is_a_placeholder(tmp_path):
    content = make_content(tmp_path, REAL_ERAS)
    result = run("--content", str(content))
    assert result.returncode == 0, result.stdout
    assert result.stdout.strip() == ""


def test_a_missing_content_directory_is_skipped(tmp_path):
    result = run("--content", str(tmp_path / "missing"))
    assert result.returncode == 0


def test_nested_files_and_json_are_scanned(tmp_path):
    content = tmp_path / "content"
    (content / "deep").mkdir(parents=True)
    (content / "deep" / "story.json").write_text('[{"id": "step-1", "placeholder": true}]', encoding="utf-8")
    result = run("--content", str(content))
    assert result.returncode == 1
    assert "step-1" in result.stdout


def test_the_mock_check_still_works_next_to_the_content_check(tmp_path):
    content = make_content(tmp_path, REAL_ERAS)
    data = tmp_path / "data"
    data.mkdir()
    (data / "valid.json").write_text('{"source": "MOCK"}', encoding="utf-8")
    result = run(str(data), "--content", str(content))
    assert result.returncode == 1
    assert "source: MOCK" in result.stdout

    clean = tmp_path / "clean"
    clean.mkdir()
    (clean / "valid.json").write_text('{"source": "real"}', encoding="utf-8")
    assert run(str(clean), "--content", str(content)).returncode == 0


def test_both_checks_report_when_both_fail(tmp_path):
    content = make_content(tmp_path, PLACEHOLDER_ERAS)
    data = tmp_path / "data"
    data.mkdir()
    (data / "valid.json").write_text('{"source": "MOCK"}', encoding="utf-8")
    result = run(str(data), "--content", str(content))
    assert result.returncode == 1
    assert "source: MOCK" in result.stdout
    assert "era-a" in result.stdout


def test_default_run_looks_at_web_src_content_relative_to_the_working_directory(tmp_path):
    (tmp_path / "web" / "src" / "content").mkdir(parents=True)
    (tmp_path / "web" / "src" / "content" / "eras.ts").write_text(PLACEHOLDER_ERAS, encoding="utf-8")
    result = run(cwd=tmp_path)
    assert result.returncode == 1
    assert "era-a" in result.stdout

    (tmp_path / "web" / "src" / "content" / "eras.ts").write_text(REAL_ERAS, encoding="utf-8")
    assert run(cwd=tmp_path).returncode == 0


def test_explicit_data_dirs_do_not_scan_the_default_content_directory(tmp_path):
    (tmp_path / "web" / "src" / "content").mkdir(parents=True)
    (tmp_path / "web" / "src" / "content" / "eras.ts").write_text(PLACEHOLDER_ERAS, encoding="utf-8")
    clean = tmp_path / "clean"
    clean.mkdir()
    (clean / "valid.json").write_text('{"source": "real"}', encoding="utf-8")
    assert run(str(clean), cwd=tmp_path).returncode == 0
