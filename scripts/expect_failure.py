"""Runs a command that is expected to fail and checks why.

usage: expect_failure.py <command...> [--stderr-contains TEXT] [--stdout-contains TEXT]

Exit 0 only when the command exits non-zero and every given text is found in the stream it names.
Exit 1 when the command succeeds or a text is missing (what happened is printed on stdout).
Exit 2 for a usage error or a command that cannot be started.

Words that are not one of the two options belong to the command, in order, so the command may have flags of its
own. `--` ends the options: everything after it is the command.
"""

import shutil
import subprocess
import sys

USAGE = "usage: expect_failure.py <command...> [--stderr-contains TEXT] [--stdout-contains TEXT]"
TAIL_LINES = 40


def parse(argv):
    """Returns (command, stdout_texts, stderr_texts), or None for a usage error."""
    command, stdout_texts, stderr_texts = [], [], []
    i = 0
    while i < len(argv):
        word = argv[i]
        if word == "--":
            command.extend(argv[i + 1:])
            break
        if word in ("--stdout-contains", "--stderr-contains"):
            if i + 1 >= len(argv):
                return None
            (stdout_texts if word == "--stdout-contains" else stderr_texts).append(argv[i + 1])
            i += 2
            continue
        command.append(word)
        i += 1
    if not command or not (stdout_texts or stderr_texts):
        return None
    return command, stdout_texts, stderr_texts


def tail(text):
    lines = text.splitlines()
    return "\n".join(lines[-TAIL_LINES:])


def main(argv=None):
    parsed = parse(sys.argv[1:] if argv is None else argv)
    if parsed is None:
        print(USAGE, file=sys.stderr)
        return 2
    command, stdout_texts, stderr_texts = parsed

    # resolve the program so that npm.cmd and friends also work on Windows
    program = shutil.which(command[0]) or command[0]
    try:
        result = subprocess.run([program, *command[1:]], capture_output=True, text=True, check=False)
    except OSError as exc:
        print(f"expect_failure: cannot run {command[0]}: {exc}", file=sys.stderr)
        return 2

    problems = []
    if result.returncode == 0:
        problems.append("expect_failure: command exited 0, expected a non-zero exit")
    for text in stdout_texts:
        if text not in result.stdout:
            problems.append(f'expect_failure: stdout does not contain "{text}"')
    for text in stderr_texts:
        if text not in result.stderr:
            problems.append(f'expect_failure: stderr does not contain "{text}"')

    if problems:
        for problem in problems:
            print(problem)
        print(f"expect_failure: the command exited {result.returncode}; its last stdout lines:")
        print(tail(result.stdout))
        print("expect_failure: its last stderr lines:")
        print(tail(result.stderr))
        return 1

    print(f"expect_failure: OK (the command exited {result.returncode} and printed the expected text)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
