import numpy as np

from . import TerrainError

MIN_HEIGHT_M = -32768
MAX_HEIGHT_M = 32767
OFFSET = 32768


def encode_terrarium(heights: np.ndarray) -> np.ndarray:
    """Encode heights (meters) as 8-bit RGB: value = height + 32768, R = floor(value / 256),
    G = floor(value) % 256, B = floor(fraction * 256). Heights are rounded to the nearest 1/256 m
    (ties to even). Returns an array of shape heights.shape + (3,) and dtype uint8."""
    heights = np.asarray(heights, dtype="float64")
    if not np.isfinite(heights).all():
        raise TerrainError("heights are not finite")
    if heights.min() < MIN_HEIGHT_M or heights.max() > MAX_HEIGHT_M:
        raise TerrainError(
            f"height {heights.min() if heights.min() < MIN_HEIGHT_M else heights.max()} m is outside the range "
            f"{MIN_HEIGHT_M}..{MAX_HEIGHT_M}"
        )
    steps = np.rint((heights + OFFSET) * 256).astype(np.int64)  # value in 1/256 m units
    whole = steps // 256
    rgb = np.empty(heights.shape + (3,), dtype=np.uint8)
    rgb[..., 0] = whole // 256
    rgb[..., 1] = whole % 256
    rgb[..., 2] = steps % 256
    return rgb


def decode_terrarium(rgb: np.ndarray) -> np.ndarray:
    """Inverse of encode_terrarium: height = R * 256 + G + B / 256 - 32768."""
    rgb = np.asarray(rgb)
    r = rgb[..., 0].astype("float64")
    g = rgb[..., 1].astype("float64")
    b = rgb[..., 2].astype("float64")
    return r * 256 + g + b / 256 - OFFSET
