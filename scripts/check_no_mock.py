import json
import re
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

CONTENT_SUFFIXES = {".ts", ".tsx", ".json"}
FLAT_OBJECT = re.compile(r"\{[^{}]*\}")
PLACEHOLDER_TRUE = re.compile(r"""["']?placeholder["']?\s*:\s*true(?![A-Za-z0-9_])""")
ENTRY_ID = re.compile(r"""["']?id["']?\s*:\s*["']([^"']+)["']""")


def placeholder_ids(text):
    """Ids of the flat objects of a source file that have `placeholder: true` ("<no id>" when they have none)."""
    ids = []
    for block in FLAT_OBJECT.findall(text):
        if PLACEHOLDER_TRUE.search(block):
            match = ENTRY_ID.search(block)
            ids.append(match.group(1) if match else "<no id>")
    return ids


def check_content(content_dir):
    """Prints every placeholder entry found under content_dir and returns True when there is at least one."""
    root = Path(content_dir)
    if not root.exists():
        return False
    found = False
    for fpath in sorted(root.rglob("*")):
        if not fpath.is_file() or fpath.suffix not in CONTENT_SUFFIXES:
            continue
        for entry_id in placeholder_ids(fpath.read_text(encoding="utf-8")):
            print(f"Placeholder content: {fpath}: {entry_id}")
            found = True
    return found


def parse_args(argv):
    dirs = []
    content_dirs = []
    i = 0
    while i < len(argv):
        if argv[i] == "--content" and i + 1 < len(argv):
            content_dirs.append(argv[i + 1])
            i += 2
        else:
            dirs.append(argv[i])
            i += 1
    if not dirs and not content_dirs:
        # default run (release build on CI): the processed data and the public data, plus the content folder
        dirs = ["data/processed", "web/public/data"]
        content_dirs = ["web/src/content"]
    return dirs, content_dirs


def main():
    dirs, content_dirs = parse_args(sys.argv[1:])

    found_mock = False

    for content_dir in content_dirs:
        if check_content(content_dir):
            found_mock = True
    
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
