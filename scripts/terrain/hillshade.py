import math

import numpy as np

# Spherical Earth used to turn degrees into ground meters. Not given by the brief: a documented decision.
EARTH_RADIUS_M = 6371008.8


def _pad_axis(arr: np.ndarray, axis: int) -> np.ndarray:
    """Pad one cell on each side of an axis by linear extrapolation (exact for planes);
    an axis of length 1 is padded by replication."""
    n = arr.shape[axis]
    first = np.take(arr, [0], axis=axis)
    last = np.take(arr, [n - 1], axis=axis)
    if n >= 2:
        first = 2 * first - np.take(arr, [1], axis=axis)
        last = 2 * last - np.take(arr, [n - 2], axis=axis)
    return np.concatenate([first, arr, last], axis=axis)


def hillshade(
    heights: np.ndarray,
    north: float,
    dx_deg: float,
    dy_deg: float,
    azimuth_deg: float,
    altitude_deg: float,
    z_factor: float,
) -> np.ndarray:
    """Horn's method. Returns 8-bit shading, 255 * (surface normal . light vector), clipped at 0.

    Rows run from `north` southward; the ground size of a pixel uses the latitude of its row (a degree of
    longitude shrinks with the cosine of the latitude). Azimuth is clockwise from north. Border pixels use
    neighbours extrapolated linearly. Flat terrain gives exactly round(255 * sin(altitude)).
    """
    z = np.asarray(heights, dtype="float64")
    rows = z.shape[0]
    p = _pad_axis(_pad_axis(z, 0), 1)
    a, b, c = p[:-2, :-2], p[:-2, 1:-1], p[:-2, 2:]
    d, f = p[1:-1, :-2], p[1:-1, 2:]
    g, h, i = p[2:, :-2], p[2:, 1:-1], p[2:, 2:]

    meters_per_degree = math.pi * EARTH_RADIUS_M / 180
    lat = north - (np.arange(rows) + 0.5) * dy_deg
    dx_m = (dx_deg * meters_per_degree * np.cos(np.radians(lat)))[:, None]
    dy_m = dy_deg * meters_per_degree

    east_slope = z_factor * ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * dx_m)
    north_slope = z_factor * ((a + 2 * b + c) - (g + 2 * h + i)) / (8 * dy_m)

    azimuth = math.radians(azimuth_deg)
    altitude = math.radians(altitude_deg)
    light = (
        -east_slope * math.sin(azimuth) * math.cos(altitude)
        - north_slope * math.cos(azimuth) * math.cos(altitude)
        + math.sin(altitude)
    )
    shade = 255 * light / np.sqrt(1 + east_slope**2 + north_slope**2)
    return np.clip(np.rint(shade), 0, 255).astype(np.uint8)
