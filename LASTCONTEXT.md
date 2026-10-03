# Last Context

## State
- Task `terrain-bake` on branch `task/terrain-bake`: the tool that bakes measured elevation (DEM GeoTIFF) into static terrain files, plus a renderer-agnostic web loader. No real DEM data and no real terrain output committed.
- Python (`scripts/terrain/`): `config.py`, `mosaic.py` (manifest verification, mosaic), `resample.py` (crop, nodata fill, block-mean resample), `encode.py` (terrarium), `hillshade.py` (Horn), `bake.py` (orchestration, atomic writes, `verify_points`), `__main__.py` (CLI `bake` and `verify`). Tests in `scripts/terrain/tests/` (142), plus `data/schemas/terrain_meta.schema.json`.
- Web (`web/src/terrain/`, `web/src/types/terrain.ts`): `parseTerrainMeta`, `decodeTerrarium`, `sampleElevation`, `lonLatToPixel`, `pixelToLonLat`, `elevationRange`, `loadTerrain` with injectable fetch and decoder. 33 Vitest tests.
- Plumbing: `scripts/terrain/requirements.txt` (numpy, rasterio, Pillow, pinned), `scripts/precheck.py` step `terrain` (prints `SKIP terrain: install scripts/terrain/requirements.txt` when the packages are missing), root `pytest.ini` skips `terrain` directories, CI job `terrain` (always runs), `docs/terrain.md`, `terrain/config.example.json` (fake values).
- TDD: each test commit precedes its implementation commit.

## Decisions (for the human)
- Dependency exception and the local precheck skip.
- Earth radius 6,371,008.8 m for hillshade ground distances (the brief gave none).
- The crop snaps outward to whole pixels; the metadata `bbox` is the snapped box.
- Hillshade borders use neighbours extrapolated linearly (exact for planes).
- `verify` prints `outside bbox` for points outside the box or within half a pixel of its edge.
- The Python schema test cannot check `format: uri` (no extra package); the TypeScript parser (ajv-formats) does.
- Rejected tiles: different CRS, non-EPSG:4326, rotated, different pixel size, misaligned grid.

## Next step
- Human: download and register the DEM, set the bounding boxes, bake, verify, commit the outputs (`docs/terrain.md`), before `andes-integration`.
- Next in `TASKS.md`: `geo-provinces`.
- Pushed, CI not checked. rasterio was only run on Windows locally.
