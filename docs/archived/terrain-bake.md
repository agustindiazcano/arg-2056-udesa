# Task: `terrain-bake`

Branch: `task/terrain-bake`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md`, `docs/data-pipeline.md`, `docs/sources.md` (geodata section) and the existing `scripts/precheck.py` and `.github/workflows/*.yml` first.
Prerequisite: `data-pipeline` is merged (this task uses its raw manifest format and loader). If it is not merged, stop and tell me.

## Goal

Build the tool that turns real elevation data (a digital elevation model, DEM) into small static terrain files for the Andes scene, plus a renderer-agnostic loader in the web app. The terrain comes only from measured elevation, never from a generative model. Nothing depends on an external tile server at runtime.

This PR contains **no real terrain output**. The human downloads the DEM files, registers them, runs the tool locally and commits the outputs in a later step. Tests use small synthetic rasters built inside the tests.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No rendering code, no Three.js, no MapLibre, no deck.gl, no scene changes. The renderer is decided in `andes-integration`.
- No procedural detail, no sky, no textures other than the hillshade described here.
- No network access in the tool or in tests (monkeypatch `socket.socket` in a test to prove it). Do not download DEM files.
- No dependency other than the ones in section 1. No npm dependency.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Dependencies (explicit exception to "no new dependency")

Python, in a new file `scripts/terrain/requirements.txt`, exact pinned versions: `numpy`, `rasterio`, `Pillow`. Nothing else. They are used only under `scripts/terrain/`.

- CI: add a job `terrain` that installs `scripts/terrain/requirements.txt` and runs the terrain tests. It always runs, never skipped.
- `scripts/precheck.py`: add a step `terrain` that runs the terrain tests when the three packages import, and otherwise prints exactly `SKIP terrain: install scripts/terrain/requirements.txt` and does not fail. State this in the PR description as a decision for the human (the local skip exists only so the other checks still run on machines without these packages; CI enforces them).
- Do not use these packages anywhere else in the repository.

## 2. Layout

```
scripts/terrain/__init__.py
scripts/terrain/config.py        load and validate terrain config
scripts/terrain/mosaic.py        read GeoTIFF tiles, mosaic to one array with geotransform
scripts/terrain/resample.py      crop to bbox, resample to target size
scripts/terrain/encode.py        terrarium encode and decode
scripts/terrain/hillshade.py     hillshade from elevation
scripts/terrain/bake.py          orchestration
scripts/terrain/__main__.py      CLI: python -m terrain bake | verify
scripts/terrain/tests/           tests (or the location the repo already uses for script tests)
terrain/config.example.json     example config (not used by tests)
data/schemas/terrain_meta.schema.json
web/src/terrain/decode.ts
web/src/terrain/load.ts
web/src/terrain/meta.ts
web/src/types/terrain.ts
docs/terrain.md
```

## 3. Config (`terrain/config.json`, validated by `config.py`)

```
{
  "dem_dataset_id": string (the data/raw/<id>/ folder with MANIFEST.json),
  "regions": [
    {
      "id": string (^[a-z0-9_]+$, unique),
      "bbox": [west, south, east, north]  (decimal degrees, west < east, south < north, within -180..180 and -90..90),
      "max_size": integer (long side in pixels, 64..4096)
    }
  ],
  "hillshade": { "azimuth_deg": number, "altitude_deg": number, "z_factor": number },
  "max_bytes_per_region": integer
}
```

The bounding boxes are decided by the human and are NOT chosen by you; the example file only shows the shape with obviously fake values (document that in the file and in `docs/terrain.md`). Recommended method for the human, to be written in `docs/terrain.md`: take the min and max of the waypoint coordinates in the Andes facts dataset and add a margin. Invalid config (bbox order, out of range, unknown fields, duplicate ids, `max_size` out of range) is an error with a clear message.

## 4. Inputs and provenance

Input DEM GeoTIFF files are registered with the `data-pipeline` manifest under `data/raw/<dem_dataset_id>/`. The tool verifies every file with the manifest loader (hash match, no unregistered files) before reading anything, and fails otherwise. DEM source and license are manifest fields; the metadata of each output copies `source`, `source_url`, `retrieved_at`, `license_or_terms` from the manifest entries (if the entries disagree, fail) and adds an `attribution` string passed on the command line `--attribution "..."` (required, non-empty).

`docs/terrain.md` lists candidate DEM sources as leads to be verified by the human (for example Copernicus GLO-30, SRTM 1 arc-second, national elevation models) with their license terms to check; it must not state license terms as facts.

## 5. Processing rules

1. **Mosaic**: combine the registered tiles into one array in geographic coordinates (EPSG:4326). Tiles must share the CRS; otherwise fail. Overlaps: where valid values differ by more than 1 m, fail and print the first location; otherwise average.
2. **Crop** to the region bbox. The bbox must be fully covered by the mosaic; if not, fail and print the uncovered fraction.
3. **No-data**: count pixels equal to the declared nodata value inside the bbox. More than 0.1% of pixels: fail and print count and the first locations. Otherwise fill each by the nearest valid pixel and record `filled_fraction` in the metadata. Elevation 0 is a valid measurement (sea level); never treat 0 as missing.
4. **Resample** so the long side equals `max_size` (never upscale: if the source is smaller, use the source size). Downsampling uses block averaging (area mean); the output keeps the geographic aspect of the bbox in degrees and records the pixel size in degrees.
5. **Encode** heights as 8-bit RGB in terrarium format: `value = height_m + 32768`, `R = floor(value / 256)`, `G = floor(value) % 256`, `B = floor((value - floor(value)) * 256)`. Heights are rounded to the nearest 1/256 m. Heights outside -32768..32767 fail.
6. **Hillshade**: Horn's method, 8-bit grayscale, using the configured azimuth, altitude and z-factor, with ground distances per pixel computed from the pixel size in degrees at each row latitude (meters per degree of longitude scales with cosine of latitude). Flat terrain must give a constant value equal to `round(255 * sin(altitude))`.
7. **Outputs** per region, written atomically: `web/public/terrain/<id>.height.png`, `web/public/terrain/<id>.hillshade.png`, `web/public/terrain/<id>.json` (metadata, section 6). Fail if the two PNGs together exceed `max_bytes_per_region`. PNG writing is deterministic (fixed compression level, no extra chunks); running twice in the same environment gives identical bytes.

## 6. Metadata schema (`terrain_meta.schema.json`, Draft 2020-12, `additionalProperties: false`)

`id`, `crs` (const `"EPSG:4326"`), `bbox` (array of 4 numbers), `width`, `height` (integers), `pixel_size_deg` (`{x, y}` numbers > 0), `meters_per_pixel` (`{x, y}` at the center latitude, numbers > 0), `encoding` (const `"terrarium"`), `elevation_min_m`, `elevation_max_m` (numbers), `filled_fraction` (number 0..1), `hillshade` (`{azimuth_deg, altitude_deg, z_factor}`), `files` (`{height, hillshade}` relative paths), `bytes` (`{height, hillshade}` integers), `dem_inputs` (array of `{path, sha256}`), `source`, `source_url` (uri or null), `retrieved_at` (date), `license_or_terms` (string or null), `attribution` (string, minLength 1), `generated_by` (const `"scripts/terrain"`). No timestamps of generation.

## 7. CLI

- `python -m terrain bake --config terrain/config.json --attribution "..." [--raw-root PATH] [--out-root PATH]`: runs the whole process for every region; all-or-nothing per region; exit 0 success, 1 any validation or processing error (message `ERROR <region> <reason>`), 2 usage error.
- `python -m terrain verify --meta web/public/terrain/<id>.json --points points.json`: reads the baked height image, bilinearly samples each point of `points.json` (`[{name, lon, lat, expected_m}]`, provided by the human from the Andes facts) and prints a table `name, expected_m, baked_m, difference_m`. Exit 0 always when it ran; it never judges. A point outside the bbox is printed as `outside bbox`, never as a number.

## 8. Web: loader and sampling (`web/src/terrain/`)

- `types/terrain.ts` + `meta.ts`: type `TerrainMeta` and `parseTerrainMeta(json: unknown): TerrainMeta` using `ajv.compile<TerrainMeta>` against the same schema file (copy by the existing mechanism the repo uses for schemas; do not duplicate by hand).
- `decode.ts` (pure): `decodeTerrarium(rgba: Uint8ClampedArray, width, height): Float32Array` (heights in meters); `sampleElevation(terrain, lon, lat): number | null` with bilinear interpolation, `null` outside the bbox (never 0); `lonLatToPixel(meta, lon, lat)` and `pixelToLonLat(meta, x, y)` (pixel centers convention documented in a comment: pixel (0,0) center is at west + 0.5 pixel, north - 0.5 pixel); `elevationRange(terrain)`.
- `load.ts`: `loadTerrain(baseUrl, id, deps?)` fetches `<id>.json` and the height PNG, decodes it through an injectable `decodeImage(blob) => { rgba, width, height }` (default uses the browser canvas), checks that image size equals `meta.width`/`meta.height`, and returns `{ meta, heights }`; errors have descriptive messages. The default browser decoder is not unit-tested; the injectable path is.

## 9. Tests (write first)

Python (synthetic rasters built inside the tests with `rasterio` into `tmp_path`; no real data):
- Config: valid passes; each fails: west >= east, south >= north, bbox out of range, duplicate region id, `max_size` 63 and 4097, unknown field, missing `dem_dataset_id`.
- Provenance: unregistered file, hash mismatch and missing file each fail through the manifest loader with the dataset and path in the message; licenses/sources disagreeing across manifest entries fail.
- Mosaic: two adjacent tiles give the exact expected array and geotransform; overlap with a difference above 1 m fails with the location; overlap within 1 m averages; different CRS fails.
- Crop: bbox not fully covered fails with the uncovered fraction.
- No-data: more than 0.1% fails with count and first location; below the limit fills by nearest valid and reports the exact `filled_fraction`; a block of true zeros is NOT treated as missing.
- Resample: exact block-mean result on a 4x4 to 2x2 example; never upscales; aspect kept.
- Encode/decode: round trip within 1/256 m for a set of values including -100, 0, 0.5, 4999.996, 6962; out-of-range fails; exact RGB bytes for three hand-computed values.
- Hillshade: flat terrain gives exactly `round(255 * sin(altitude))`; a plane tilted toward the sun is brighter than a plane tilted away (assert exact ordering and values for hand-computed cases); z-factor changes contrast monotonically; latitude scaling of ground distance is applied (a case where the same degree gradient at two latitudes yields different slopes).
- Bake: outputs exist; the two PNGs decode to the expected arrays; metadata validates against the schema and equals the expected dict exactly for a small fixture; two runs give identical bytes; exceeding `max_bytes_per_region` fails and writes nothing; a failure in the second region leaves no partial files for it.
- `verify`: prints the exact expected table for a synthetic plane with known heights; a point outside the bbox prints `outside bbox`.
- No network: tests pass with `socket.socket` monkeypatched to raise.

TypeScript (Vitest, no canvas):
- `decodeTerrarium` exact heights for hand-built RGBA; `sampleElevation` bilinear exact values at pixel centers, midpoints and a quarter-point; `null` outside the bbox and exactly on the outer edge beyond the last pixel center per the documented convention; `lonLatToPixel`/`pixelToLonLat` round trip; `elevationRange`.
- `parseTerrainMeta` accepts valid and rejects each invalid case (wrong encoding const, bbox of length 3, missing attribution, extra field).
- `loadTerrain` with injected fetch and decoder: success; size mismatch error; metadata invalid error; fetch failure error.

## 10. Docs (`docs/terrain.md`)

How to choose bounding boxes; candidate DEM sources as unverified leads; how to register the DEM files with the data-pipeline manifest; the exact commands to bake and verify; how to compare baked heights against the elevations in the Andes facts; the attribution text to show and add to the references page; the decision that terrain is baked from measured data and any procedural detail added later (in `andes-integration`) is labeled as illustrative; the size budget per region and the trade-off between `max_size` and detail (give the meters-per-pixel formula, not numbers from memory).

## 11. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes (with the three packages installed).
- [ ] CI job `terrain` added and always runs; the local skip message is exact and documented.
- [ ] Only `numpy`, `rasterio`, `Pillow` added, pinned, only under `scripts/terrain/`; no npm dependency; no checker silenced; no `as unknown as`.
- [ ] No real DEM data, no real terrain output committed; `terrain/config.example.json` has obviously fake values.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add the human step "download and register DEM, set bbox, bake, verify, commit outputs" before `andes-integration`).
- [ ] PR description: what changed, what was verified, what the human must verify (the dependency exception and the local skip, the terrarium choice, the 0.1% no-data limit, the 1 m overlap tolerance, the byte budget, that nothing in the tool or the tests touches the network).
