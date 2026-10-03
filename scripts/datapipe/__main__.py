import argparse
import sys
from pathlib import Path

from .adapters import REGISTRY
from .manifest import ManifestError, register_file
from .provenance import verify_provenance
from .runner import check_dataset, run_dataset
from .sources import SourcesError, build_sources


def main():
    parser = argparse.ArgumentParser(prog="datapipe")
    subparsers = parser.add_subparsers(dest="cmd", required=True)
    
    # run
    p_run = subparsers.add_parser("run")
    p_run.add_argument("dataset_id", nargs="?")
    p_run.add_argument("--all", action="store_true")
    p_run.add_argument("--raw-root", default="data/raw")
    p_run.add_argument("--out-root", default="data/processed")
    p_run.add_argument("--schemas", default="data/schemas")
    
    # check
    p_check = subparsers.add_parser("check")
    p_check.add_argument("dataset_id", nargs="?")
    p_check.add_argument("--all", action="store_true")
    p_check.add_argument("--raw-root", default="data/raw")
    p_check.add_argument("--out-root", default="data/processed")
    p_check.add_argument("--schemas", default="data/schemas")
    
    # register
    p_reg = subparsers.add_parser("register")
    p_reg.add_argument("dataset_id")
    p_reg.add_argument("file")
    p_reg.add_argument("--source", required=True)
    p_reg.add_argument("--source-url", default=None)
    p_reg.add_argument("--retrieved-at", required=True)
    p_reg.add_argument("--license", default=None)
    p_reg.add_argument("--not-redistributable", action="store_true")
    p_reg.add_argument("--note", default=None)
    p_reg.add_argument("--private", action="store_true")
    p_reg.add_argument("--replace", action="store_true")
    p_reg.add_argument("--raw-root", default="data/raw")
    
    # verify-provenance
    p_vp = subparsers.add_parser("verify-provenance")
    p_vp.add_argument("--out-root", default="data/processed")
    
    # build-sources
    p_bs = subparsers.add_parser("build-sources")
    p_bs.add_argument("--research-root", default="data/raw/research")
    p_bs.add_argument("--out", default="data/processed/sources.json")
    
    args = parser.parse_args()
    
    if args.cmd == "run":
        if not args.dataset_id and not args.all:
            print("Must specify dataset_id or --all")
            sys.exit(2)
        if args.dataset_id and args.all:
            print("Cannot specify both dataset_id and --all")
            sys.exit(2)
            
        targets = [args.dataset_id] if args.dataset_id else list(REGISTRY.keys())
        for ds in targets:
            code, msg = run_dataset(ds, Path(args.raw_root), Path(args.out_root), Path(args.schemas))
            if code != 0:
                print(msg)
                sys.exit(code)
        sys.exit(0)
        
    elif args.cmd == "check":
        if not args.dataset_id and not args.all:
            # wait, brief: python -m datapipe check [<dataset_id> | --all]
            print("Must specify dataset_id or --all")
            sys.exit(2)
        if args.dataset_id and args.all:
            print("Cannot specify both dataset_id and --all")
            sys.exit(2)
            
        targets = [args.dataset_id] if args.dataset_id else list(REGISTRY.keys())
        for ds in targets:
            code, msg = check_dataset(ds, Path(args.raw_root), Path(args.out_root), Path(args.schemas))
            print(msg)
            if code != 0:
                sys.exit(code)
        sys.exit(0)
        
    elif args.cmd == "register":
        try:
            register_file(
                Path(args.raw_root) / args.dataset_id,
                args.file,
                source=args.source,
                source_url=args.source_url,
                retrieved_at=args.retrieved_at,
                license_or_terms=args.license,
                redistributable=not args.not_redistributable,
                private=args.private,
                note=args.note,
                replace=args.replace
            )
        except ManifestError as e:
            print(e)
            sys.exit(1)
            
    elif args.cmd == "verify-provenance":
        try:
            verify_provenance(Path(args.out_root))
        except RuntimeError as e:
            print(f"ERROR: {e}")
            sys.exit(1)
            
    elif args.cmd == "build-sources":
        try:
            build_sources(Path(args.research_root), Path(args.out))
        except SourcesError as e:
            print(e)
            sys.exit(1)
            
if __name__ == "__main__":
    main()
