import csv
import json
import urllib.parse
from pathlib import Path

class SourcesError(Exception):
    pass

PUBLISHER_TYPES = {
    "official", "international", "peer_reviewed", "working_paper", "technical_report",
    "company", "association", "bank", "consultancy", "think_tank", "archive", "press"
}

def normalize_url(url: str) -> str:
    if not url:
        return url
    parsed = urllib.parse.urlparse(url)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path
    path = parsed.path.removesuffix('/')
    
    q_pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    filtered = [(k, v) for k, v in q_pairs if not k.startswith("utm_")]
    query = urllib.parse.urlencode(filtered)
    
    return urllib.parse.urlunparse((scheme, netloc, path, parsed.params, query, ""))

def build_sources(research_root: Path, out_path: Path):
    if not research_root.exists():
        out_path.write_text("[]\n")
        return
        
    all_sources = []
    
    for scope_dir in sorted(research_root.iterdir()):
        if not scope_dir.is_dir(): continue
        csv_path = scope_dir / "sources.csv"
        if not csv_path.exists(): continue
        
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            expected = {"id", "url", "title", "authors_or_publisher", "publisher_type", "publication_date", "retrieved_at", "access", "language", "license_or_terms", "derived_from"}
            if not expected.issubset(set(reader.fieldnames or [])):
                raise SourcesError(f"ERROR {scope_dir.name} missing columns")
                
            for i, row in enumerate(reader, start=2):
                if row.get("publisher_type") and row["publisher_type"] not in PUBLISHER_TYPES:
                    raise SourcesError(f"ERROR {scope_dir.name} line {i} invalid publisher_type: {row['publisher_type']}")
                if row.get("access") and row["access"] not in ("opened", "not_opened"):
                    raise SourcesError(f"ERROR {scope_dir.name} line {i} invalid access: {row['access']}")
                    
                prefixed_id = f"{scope_dir.name}:{row['id']}"
                d_from = row.get("derived_from")
                if d_from:
                    d_from = f"{scope_dir.name}:{d_from}"
                else:
                    d_from = None
                    
                all_sources.append({
                    "id": prefixed_id,
                    "url": row.get("url", ""),
                    "title": row.get("title", ""),
                    "authors_or_publisher": row.get("authors_or_publisher", ""),
                    "publisher_type": row.get("publisher_type", ""),
                    "publication_date": row.get("publication_date", "") or None,
                    "retrieved_at": row.get("retrieved_at", ""),
                    "access": row.get("access", ""),
                    "language": row.get("language", "") or None,
                    "license_or_terms": row.get("license_or_terms", "") or None,
                    "derived_from": d_from,
                    "norm_url": normalize_url(row.get("url", ""))
                })
                
    # Validate dangling derived_from
    ids_set = {s["id"] for s in all_sources}
    for s in all_sources:
        if s["derived_from"] and s["derived_from"] not in ids_set:
            raise SourcesError(f"dangling derived_from {s['derived_from']} in {s['id']}")
            
    # Deduplicate by norm_url
    by_url = {}
    for s in all_sources:
        u = s["norm_url"]
        if u not in by_url:
            by_url[u] = []
        by_url[u].append(s)
        
    final_sources = []
    conflicts = []
    
    for u, group in by_url.items():
        group.sort(key=lambda x: x["id"])
        main = group[0]
        aliases = [x["id"] for x in group[1:]]
        
        for other in group[1:]:
            if other["title"] != main["title"] or other["publication_date"] != main["publication_date"]:
                conflicts.append(f"Conflict on {u}: {main['id']} vs {other['id']}")
                
        rec = dict(main)
        del rec["norm_url"]
        rec["aliases"] = aliases
        final_sources.append(rec)
        
    final_sources.sort(key=lambda x: x["id"])
    
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(final_sources, f, indent=2, ensure_ascii=False)
        f.write("\n")
        
    if conflicts:
        conflict_path = out_path.parent / "sources_conflicts.txt"
        conflict_path.write_text("\n".join(sorted(conflicts)) + "\n", encoding="utf-8")
        
def check_sources_coverage(processed_dir: Path, sources: list[dict]) -> list[str]:
    # sources is the parsed sources.json array
    by_url = {}
    for s in sources:
        nu = normalize_url(s.get("url", ""))
        by_url[nu] = s
        
    errs = []
    null_count = 0
    
    for p in processed_dir.glob("*.json"):
        if p.name in ("_provenance.json", "sources.json"): continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
            
        if not isinstance(data, list):
            continue
            
        for i, rec in enumerate(data):
            u = rec.get("source_url")
            if u is None:
                null_count += 1
                continue
                
            nu = normalize_url(u)
            if nu not in by_url:
                errs.append(f"ERROR {p.name} record {i} URL {u} not found in sources")
            else:
                if by_url[nu].get("access") == "not_opened":
                    errs.append(f"ERROR {p.name} record {i} cites not_opened source {u}")
                    
    # The null_count is "counted and reported", we can just return errs
    return errs
