# Task: `data-pipeline` (framework only)

Branch: `task/data-pipeline`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/data-dictionary.md`, `docs/sources.md` and the existing `scripts/` (`validate_data.py`, `dataset_checks.py`, `gen_mock.py`, `check_no_mock.py`, `precheck.py`) and `web/package.json` scripts first.
Prerequisites: `shell`, `composition-contract` and `projections-contract` are merged into `main`.

## Why this task exists

The app reads `web/public/data/*.json`. Today that folder is filled from mock data. Real data will arrive from research files and official downloads, in many formats and with many licenses. This task builds the **offline, reproducible, auditable path from raw files to `data/processed/`**, plus the copy to `web/public/data/`. It does **not** process any real dataset: each real dataset gets its own later task (`data-<dataset>`), one PR each, after the human has verified its sources.

Core rules:
- The pipeline **never touches the network** and never downloads. A human (or a research agent) places raw files and registers them; the pipeline only transforms what is registered.
- The pipeline **never invents or fills values**. A missing value stays `null` with a `note`.
- Everything is deterministic: same raw files give byte-identical processed files.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No real dataset adapter, no real data, no downloading, no scraping, no network calls (tests must fail if a socket is opened: monkeypatch `socket.socket` in a test to prove it).
- No new dependency in Python or npm. Use the standard library plus whatever `validate_data.py` already uses for JSON Schema.
- No UI change. No change to `useDataset` (cache-busting with the data version is a later task; this task only writes the version file).
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Layout

Put the package at `scripts/datapipe/` and its tests under the same location the existing script tests use (check the repo; if the existing script tests live elsewhere, follow that and say so in the PR).

```
scripts/datapipe/__init__.py
scripts/datapipe/manifest.py      load and verify data/raw/<dataset_id>/MANIFEST.json
scripts/datapipe/adapters/__init__.py   explicit REGISTRY dict {dataset_id: module}; no dynamic imports
scripts/datapipe/runner.py        run / check logic
scripts/datapipe/provenance.py    sha256 helpers and _provenance.json
scripts/datapipe/sources.py       sources.csv merge, sources.json, coverage check
scripts/datapipe/__main__.py      CLI: python -m datapipe ...
scripts/check_data_budget.py      size budget gate
data/schemas/sources.schema.json
data/schemas/raw_manifest.schema.json
```

## 2. Raw manifest

`data/raw/<dataset_id>/MANIFEST.json` (validated by `raw_manifest.schema.json`, `additionalProperties: false`):

```
{
  "dataset_id": string (^[a-z0-9_]+$, equals the folder name),
  "files": [
    {
      "path": string (relative to the dataset folder, no "..", no absolute),
      "sha256": string (64 lowercase hex),
      "source": string (minLength 1),
      "source_url": string (format uri) | null,
      "retrieved_at": string (format date),
      "license_or_terms": string | null,
      "redistributable": boolean,
      "note": string (optional)
    }
  ]
}
```

Rules (use `if/then` where the schema allows, otherwise `manifest.py` checks and tests):
- `redistributable: false` requires a `note` saying where the human keeps the file.
- Every file listed exists and its sha256 matches. A mismatch or a missing file is an error that names the dataset and the path.
- A file present in the folder but absent from the manifest is an error (nothing unregistered gets processed), except `MANIFEST.json` itself.
- `redistributable: false` files live under `data/raw/_private/<dataset_id>/` which is git-ignored (add it to `.gitignore`). The manifest is committed; the file is not. `manifest.py` resolves the path accordingly: a manifest in `data/raw/<id>/` may point to `_private/<id>/<file>` through a `"private": true` field on that file entry (add this boolean to the schema, default false; `private: true` is only valid with `redistributable: false`).

Provide `python -m datapipe register <dataset_id> <file> --source ... --source-url ... --retrieved-at YYYY-MM-DD --license ... [--not-redistributable --note ...]`: computes sha256, creates or updates the manifest (sorted by `path`, 2-space JSON, trailing newline), refuses to overwrite an existing entry with a different sha256 unless `--replace` is passed.

## 3. Adapter protocol

Each adapter module exposes exactly:

```
DATASET_ID: str
OUTPUTS: dict[str, str]   # processed file name -> schema file name, e.g. {"population.json": "population.schema.json"}
def build(files: dict[str, Path], manifest: Manifest) -> dict[str, list[dict]]
```

`build` is pure: no network, no clock, no randomness, no environment reads. `retrieved_at` and `source` of the output records come from the manifest entries, never from "today". The set of keys it returns must equal `OUTPUTS` keys (extra or missing key is an error).

`REGISTRY` in `adapters/__init__.py` is an explicit dict. In this PR it is empty in production; tests inject a test registry through a parameter (`run(..., registry=...)`), they do not edit the real one.

## 4. Runner

`python -m datapipe run <dataset_id> | --all [--raw-root PATH] [--out-root PATH] [--schemas PATH]` (defaults: `data/raw`, `data/processed`, `data/schemas`).

Behavior, in this order, all-or-nothing per dataset:
1. Load and verify the manifest (section 2).
2. Call `build`.
3. Validate every output against its schema and run the matching consistency checks from `dataset_checks.py` (call the existing functions; do not duplicate them). A record with `source == "MOCK"` is an error.
4. Only if everything passed, write every output: JSON, `indent=2`, `ensure_ascii=False`, keys in schema order of insertion, records sorted by a sort key the adapter declares or by the full JSON string if none (document which), trailing newline, atomic write (temp file in the same folder, then rename).
5. Update `data/processed/_provenance.json` (section 5).

Exit codes: 0 success; 1 any validation, manifest or adapter error (message format `ERROR <dataset_id> <file> <reason>`); 2 usage error (unknown dataset, bad arguments). Nothing is written when exit code is not 0.

`python -m datapipe check [<dataset_id> | --all]`: re-runs the adapters in memory and compares bytes with the committed processed files and with `_provenance.json`. Exit 1 on any difference, with the file name. Datasets whose manifest has any file with `private: true` cannot be rebuilt in CI: `check` does not re-run them, it verifies instead that the processed file's sha256 equals the one in `_provenance.json`, and prints `SKIP <dataset_id> private inputs, verified output hash only`.

## 5. Provenance and data version

`data/processed/_provenance.json`:

```
{
  "outputs": {
    "<file>": {
      "sha256": string,
      "dataset_id": string,
      "adapter": string (module name),
      "inputs": [ { "path": string, "sha256": string } ]
    }
  }
}
```

Keys sorted; entries only for outputs that exist. No timestamps (determinism). Provide `python -m datapipe verify-provenance`: every processed file (except `_provenance.json`, `sources.json`) is listed and its hash matches; every listed file exists. Exit 1 otherwise.

## 6. Sources registry and the References page data

`data/schemas/sources.schema.json` for `data/processed/sources.json` (array, `additionalProperties: false`): `id` (pattern `^[a-z0-9_-]+:[A-Za-z0-9_.-]+$`, scope prefix + source id), `aliases` (array of ids, possibly empty), `url` (format uri), `title`, `authors_or_publisher`, `publisher_type` (enum: official, international, peer_reviewed, working_paper, technical_report, company, association, bank, consultancy, think_tank, archive, press), `publication_date` (date | null), `retrieved_at` (date), `access` (enum: opened, not_opened), `language` (string | null), `license_or_terms` (string | null), `derived_from` (id | null).

`python -m datapipe build-sources [--research-root data/raw/research] [--out data/processed/sources.json]`:
- Reads every `<scope>/sources.csv` with the columns defined in `docs/research-prompts.md` (stdlib `csv`; error naming scope and line if a column is missing or a value breaks the enum).
- Prefixes ids with the folder name (`mining:S012`), resolves `derived_from` to prefixed ids (a dangling reference is an error).
- Deduplicates by normalized URL (lowercase scheme and host, strip fragment and a trailing slash, drop `utm_*` parameters, keep other query parameters). The first id in sorted order is the `id`; the others go to `aliases`. If duplicates disagree on `title` or `publication_date`, keep the first and list the disagreement in a `data/processed/sources_conflicts.txt` report (plain text, sorted).
- Output sorted by `id`, deterministic.

`check_sources_coverage(processed_dir, sources) -> list[str]` in `sources.py`: for every record in every processed dataset that has a non-null `source_url`, the normalized URL must match some source `url`. Records with a null `source_url` are counted and reported, not errors. A source with `access == "not_opened"` cited by a record is an error (a number cannot be backed by a page nobody opened). Wire it into `validate_data.py` only when `sources.json` exists; absence of `sources.json` is a clear message, not a failure, until the first real dataset lands.

## 7. Sync to the web app

Replace the `sync-mock` step with `sync-data` in `web/package.json` (keep `sync-mock` working as an alias if other scripts call it):
- Start from every file in `data/mock/`, then overlay every file present in `data/processed/` (same name replaces the mock one), then copy `sources.json` if present. Skip files starting with `_` except `_version.json`.
- Write `web/public/data/_manifest.json`: `{ "files": [ { "name": string, "origin": "mock" | "processed" } ] }` sorted by name.
- Write `web/public/data/_version.json`: `{ "data_version": string }` where the value is the first 12 hex chars of the sha256 of the concatenation of `name:sha256\n` for all copied data files in name order.
- With an empty `data/processed/` the result must be identical to today's `sync-mock` plus the two new files.
- `predev` and `build` use `sync-data`. `build:release` still fails when any file has origin `mock` or any record has `source == "MOCK"` (keep the existing `no-mock` logic; add a test that a mixed folder fails release and shows which files are mock).

Implement `sync-data` in Python (`scripts/sync_data.py`) if the current `sync-mock` is a Python script, or in Node if it is a Node script; follow the existing choice and its test style.

## 8. Size budget

`python scripts/check_data_budget.py [--dir web/public/data]`: constants `TOTAL_BUDGET_BYTES = 5_000_000` and `FILE_BUDGET_BYTES = 1_500_000`. Exit 1 listing the offending files and sizes when either is exceeded. Add it to `precheck.py` and to the CI data job. The numbers are a starting point; the PR description must say that the human decides the final budget after measuring real data.

## 9. Docs

`docs/data-pipeline.md` (short): the flow raw → adapter → processed → sync → web; the manifest and how to register a file; how to write an adapter; what `redistributable: false` means for the repo and for CI; the rule that the human verifies 10 URLs and 3 numbers before a dataset PR is merged; the list of upcoming dataset tasks (one per processed file: `resource_production`, `projects`, `production_projections` from the mining, energy and agro research; `economy_series`, `population`, `composition` from the economy and population research; `andes_events` from the Andes research; provincial geometry).

## 10. Tests (write first)

Everything uses `tmp_path` and fixtures built in the tests; no real `data/` folder is written.
- Manifest schema: valid passes; each fails: bad sha256 length, uppercase hex, path with `..`, absolute path, `redistributable: false` without `note`, `private: true` with `redistributable: true`, missing `source`, bad date, extra field.
- Manifest verification: sha mismatch (exact message with dataset and path), missing file, unregistered file in the folder, positive case.
- `register`: creates a manifest with the right sha256; second call with a different file content for the same path fails without `--replace` and passes with it; entries sorted.
- Runner with an injected fake adapter: success writes the outputs byte-for-byte as specified (check exact bytes of a small fixture); running twice is byte-identical; adapter returning an extra or missing output key fails; invalid record fails with nothing written (assert no file exists); `MOCK` source fails; failing second output leaves no partial first output; atomic write leaves no temp files; exit codes 0, 1, 2 with message fragments.
- `check`: passes on clean state; detects a modified processed file; detects a modified raw file through the manifest; private inputs produce the exact `SKIP` line and verify the hash.
- Provenance: written with sorted keys and no timestamps; `verify-provenance` passes, then fails for a file not listed, a listed file missing, and a changed hash.
- No network: with `socket.socket` monkeypatched to raise, `run` and `check` still succeed.
- Sources: merge of two scopes with a duplicate URL (alias recorded, conflict report content exact); URL normalization table (utm dropped, fragment dropped, trailing slash, host case); dangling `derived_from` fails; bad enum fails naming scope and line; deterministic output.
- Coverage: record URL present passes; absent fails with the file and record index; `not_opened` source cited fails; null `source_url` counted not failed.
- Sync: empty processed equals the old mock behavior plus `_manifest.json` and `_version.json`; processed file overrides the mock one and `_manifest.json` says `processed`; `_version.json` changes when a file changes and is stable otherwise (exact expected value for a tiny fixture); files starting with `_` are not copied; mixed folder fails `build:release` and names the mock files.
- Budget: under budget exit 0; total over, single file over, each with the exact message and exit 1.
- `precheck.py` runs the new steps (test that the step list contains them).

## 11. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no checker silenced; no `as unknown as`; no network access.
- [ ] No real data committed; `data/processed/` still empty (except what already existed).
- [ ] `sync-data` with empty processed behaves like the old `sync-mock` plus the two new files.
- [ ] `docs/data-pipeline.md` written; `.gitignore` has `data/raw/_private/`.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (the list of upcoming `data-<dataset>` tasks added to the queue).
- [ ] PR description: what changed, what was verified, what the human must verify (the manifest fields, the private-file rule and what CI skips, the budget numbers, the dedupe rule for sources, the decision that `access: not_opened` sources cannot back a number).
