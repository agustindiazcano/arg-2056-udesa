import copy
import json
import os
import socket
import subprocess
import sys
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

from datapipe.references import ReferencesError, build_references  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "data" / "schemas" / "references.schema.json").read_text(encoding="utf-8")) if (
    ROOT / "data" / "schemas" / "references.schema.json"
).exists() else {}


def source(sid, url, **over):
    base = {
        "id": sid,
        "aliases": [],
        "url": url,
        "title": f"Title {sid}",
        "authors_or_publisher": "Publisher",
        "publisher_type": "official",
        "publication_date": "2020-05-01",
        "retrieved_at": "2026-01-10",
        "access": "opened",
        "language": "en",
        "license_or_terms": None,
        "derived_from": None,
    }
    base.update(over)
    return base


def record(url, **over):
    base = {"source": "Some source", "source_url": url, "retrieved_at": "2026-01-10", "value": 1}
    base.update(over)
    return base


class Env:
    def __init__(self, tmp_path):
        self.root = tmp_path
        self.sources = tmp_path / "sources.json"
        self.data = tmp_path / "public_data"
        self.terrain = tmp_path / "terrain"
        self.geo = tmp_path / "geo" / "provinces.meta.json"
        self.out = self.data / "references.json"
        self.data.mkdir()

    def write_sources(self, entries):
        self.sources.write_text(json.dumps(entries), encoding="utf-8")

    def write_data(self, name, content):
        (self.data / name).write_text(json.dumps(content), encoding="utf-8")

    def build(self):
        return build_references(self.sources, self.data, self.terrain, self.geo)

    def cli(self, *extra):
        env = {**os.environ, "PYTHONPATH": str(ROOT / "scripts")}
        return subprocess.run(
            [
                sys.executable, "-m", "datapipe", "build-references",
                "--sources", str(self.sources), "--data-dir", str(self.data), "--terrain-dir", str(self.terrain),
                "--geo-meta", str(self.geo), "--out", str(self.out), *extra,
            ],
            capture_output=True, text=True, check=False, env=env, cwd=ROOT,
        )


@pytest.fixture
def env(tmp_path):
    return Env(tmp_path)


def test_a_cited_source_appears_with_used_by_and_record_count(env):
    env.write_sources([source("s:A", "https://example.com/a"), source("s:B", "https://example.com/b")])
    env.write_data("projects.json", [record("https://example.com/a"), record("https://example.com/a")])
    env.write_data("economy.json", [record("https://example.com/a")])
    refs = env.build()
    assert [s["id"] for s in refs["sources"]] == ["s:A"]  # s:B is cited by nobody
    entry = refs["sources"][0]
    assert entry["used_by"] == ["economy.json", "projects.json"]
    assert entry["record_count"] == 3
    assert entry["title"] == "Title s:A"
    assert entry["publisher_type"] == "official"
    assert entry["publication_date"] == "2020-05-01"
    assert entry["language"] == "en"
    assert entry["license_or_terms"] is None
    assert entry["derived_from"] is None


def test_url_variants_match_through_the_shared_normalization(env):
    env.write_sources([source("s:A", "https://example.com/a"), source("s:B", "https://example.org/report?id=7")])
    env.write_data(
        "projects.json",
        [
            record("HTTPS://Example.COM/a/#section"),  # host case, trailing slash, fragment
            record("https://example.org/report?id=7&utm_source=newsletter&utm_medium=x"),  # utm dropped
        ],
    )
    refs = env.build()
    assert [(s["id"], s["record_count"]) for s in refs["sources"]] == [("s:A", 1), ("s:B", 1)]


def test_a_source_with_aliases_appears_once(env):
    env.write_sources([source("s:A", "https://example.com/a", aliases=["t:A2", "u:A3"])])
    env.write_data("projects.json", [record("https://example.com/a"), record("https://example.com/a/")])
    refs = env.build()
    assert len(refs["sources"]) == 1
    assert refs["sources"][0]["record_count"] == 2


def test_not_opened_sources_become_leads_and_never_sources(env):
    env.write_sources(
        [
            source("s:A", "https://example.com/a"),
            source("s:N", "https://example.com/n", access="not_opened", title="Lead", authors_or_publisher="Someone"),
        ]
    )
    env.write_data("projects.json", [record("https://example.com/a")])
    refs = env.build()
    assert [s["id"] for s in refs["sources"]] == ["s:A"]
    assert refs["leads"] == [{"id": "s:N", "url": "https://example.com/n", "title": "Lead", "authors_or_publisher": "Someone"}]


def test_a_record_citing_a_not_opened_source_fails_and_writes_nothing(env):
    env.write_sources([source("s:N", "https://example.com/n", access="not_opened")])
    env.write_data("projects.json", [record("https://example.com/n")])
    with pytest.raises(ReferencesError, match="cites not_opened source"):
        env.build()
    result = env.cli()
    assert result.returncode == 1
    assert "ERROR projects.json record 0 cites not_opened source https://example.com/n" in result.stdout
    assert not env.out.exists()


def test_a_url_missing_from_the_registry_fails_with_file_and_record_index(env):
    env.write_sources([source("s:A", "https://example.com/a")])
    env.write_data("projects.json", [record("https://example.com/a"), record("https://unknown.example/x")])
    with pytest.raises(ReferencesError, match=r"projects\.json record 1 URL https://unknown\.example/x not found in sources"):
        env.build()
    result = env.cli()
    assert result.returncode == 1
    assert "ERROR projects.json record 1" in result.stdout
    assert not env.out.exists()


def test_attributions_come_from_the_metadata_files_in_a_fixed_order(env):
    env.write_sources([])
    env.terrain.mkdir()
    (env.terrain / "b_region.json").write_text(
        json.dumps({"attribution": "Terrain from B", "source_url": "https://dem.example/b"}), encoding="utf-8"
    )
    (env.terrain / "a_region.json").write_text(
        json.dumps({"attribution": "Terrain from A", "source_url": None}), encoding="utf-8"
    )
    (env.terrain / "c_region.json").write_text(
        json.dumps({"attribution": "Terrain from A", "source_url": None}), encoding="utf-8"
    )  # same text as a_region: listed once
    env.geo.parent.mkdir()
    env.geo.write_text(json.dumps({"attribution": "Boundaries by G", "source_url": "https://geo.example/g"}), encoding="utf-8")
    refs = env.build()
    assert refs["attributions"] == [
        {"label": "Terrain", "text": "Terrain from A", "source_url": None},
        {"label": "Terrain", "text": "Terrain from B", "source_url": "https://dem.example/b"},
        {"label": "Province boundaries", "text": "Boundaries by G", "source_url": "https://geo.example/g"},
    ]


def test_missing_metadata_files_produce_no_attribution(env):
    env.write_sources([])
    assert env.build()["attributions"] == []


def test_stats_are_exact(env):
    env.write_sources(
        [
            source("s:A", "https://example.com/a", retrieved_at="2026-01-10"),
            source("s:B", "https://example.com/b", retrieved_at="2026-03-02"),
            source("s:C", "https://example.com/c", retrieved_at="2025-12-31"),  # not cited
        ]
    )
    env.write_data("projects.json", [record("https://example.com/a"), record("https://example.com/b"), record(None)])
    env.write_data("economy.json", [record("https://example.com/a"), {"value": 3}])  # the last has no source field
    refs = env.build()
    assert refs["stats"] == {
        "published_files": 2,
        "records_total": 4,  # the record without a source field is not counted
        "records_without_url": 1,
        "sources_used": 2,
        "retrieved_min": "2026-01-10",
        "retrieved_max": "2026-03-02",
    }
    assert refs["mock"] is False


def test_a_single_object_file_with_a_source_counts_as_one_record(env):
    env.write_sources([])
    env.write_data("forecast_output.json", {"source": "argmodel@1", "series": [{"x": 1}]})
    refs = env.build()
    assert refs["stats"]["published_files"] == 0  # no sources.json yet: zero stats
    env.write_sources([source("s:A", "https://example.com/a")])
    refs = env.build()
    assert refs["stats"]["records_total"] == 1
    assert refs["stats"]["records_without_url"] == 1


def test_mock_is_true_when_any_record_has_source_mock(env):
    env.write_sources([source("s:A", "https://example.com/a")])
    env.write_data("projects.json", [record("https://example.com/a")])
    assert env.build()["mock"] is False
    env.write_data("economy.json", [{"source": "MOCK", "source_url": None, "value": 1}])
    assert env.build()["mock"] is True
    env.write_data("economy.json", {"source": "MOCK", "series": []})
    assert env.build()["mock"] is True


def test_internal_files_are_not_published_records(env):
    env.write_sources([source("s:A", "https://example.com/a")])
    env.write_data("_manifest.json", {"files": []})
    env.write_data("_version.json", {"data_version": "x"})
    env.write_data("sources.json", [{"source": "MOCK"}])
    env.write_data("references.json", {"mock": True})
    refs = env.build()
    assert refs["stats"]["published_files"] == 0
    assert refs["mock"] is False


def test_without_sources_json_the_file_is_written_empty_with_exit_0(env):
    env.write_data("economy.json", [{"source": "MOCK", "source_url": None, "value": 1}])
    result = env.cli()
    assert result.returncode == 0, result.stdout
    assert json.loads(env.out.read_text(encoding="utf-8")) == {
        "attributions": [],
        "leads": [],
        "mock": True,
        "sources": [],
        "stats": {
            "published_files": 0,
            "records_total": 0,
            "records_without_url": 0,
            "retrieved_max": None,
            "retrieved_min": None,
            "sources_used": 0,
        },
    }


def test_an_invalid_sources_json_fails_with_exit_1(env):
    env.sources.write_text(json.dumps([{"id": "bad"}]), encoding="utf-8")
    result = env.cli()
    assert result.returncode == 1
    assert "ERROR sources.json invalid" in result.stdout
    assert not env.out.exists()
    env.sources.write_text("{broken", encoding="utf-8")
    assert env.cli().returncode == 1


def test_usage_error_exits_2(env):
    result = env.cli("--no-such-option")
    assert result.returncode == 2


def test_two_runs_give_identical_bytes_with_sorted_keys_and_a_trailing_newline(env):
    env.write_sources([source("s:A", "https://example.com/a")])
    env.write_data("projects.json", [record("https://example.com/a")])
    assert env.cli().returncode == 0
    first = env.out.read_bytes()
    env.out.unlink()
    assert env.cli().returncode == 0
    assert env.out.read_bytes() == first
    text = first.decode("utf-8")
    assert text.endswith("}\n")
    doc = json.loads(text)
    assert text == json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def validator():
    return Draft202012Validator(SCHEMA, format_checker=FormatChecker())


def valid_doc():
    return {
        "sources": [
            {
                "id": "s:A", "url": "https://example.com/a", "title": "T", "authors_or_publisher": "P",
                "publisher_type": "official", "publication_date": None, "retrieved_at": "2026-01-10", "language": None,
                "license_or_terms": None, "derived_from": None, "used_by": ["projects.json"], "record_count": 2,
            }
        ],
        "leads": [{"id": "s:N", "url": "https://example.com/n", "title": "T", "authors_or_publisher": "P"}],
        "attributions": [{"label": "Terrain", "text": "x", "source_url": None}],
        "stats": {
            "published_files": 1, "records_total": 2, "records_without_url": 0, "sources_used": 1,
            "retrieved_min": "2026-01-10", "retrieved_max": "2026-01-10",
        },
        "mock": False,
    }


def test_the_output_validates_against_the_schema(env):
    env.write_sources([source("s:A", "https://example.com/a")])
    env.write_data("projects.json", [record("https://example.com/a")])
    assert list(validator().iter_errors(env.build())) == []
    assert list(validator().iter_errors(valid_doc())) == []


@pytest.mark.parametrize(
    "change",
    [
        lambda d: d.update(extra=1),
        lambda d: d["sources"][0].update(extra=1),
        lambda d: d["sources"][0].update(retrieved_at="2026-13-01"),
        lambda d: d["sources"][0].update(publication_date="yesterday"),
        lambda d: d["sources"][0].update(publisher_type="blog"),
        lambda d: d["sources"][0].pop("used_by"),
        lambda d: d["sources"][0].update(record_count=-1),
        lambda d: d["sources"][0].update(record_count=1.5),
        lambda d: d["sources"][0].update(access="opened"),
        lambda d: d["leads"][0].pop("title"),
        lambda d: d["attributions"][0].update(label="Other"),
        lambda d: d["stats"].update(records_total=-1),
        lambda d: d["stats"].update(retrieved_min="soon"),
        lambda d: d.update(mock="no"),
        lambda d: d.pop("stats"),
    ],
)
def test_schema_rejects_each_invalid_case(change):
    doc = copy.deepcopy(valid_doc())
    change(doc)
    assert list(validator().iter_errors(doc)) != []


def test_no_network_is_used(env, monkeypatch):
    def boom(*args, **kwargs):
        raise AssertionError("network access attempted")

    monkeypatch.setattr(socket.socket, "connect", boom)
    env.write_sources([source("s:A", "https://example.com/a")])
    env.write_data("projects.json", [record("https://example.com/a")])
    assert env.build()["sources"][0]["id"] == "s:A"
