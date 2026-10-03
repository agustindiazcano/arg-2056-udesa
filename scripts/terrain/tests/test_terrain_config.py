import copy
import json

import pytest
from terrain.config import ConfigError, load_config

VALID = {
    "dem_dataset_id": "dem_example",
    "regions": [
        {"id": "region_a", "bbox": [-70.0, -34.0, -69.0, -33.0], "max_size": 512},
        {"id": "region_b", "bbox": [-71.5, -35.0, -70.5, -34.5], "max_size": 64},
    ],
    "hillshade": {"azimuth_deg": 315, "altitude_deg": 45, "z_factor": 1.0},
    "max_bytes_per_region": 1000000,
}


def write(tmp_path, doc):
    path = tmp_path / "config.json"
    path.write_text(json.dumps(doc), encoding="utf-8")
    return path


def mutated(fn):
    doc = copy.deepcopy(VALID)
    fn(doc)
    return doc


def test_valid_config_loads_exactly(tmp_path):
    cfg = load_config(write(tmp_path, VALID))
    assert cfg.dem_dataset_id == "dem_example"
    assert [r.id for r in cfg.regions] == ["region_a", "region_b"]
    assert cfg.regions[0].bbox == (-70.0, -34.0, -69.0, -33.0)
    assert cfg.regions[0].max_size == 512
    assert cfg.hillshade.azimuth_deg == 315
    assert cfg.hillshade.altitude_deg == 45
    assert cfg.hillshade.z_factor == 1.0
    assert cfg.max_bytes_per_region == 1000000


def test_max_size_limits_are_inclusive(tmp_path):
    doc = mutated(lambda d: d["regions"][0].update(max_size=4096))
    assert load_config(write(tmp_path, doc)).regions[0].max_size == 4096
    doc = mutated(lambda d: d["regions"][0].update(max_size=64))
    assert load_config(write(tmp_path, doc)).regions[0].max_size == 64


@pytest.mark.parametrize(
    ("change", "fragment"),
    [
        (lambda d: d["regions"][0].update(bbox=[-69.0, -34.0, -70.0, -33.0]), "west must be less than east"),
        (lambda d: d["regions"][0].update(bbox=[-70.0, -33.0, -69.0, -34.0]), "south must be less than north"),
        (lambda d: d["regions"][0].update(bbox=[-70.0, -34.0, -70.0, -33.0]), "west must be less than east"),
        (lambda d: d["regions"][0].update(bbox=[-181.0, -34.0, -69.0, -33.0]), "longitude out of range"),
        (lambda d: d["regions"][0].update(bbox=[-70.0, -34.0, 181.0, -33.0]), "longitude out of range"),
        (lambda d: d["regions"][0].update(bbox=[-70.0, -91.0, -69.0, -33.0]), "latitude out of range"),
        (lambda d: d["regions"][0].update(bbox=[-70.0, -34.0, -69.0, 91.0]), "latitude out of range"),
        (lambda d: d["regions"][0].update(bbox=[-70.0, -34.0, -69.0]), "bbox must have 4 numbers"),
        (lambda d: d["regions"][1].update(id="region_a"), "duplicate region id region_a"),
        (lambda d: d["regions"][0].update(id="Region-A"), "invalid region id"),
        (lambda d: d["regions"][0].update(max_size=63), "max_size must be an integer between 64 and 4096"),
        (lambda d: d["regions"][0].update(max_size=4097), "max_size must be an integer between 64 and 4096"),
        (lambda d: d["regions"][0].update(max_size=512.5), "max_size must be an integer between 64 and 4096"),
        (lambda d: d.update(extra=1), "unknown field extra"),
        (lambda d: d["regions"][0].update(extra=1), "unknown field extra in region region_a"),
        (lambda d: d["hillshade"].update(extra=1), "unknown field extra in hillshade"),
        (lambda d: d.pop("dem_dataset_id"), "missing field dem_dataset_id"),
        (lambda d: d.pop("hillshade"), "missing field hillshade"),
        (lambda d: d["hillshade"].pop("z_factor"), "missing field z_factor in hillshade"),
        (lambda d: d.update(regions=[]), "regions must be a non-empty list"),
        (lambda d: d.update(max_bytes_per_region=0), "max_bytes_per_region must be a positive integer"),
    ],
)
def test_invalid_config_is_an_error_with_a_clear_message(tmp_path, change, fragment):
    with pytest.raises(ConfigError) as exc:
        load_config(write(tmp_path, mutated(change)))
    assert fragment in str(exc.value)


def test_missing_file_and_bad_json_are_errors(tmp_path):
    with pytest.raises(ConfigError, match="config file not found"):
        load_config(tmp_path / "nope.json")
    bad = tmp_path / "bad.json"
    bad.write_text("{not json", encoding="utf-8")
    with pytest.raises(ConfigError, match="not valid JSON"):
        load_config(bad)
