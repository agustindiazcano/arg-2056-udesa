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
PLACEHOLDER_TRUE = re.compile(r"""["']?placeholder["']?\s*:\s*true(?![A-Za-z0-9_])""")
ENTRY_ID = re.compile(r"""["']?id["']?\s*:\s*["']([^"']+)["']""")
KEY_BEFORE_BRACKET = re.compile(r"""(?:([A-Za-z_$][\w$]*)|["']([^"']+)["'])\s*:\s*$""")


# The scan below is a deliberate approximation, not a parser: it counts braces and brackets and does not skip
# strings or comments, so an unbalanced bracket inside a string can confuse it. Content files are plain data
# literals, which keeps that safe; the tests pin the shapes that matter.


def enclosing_object(text, pos):
    """(start, end) of the innermost {...} around `pos`, or None when `pos` is outside any object."""
    depth = 0
    start = None
    for i in range(pos - 1, -1, -1):
        c = text[i]
        if c == "}":
            depth += 1
        elif c == "{":
            if depth == 0:
                start = i
                break
            depth -= 1
    if start is None:
        return None
    depth = 0
    for j in range(start, len(text)):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                return start, j + 1
    return start, len(text)


def own_id(obj_text):
    """The `id` that belongs to the object itself, not to an object nested inside it; None when it has none."""
    depth = 0
    last = 0
    for match in ENTRY_ID.finditer(obj_text):
        for c in obj_text[last:match.start()]:
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
        last = match.start()
        if depth == 1:
            return match.group(1)
    return None


def container_key(text, start):
    """Key of the array that directly holds the object starting at `start` (`andes: [ {...} ]`), else None."""
    depth = 0
    for i in range(start - 1, -1, -1):
        c = text[i]
        if c in "}])":
            depth += 1
        elif c in "{[(":
            if depth == 0:
                if c != "[":
                    return None
                match = KEY_BEFORE_BRACKET.search(text[max(0, i - 200):i])
                return (match.group(1) or match.group(2)) if match else None
            depth -= 1
    return None


def placeholder_ids(text):
    """Labels of the objects of a source file that have `placeholder: true`, in file order.

    The label is the object's own id ("<no id>" when it has none), prefixed by the key of the array that holds it
    when there is one: `andes/step-1`. Objects may nest other objects (a step has a `focus`). A mention of
    `placeholder: true` outside any object, such as in a comment, is not an entry.
    """
    labels = []
    seen = set()
    for match in PLACEHOLDER_TRUE.finditer(text):
        bounds = enclosing_object(text, match.start())
        if bounds is None or bounds[0] in seen:
            continue
        seen.add(bounds[0])
        entry_id = own_id(text[bounds[0]:bounds[1]]) or "<no id>"
        key = container_key(text, bounds[0])
        labels.append(f"{key}/{entry_id}" if key else entry_id)
    return labels


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


def check_references(path, required):
    """Release conditions of references.json: not mock, and at least one source. Returns True when one fails."""
    p = Path(path)
    if not p.exists():
        if required:
            print(f"references file not found: {p}")
            return True
        return False
    try:
        doc = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in {p}: {e}")
        sys.exit(2)
    failed = False
    if doc.get("mock") is True:
        print(f"{p.name} has mock: true")
        failed = True
    if not doc.get("sources"):
        print(f"{p.name} lists no sources")
        failed = True
    return failed


def parse_args(argv):
    dirs = []
    content_dirs = []
    references = []
    i = 0
    while i < len(argv):
        if argv[i] == "--content" and i + 1 < len(argv):
            content_dirs.append(argv[i + 1])
            i += 2
        elif argv[i] == "--references" and i + 1 < len(argv):
            references.append((argv[i + 1], True))
            i += 2
        else:
            dirs.append(argv[i])
            i += 1
    if not dirs and not content_dirs and not references:
        # default run (release build on CI): the processed data and the public data, plus the content folder
        # and the references file when it exists
        dirs = ["data/processed", "web/public/data"]
        content_dirs = ["web/src/content"]
        references = [("web/public/data/references.json", False)]
    return dirs, content_dirs, references


def main():
    dirs, content_dirs, references = parse_args(sys.argv[1:])

    found_mock = False

    for path, required in references:
        if check_references(path, required):
            found_mock = True

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
