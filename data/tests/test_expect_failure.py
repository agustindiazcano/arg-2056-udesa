import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "expect_failure.py"


def run(*args):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, check=False)


def failing(stdout="", stderr="", exit_code=3):
    """A python -c command that prints to stdout and stderr and exits with exit_code."""
    code = f"import sys; sys.stdout.write({stdout!r}); sys.stderr.write({stderr!r}); sys.exit({exit_code})"
    return [sys.executable, "-c", code]


def test_a_failing_command_with_the_text_in_stderr_exits_0():
    result = run(*failing(stderr="Release gate: file x has source: MOCK"), "--stderr-contains", "source: MOCK")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "expect_failure: OK" in result.stdout


def test_a_failing_command_with_the_text_in_stdout_exits_0():
    result = run(*failing(stdout="File contains source: MOCK: data.json\n"), "--stdout-contains", "source: MOCK")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "expect_failure: OK" in result.stdout


def test_when_both_texts_are_given_both_must_be_found():
    command = failing(stdout="out text", stderr="err text")
    ok = run(*command, "--stdout-contains", "out text", "--stderr-contains", "err text")
    assert ok.returncode == 0, ok.stdout + ok.stderr

    missing = run(*command, "--stdout-contains", "out text", "--stderr-contains", "nope")
    assert missing.returncode == 1
    assert 'stderr does not contain "nope"' in missing.stdout


def test_a_failing_command_without_the_text_exits_1_and_says_so():
    result = run(*failing(stderr="something else entirely"), "--stderr-contains", "source: MOCK")
    assert result.returncode == 1
    assert 'expect_failure: stderr does not contain "source: MOCK"' in result.stdout
    assert "something else entirely" in result.stdout  # shows what the command printed


def test_the_text_is_looked_for_in_the_requested_stream_only():
    result = run(*failing(stdout="source: MOCK"), "--stderr-contains", "source: MOCK")
    assert result.returncode == 1
    assert "stderr does not contain" in result.stdout


def test_a_command_that_succeeds_exits_1():
    result = run(sys.executable, "-c", "print('source: MOCK')", "--stdout-contains", "source: MOCK")
    assert result.returncode == 1
    assert "expect_failure: command exited 0, expected a non-zero exit" in result.stdout


def test_command_arguments_that_look_like_flags_stay_with_the_command():
    result = run(
        sys.executable,
        "-c",
        "import sys; print(sys.argv[1:]); sys.exit(1)",
        "--prefix",
        "web",
        "--stdout-contains",
        "--prefix",
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_a_double_dash_ends_the_options():
    result = run("--stdout-contains", "x", "--", sys.executable, "-c", "print('x'); raise SystemExit(1)")
    assert result.returncode == 0, result.stdout + result.stderr


def test_no_command_is_a_usage_error():
    result = run("--stderr-contains", "x")
    assert result.returncode == 2
    assert "usage: expect_failure.py" in result.stderr


def test_no_expected_text_is_a_usage_error():
    result = run(sys.executable, "-c", "raise SystemExit(1)")
    assert result.returncode == 2
    assert "usage: expect_failure.py" in result.stderr


def test_a_flag_without_its_value_is_a_usage_error():
    result = run(sys.executable, "-c", "raise SystemExit(1)", "--stderr-contains")
    assert result.returncode == 2
    assert "usage: expect_failure.py" in result.stderr


def test_a_command_that_cannot_be_started_is_a_usage_error():
    result = run("this-command-does-not-exist-anywhere", "--stderr-contains", "x")
    assert result.returncode == 2
    assert "cannot run this-command-does-not-exist-anywhere" in result.stderr
