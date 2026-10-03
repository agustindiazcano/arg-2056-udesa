import json
import sys
from pathlib import Path


def has_mock_source(obj):
    if isinstance(obj, dict):
        if obj.get("source") == "MOCK":
            return True
        for v in obj.values():
            if has_mock_source(v):
                return True
    elif isinstance(obj, list):
        for item in obj:
            if has_mock_source(item):
                return True
    return False

def main():
    dirs = sys.argv[1:]
    if not dirs:
        dirs = ["data/processed", "web/public/data"]
        
    found_mock = False
    
    for d in dirs:
        p = Path(d)
        if not p.exists():
            continue
            
        # Check _manifest.json if in web/public/data
        manifest_path = p / "_manifest.json"
        if manifest_path.exists():
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    man = json.load(f)
                for entry in man.get("files", []):
                    if entry.get("origin") == "mock":
                        print(f"File {entry.get('name')} in _manifest.json has origin mock")
                        found_mock = True
            except json.JSONDecodeError as e:
                print(f"Invalid JSON in {manifest_path}: {e}")
                sys.exit(2)
                
        for fpath in p.rglob("*.json"):
            if fpath.name == "_manifest.json" or fpath.name == "_version.json":
                continue
            if "mock" in fpath.name.lower():
                print(f"File name contains mock: {fpath}")
                found_mock = True
                continue
                
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"Invalid JSON in {fpath}: {e}")
                sys.exit(2)
                
            if has_mock_source(data):
                print(f"File contains source: MOCK: {fpath}")
                found_mock = True
                
    if found_mock:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
