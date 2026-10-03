import copy
import hashlib
import io
import json
import math
import socket
import struct
from pathlib import Path

import numpy as np
import pytest
from jsonschema import Draft202012Validator, FormatChecker
from PIL import Image
from terrain.__main__ import main
from terrain.bake import bake_all, verify_points
from terrain.config import load_config
from terrain.encode import decode_terrarium
from terrain.hillshade import hillshade
from terrain_testlib import make_dataset

SCHEMA = Path(__file__).resolve().parents[3] / "data" / "schemas" / "terrain_meta.schema.json"

# A 16x8 world: 0.25 degree pixels, west -70, north -30 (so 4 x 2 degrees). Heights = 100 + 10 * col + 1000 * row.
COLS, ROWS = 16, 8
ARRAY = 100 + 10 * np.arange(COLS)[None, :] + 1000 * np.arange(ROWS)[:, None]
WORLD = {"array": ARRAY, "west": -70.0, "north": -30.0, "dx": 0.25}

CONFIG = {
    "dem_dataset_id": "dem_example",
    "regions": [{"id": "region_a", "bbox": [-70.0, -32.0, -66.0, -30.0], "max_size": 64}],
    "hillshade": {"azimuth_deg": 315, "altitude_deg": 45, "z_factor": 1.0},
    "max_bytes_per_region": 100000,
}


def setup(tmp_path, config=None):
    raw = tmp_path / "raw"
    make_dataset(raw, "dem_example", {"world.tif": WORLD})
    cfg = tmp_path / "config.json"
    cfg.write_text(json.dumps(config or CONFIG), encoding="utf-8")
    return raw, cfg, tmp_path / "out"


def bake(tmp_path, config=None, attribution="Example attribution"):
    raw, cfg, out = setup(tmp_path, config)
    errors = bake_all(load_config(cfg), raw, out, attribution)
    return raw, cfg, out, errors


def png_pixels(path):
    return np.asarray(Image.open(path))


def png_chunks(path):
    data = Path(path).read_bytes()
    pos, chunks = 8, []
    while pos < len(data):
        length, kind = struct.unpack(">I4s", data[pos : pos + 8])
        chunks.append(kind.decode())
        pos += 12 + length
    return chunks


def test_bake_writes_the_three_files_and_the_pixels_are_the_expected_arrays(tmp_path):
    _, _, out, errors = bake(tmp_path)
    assert errors == []
    assert sorted(p.name for p in out.iterdir()) == ["region_a.height.png", "region_a.hillshade.png", "region_a.json"]
    height = decode_terrarium(png_pixels(out / "region_a.height.png"))
    np.testing.assert_array_equal(height, ARRAY)  # 16x8 is below max_size 64: no resampling
    expected_shade = hillshade(ARRAY.astype(float), -30.0, 0.25, 0.25, 315, 45, 1.0)
    np.testing.assert_array_equal(png_pixels(out / "region_a.hillshade.png"), expected_shade)
    assert Image.open(out / "region_a.height.png").mode == "RGB"
    assert Image.open(out / "region_a.hillshade.png").mode == "L"


def test_metadata_validates_and_equals_the_expected_dict_exactly(tmp_path):
    raw, _, out, errors = bake(tmp_path)
    assert errors == []
    meta = json.loads((out / "region_a.json").read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    assert list(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(meta)) == []

    tif_hash = hashlib.sha256((raw / "dem_example" / "world.tif").read_bytes()).hexdigest()
    mpd = math.pi * 6371008.8 / 180
    center_lat = -31.0
    expected = {
        "id": "region_a",
        "crs": "EPSG:4326",
        "bbox": [-70.0, -32.0, -66.0, -30.0],
        "width": 16,
        "height": 8,
        "pixel_size_deg": {"x": 0.25, "y": 0.25},
        "meters_per_pixel": {"x": 0.25 * mpd * math.cos(math.radians(center_lat)), "y": 0.25 * mpd},
        "encoding": "terrarium",
        "elevation_min_m": 100.0,
        "elevation_max_m": float(ARRAY.max()),
        "filled_fraction": 0.0,
        "hillshade": {"azimuth_deg": 315, "altitude_deg": 45, "z_factor": 1.0},
        "files": {"height": "region_a.height.png", "hillshade": "region_a.hillshade.png"},
        "bytes": {
            "height": (out / "region_a.height.png").stat().st_size,
            "hillshade": (out / "region_a.hillshade.png").stat().st_size,
        },
        "dem_inputs": [{"path": "world.tif", "sha256": tif_hash}],
        "source": "Example DEM",
        "source_url": "https://example.com/dem",
        "retrieved_at": "2026-01-01",
        "license_or_terms": "Example terms",
        "attribution": "Example attribution",
        "generated_by": "scripts/terrain",
    }
    assert meta == expected


def test_resampling_applies_the_max_size_and_records_the_pixel_size(tmp_path):
    cfg = copy.deepcopy(CONFIG)
    cfg["regions"][0]["bbox"] = [-70.0, -34.0, -54.0, -30.0]  # 16 x 4 degrees
    cfg["regions"][0]["max_size"] = 64
    big = dict(WORLD, array=np.tile(ARRAY, (16, 16)), dx=1 / 16)  # 256 x 128 pixels over 16 x 8 degrees
    raw = tmp_path / "raw"
    make_dataset(raw, "dem_example", {"world.tif": big})
    cfgfile = tmp_path / "config.json"
    cfgfile.write_text(json.dumps(cfg), encoding="utf-8")
    out = tmp_path / "out"
    assert bake_all(load_config(cfgfile), raw, out, "x") == []
    meta = json.loads((out / "region_a.json").read_text(encoding="utf-8"))
    assert (meta["width"], meta["height"]) == (64, 16)
    assert meta["pixel_size_deg"] == {"x": 0.25, "y": 0.25}


def test_two_runs_give_identical_bytes_and_pngs_have_only_the_basic_chunks(tmp_path):
    _, _, out_a, _ = bake(tmp_path / "a")
    _, _, out_b, _ = bake(tmp_path / "b")
    for name in ("region_a.height.png", "region_a.hillshade.png", "region_a.json"):
        assert (out_a / name).read_bytes() == (out_b / name).read_bytes()
    for name in ("region_a.height.png", "region_a.hillshade.png"):
        assert set(png_chunks(out_a / name)) <= {"IHDR", "IDAT", "IEND"}


def test_exceeding_the_byte_budget_fails_and_writes_nothing(tmp_path):
    cfg = copy.deepcopy(CONFIG)
    cfg["max_bytes_per_region"] = 10
    _, _, out, errors = bake(tmp_path, cfg)
    assert len(errors) == 1
    assert errors[0].startswith("ERROR region_a ")
    assert "exceed max_bytes_per_region 10" in errors[0]
    assert not out.exists() or list(out.iterdir()) == []


def test_a_failing_region_leaves_no_partial_files_and_does_not_stop_the_other_regions(tmp_path):
    cfg = copy.deepcopy(CONFIG)
    cfg["regions"].append({"id": "region_b", "bbox": [-80.0, -32.0, -76.0, -30.0], "max_size": 64})  # not covered
    _, _, out, errors = bake(tmp_path, cfg)
    assert [e.split(" ")[1] for e in errors] == ["region_b"]
    assert "bbox is not fully covered" in errors[0]
    assert sorted(p.name for p in out.iterdir()) == ["region_a.height.png", "region_a.hillshade.png", "region_a.json"]


def test_a_byte_budget_failure_in_the_second_region_leaves_nothing_for_it(tmp_path):
    noise = np.random.default_rng(7).uniform(0, 5000, size=(128, 256)).round()
    raw = tmp_path / "raw"
    make_dataset(raw, "dem_example", {"world.tif": dict(WORLD, array=noise, dx=1 / 16)})  # 16 x 8 degrees
    cfg = copy.deepcopy(CONFIG)
    cfg["regions"] = [
        {"id": "region_a", "bbox": [-70.0, -30.5, -69.0, -30.0], "max_size": 64},  # 16 x 8 pixels: small PNGs
        {"id": "region_b", "bbox": [-70.0, -34.0, -62.0, -30.0], "max_size": 128},  # 128 x 64 noisy pixels
    ]
    cfg["max_bytes_per_region"] = 5000
    cfgfile = tmp_path / "config.json"
    cfgfile.write_text(json.dumps(cfg), encoding="utf-8")
    out = tmp_path / "out"
    errors = bake_all(load_config(cfgfile), raw, out, "x")
    assert len(errors) == 1
    assert errors[0].startswith("ERROR region_b ")
    assert "exceed max_bytes_per_region 5000" in errors[0]
    assert sorted(p.name for p in out.iterdir()) == ["region_a.height.png", "region_a.hillshade.png", "region_a.json"]


def test_nodata_above_the_limit_fails_the_region_with_the_message(tmp_path):
    arr = ARRAY.astype(float)
    arr[0, :4] = -9999
    raw = tmp_path / "raw"
    make_dataset(raw, "dem_example", {"world.tif": dict(WORLD, array=arr, nodata=-9999)})
    cfgfile = tmp_path / "config.json"
    cfgfile.write_text(json.dumps(CONFIG), encoding="utf-8")
    errors = bake_all(load_config(cfgfile), raw, tmp_path / "out", "x")
    assert len(errors) == 1
    assert "4 nodata pixels (3.1%)" in errors[0]


def test_filled_fraction_is_recorded_when_below_the_limit(tmp_path):
    cfg = copy.deepcopy(CONFIG)
    big = np.tile(ARRAY.astype(float), (8, 8))  # 64 x 128 pixels, one nodata pixel = 1/8192 < 0.1%
    big[10, 10] = -9999
    raw = tmp_path / "raw"
    make_dataset(raw, "dem_example", {"world.tif": dict(WORLD, array=big, dx=1 / 16, nodata=-9999)})
    cfg["regions"][0]["bbox"] = [-70.0, -34.0, -62.0, -30.0]
    cfg["regions"][0]["max_size"] = 128
    cfgfile = tmp_path / "config.json"
    cfgfile.write_text(json.dumps(cfg), encoding="utf-8")
    out = tmp_path / "out"
    assert bake_all(load_config(cfgfile), raw, out, "x") == []
    meta = json.loads((out / "region_a.json").read_text(encoding="utf-8"))
    assert meta["filled_fraction"] == 1 / 8192


def test_unregistered_dem_file_fails_every_region_before_reading(tmp_path):
    raw, cfgfile, out = setup(tmp_path)
    (raw / "dem_example" / "extra.tif").write_bytes(b"not a tif")
    errors = bake_all(load_config(cfgfile), raw, out, "x")
    assert len(errors) == 1
    assert errors[0] == "ERROR region_a dem_example extra.tif unregistered file present"


def test_baking_never_touches_the_network(tmp_path, monkeypatch):
    def boom(*args, **kwargs):
        raise AssertionError("network access attempted")

    monkeypatch.setattr(socket, "socket", boom)
    _, _, out, errors = bake(tmp_path)
    assert errors == []
    assert (out / "region_a.json").exists()


# ---- CLI ----


def run_cli(args, capsys):
    code = main(args)
    captured = capsys.readouterr()
    return code, captured.out, captured.err


def test_cli_bake_success_exit_0(tmp_path, capsys):
    raw, cfg, out = setup(tmp_path)
    code, out_text, _ = run_cli(
        ["bake", "--config", str(cfg), "--attribution", "A", "--raw-root", str(raw), "--out-root", str(out)], capsys
    )
    assert code == 0
    assert "OK region_a" in out_text
    assert (out / "region_a.json").exists()


def test_cli_bake_processing_error_exit_1_with_message(tmp_path, capsys):
    cfgdoc = copy.deepcopy(CONFIG)
    cfgdoc["regions"][0]["bbox"] = [-90.0, -32.0, -86.0, -30.0]
    raw, cfg, out = setup(tmp_path, cfgdoc)
    code, _, err_text = run_cli(
        ["bake", "--config", str(cfg), "--attribution", "A", "--raw-root", str(raw), "--out-root", str(out)], capsys
    )
    assert code == 1
    assert "ERROR region_a bbox is not fully covered: uncovered fraction 1" in err_text


def test_cli_bake_config_error_exit_1(tmp_path, capsys):
    cfgdoc = copy.deepcopy(CONFIG)
    cfgdoc["regions"][0]["max_size"] = 63
    raw, cfg, out = setup(tmp_path, cfgdoc)
    code, _, err_text = run_cli(
        ["bake", "--config", str(cfg), "--attribution", "A", "--raw-root", str(raw), "--out-root", str(out)], capsys
    )
    assert code == 1
    assert "ERROR config region region_a: max_size must be an integer between 64 and 4096" in err_text


@pytest.mark.parametrize(
    "args",
    [
        [],
        ["bake"],
        ["bake", "--config", "x.json"],
        ["bake", "--config", "x.json", "--attribution", ""],
        ["bake", "--config", "x.json", "--attribution", "   "],
        ["unknown"],
        ["verify"],
    ],
)
def test_cli_usage_errors_exit_2(args, capsys):
    code, _, err_text = run_cli(args, capsys)
    assert code == 2
    assert err_text != ""


# ---- verify ----


def baked_plane(tmp_path):
    _, _, out, errors = bake(tmp_path)
    assert errors == []
    return out


def test_verify_prints_the_exact_table_for_known_heights(tmp_path, capsys):
    out = baked_plane(tmp_path)
    # center of pixel (row 0, col 0): lon -69.875, lat -30.125 -> 100 m; center of (row 1, col 2): 1120 m
    points = [
        {"name": "A", "lon": -69.875, "lat": -30.125, "expected_m": 100.0},
        {"name": "B", "lon": -69.375, "lat": -30.375, "expected_m": 1100.0},
        {"name": "Mid", "lon": -69.75, "lat": -30.125, "expected_m": 100.0},  # halfway between col 0 and col 1
    ]
    pts = tmp_path / "points.json"
    pts.write_text(json.dumps(points), encoding="utf-8")
    code, out_text, _ = run_cli(["verify", "--meta", str(out / "region_a.json"), "--points", str(pts)], capsys)
    assert code == 0
    assert out_text.splitlines() == [
        "name\texpected_m\tbaked_m\tdifference_m",
        "A\t100.00\t100.00\t0.00",
        "B\t1100.00\t1120.00\t20.00",
        "Mid\t100.00\t105.00\t5.00",
    ]


def test_verify_prints_outside_bbox_never_a_number(tmp_path, capsys):
    out = baked_plane(tmp_path)
    points = [
        {"name": "Far", "lon": 10.0, "lat": 10.0, "expected_m": 5.0},
        {"name": "EdgeStrip", "lon": -69.999, "lat": -30.125, "expected_m": 5.0},
    ]
    pts = tmp_path / "points.json"
    pts.write_text(json.dumps(points), encoding="utf-8")
    code, out_text, _ = run_cli(["verify", "--meta", str(out / "region_a.json"), "--points", str(pts)], capsys)
    assert code == 0
    assert out_text.splitlines()[1:] == ["Far\t5.00\toutside bbox\t-", "EdgeStrip\t5.00\toutside bbox\t-"]


def test_verify_function_returns_rows_with_none_outside(tmp_path):
    out = baked_plane(tmp_path)
    rows = verify_points(out / "region_a.json", [{"name": "Far", "lon": 10.0, "lat": 10.0, "expected_m": 5.0}])
    assert rows == [("Far", 5.0, None)]


def test_png_is_deterministic_in_memory():
    from terrain.bake import png_bytes

    rgb = np.zeros((2, 2, 3), dtype=np.uint8)
    assert png_bytes(rgb) == png_bytes(rgb)
    assert Image.open(io.BytesIO(png_bytes(rgb))).size == (2, 2)
