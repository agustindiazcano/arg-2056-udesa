# Data Pipeline

The data pipeline provides an offline, reproducible, and auditable path from raw files to the final data consumed by the app.

## Flow

1. **Raw**: Files are placed in `data/raw/<dataset_id>/` and registered in `MANIFEST.json`.
2. **Adapter**: A Python adapter in `scripts/datapipe/adapters/` transforms raw files deterministically.
3. **Processed**: Transformed files are saved to `data/processed/`, checked against JSON Schemas, and hashes are recorded in `_provenance.json`.
4. **Sync**: `npm run data:sync` overlays processed files over mock data and copies them to `web/public/data/`.
5. **Web**: The app fetches from `public/data/`.

## Manifest and Registration

Every raw file must be registered. The pipeline never touches the network.
Register a file:
```bash
python -m datapipe register <dataset_id> <file> --source "..." --retrieved-at YYYY-MM-DD
```

## Private Files (`redistributable: false`)

If a dataset contains files that cannot be shared (`redistributable: false` and `private: true`), the file itself is stored in `data/raw/_private/<dataset_id>/` (git-ignored). The `MANIFEST.json` is committed, but the file is not. CI will skip rebuilding this dataset and will only verify that the committed processed file's hash matches the one in `_provenance.json`.

## Writing an Adapter

An adapter in `scripts/datapipe/adapters/` exposes:
- `DATASET_ID: str`
- `OUTPUTS: dict[str, str]` (processed file name -> schema file name)
- `def build(files: dict[str, Path], manifest: dict) -> dict[str, list[dict]]`

The `build` function must be pure. No network access, no randomness. The adapter must also be registered in `scripts/datapipe/adapters/__init__.py`.

## Human Verification Rule

Before a dataset PR is merged, a human must verify at least 10 URLs and 3 numbers against the original source.

## Upcoming Dataset Tasks

- `data-mining`, `data-energy`, `data-agro`: for `resource_production.json`, `projects.json`, `production_projections.json`
- `data-economy`, `data-population`: for `economy_series.json`, `population.json`, `composition.json`
- `data-andes`: for `andes_events.json`
- `data-provinces`: provincial geometry
