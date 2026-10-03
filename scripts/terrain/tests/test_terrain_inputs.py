import numpy as np
import pytest
import rasterio
from terrain import TerrainError
from terrain.mosaic import load_dem_inputs, mosaic_tiles
from terrain_testlib import make_dataset, register, write_tif


def tile(array, west, north, dx=1.0, **kw):
    return dict(array=array, west=west, north=north, dx=dx, **kw)


def test_load_dem_inputs_verifies_and_returns_provenance_and_hashes(tmp_path):
    make_dataset(tmp_path, "dem_example", {"b.tif": tile([[1, 2]], 0, 1), "a.tif": tile([[3, 4]], 2, 1)})
    inputs = load_dem_inputs(tmp_path, "dem_example")
    assert [p.name for p in inputs.tiles] == ["a.tif", "b.tif"]
    assert [i["path"] for i in inputs.inputs] == ["a.tif", "b.tif"]
    assert all(len(i["sha256"]) == 64 for i in inputs.inputs)
    assert inputs.source == "Example DEM"
    assert inputs.source_url == "https://example.com/dem"
    assert inputs.retrieved_at == "2026-01-01"
    assert inputs.license_or_terms == "Example terms"


def test_unregistered_file_fails_with_dataset_and_path(tmp_path):
    make_dataset(tmp_path, "dem_example", {"a.tif": tile([[1, 2]], 0, 1)})
    write_tif(tmp_path / "dem_example" / "extra.tif", [[1]], 5, 1, 1.0)
    with pytest.raises(TerrainError) as exc:
        load_dem_inputs(tmp_path, "dem_example")
    assert "dem_example extra.tif unregistered file present" in str(exc.value)


def test_hash_mismatch_fails_with_dataset_and_path(tmp_path):
    make_dataset(tmp_path, "dem_example", {"a.tif": tile([[1, 2]], 0, 1)})
    write_tif(tmp_path / "dem_example" / "a.tif", [[9, 9]], 0, 1, 1.0)
    with pytest.raises(TerrainError) as exc:
        load_dem_inputs(tmp_path, "dem_example")
    assert "dem_example a.tif sha256 mismatch" in str(exc.value)


def test_missing_file_fails_with_dataset_and_path(tmp_path):
    ds = make_dataset(tmp_path, "dem_example", {"a.tif": tile([[1, 2]], 0, 1)})
    (ds / "a.tif").unlink()
    with pytest.raises(TerrainError) as exc:
        load_dem_inputs(tmp_path, "dem_example")
    assert "dem_example a.tif file missing" in str(exc.value)


def test_missing_manifest_fails(tmp_path):
    (tmp_path / "dem_example").mkdir()
    with pytest.raises(TerrainError) as exc:
        load_dem_inputs(tmp_path, "dem_example")
    assert "dem_example MANIFEST.json missing" in str(exc.value)


@pytest.mark.parametrize(
    ("field", "other"),
    [
        ("source", "Another DEM"),
        ("source_url", "https://example.com/other"),
        ("retrieved_at", "2026-02-02"),
        ("license_or_terms", "Other terms"),
    ],
)
def test_disagreeing_manifest_entries_fail(tmp_path, field, other):
    make_dataset(tmp_path, "dem_example", {"a.tif": tile([[1, 2]], 0, 1)})
    write_tif(tmp_path / "dem_example" / "b.tif", [[3, 4]], 2, 1, 1.0)
    register(tmp_path, "dem_example", "b.tif", **{field: other})
    with pytest.raises(TerrainError) as exc:
        load_dem_inputs(tmp_path, "dem_example")
    assert f"manifest entries disagree on {field}" in str(exc.value)


def test_dataset_without_tiffs_fails(tmp_path):
    ds = tmp_path / "dem_example"
    ds.mkdir()
    (ds / "notes.txt").write_text("x", encoding="utf-8")
    register(tmp_path, "dem_example", "notes.txt")
    with pytest.raises(TerrainError, match="dem_example has no GeoTIFF files"):
        load_dem_inputs(tmp_path, "dem_example")


def test_two_adjacent_tiles_give_the_exact_array_and_geotransform(tmp_path):
    left = write_tif(tmp_path / "l.tif", [[1, 2], [3, 4]], 10.0, 21.0, 0.5)
    right = write_tif(tmp_path / "r.tif", [[5, 6], [7, 8]], 11.0, 21.0, 0.5)
    m = mosaic_tiles([right, left])
    np.testing.assert_array_equal(m.data, [[1, 2, 5, 6], [3, 4, 7, 8]])
    assert (m.west, m.north, m.dx, m.dy) == (10.0, 21.0, 0.5, 0.5)
    assert m.covered.all()


def test_tiles_with_a_gap_leave_uncovered_pixels(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1]], 0.0, 2.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[2]], 2.0, 2.0, 1.0)
    m = mosaic_tiles([a, b])
    assert m.data.shape == (1, 3)
    assert m.covered.tolist() == [[True, False, True]]
    assert np.isnan(m.data[0, 1])


def test_declared_nodata_becomes_nan_but_stays_covered(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1, -9999], [0, 4]], 0.0, 2.0, 1.0, nodata=-9999)
    m = mosaic_tiles([a])
    assert np.isnan(m.data[0, 1])
    assert m.covered.all()
    assert m.data[1, 0] == 0.0  # a true zero is a measurement, not missing


def test_overlap_within_one_meter_averages(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[10, 20]], 0.0, 1.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[20.5, 30]], 1.0, 1.0, 1.0)
    m = mosaic_tiles([a, b])
    np.testing.assert_array_equal(m.data, [[10, 20.25, 30]])


def test_overlap_difference_of_exactly_one_meter_is_allowed(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[10, 20]], 0.0, 1.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[21, 30]], 1.0, 1.0, 1.0)
    assert mosaic_tiles([a, b]).data[0, 1] == 20.5


def test_overlap_above_one_meter_fails_with_the_first_location(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[10, 20, 30]], 0.0, 1.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[22, 31]], 1.0, 1.0, 1.0)  # differs by 2 at col 1, 1 at col 2
    with pytest.raises(TerrainError) as exc:
        mosaic_tiles([a, b])
    assert "overlap mismatch of 2.0 m at lon 1.500000 lat 0.500000" in str(exc.value)


def test_overlap_with_nodata_in_one_tile_uses_the_valid_value(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[10, -9999]], 0.0, 1.0, 1.0, nodata=-9999)
    b = write_tif(tmp_path / "b.tif", [[50, 30]], 1.0, 1.0, 1.0)
    np.testing.assert_array_equal(mosaic_tiles([a, b]).data, [[10, 50, 30]])


def test_different_crs_fails(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1]], 0.0, 1.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[2]], 1.0, 1.0, 1.0, crs="EPSG:3857")
    with pytest.raises(TerrainError, match="tiles do not share the same CRS"):
        mosaic_tiles([a, b])


def test_non_geographic_crs_fails(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1]], 0.0, 1.0, 1.0, crs="EPSG:3857")
    with pytest.raises(TerrainError, match="a.tif has CRS EPSG:3857, expected EPSG:4326"):
        mosaic_tiles([a])


def test_different_pixel_sizes_fail(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1]], 0.0, 1.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[2]], 1.0, 1.0, 0.5)
    with pytest.raises(TerrainError, match="tiles have different pixel sizes"):
        mosaic_tiles([a, b])


def test_misaligned_grids_fail(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1]], 0.0, 1.0, 1.0)
    b = write_tif(tmp_path / "b.tif", [[2]], 1.5, 1.0, 1.0)
    with pytest.raises(TerrainError, match="b.tif is not aligned to the pixel grid"):
        mosaic_tiles([a, b])


def test_synthetic_tiles_are_real_geotiffs_in_epsg4326(tmp_path):
    a = write_tif(tmp_path / "a.tif", [[1.5]], 0.0, 1.0, 1.0)
    with rasterio.open(a) as src:
        assert src.crs.to_string() == "EPSG:4326"
    assert mosaic_tiles([a]).data[0, 0] == 1.5
