"""Builds web/public/data/references.json (same as `python -m datapipe build-references`, runnable from any folder)."""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from datapipe.references import ReferencesError, build_references, write_references


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="build_references")
    parser.add_argument("--sources", default=str(ROOT / "data" / "processed" / "sources.json"))
    parser.add_argument("--data-dir", default=str(ROOT / "web" / "public" / "data"))
    parser.add_argument("--terrain-dir", default=str(ROOT / "web" / "public" / "terrain"))
    parser.add_argument("--geo-meta", default=str(ROOT / "web" / "public" / "geo" / "provinces.meta.json"))
    parser.add_argument("--out", default=str(ROOT / "web" / "public" / "data" / "references.json"))
    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        return exc.code if isinstance(exc.code, int) else 2
    try:
        result = build_references(Path(args.sources), Path(args.data_dir), Path(args.terrain_dir), Path(args.geo_meta))
    except ReferencesError as exc:
        print(exc)
        return 1
    write_references(result, Path(args.out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
