# Task: `geo-provinces`

Branch: `task/geo-provinces`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md`, `docs/data-pipeline.md`, `docs/sources.md` (geodata section), `web/src/types` (the `PROVINCES` constant and the 24 ids `AR-A` to `AR-Z`) and `web/package.json` first.
Prerequisite: `data-pipeline` is merged (this task uses its raw manifest format and loader). If it is not merged, stop and tell me.

## Goal

A build tool and a typed loader for the geometry of the 24 provinces, small enough for a static site, with topology-preserving simplification (neighboring provinces keep sharing their borders: no gaps, no overlaps). It unblocks the province map in the forecast scene (`scene-forecast-map`).

This PR contains **no real geometry**. The human downloads the source file, registers it, runs the tool and commits the outputs later. Tests use small hand-built fixtures.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No map rendering, no choropleth, no UI, no scene changes.
- No downloading and no network access. No shapefile reader: the input is a GeoJSON file in longitude/latitude (WGS84). The human converts other formats with a local tool, documented in `docs/geo.md`.
- No dependency other than the ones listed in section 1.
- Do not decide how disputed or claimed territories are drawn, and do not pick the source dataset: both are decisions for the human (section 8).
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Dependencies (allowed, `web/package.json` devDependencies, exact versions)

`topojson-server`, `topojson-simplify`, `topojson-client`, their `@types/` packages if they exist, and `tsx` to run the TypeScript build script. Nothing else. The built outputs are plain GeoJSON, so the app needs no runtime dependency for geometry.

## 2. Layout

```
web/scripts/geo/lib.ts                  pure functions (no file IO)
web/scripts/geo/build-provinces.ts      CLI wrapper (reads config, files, writes outputs)
web/src/geo/provinces.ts                types, parseProvincesGeo, checkProvinceIds, loadProvinces
web/src/geo/meta.ts                     parseGeoMeta
data/schemas/provinces_geo.schema.json  FeatureCollection with the properties below
data/schemas/geo_meta.schema.json       metadata of the build
geo/config.example.json                 example config (obviously fake values; not used by tests)
web/tests/unit/geo/                     tests
docs/geo.md
```

`web/package.json` script: `"build:geo": "tsx scripts/geo/build-provinces.ts"`.

## 3. Config (`geo/config.json`, validated in `lib.ts`)

```
{
  "dataset_id": string (the data/raw/<id>/ folder with MANIFEST.json),
  "input_file": string (relative path inside that folder; a GeoJSON FeatureCollection),
  "id_map": { "<value of the id property in the input>": "AR-X", ... },
  "id_property": string (property of each input feature used as the key of id_map),
  "target_max_bytes": integer,
  "max_area_change_pct": number (per province, default 2),
  "min_island_area_km2": number (polygons below this area are dropped, default 0 meaning keep all),
  "coordinate_decimals": integer (default 3),
  "sanity_bounds": { "lon": [min, max], "lat": [min, max] }
}
```

Invalid config (missing field, wrong type, `id_map` values that are not exactly the 24 ids of `PROVINCES`, duplicate ids, unknown fields) is an error with a clear message. The `id_map` and the real `sanity_bounds` are filled by the human; the example file uses fake values and says so.

## 4. Processing rules (`lib.ts`, pure)

1. **Input check**: GeoJSON `FeatureCollection` of `Polygon` and `MultiPolygon` only. Every coordinate lies inside `sanity_bounds` (this catches projected coordinates); otherwise fail, naming the feature and the first bad coordinate. Every feature has the `id_property`; every value is in `id_map`; every one of the 24 ids appears exactly once after mapping. Missing, duplicate or unmapped features are errors listing them.
2. **Area before simplification**: compute `area_km2` per province from the original geometry using the spherical-rectangle-consistent formula for polygons on a sphere of mean radius 6371.0088 km (state the formula and the radius in a code comment). Store these values; they are never recomputed from simplified geometry.
3. **Topology and simplification**: build a topology (shared borders become shared arcs), simplify with a deterministic algorithm to the smallest simplification that makes the final GeoJSON fit `target_max_bytes` (search the parameter by bisection with a fixed iteration count; the final choice is deterministic), then convert back to GeoJSON features. Round coordinates to `coordinate_decimals`. If even maximum simplification does not fit, fail and print the achieved size.
4. **Islands**: drop polygons whose original area is below `min_island_area_km2`, but always keep the largest polygon of every province. Report each dropped polygon (province id, original area) in the metadata.
5. **Quality gates**: for every province the area change between original and simplified geometry (planar-consistent comparison using the same area function) must not exceed `max_area_change_pct`; every ring is closed and has at least 4 positions; no coordinate is NaN or infinite; a province must not become empty. Failure names the province and the numbers.
6. **Properties per feature** (exactly these): `id` (`AR-X`), `name` (from `PROVINCES`, not from the input), `area_km2` (from step 2), `centroid` (`[lon, lat]`, planar area-weighted centroid of the largest polygon of the simplified geometry), `centroid_inside` (boolean: whether the centroid lies inside that polygon), `bbox` (`[west, south, east, north]`). Features sorted by `id`. Output keys in a fixed order.
7. **Outputs** (written atomically; nothing is written if any gate fails): `web/public/geo/provinces.geojson` and `web/public/geo/provinces.meta.json`. Metadata (schema `geo_meta.schema.json`, `additionalProperties: false`): `source`, `source_url` (uri or null), `retrieved_at` (date), `license_or_terms` (string or null), `attribution` (non-empty string, passed with `--attribution`), `input_sha256`, `simplification` (`{ algorithm, parameter, vertices_before, vertices_after, bytes }`), `dropped_polygons` (array of `{ id, area_km2 }`), `area_change_pct` (object from province id to number), `provinces_count` (const 24), `generated_by` (const `web/scripts/geo`). No generation timestamp. Source fields are copied from the manifest entry of the input file.

CLI: `npm run build:geo -- --config geo/config.json --attribution "..." [--raw-root PATH] [--out-root PATH]`. The input file is verified with the `data-pipeline` manifest loader first (hash, registration). Exit codes: 0 success, 1 validation or processing error (message `ERROR <what> <reason>`), 2 usage error. Running twice gives byte-identical files.

## 5. Web: types and loader (`web/src/geo/`)

- `provinces.ts`: type `ProvinceFeature` and `ProvincesGeo`; `parseProvincesGeo(json: unknown)` using `ajv.compile<ProvincesGeo>` against the schema; `checkProvinceIds(geo)` returns a list of problems (missing ids, extra ids, duplicate ids) compared to `PROVINCES`; `featureById(geo, id)`; `loadProvinces(baseUrl, fetchFn = fetch)` that fetches and parses both files and throws a descriptive error if parsing fails or `checkProvinceIds` is not empty. No geometry processing in the app.
- `meta.ts`: `parseGeoMeta(json: unknown)` with `ajv.compile`.
- No `as unknown as`. Types come from the schemas through the repo's existing mechanism.

## 6. Tests (write first; hand-built fixtures, no real data)

Library:
- Config: valid passes; each fails: `id_map` missing an id, extra id, duplicate target id, unknown field, wrong type, `max_area_change_pct` negative.
- Input check: a non-polygon geometry fails; a coordinate outside `sanity_bounds` fails naming the feature; unmapped, duplicate and missing provinces fail with the list.
- Area: for a lat/lon rectangle, `area_km2` equals the closed form `R² · Δλ · (sin φ2 − sin φ1)` (write the closed form independently in the test; compare to 6 significant digits); polygons with a hole subtract the hole.
- Topology: two adjacent squares with extra collinear and near-collinear vertices on their shared edge; after simplification both provinces contain exactly the same coordinates along that edge (no gap, no overlap); the number of vertices decreases.
- Budget search: the result fits `target_max_bytes`; the same input gives the same parameter and bytes on two runs; an impossible budget fails and prints the achieved size.
- Islands: a polygon below `min_island_area_km2` is dropped and reported; the largest polygon of a province is never dropped even if it is below the threshold.
- Quality gates: forcing a large simplification on a fixture breaks `max_area_change_pct` and fails naming the province and numbers; ring closure and finite coordinates checked.
- Properties: exact `area_km2`, `bbox`, `centroid` for a rectangle, and `centroid_inside: false` for a C-shaped polygon fixture; names come from `PROVINCES`; features sorted by `id`.
- CLI: success writes both files and metadata equals the expected object exactly; a failing gate writes nothing; two runs are byte-identical; unregistered input or hash mismatch fails through the manifest loader; the network is never used (monkeypatch `globalThis.fetch` and `node:net` usage to throw in a test).

Web:
- `parseProvincesGeo` accepts a valid 24-feature fixture and rejects: a feature without `id`, a bad `id` pattern, a `Point` geometry, a property out of the list, an extra field.
- `checkProvinceIds` returns exact messages for missing, extra and duplicate ids.
- `loadProvinces` with injected fetch: success; HTTP failure; invalid JSON; invalid ids; invalid meta.
- `parseGeoMeta` accepts valid and rejects: `provinces_count` other than 24, missing attribution, extra field.

## 7. Docs (`docs/geo.md`)

How to choose a source (leads to verify, not facts: the national geographic institute's province layer, Natural Earth admin-1, others; check each license), how to register the file with the data-pipeline manifest, how to convert a shapefile to GeoJSON locally with a tool of the human's choice, how to fill `id_map` (a table of the 24 ids and their names from `PROVINCES`), how to run the build, how to read the metadata (area change per province, dropped polygons, `centroid_inside`), the attribution text for the references page, and the size budget trade-off.

## 8. Decisions that belong to the human (list them in the PR description)

1. **Source dataset** and its license.
2. **How the national territory is drawn**: continental provinces only, or including the southern islands and the Antarctic sector in the same layer. The tool handles either, but the choice affects how the map looks and the rules for representing the national territory on published maps should be checked by the human before publishing. Do not decide it in code.
3. **Budget** (`target_max_bytes`) and tolerance (`max_area_change_pct`), after seeing real results.

## 9. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] Only the listed devDependencies added; no runtime dependency; no checker silenced; no `as unknown as`.
- [ ] No real geometry committed; `geo/config.example.json` has obviously fake values.
- [ ] `web/package.json` has `build:geo`; `docs/geo.md` written.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add the human step "choose source, register file, fill config, run build:geo, review metadata, commit outputs" before `scene-forecast-map`).
- [ ] PR description: what changed, what was verified, what the human must verify (the three decisions of section 8, the area formula and radius, the 1e-3 degree rounding, that the build never touches the network).
