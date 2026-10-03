# Last Context

## State
- Task `geo-provinces` on branch `task/geo-provinces`: the build tool and typed loader for the geometry of the 24 provinces. No real geometry committed.
- Build (`web/scripts/geo/`): `lib.ts` (config validation, input check, spherical area, island drop, topology simplification with budget search, quality gates, properties), `manifest.ts` (TypeScript port of `verify_manifest`), `build-provinces.ts` (CLI, `npm run build:geo`). Output: `web/public/geo/provinces.geojson` and `provinces.meta.json`, written atomically and byte-identical across runs.
- Web (`web/src/geo/`): `parseProvincesGeo`, `checkProvinceIds`, `featureById`, `loadProvinces`, `parseGeoMeta`.
- Schemas: `data/schemas/provinces_geo.schema.json`, `data/schemas/geo_meta.schema.json`. Docs: `docs/geo.md`. Example config with fake values: `geo/config.example.json`.
- Dependencies added (exact versions, devDependencies only): topojson-server, topojson-simplify, topojson-client, their `@types` packages, tsx. No runtime dependency.
- TDD: each test commit precedes its implementation commit. 108 new geo tests.

## Decisions (for the human)
- **The manifest check is a TypeScript port** of `scripts/datapipe/manifest.py` (same checks and reasons), because the brief asks for the data-pipeline loader but the tool runs in Node, the CI `web` job has no Python, and `datapipe` has no standalone verify command. Alternative: shell out to Python.
- `area_km2` is computed from the original geometry (islands included); the area-change gate compares the geometry after the island drop with the simplified one, and dropped islands are reported separately.
- Reported areas are rounded to 3 decimals, `area_change_pct` to 6, centroid and bbox to `coordinate_decimals`.
- Simplification weight is the planar triangle area in square degrees (`topojson-simplify`); the parameter in the metadata is in those units.
- The schema for `provinces.geojson` requires exactly 24 features; `checkProvinceIds` checks which ids.
- The Python-free `format: uri` check is done by ajv-formats in the loader.
- The three decisions of the brief (source dataset, how the national territory is drawn, budget and tolerance) are left to the human.

## Next step
- Human: choose the source, register it, fill `geo/config.json`, run `npm run build:geo`, review the metadata, commit the outputs (`docs/geo.md`).
- Next in `TASKS.md`: `scene-forecast-map` (needs this merged), `scene-economy`, `scene-sandbox`, `references-page`.
- Pushed, CI not checked.
- Open PR #20 (`terrain-bake`) also overwrites this file; keep both states when merging.
