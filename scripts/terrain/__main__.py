import argparse
import json
import sys
from pathlib import Path

from . import TerrainError
from .bake import bake_all, verify_points
from .config import ConfigError, load_config


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="terrain")
    sub = parser.add_subparsers(dest="cmd", required=True)

    bake = sub.add_parser("bake", help="bake terrain files for every region of the config")
    bake.add_argument("--config", required=True)
    bake.add_argument("--attribution", required=True)
    bake.add_argument("--raw-root", default="data/raw")
    bake.add_argument("--out-root", default="web/public/terrain")

    verify = sub.add_parser("verify", help="print baked heights next to expected heights")
    verify.add_argument("--meta", required=True)
    verify.add_argument("--points", required=True)
    return parser


def _cmd_bake(args) -> int:
    if not args.attribution.strip():
        print("usage error: --attribution must be non-empty", file=sys.stderr)
        return 2
    try:
        config = load_config(Path(args.config))
    except ConfigError as exc:
        print(f"ERROR config {exc}", file=sys.stderr)
        return 1

    errors = bake_all(config, Path(args.raw_root), Path(args.out_root), args.attribution)
    failed = {line.split(" ")[1] for line in errors}
    for region in config.regions:
        if region.id not in failed:
            print(f"OK {region.id}")
    for line in errors:
        print(line, file=sys.stderr)
    return 1 if errors else 0


def _cmd_verify(args) -> int:
    try:
        points = json.loads(Path(args.points).read_text(encoding="utf-8"))
        rows = verify_points(Path(args.meta), points)
    except (OSError, ValueError, KeyError, TerrainError) as exc:
        print(f"ERROR verify {exc}", file=sys.stderr)
        return 1
    print("name\texpected_m\tbaked_m\tdifference_m")
    for name, expected, baked in rows:
        if baked is None:
            print(f"{name}\t{expected:.2f}\toutside bbox\t-")
        else:
            print(f"{name}\t{expected:.2f}\t{baked:.2f}\t{baked - expected:.2f}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        return exc.code if isinstance(exc.code, int) else 2
    if args.cmd == "bake":
        return _cmd_bake(args)
    return _cmd_verify(args)


if __name__ == "__main__":
    sys.exit(main())
