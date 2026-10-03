import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import rasterio
from datapipe.manifest import ManifestError, verify_manifest
from rasterio.crs import CRS

from . import TerrainError

OVERLAP_TOLERANCE_M = 1.0
PROVENANCE_FIELDS = ("source", "source_url", "retrieved_at", "license_or_terms")
GEOGRAPHIC_CRS = CRS.from_epsg(4326)


@dataclass(frozen=True)
class DemInputs:
    tiles: list[Path]
    inputs: list[dict]
    source: str
    source_url: str | None
    retrieved_at: str
    license_or_terms: str | None


@dataclass(frozen=True)
class Mosaic:
    """Elevation array in EPSG:4326. NaN marks declared nodata (or no tile); covered marks pixels inside a tile."""

    data: np.ndarray
    covered: np.ndarray
    west: float
    north: float
    dx: float
    dy: float


def load_dem_inputs(raw_root: Path, dataset_id: str) -> DemInputs:
    dataset_dir = Path(raw_root) / dataset_id
    try:
        verify_manifest(dataset_id, dataset_dir)
    except ManifestError as exc:
        raise TerrainError(str(exc).removeprefix("ERROR ")) from exc

    manifest = json.loads((dataset_dir / "MANIFEST.json").read_text(encoding="utf-8"))
    entries = sorted(
        (e for e in manifest["files"] if e["path"].lower().endswith((".tif", ".tiff"))),
        key=lambda e: e["path"],
    )
    if not entries:
        raise TerrainError(f"{dataset_id} has no GeoTIFF files")

    for field in PROVENANCE_FIELDS:
        if len({e.get(field) for e in entries}) > 1:
            raise TerrainError(f"{dataset_id} manifest entries disagree on {field}")

    tiles = []
    for entry in entries:
        if entry.get("private", False):
            tiles.append(dataset_dir.parent / "_private" / dataset_id / entry["path"])
        else:
            tiles.append(dataset_dir / entry["path"])

    first = entries[0]
    return DemInputs(
        tiles=tiles,
        inputs=[{"path": e["path"], "sha256": e["sha256"]} for e in entries],
        source=first["source"],
        source_url=first.get("source_url"),
        retrieved_at=first["retrieved_at"],
        license_or_terms=first.get("license_or_terms"),
    )


@dataclass(frozen=True)
class _Tile:
    name: str
    crs: CRS | None
    west: float
    north: float
    dx: float
    dy: float
    data: np.ndarray
    valid: np.ndarray


def _read_tile(path: Path) -> _Tile:
    with rasterio.open(path) as src:
        t = src.transform
        if t.b != 0 or t.d != 0 or t.e >= 0 or t.a <= 0:
            raise TerrainError(f"{path.name} is rotated or not north-up")
        data = src.read(1).astype("float64")
        nodata = src.nodata
        valid = ~np.isnan(data)
        if nodata is not None and not np.isnan(nodata):
            valid &= data != nodata
        return _Tile(path.name, src.crs, t.c, t.f, t.a, -t.e, data, valid)


def mosaic_tiles(paths: list[Path]) -> Mosaic:
    tiles = [_read_tile(Path(p)) for p in paths]
    if not tiles:
        raise TerrainError("no tiles to mosaic")

    if any(t.crs is None for t in tiles):
        raise TerrainError(f"{next(t.name for t in tiles if t.crs is None)} has no CRS")
    if any(t.crs != tiles[0].crs for t in tiles):
        raise TerrainError("tiles do not share the same CRS")
    if tiles[0].crs != GEOGRAPHIC_CRS:
        raise TerrainError(f"{tiles[0].name} has CRS {tiles[0].crs.to_string()}, expected EPSG:4326")

    dx, dy = tiles[0].dx, tiles[0].dy
    for t in tiles[1:]:
        if not (np.isclose(t.dx, dx, rtol=1e-9, atol=0) and np.isclose(t.dy, dy, rtol=1e-9, atol=0)):
            raise TerrainError("tiles have different pixel sizes")

    west = min(t.west for t in tiles)
    north = max(t.north for t in tiles)
    east = max(t.west + t.data.shape[1] * dx for t in tiles)
    south = min(t.north - t.data.shape[0] * dy for t in tiles)
    width = round((east - west) / dx)
    height = round((north - south) / dy)

    total = np.zeros((height, width))
    count = np.zeros((height, width), dtype=int)
    low = np.full((height, width), np.inf)
    high = np.full((height, width), -np.inf)
    covered = np.zeros((height, width), dtype=bool)

    for t in tiles:
        col = (t.west - west) / dx
        row = (north - t.north) / dy
        if abs(col - round(col)) > 1e-6 or abs(row - round(row)) > 1e-6:
            raise TerrainError(f"{t.name} is not aligned to the pixel grid")
        r0, c0 = round(row), round(col)
        h, w = t.data.shape
        window = (slice(r0, r0 + h), slice(c0, c0 + w))
        covered[window] = True
        values = np.where(t.valid, t.data, 0.0)
        total[window] += values
        count[window] += t.valid
        low[window] = np.where(t.valid, np.minimum(low[window], t.data), low[window])
        high[window] = np.where(t.valid, np.maximum(high[window], t.data), high[window])

    bad = (count > 1) & ((high - low) > OVERLAP_TOLERANCE_M)
    if bad.any():
        r, c = np.argwhere(bad)[0]
        lon = west + (c + 0.5) * dx
        lat = north - (r + 0.5) * dy
        raise TerrainError(f"overlap mismatch of {float(high[r, c] - low[r, c])} m at lon {lon:.6f} lat {lat:.6f}")

    data = np.full((height, width), np.nan)
    has = count > 0
    data[has] = total[has] / count[has]
    return Mosaic(data=data, covered=covered, west=west, north=north, dx=dx, dy=dy)
