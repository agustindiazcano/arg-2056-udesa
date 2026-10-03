import io
import json
import math
import os
from pathlib import Path

import numpy as np
from PIL import Image

from . import TerrainError
from .config import Config, Region
from .encode import decode_terrarium, encode_terrarium
from .hillshade import EARTH_RADIUS_M, hillshade
from .mosaic import DemInputs, Mosaic, load_dem_inputs, mosaic_tiles
from .resample import crop_to_bbox, fill_nodata, resample


def png_bytes(array: np.ndarray) -> bytes:
    """Deterministic PNG: fixed compression level and no ancillary chunks."""
    buffer = io.BytesIO()
    Image.fromarray(array).save(buffer, format="PNG", compress_level=9)
    return buffer.getvalue()


def _write_atomically(files: dict[Path, bytes]) -> None:
    temps = {}
    try:
        for path, content in files.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            temp = path.with_name(f".{path.name}.tmp")
            temp.write_bytes(content)
            temps[path] = temp
        for path, temp in temps.items():
            os.replace(temp, path)
    finally:
        for temp in temps.values():
            if temp.exists():
                temp.unlink()


def bake_region(
    region: Region, config: Config, mosaic: Mosaic, dem: DemInputs, attribution: str, out_root: Path
) -> dict:
    cropped = crop_to_bbox(mosaic, region.bbox)
    filled, filled_fraction = fill_nodata(cropped)
    small = resample(filled, region.max_size)

    rgb = encode_terrarium(small.data)
    heights = decode_terrarium(rgb)  # the baked heights, rounded to 1/256 m
    west, south, east, north = small.bbox
    shade = hillshade(
        heights,
        north,
        small.pixel_dx,
        small.pixel_dy,
        config.hillshade.azimuth_deg,
        config.hillshade.altitude_deg,
        config.hillshade.z_factor,
    )

    height_png = png_bytes(rgb)
    shade_png = png_bytes(shade)
    total = len(height_png) + len(shade_png)
    if total > config.max_bytes_per_region:
        raise TerrainError(
            f"PNG files total {total} bytes, which exceed max_bytes_per_region {config.max_bytes_per_region}"
        )

    meters_per_degree = math.pi * EARTH_RADIUS_M / 180
    center_lat = (south + north) / 2
    files = {"height": f"{region.id}.height.png", "hillshade": f"{region.id}.hillshade.png"}
    meta = {
        "id": region.id,
        "crs": "EPSG:4326",
        "bbox": [west, south, east, north],
        "width": int(heights.shape[1]),
        "height": int(heights.shape[0]),
        "pixel_size_deg": {"x": small.pixel_dx, "y": small.pixel_dy},
        "meters_per_pixel": {
            "x": small.pixel_dx * meters_per_degree * math.cos(math.radians(center_lat)),
            "y": small.pixel_dy * meters_per_degree,
        },
        "encoding": "terrarium",
        "elevation_min_m": float(heights.min()),
        "elevation_max_m": float(heights.max()),
        "filled_fraction": filled_fraction,
        "hillshade": {
            "azimuth_deg": config.hillshade.azimuth_deg,
            "altitude_deg": config.hillshade.altitude_deg,
            "z_factor": config.hillshade.z_factor,
        },
        "files": files,
        "bytes": {"height": len(height_png), "hillshade": len(shade_png)},
        "dem_inputs": dem.inputs,
        "source": dem.source,
        "source_url": dem.source_url,
        "retrieved_at": dem.retrieved_at,
        "license_or_terms": dem.license_or_terms,
        "attribution": attribution,
        "generated_by": "scripts/terrain",
    }

    out_root = Path(out_root)
    _write_atomically(
        {
            out_root / files["height"]: height_png,
            out_root / files["hillshade"]: shade_png,
            out_root / f"{region.id}.json": (json.dumps(meta, indent=2, sort_keys=True) + "\n").encode("utf-8"),
        }
    )
    return meta


def bake_all(config: Config, raw_root: Path, out_root: Path, attribution: str) -> list[str]:
    """Bake every region. Returns the error lines (empty on success); a failing region writes nothing."""
    try:
        dem = load_dem_inputs(Path(raw_root), config.dem_dataset_id)
        mosaic = mosaic_tiles(dem.tiles)
    except TerrainError as exc:
        return [f"ERROR {region.id} {exc}" for region in config.regions]

    errors = []
    for region in config.regions:
        try:
            bake_region(region, config, mosaic, dem, attribution, Path(out_root))
        except TerrainError as exc:
            errors.append(f"ERROR {region.id} {exc}")
    return errors


def verify_points(meta_path: Path, points: list[dict]) -> list[tuple[str, float, float | None]]:
    """Bilinear samples of the baked height image. None means the point is outside the bbox (or within half a
    pixel of its edge, where there are not four pixel centers to interpolate). Pixel (0, 0) has its center at
    west + 0.5 pixel, north - 0.5 pixel."""
    meta_path = Path(meta_path)
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    image = Image.open(meta_path.parent / meta["files"]["height"]).convert("RGB")
    heights = decode_terrarium(np.asarray(image))
    rows, cols = heights.shape
    if (cols, rows) != (meta["width"], meta["height"]):
        raise TerrainError(f"height image is {cols}x{rows}, metadata says {meta['width']}x{meta['height']}")

    west, _, _, north = meta["bbox"]
    dx, dy = meta["pixel_size_deg"]["x"], meta["pixel_size_deg"]["y"]
    result = []
    for point in points:
        x = (point["lon"] - west) / dx - 0.5
        y = (north - point["lat"]) / dy - 0.5
        if x < 0 or y < 0 or x > cols - 1 or y > rows - 1:
            result.append((point["name"], float(point["expected_m"]), None))
            continue
        x0 = min(math.floor(x), max(cols - 2, 0))
        y0 = min(math.floor(y), max(rows - 2, 0))
        x1, y1 = min(x0 + 1, cols - 1), min(y0 + 1, rows - 1)
        fx, fy = x - x0, y - y0
        top = heights[y0, x0] * (1 - fx) + heights[y0, x1] * fx
        bottom = heights[y1, x0] * (1 - fx) + heights[y1, x1] * fx
        result.append((point["name"], float(point["expected_m"]), float(top * (1 - fy) + bottom * fy)))
    return result
