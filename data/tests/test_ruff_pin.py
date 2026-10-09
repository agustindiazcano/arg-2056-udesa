import re
import subprocess
import sys
from pathlib import Path

REQUIREMENTS = Path(__file__).resolve().parents[2] / "requirements-dev.txt"


def pinned_ruff_version():
    match = re.search(r"^ruff==(\S+)\s*$", REQUIREMENTS.read_text(encoding="utf-8"), re.MULTILINE)
    return match.group(1) if match else None


def test_ruff_is_pinned_to_an_exact_version():
    assert pinned_ruff_version() is not None, "requirements-dev.txt must pin ruff with ruff==X.Y.Z"


def test_installed_ruff_is_the_pinned_one():
    out = subprocess.run([sys.executable, "-m", "ruff", "--version"], capture_output=True, text=True, check=True).stdout.strip()
    assert out == f"ruff {pinned_ruff_version()}", f"installed {out!r}, pinned {pinned_ruff_version()!r}: run pip install -r requirements-dev.txt"
