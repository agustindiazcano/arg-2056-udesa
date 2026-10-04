"""Release check of the files only the human can supply: the link-preview image and the favicon.

usage: check_release_assets.py [--public DIR]

DIR defaults to web/public. Checks, and lists every problem it finds:
- og.png exists, is a PNG of exactly 1200 by 630 pixels (read from the IHDR header; no image library) and is at most
  600 KB;
- favicon.svg exists and is not the placeholder (its text does not contain "PLACEHOLDER").

Exit 0 when all pass, 1 when any fails, 2 for a usage error.
"""

import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
OG_SIZE = (1200, 630)
OG_MAX_BYTES = 600 * 1024


def check_og_image(path):
    if not path.is_file():
        return [f"og.png: missing ({path})"]
    data = path.read_bytes()
    if len(data) < 24 or data[:8] != PNG_SIGNATURE or data[12:16] != b"IHDR":
        return ["og.png: not a PNG file"]
    width, height = struct.unpack(">II", data[16:24])
    problems = []
    if (width, height) != OG_SIZE:
        problems.append(f"og.png: must be {OG_SIZE[0]}x{OG_SIZE[1]} pixels, found {width}x{height}")
    if len(data) > OG_MAX_BYTES:
        problems.append(f"og.png: larger than 600 KB ({len(data)} bytes)")
    return problems


def check_favicon(path):
    if not path.is_file():
        return [f"favicon.svg: missing ({path})"]
    if "PLACEHOLDER" in path.read_text(encoding="utf-8", errors="replace"):
        return ["favicon.svg: still the placeholder"]
    return []


def main(argv=None):
    args = list(sys.argv[1:] if argv is None else argv)
    public = ROOT / "web" / "public"
    if args[:1] == ["--public"] and len(args) == 2:
        public = Path(args[1])
    elif args:
        print("usage: check_release_assets.py [--public DIR]", file=sys.stderr)
        return 2
    if not public.is_dir():
        print(f"check_release_assets: {public} is not a folder", file=sys.stderr)
        return 2
    problems = check_og_image(public / "og.png") + check_favicon(public / "favicon.svg")
    for problem in problems:
        print(problem)
    if problems:
        return 1
    print("release assets: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
