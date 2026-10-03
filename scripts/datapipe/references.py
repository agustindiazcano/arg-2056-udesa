import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

from .sources import check_sources_coverage, normalize_url

INTERNAL_FILES = {"_manifest.json", "_version.json", "references.json", "sources.json"}
SCHEMAS_DIR = Path(__file__).resolve().parents[2] / "data" / "schemas"


class ReferencesError(Exception):
    pass


def _validator(name: str) -> Draft202012Validator:
    schema = json.loads((SCHEMAS_DIR / name).read_text(encoding="utf-8"))
    return Draft202012Validator(schema, format_checker=FormatChecker())


def _has_mock(obj) -> bool:
    if isinstance(obj, dict):
        return obj.get("source") == "MOCK" or any(_has_mock(v) for v in obj.values())
    if isinstance(obj, list):
        return any(_has_mock(v) for v in obj)
    return False


def _published(data_dir: Path) -> dict[str, object]:
    files = {}
    if not data_dir.exists():
        return files
    for path in sorted(data_dir.glob("*.json")):
        if path.name in INTERNAL_FILES:
            continue
        try:
            files[path.name] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ReferencesError(f"ERROR {path.name} is not valid JSON: {exc}") from exc
    return files


def _records(content) -> list[dict]:
    """Records of a published file: the dicts of a list, or the object itself for a single-object file."""
    if isinstance(content, list):
        return [r for r in content if isinstance(r, dict)]
    if isinstance(content, dict):
        return [content]
    return []


def _attributions(terrain_dir: Path, geo_meta: Path) -> list[dict]:
    found: list[dict] = []

    def add(label: str, path: Path) -> None:
        meta = json.loads(path.read_text(encoding="utf-8"))
        entry = {"label": label, "text": meta["attribution"], "source_url": meta.get("source_url")}
        if entry not in found:
            found.append(entry)

    if terrain_dir.exists():
        for path in sorted(terrain_dir.glob("*.json")):
            add("Terrain", path)
    if geo_meta.exists():
        add("Province boundaries", geo_meta)
    return found


def build_references(sources_path: Path, data_dir: Path, terrain_dir: Path, geo_meta: Path) -> dict:
    files = _published(Path(data_dir))
    mock = any(_has_mock(content) for content in files.values())
    empty = {
        "sources": [],
        "leads": [],
        "attributions": [],
        "stats": {
            "published_files": 0,
            "records_total": 0,
            "records_without_url": 0,
            "sources_used": 0,
            "retrieved_min": None,
            "retrieved_max": None,
        },
        "mock": mock,
    }
    sources_path = Path(sources_path)
    if not sources_path.exists():
        return empty

    try:
        sources = json.loads(sources_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ReferencesError(f"ERROR sources.json invalid: {exc}") from exc
    problems = list(_validator("sources.schema.json").iter_errors(sources))
    if problems:
        raise ReferencesError(f"ERROR sources.json invalid: {problems[0].message}")

    errors = check_sources_coverage(Path(data_dir), sources)
    if errors:
        raise ReferencesError(errors[0])

    by_url = {normalize_url(s["url"]): s for s in sources}
    used_by: dict[str, set[str]] = {}
    counts: dict[str, int] = {}
    records_total = 0
    without_url = 0
    for name, content in files.items():
        for rec in _records(content):
            if "source" not in rec:
                continue
            records_total += 1
            url = rec.get("source_url")
            if url is None:
                without_url += 1
                continue
            sid = by_url[normalize_url(url)]["id"]
            used_by.setdefault(sid, set()).add(name)
            counts[sid] = counts.get(sid, 0) + 1

    cited = [
        {
            "id": s["id"],
            "url": s["url"],
            "title": s["title"],
            "authors_or_publisher": s["authors_or_publisher"],
            "publisher_type": s["publisher_type"],
            "publication_date": s.get("publication_date"),
            "retrieved_at": s["retrieved_at"],
            "language": s.get("language"),
            "license_or_terms": s.get("license_or_terms"),
            "derived_from": s.get("derived_from"),
            "used_by": sorted(used_by[s["id"]]),
            "record_count": counts[s["id"]],
        }
        for s in sorted(sources, key=lambda x: x["id"])
        if s["access"] == "opened" and s["id"] in used_by
    ]
    leads = [
        {"id": s["id"], "url": s["url"], "title": s["title"], "authors_or_publisher": s["authors_or_publisher"]}
        for s in sorted(sources, key=lambda x: x["id"])
        if s["access"] == "not_opened"
    ]
    dates = [s["retrieved_at"] for s in cited]
    result = {
        "sources": cited,
        "leads": leads,
        "attributions": _attributions(Path(terrain_dir), Path(geo_meta)),
        "stats": {
            "published_files": len(files),
            "records_total": records_total,
            "records_without_url": without_url,
            "sources_used": len(cited),
            "retrieved_min": min(dates) if dates else None,
            "retrieved_max": max(dates) if dates else None,
        },
        "mock": mock,
    }
    invalid = list(_validator("references.schema.json").iter_errors(result))
    if invalid:
        raise ReferencesError(f"ERROR references.json invalid: {invalid[0].message}")
    return result


def write_references(result: dict, out: Path) -> None:
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:  # LF on every platform: byte-identical output
        f.write(json.dumps(result, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
