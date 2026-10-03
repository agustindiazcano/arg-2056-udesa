"""Helpers that build tiny synthetic rasters and raw datasets inside tmp_path. No real data."""
from pathlib import Path

import numpy as np
import rasterio
from datapipe.manifest import register_file
from rasterio.transform import from_origin


def write_tif(path, array, west, north, dx, dy=None, nodata=None, crs="EPSG:4326"):
    array = np.asarray(array, dtype="float32")
    dy = dx if dy is None else dy
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(
        path,
        "w",
        driver="GTiff",
        height=array.shape[0],
        width=array.shape[1],
        count=1,
        dtype="float32",
        crs=crs,
        transform=from_origin(west, north, dx, dy),
        nodata=nodata,
    ) as dst:
        dst.write(array, 1)
    return path


def register(
    raw_root,
    dataset_id,
    name,
    source="Example DEM",
    source_url="https://example.com/dem",
    retrieved_at="2026-01-01",
    license_or_terms="Example terms",
):
    register_file(
        Path(raw_root) / dataset_id,
        name,
        source=source,
        source_url=source_url,
        retrieved_at=retrieved_at,
        license_or_terms=license_or_terms,
        redistributable=True,
        private=False,
        note=None,
    )


def make_dataset(raw_root, dataset_id, tiles, **provenance):
    """tiles: dict name -> dict(array=..., west=..., north=..., dx=..., [dy, nodata, crs])."""
    for name, spec in tiles.items():
        write_tif(Path(raw_root) / dataset_id / name, **spec)
        register(raw_root, dataset_id, name, **provenance)
    return Path(raw_root) / dataset_id
