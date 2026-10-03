import copy
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

SCHEMA = Path(__file__).resolve().parents[3] / "data" / "schemas" / "terrain_meta.schema.json"

VALID = {
    "id": "region_a",
    "crs": "EPSG:4326",
    "bbox": [-70.0, -34.0, -69.0, -33.0],
    "width": 256,
    "height": 256,
    "pixel_size_deg": {"x": 0.00390625, "y": 0.00390625},
    "meters_per_pixel": {"x": 360.5, "y": 434.3},
    "encoding": "terrarium",
    "elevation_min_m": 120.5,
    "elevation_max_m": 4800.25,
    "filled_fraction": 0.0005,
    "hillshade": {"azimuth_deg": 315, "altitude_deg": 45, "z_factor": 1.0},
    "files": {"height": "region_a.height.png", "hillshade": "region_a.hillshade.png"},
    "bytes": {"height": 1000, "hillshade": 500},
    "dem_inputs": [{"path": "tile_1.tif", "sha256": "a" * 64}],
    "source": "Example DEM",
    "source_url": "https://example.com/dem",
    "retrieved_at": "2026-01-01",
    "license_or_terms": None,
    "attribution": "Example attribution",
    "generated_by": "scripts/terrain",
}


def validator():
    return Draft202012Validator(json.loads(SCHEMA.read_text(encoding="utf-8")), format_checker=FormatChecker())


def errors(doc):
    return list(validator().iter_errors(doc))


def mutated(fn):
    doc = copy.deepcopy(VALID)
    fn(doc)
    return doc


def test_valid_metadata_passes():
    assert errors(VALID) == []
    assert errors(mutated(lambda d: d.update(source_url=None, license_or_terms="CC"))) == []


@pytest.mark.parametrize(
    "change",
    [
        lambda d: d.update(crs="EPSG:3857"),
        lambda d: d.update(encoding="mapbox"),
        lambda d: d.update(bbox=[-70.0, -34.0, -69.0]),
        lambda d: d.update(bbox=[-70.0, -34.0, -69.0, -33.0, 0.0]),
        lambda d: d.update(bbox=["a", -34.0, -69.0, -33.0]),
        lambda d: d.pop("attribution"),
        lambda d: d.update(attribution=""),
        lambda d: d.update(extra=1),
        lambda d: d["hillshade"].update(extra=1),
        lambda d: d["files"].update(extra="x"),
        lambda d: d.update(width=0),
        lambda d: d.update(height=1.5),
        lambda d: d["pixel_size_deg"].update(x=0),
        lambda d: d["meters_per_pixel"].update(y=-1),
        lambda d: d.update(filled_fraction=1.5),
        lambda d: d.update(filled_fraction=-0.1),
        lambda d: d["bytes"].update(height=1.5),
        lambda d: d.update(retrieved_at="2026-13-01"),
        lambda d: d["dem_inputs"][0].update(sha256="xyz"),
        lambda d: d["dem_inputs"][0].pop("path"),
        lambda d: d.update(source=""),
        lambda d: d.update(source_url="not a uri"),
        lambda d: d.update(generated_by="somebody else"),
        lambda d: d.update(generated_at="2026-01-01"),
        lambda d: d.pop("elevation_max_m"),
    ],
)
def test_invalid_metadata_fails(change):
    assert errors(mutated(change)) != []
