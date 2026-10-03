import argparse
import sys
from pathlib import Path

TOTAL_BUDGET_BYTES = 5_000_000
FILE_BUDGET_BYTES = 1_500_000

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="web/public/data")
    args = parser.parse_args()
    
    d = Path(args.dir)
    if not d.exists():
        sys.exit(0)
        
    total = 0
    errors = []
    
    for f in d.rglob("*"):
        if f.is_file():
            size = f.stat().st_size
            total += size
            if size > FILE_BUDGET_BYTES:
                errors.append(f"{f.name}: {size} bytes (> {FILE_BUDGET_BYTES})")
                
    if total > TOTAL_BUDGET_BYTES:
        errors.append(f"TOTAL: {total} bytes (> {TOTAL_BUDGET_BYTES})")
        
    if errors:
        for e in errors:
            print(e)
        sys.exit(1)
        
    sys.exit(0)
    
if __name__ == "__main__":
    main()
