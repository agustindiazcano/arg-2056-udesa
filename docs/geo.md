# Province geometry

The forecast map needs the geometry of the 24 provinces, small enough for a static site. `web/scripts/geo` builds it from a GeoJSON file you provide: it simplifies with a shared topology (neighbouring provinces keep exactly the same border, no gaps and no overlaps) until the output fits a byte budget, checks the result with quality gates, and writes two files. The app only loads and validates them (`web/src/geo`); it does no geometry processing.

This repository contains the tool, not geometry. The human chooses the source, registers it, runs the build and commits the outputs.

## 1. Choosing a source

The source dataset and its license are a human decision. Leads to verify (not facts): the national geographic institute's province layer, Natural Earth admin-1, other open province layers. Check each license, the date of the data and how the national territory is drawn before choosing.

How the national territory is drawn (continental provinces only, or including the southern islands and the Antarctic sector in the same layer) is also a human decision, and the rules for representing the national territory on published maps should be checked before publishing. The tool handles either layout and decides nothing about it.

## 2. Input requirements

A single GeoJSON `FeatureCollection` of `Polygon` and `MultiPolygon` features in longitude/latitude (WGS84), one feature per province, each with a property that identifies it (`id_property`). Other formats (for example a shapefile) are converted locally with a tool of your choice, for example `ogr2ogr -f GeoJSON -t_srs EPSG:4326 provinces.geojson provinces.shp`. The tool never reads shapefiles and never downloads anything.

Every coordinate must lie inside `sanity_bounds`, which catches projected coordinates by mistake. Rings are not expected to cross the antimeridian.

## 3. Register the file

Put the file under `data/raw/<dataset_id>/` and register it with the data-pipeline manifest (see `docs/data-pipeline.md`):

```
python -m datapipe register <dataset_id> <file.geojson> --source "..." --source-url "..." --retrieved-at YYYY-MM-DD --license "..."
```

(run with `scripts` on the Python path: `PYTHONPATH=scripts` in bash, `$env:PYTHONPATH = "scripts"` in PowerShell). The build verifies the dataset before reading anything: every registered file must exist and match its hash, and no unregistered file may be present. This check is a TypeScript port of `verify_manifest` in `scripts/datapipe/manifest.py` with the same reasons, because the data-pipeline loader is Python and the build runs in Node. `source`, `source_url`, `retrieved_at` and `license_or_terms` are copied from the manifest entry of the input file into the metadata.

## 4. Fill the config

Copy `geo/config.example.json` to `geo/config.json` (the example contains obviously fake values: `fake_geo_dataset_replace_me`, `FAKE-01`, bounds of one degree) and fill it in:

| Field | Meaning |
|---|---|
| `dataset_id` | folder under `data/raw/` with `MANIFEST.json` |
| `input_file` | relative path of the GeoJSON inside that folder |
| `id_property` | property of each input feature that identifies it |
| `id_map` | value of that property to the province id, exactly the 24 ids below |
| `target_max_bytes` | size budget of `provinces.geojson` |
| `max_area_change_pct` | per-province limit for the area change caused by simplification (default 2) |
| `min_island_area_km2` | polygons below this area are dropped, always keeping the largest of each province (default 0, keep all) |
| `coordinate_decimals` | rounding of the output coordinates (default 3) |
| `sanity_bounds` | `{ "lon": [min, max], "lat": [min, max] }` of the expected territory |

`id_map` must map to exactly these 24 ids (names come from `web/src/types/province.ts`, never from the input):

| Id | Name | Id | Name |
|---|---|---|---|
| `AR-A` | Salta | `AR-B` | Buenos Aires |
| `AR-C` | Ciudad Autónoma de Buenos Aires | `AR-D` | San Luis |
| `AR-E` | Entre Ríos | `AR-F` | La Rioja |
| `AR-G` | Santiago del Estero | `AR-H` | Chaco |
| `AR-J` | San Juan | `AR-K` | Catamarca |
| `AR-L` | La Pampa | `AR-M` | Mendoza |
| `AR-N` | Misiones | `AR-P` | Formosa |
| `AR-Q` | Neuquén | `AR-R` | Río Negro |
| `AR-S` | Santa Fe | `AR-T` | Tucumán |
| `AR-U` | Chubut | `AR-V` | Tierra del Fuego, Antártida e Islas del Atlántico Sur |
| `AR-W` | Corrientes | `AR-X` | Córdoba |
| `AR-Y` | Jujuy | `AR-Z` | Santa Cruz |

## 5. Run the build

```
cd web
npm run build:geo -- --config ../geo/config.json --attribution "<attribution text>" --raw-root ../data/raw --out-root public/geo
```

Defaults: `--raw-root data/raw` and `--out-root web/public/geo` (relative to the directory you run it from). Exit codes: 0 success, 1 validation or processing error (`ERROR <what> <reason>` on stderr, where `<what>` is `config`, `manifest`, `input` or `build`), 2 usage error. Nothing is written unless every gate passes, and running twice gives byte-identical files.

## 6. What the build does

1. Checks the input: only `Polygon` and `MultiPolygon`; every coordinate inside `sanity_bounds`; every feature has the id property; every value is in `id_map`; each of the 24 ids appears exactly once.
2. Computes `area_km2` per province from the **original** geometry (islands included), on a sphere of mean radius 6371.0088 km, with the Chamberlain-Duquette line integral `R^2 / 2 * |sum of (lon2 - lon1) * (2 + sin(lat1) + sin(lat2))|` over the edges, holes subtracted. A lat/lon rectangle gets exactly `R^2 * (lon2 - lon1) * (sin(lat2) - sin(lat1))`. These values are never recomputed from simplified geometry.
3. Drops islands, builds the topology and simplifies it with Visvalingam-Whyatt (`topojson-simplify`, triangle area in square degrees). The parameter is the smallest value that makes the final file fit `target_max_bytes`, found by bisection with 40 fixed iterations (deterministic). If even the maximum simplification does not fit it fails and prints the achieved size. Coordinates are rounded to `coordinate_decimals` and consecutive duplicates removed.
4. Gates: rings closed with at least 4 positions, no NaN or infinite coordinate, no empty province, and the area change of each province (geometry after the island drop against the simplified one, same area function) at most `max_area_change_pct`.

## 7. Reading the metadata (`provinces.meta.json`)

- `simplification`: algorithm, parameter, `vertices_before` (positions after the island drop), `vertices_after`, `bytes`.
- `area_change_pct`: the area change per province; check the largest ones.
- `dropped_polygons`: islands removed, with their original area.
- Per feature in `provinces.geojson`: `centroid` and `centroid_inside`. A centroid outside its polygon (for example a crescent-shaped province) needs a different label anchor in the map.
- `source`, `source_url`, `retrieved_at`, `license_or_terms`, `input_sha256` come from the manifest and the input file; `attribution` is what you passed.

## 8. Attribution and the references page

Pass the attribution text required by the license of your source with `--attribution` and show it on the references page.

## 9. Size budget trade-off

A smaller `target_max_bytes` means a coarser border and a larger area change; a larger one keeps detail but loads slower. Start from the budget you can afford on the first load, run the build, then read `area_change_pct`. If a province exceeds the limit, raise the budget or the limit explicitly rather than editing the output.
