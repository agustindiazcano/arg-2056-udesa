import json
import csv
from pathlib import Path
import pytest
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.datapipe.sources import build_sources, check_sources_coverage, SourcesError

def test_sources_build(tmp_path):
    rs_dir = tmp_path / "research"
    out_file = tmp_path / "sources.json"
    
    mining = rs_dir / "mining"
    mining.mkdir(parents=True)
    with open(mining / "sources.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "id", "url", "title", "authors_or_publisher", "publisher_type", 
            "publication_date", "retrieved_at", "access", "language", "license_or_terms", "derived_from"
        ])
        writer.writeheader()
        writer.writerow({
            "id": "S01", "url": "http://Example.COM/path/?utm_source=twitter&a=1#frag",
            "title": "Title 1", "authors_or_publisher": "Auth", "publisher_type": "official",
            "publication_date": "2020-01-01", "retrieved_at": "2024-01-01", "access": "opened",
            "language": "es", "license_or_terms": "", "derived_from": ""
        })
        writer.writerow({
            "id": "S02", "url": "https://other.com/a/",
            "title": "Title 2", "authors_or_publisher": "Auth", "publisher_type": "official",
            "publication_date": "", "retrieved_at": "2024-01-01", "access": "opened",
            "language": "es", "license_or_terms": "", "derived_from": "S01"
        })
        
    energy = rs_dir / "energy"
    energy.mkdir()
    with open(energy / "sources.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "id", "url", "title", "authors_or_publisher", "publisher_type", 
            "publication_date", "retrieved_at", "access", "language", "license_or_terms", "derived_from"
        ])
        writer.writeheader()
        # Duplicate URL but different title
        writer.writerow({
            "id": "E01", "url": "http://example.com/path?a=1",
            "title": "Title E", "authors_or_publisher": "Auth", "publisher_type": "official",
            "publication_date": "2020-01-02", "retrieved_at": "2024-01-01", "access": "opened",
            "language": "es", "license_or_terms": "", "derived_from": ""
        })
        
    build_sources(rs_dir, out_file)
    
    out_data = json.loads(out_file.read_text())
    assert len(out_data) == 2
    
    # Check deduplication and alias
    # "http://example.com/path?a=1" normalizes to "http://example.com/path?a=1"
    # "http://Example.COM/path/?utm_source=twitter&a=1#frag" normalizes to "http://example.com/path?a=1"
    
    s0 = out_data[0]
    s1 = out_data[1]
    
    if s0["id"] == "energy:E01":
        e = s0; m = s1
    else:
        m = s0; e = s1
        
    assert m["id"] == "mining:S02"
    assert len(e["aliases"]) == 1
    
    # Conflict report
    conflict_path = tmp_path / "sources_conflicts.txt"
    assert conflict_path.exists()
    content = conflict_path.read_text()
    assert "disagreement" in content.lower() or "conflict" in content.lower() or "title" in content.lower()

def test_sources_errors(tmp_path):
    rs_dir = tmp_path / "research"
    out_file = tmp_path / "sources.json"
    
    mining = rs_dir / "mining"; mining.mkdir(parents=True)
    
    # Bad enum
    with open(mining / "sources.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "url", "title", "authors_or_publisher", "publisher_type", "publication_date", "retrieved_at", "access", "language", "license_or_terms", "derived_from"])
        writer.writeheader()
        writer.writerow({"id": "1", "publisher_type": "bad", "url": "http://a.com", "access": "opened"})
        
    with pytest.raises(SourcesError, match="mining.*line 2.*publisher_type"):
        build_sources(rs_dir, out_file)
        
    # Dangling derived_from
    with open(mining / "sources.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "url", "title", "authors_or_publisher", "publisher_type", "publication_date", "retrieved_at", "access", "language", "license_or_terms", "derived_from"])
        writer.writeheader()
        writer.writerow({"id": "1", "publisher_type": "official", "url": "http://a.com", "access": "opened", "derived_from": "2"})
    with pytest.raises(SourcesError, match="dangling"):
        build_sources(rs_dir, out_file)

def test_sources_coverage(tmp_path):
    pdir = tmp_path / "processed"
    pdir.mkdir()
    (pdir / "d1.json").write_text(json.dumps([
        {"source_url": "http://a.com/?"},
        {"source_url": None},
        {"source_url": "http://b.com"}
    ]))
    
    sources = [
        {"id": "a", "url": "http://a.com", "access": "opened"},
        {"id": "b", "url": "http://b.com", "access": "not_opened"}
    ]
    
    errs = check_sources_coverage(pdir, sources)
    # 1. b is not_opened -> error
    # null is counted, not an error
    
    assert len(errs) == 1
    assert "not_opened" in errs[0]
    
    # missing url
    (pdir / "d1.json").write_text(json.dumps([
        {"source_url": "http://c.com"}
    ]))
    errs2 = check_sources_coverage(pdir, sources)
    assert len(errs2) == 1
    assert "http://c.com" in errs2[0]
