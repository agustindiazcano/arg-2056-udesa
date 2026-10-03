"""The content gate must see placeholder story steps: objects with a nested `focus` and keyed by scene."""

import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "check_no_mock.py"

PLACEHOLDER_STEPS = """import type { StepsByScene } from '../../story/types';

// the doc comment may say `placeholder: true` without being an entry
export const STEPS: StepsByScene = {
  andes: [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2', text: TEXT, focus: {}, source_ids: [], placeholder: false }
  ],
  economy: [
    { id: 'step-1', title: 'Step 1', text: TEXT, focus: { year: parseYear(1880) }, source_ids: [], placeholder: true },
    {
      id: 'step-2',
      title: 'Step 2',
      text: TEXT,
      focus: { scenario: 'optimistic', play: { fromYear: parseYear(2026), toYear: parseYear(2056) } },
      source_ids: [],
      placeholder: true
    }
  ],
  'ai-revolution': [
    { id: 'step-7', title: 'T', text: TEXT, focus: { aiOverlay: true }, source_ids: [], placeholder: true }
  ]
};
"""

REAL_STEPS = """// the doc comment may say `placeholder: true` without being an entry
export const STEPS = {
  andes: [
    { id: 'step-1', title: 'A real title', text: 'Real text', focus: { year: 1880 }, source_ids: ['x:1'], placeholder: false }
  ],
  economy: [
    {
      id: 'step-1',
      title: 'Another',
      text: 'More',
      focus: { play: { fromYear: 1990, toYear: 2000 } },
      source_ids: [],
      placeholder: false
    }
  ]
};
"""


def run(*args, cwd=None):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, check=False, cwd=cwd)


def make_steps(tmp_path, text):
    content = tmp_path / "content"
    (content / "steps").mkdir(parents=True)
    (content / "steps" / "index.ts").write_text(text, encoding="utf-8")
    return content


def printed(result):
    return [line for line in result.stdout.splitlines() if line.startswith("Placeholder content")]


def test_steps_with_a_nested_focus_are_found_and_printed_with_their_scene_and_id(tmp_path):
    result = run("--content", str(make_steps(tmp_path, PLACEHOLDER_STEPS)))
    assert result.returncode == 1
    lines = printed(result)
    assert [line.rsplit(": ", 1)[1] for line in lines] == [
        "andes/step-1",
        "economy/step-1",
        "economy/step-2",
        "ai-revolution/step-7",
    ]
    assert all("index.ts" in line for line in lines)


def test_a_step_with_placeholder_false_is_not_reported(tmp_path):
    result = run("--content", str(make_steps(tmp_path, PLACEHOLDER_STEPS)))
    assert "andes/step-2" not in result.stdout


def test_the_same_step_id_in_two_scenes_is_reported_for_each_scene(tmp_path):
    result = run("--content", str(make_steps(tmp_path, PLACEHOLDER_STEPS)))
    assert "andes/step-1" in result.stdout
    assert "economy/step-1" in result.stdout


def test_steps_without_placeholders_pass_the_gate_silently(tmp_path):
    result = run("--content", str(make_steps(tmp_path, REAL_STEPS)))
    assert result.returncode == 0, result.stdout
    assert result.stdout.strip() == ""


def test_a_placeholder_word_in_a_comment_outside_any_object_is_not_an_entry(tmp_path):
    text = "// entries have `placeholder: true` until the human writes them\nexport const X = [];\n"
    result = run("--content", str(make_steps(tmp_path, text)))
    assert result.returncode == 0, result.stdout


def test_flat_entries_keep_printing_just_their_id(tmp_path):
    content = tmp_path / "content"
    content.mkdir()
    (content / "eras.ts").write_text(
        "export const ERAS = [\n  { id: 'era-a', label: 'A', placeholder: true }\n];\n", encoding="utf-8"
    )
    result = run("--content", str(content))
    assert result.returncode == 1
    assert printed(result)[0].endswith("eras.ts: era-a")


def test_an_entry_without_an_id_is_reported_as_no_id(tmp_path):
    content = tmp_path / "content"
    content.mkdir()
    (content / "x.ts").write_text("export const X = [{ placeholder: true, focus: { a: 1 } }];\n", encoding="utf-8")
    result = run("--content", str(content))
    assert result.returncode == 1
    assert printed(result)[0].endswith("x.ts: <no id>")


def test_the_mock_check_still_works_next_to_the_steps_check(tmp_path):
    content = make_steps(tmp_path, REAL_STEPS)
    data = tmp_path / "data"
    data.mkdir()
    (data / "valid.json").write_text('{"source": "MOCK"}', encoding="utf-8")
    result = run(str(data), "--content", str(content))
    assert result.returncode == 1
    assert "source: MOCK" in result.stdout

    (tmp_path / "two").mkdir()
    both = make_steps(tmp_path / "two", PLACEHOLDER_STEPS)
    result = run(str(data), "--content", str(both))
    assert result.returncode == 1
    assert "source: MOCK" in result.stdout
    assert "andes/step-1" in result.stdout
