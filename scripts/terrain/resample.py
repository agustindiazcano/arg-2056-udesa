import math
from dataclasses import dataclass

import numpy as np

from . import TerrainError
from .mosaic import Mosaic

NODATA_LIMIT = 0.001  # more than 0.1% of the pixels in the bbox fails
EPS = 1e-9


@dataclass(frozen=True)
class Cropped:
    """Window of the mosaic. NaN marks declared nodata. bbox is the snapped (west, south, east, north)."""

    data: np.ndarray
    west: float
    north: float
    dx: float
    dy: float
    bbox: tuple[float, float, float, float]


@dataclass(frozen=True)
class Resampled:
    data: np.ndarray
    bbox: tuple[float, float, float, float]
    pixel_dx: float
    pixel_dy: float


def crop_to_bbox(m: Mosaic, bbox: tuple[float, float, float, float]) -> Cropped:
    """Crop to the bbox, snapping outward to pixel edges so the requested bbox is always inside the window."""
    west, south, east, north = bbox
    col0 = math.floor((west - m.west) / m.dx + EPS)
    col1 = math.ceil((east - m.west) / m.dx - EPS)
    row0 = math.floor((m.north - north) / m.dy + EPS)
    row1 = math.ceil((m.north - south) / m.dy - EPS)
    width, height = col1 - col0, row1 - row0

    rows, cols = m.data.shape
    r_lo, r_hi = max(row0, 0), min(row1, rows)
    c_lo, c_hi = max(col0, 0), min(col1, cols)
    inside = 0
    if r_lo < r_hi and c_lo < c_hi:
        inside = int(m.covered[r_lo:r_hi, c_lo:c_hi].sum())
    uncovered = 1 - inside / (width * height)
    if inside != width * height:
        raise TerrainError(f"bbox is not fully covered: uncovered fraction {uncovered:.6g}")

    actual = (
        m.west + col0 * m.dx,
        m.north - row1 * m.dy,
        m.west + col1 * m.dx,
        m.north - row0 * m.dy,
    )
    return Cropped(
        data=m.data[row0:row1, col0:col1].copy(),
        west=actual[0],
        north=actual[3],
        dx=m.dx,
        dy=m.dy,
        bbox=actual,
    )


def _location(c: Cropped, row: int, col: int) -> str:
    lon = c.west + (col + 0.5) * c.dx
    lat = c.north - (row + 0.5) * c.dy
    return f"lon {lon:.6f} lat {lat:.6f}"


def fill_nodata(c: Cropped) -> tuple[Cropped, float]:
    """Fill nodata with the nearest valid pixel (ties: smallest row, then column). Returns the filled window and
    the exact filled fraction. Zero is a valid elevation and is never treated as missing."""
    missing = np.isnan(c.data)
    count = int(missing.sum())
    total = c.data.size
    if count == 0:
        return c, 0.0
    if count / total > NODATA_LIMIT:
        first = np.argwhere(missing)[:5]
        where = "; ".join(_location(c, int(r), int(k)) for r, k in first)
        raise TerrainError(f"{count} nodata pixels ({count / total * 100:.1f}%), first at {where}")

    valid = ~missing
    filled = c.data.copy()
    height, width = c.data.shape
    for row, col in np.argwhere(missing):
        radius = 1
        while True:
            r0, r1 = max(row - radius, 0), min(row + radius + 1, height)
            c0, c1 = max(col - radius, 0), min(col + radius + 1, width)
            rr, cc = np.nonzero(valid[r0:r1, c0:c1])
            if rr.size:
                rr, cc = rr + r0, cc + c0
                d2 = (rr - row) ** 2 + (cc - col) ** 2
                needed = math.ceil(math.sqrt(d2.min()))
                if needed <= radius:
                    best = np.lexsort((cc, rr, d2))[0]
                    filled[row, col] = c.data[rr[best], cc[best]]
                    break
                radius = needed
            else:
                radius *= 2
    return (
        Cropped(data=filled, west=c.west, north=c.north, dx=c.dx, dy=c.dy, bbox=c.bbox),
        count / total,
    )


def _area_mean_axis(arr: np.ndarray, n_out: int, axis: int) -> np.ndarray:
    """Area-weighted mean of n_in cells into n_out cells along an axis (exact block mean for integer factors)."""
    n_in = arr.shape[axis]
    if n_out == n_in:
        return arr
    arr = np.moveaxis(arr, axis, 0)
    prefix = np.concatenate([np.zeros((1,) + arr.shape[1:]), np.cumsum(arr, axis=0)])

    def integral(x: np.ndarray) -> np.ndarray:
        idx = np.minimum(np.floor(x).astype(int), n_in - 1)
        frac = (x - idx).reshape((-1,) + (1,) * (arr.ndim - 1))
        return prefix[idx] + frac * arr[idx]

    edges = np.linspace(0.0, float(n_in), n_out + 1)
    out = (integral(edges[1:]) - integral(edges[:-1])) / (n_in / n_out)
    return np.moveaxis(out, 0, axis)


def resample(c: Cropped, max_size: int) -> Resampled:
    """Block-average (area mean) so the long side equals max_size. Never upscales."""
    height, width = c.data.shape
    scale = min(1.0, max_size / max(height, width))
    if scale == 1.0:
        data = c.data
    else:
        new_w = max(1, round(width * scale))
        new_h = max(1, round(height * scale))
        data = _area_mean_axis(_area_mean_axis(c.data, new_h, 0), new_w, 1)
    west, south, east, north = c.bbox
    return Resampled(
        data=data,
        bbox=c.bbox,
        pixel_dx=(east - west) / data.shape[1],
        pixel_dy=(north - south) / data.shape[0],
    )
