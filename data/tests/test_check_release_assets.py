import struct
import subprocess
import sys
import zlib
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "check_release_assets.py"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def png(width, height, padding=0):
    """A PNG file with a real IHDR; `padding` extra bytes make it bigger."""

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return PNG_SIGNATURE + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(b"\x00" * 3)) + b"\x00" * padding + chunk(b"IEND", b"")


def run(public):
    return subprocess.run([sys.executable, str(SCRIPT), "--public", str(public)], capture_output=True, text=True, check=False)


def good_public(tmp_path):
    public = tmp_path / "public"
    public.mkdir()
    (public / "og.png").write_bytes(png(1200, 630))
    (public / "favicon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>', encoding="utf-8")
    return public


def test_both_files_correct_exits_0(tmp_path):
    result = run(good_public(tmp_path))
    assert result.returncode == 0, result.stdout + result.stderr
    assert "release assets: OK" in result.stdout


def test_missing_og_image_exits_1_and_says_so(tmp_path):
    public = good_public(tmp_path)
    (public / "og.png").unlink()
    result = run(public)
    assert result.returncode == 1
    assert "og.png: missing" in result.stdout


def test_an_og_image_that_is_not_a_png_exits_1(tmp_path):
    public = good_public(tmp_path)
    (public / "og.png").write_bytes(b"\xff\xd8\xff\xe0 this is a jpeg")
    result = run(public)
    assert result.returncode == 1
    assert "og.png: not a PNG file" in result.stdout


def test_an_og_image_of_the_wrong_size_exits_1_and_gives_both_sizes(tmp_path):
    public = good_public(tmp_path)
    (public / "og.png").write_bytes(png(1200, 600))
    result = run(public)
    assert result.returncode == 1
    assert "og.png: must be 1200x630 pixels, found 1200x600" in result.stdout


def test_an_oversized_og_image_exits_1_and_gives_the_size(tmp_path):
    public = good_public(tmp_path)
    data = png(1200, 630, padding=600 * 1024)
    (public / "og.png").write_bytes(data)
    result = run(public)
    assert result.returncode == 1
    assert f"og.png: larger than 600 KB ({len(data)} bytes)" in result.stdout


def test_exactly_600_kb_is_allowed(tmp_path):
    public = good_public(tmp_path)
    base = len(png(1200, 630))
    (public / "og.png").write_bytes(png(1200, 630, padding=600 * 1024 - base))
    assert (public / "og.png").stat().st_size == 600 * 1024
    assert run(public).returncode == 0


def test_a_truncated_png_is_not_a_png_file(tmp_path):
    public = good_public(tmp_path)
    (public / "og.png").write_bytes(PNG_SIGNATURE + b"\x00\x00")
    result = run(public)
    assert result.returncode == 1
    assert "og.png: not a PNG file" in result.stdout


def test_missing_favicon_exits_1_and_says_so(tmp_path):
    public = good_public(tmp_path)
    (public / "favicon.svg").unlink()
    result = run(public)
    assert result.returncode == 1
    assert "favicon.svg: missing" in result.stdout


def test_a_placeholder_favicon_exits_1(tmp_path):
    public = good_public(tmp_path)
    (public / "favicon.svg").write_text("<!-- PLACEHOLDER: replace before release --><svg xmlns='http://www.w3.org/2000/svg'/>", encoding="utf-8")
    result = run(public)
    assert result.returncode == 1
    assert "favicon.svg: still the placeholder" in result.stdout


def test_every_problem_is_listed_not_only_the_first(tmp_path):
    public = tmp_path / "public"
    public.mkdir()
    result = run(public)
    assert result.returncode == 1
    assert "og.png: missing" in result.stdout
    assert "favicon.svg: missing" in result.stdout


def test_a_missing_public_folder_exits_2(tmp_path):
    result = run(tmp_path / "nope")
    assert result.returncode == 2
    assert "not a folder" in result.stderr


def test_without_arguments_it_checks_web_public_of_the_repository():
    result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True, check=False)
    assert result.returncode in (0, 1)
    assert "og.png" in result.stdout or "release assets: OK" in result.stdout
