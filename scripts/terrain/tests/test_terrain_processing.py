import numpy as np
import pytest
from terrain.mosaic import Mosaic
from terrain.resample import crop_to_bbox, fill_nodata, resample

from terrain import TerrainError


def mosaic(data, west=0.0, north=10.0, dx=1.0, dy=1.0, covered=None):
    data = np.asarray(data, dtype="float64")
    cov = np.ones(data.shape, dtype=bool) if covered is None else np.asarray(covered, dtype=bool)
    return Mosaic(data=data, covered=cov, west=west, north=north, dx=dx, dy=dy)


# ---- crop ----


def test_crop_returns_the_exact_window_and_bbox():
    m = mosaic(np.arange(25).reshape(5, 5), west=0.0, north=5.0)
    c = crop_to_bbox(m, (1.0, 1.0, 4.0, 4.0))  # cols 1..3, rows 1..3
    np.testing.assert_array_equal(c.data, [[6, 7, 8], [11, 12, 13], [16, 17, 18]])
    assert (c.west, c.north, c.dx, c.dy) == (1.0, 4.0, 1.0, 1.0)
    assert c.bbox == (1.0, 1.0, 4.0, 4.0)


def test_crop_snaps_outward_to_pixel_edges_and_reports_the_actual_bbox():
    m = mosaic(np.arange(25).reshape(5, 5), west=0.0, north=5.0)
    c = crop_to_bbox(m, (1.2, 1.2, 3.8, 3.8))
    assert c.data.shape == (3, 3)
    assert c.bbox == (1.0, 1.0, 4.0, 4.0)


def test_crop_not_fully_covered_fails_with_the_uncovered_fraction():
    m = mosaic(np.ones((4, 4)), west=0.0, north=4.0)
    with pytest.raises(TerrainError) as exc:
        crop_to_bbox(m, (2.0, 0.0, 6.0, 4.0))  # right half is outside the mosaic
    assert "bbox is not fully covered: uncovered fraction 0.5" in str(exc.value)


def test_crop_with_a_hole_inside_the_mosaic_counts_it_as_uncovered():
    covered = np.ones((4, 4), dtype=bool)
    covered[0, 0] = False
    m = mosaic(np.ones((4, 4)), west=0.0, north=4.0, covered=covered)
    with pytest.raises(TerrainError) as exc:
        crop_to_bbox(m, (0.0, 0.0, 4.0, 4.0))
    assert "uncovered fraction 0.0625" in str(exc.value)


# ---- no-data ----


def test_nodata_above_the_limit_fails_with_count_and_first_location():
    data = np.ones((10, 100))
    data[2, 3] = np.nan
    data[2, 4] = np.nan  # 2 of 1000 pixels = 0.2% > 0.1%
    m = mosaic(data, west=0.0, north=10.0)
    c = crop_to_bbox(m, (0.0, 0.0, 100.0, 10.0))
    with pytest.raises(TerrainError) as exc:
        fill_nodata(c)
    msg = str(exc.value)
    assert "2 nodata pixels (0.2%)" in msg
    assert "first at lon 3.500000 lat 7.500000" in msg


def test_nodata_exactly_at_the_limit_is_filled():
    data = np.ones((10, 100))
    data[0, 0] = np.nan  # 1 of 1000 = 0.1%, not more than 0.1%
    c = crop_to_bbox(mosaic(data), (0.0, 0.0, 100.0, 10.0))
    filled, fraction = fill_nodata(c)
    assert fraction == 0.001
    assert filled.data[0, 0] == 1.0


def test_nodata_below_the_limit_fills_with_the_nearest_valid_pixel_and_reports_the_fraction():
    data = np.arange(2000, dtype="float64").reshape(20, 100)
    original = data.copy()
    data[5, 50] = np.nan
    c = crop_to_bbox(mosaic(data, north=20.0), (0.0, 0.0, 100.0, 20.0))
    filled, fraction = fill_nodata(c)
    assert fraction == 1 / 2000
    # nearest valid pixels are the 4 neighbours at distance 1; ties break by smallest row then column
    assert filled.data[5, 50] == original[4, 50]
    assert np.isnan(filled.data).sum() == 0


def test_fill_ties_break_by_smallest_row_then_column_and_use_only_original_pixels():
    data = np.arange(4000, dtype="float64").reshape(20, 200)
    original = data.copy()
    data[5:7, 50:52] = np.nan  # a 2x2 hole: 4 of 4000 pixels = 0.1%
    c = crop_to_bbox(mosaic(data, north=20.0), (0.0, 0.0, 200.0, 20.0))
    filled, fraction = fill_nodata(c)
    assert fraction == 0.001
    # every hole pixel has two valid neighbours at distance 1; the one with the smaller row (then column) wins
    assert filled.data[5, 50] == original[4, 50]
    assert filled.data[5, 51] == original[4, 51]
    assert filled.data[6, 50] == original[6, 49]
    assert filled.data[6, 51] == original[6, 52]
    assert not np.isnan(filled.data).any()


def test_fill_skips_missing_neighbours_and_takes_the_closest_valid_pixel():
    data = np.full((20, 200), 5.0)
    data[8, 100] = np.nan
    data[7, 100] = np.nan  # up
    data[9, 100] = np.nan  # down
    data[8, 99] = np.nan  # left: 4 of 4000 pixels = 0.1%
    data[8, 101] = 222.0  # right, distance 1: the only valid pixel at that distance
    c = crop_to_bbox(mosaic(data, north=20.0), (0.0, 0.0, 200.0, 20.0))
    filled, fraction = fill_nodata(c)
    assert fraction == 0.001
    assert filled.data[8, 100] == 222.0


def test_a_block_of_true_zeros_is_not_missing():
    data = np.zeros((10, 100))
    c = crop_to_bbox(mosaic(data), (0.0, 0.0, 100.0, 10.0))
    filled, fraction = fill_nodata(c)
    assert fraction == 0.0
    np.testing.assert_array_equal(filled.data, data)


def test_all_nodata_fails():
    data = np.full((10, 100), np.nan)
    c = crop_to_bbox(mosaic(data), (0.0, 0.0, 100.0, 10.0))
    with pytest.raises(TerrainError, match="1000 nodata pixels"):
        fill_nodata(c)


# ---- resample ----


def test_block_mean_4x4_to_2x2_is_exact():
    data = np.array([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]], dtype="float64")
    c = crop_to_bbox(mosaic(data, north=4.0), (0.0, 0.0, 4.0, 4.0))
    out = resample(c, 2)
    np.testing.assert_array_equal(out.data, [[3.5, 5.5], [11.5, 13.5]])
    assert out.bbox == (0.0, 0.0, 4.0, 4.0)
    assert (out.pixel_dx, out.pixel_dy) == (2.0, 2.0)


def test_resample_never_upscales():
    data = np.arange(16, dtype="float64").reshape(4, 4)
    c = crop_to_bbox(mosaic(data, north=4.0), (0.0, 0.0, 4.0, 4.0))
    out = resample(c, 64)
    np.testing.assert_array_equal(out.data, data)
    assert (out.pixel_dx, out.pixel_dy) == (1.0, 1.0)


def test_resample_keeps_the_geographic_aspect_with_the_long_side_at_max_size():
    data = np.ones((100, 400))
    c = crop_to_bbox(mosaic(data, north=100.0), (0.0, 0.0, 400.0, 100.0))
    out = resample(c, 200)
    assert out.data.shape == (50, 200)
    assert (out.pixel_dx, out.pixel_dy) == (2.0, 2.0)


def test_resample_with_a_non_integer_factor_preserves_the_mean():
    data = np.arange(30, dtype="float64").reshape(5, 6)
    c = crop_to_bbox(mosaic(data, north=5.0), (0.0, 0.0, 6.0, 5.0))
    out = resample(c, 4)  # 6 -> 4 columns, 5 -> round(5 * 4 / 6) = 3 rows
    assert out.data.shape == (3, 4)
    assert out.data.mean() == pytest.approx(data.mean(), rel=1e-12)
    # first output cell covers source rows 0..5/3 and columns 0..1.5 with area weights
    rows = np.array([1.0, 2 / 3])
    cols = np.array([1.0, 0.5])
    expected = (data[:2, :2] * np.outer(rows, cols)).sum() / np.outer(rows, cols).sum()
    assert out.data[0, 0] == pytest.approx(expected, rel=1e-12)
