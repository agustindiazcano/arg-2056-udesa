# Task: `data-resources`

Branch: `task/data-resources`. One PR per dataset family if the diff is large (mining, energy, agro), each following this brief. Read `AGENTS.md` (section 6, data rules), `LASTCONTEXT.md`, `PENDING.md`, `docs/data-pipeline.md`, `docs/data-dictionary.md` (units, unit basis, metrics, the research-agent mapping), `docs/model-design.md` section 2.3 (what the resource block needs from these files), the schemas `resource_production`, `projects`, `production_projections` and `composition`'s resource-related parts in `data/schemas/`, their mocks in `data/mock/`, `scripts/datapipe/` (runner, adapter protocol, sources registry), `scripts/dataset_checks.py`, `scripts/validate_data.py` and the research files under `data/raw/research/` (mining, energy, agro) first.
Prerequisites: `data-pipeline` and `references-page` are merged (they are). **Human input before the task starts, otherwise stop and tell me what is missing:** the research sessions for mining, energy and agro done, their files in `data/raw/research/<scope>/`, and the human's verification of 10 URLs and 3 numbers per scope.

## Goal

The real data of the resources scene and of the model's resource block: production history by resource and province, the project pipeline, and the published production projections used for comparison. They are built from registered raw files through deterministic adapters into `data/processed/`, validated by the existing schemas, each record with `source` and `retrieved_at`.

Strict TDD for each adapter. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **No invented, interpolated or "filled" figure.** A gap is `null` with a `note`. Never convert between units except by exact arithmetic that is written in the adapter, tested and documented in `docs/data-dictionary.md`; units are the contract's (`unit` fields), not the source's.
- **`production_actual` stays out of `production_projections`** (its brief says so). Projections with `metric` `guidance` or `forecast` are comparison data; keep the metric exactly as the source states it.
- No network access (adapters and tests). No schema change (if the schema cannot hold something, stop and tell me). No mock change. No UI. No new dependency. Do not choose between conflicting sources: record the one the human names as primary and list the others in `docs/sources.md`.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Steps (per file: `resource_production.json`, `projects.json`, `production_projections.json`)

1. **Register the raw files** with `python -m datapipe register <dataset_id> <file> --source "..." --retrieved-at YYYY-MM-DD` (commands and flags are in `docs/data-pipeline.md`); private files follow the `_private` rule.
2. **Adapters** in `scripts/datapipe/adapters/` (`DATASET_ID`, `OUTPUTS`, pure `build(files, manifest)`), registered in `adapters/__init__.py`; for example `mining.py`, `energy.py`, `agro.py`, each writing the files its family owns. Field names, enums (`resource`, `status` stages, `geo`), units and the `metric` vocabulary are copied from the schemas and the data dictionary.
3. **Province and national rows**: every province id is one of the 24 of `web/src/types/province.ts` or `AR`; a row whose province cannot be mapped is an error with a message, not a dropped row. The national total and the sum of the provinces are both stored only if the source gives both; the check below compares them.
4. **Run the pipeline** to write `data/processed/*.json` and `_provenance.json`; nothing under `data/processed/` is edited by hand.
5. **Sources registry**: register each source in `data/processed/sources.json` and run `python scripts/build_references.py`; conflicts in `docs/sources.md`.
6. **Overlay and gates**: `npm run data:sync`; the data smoke test, `scripts/validate_data.py` and `scripts/check_data_budget.py` pass. The release gate `check_no_mock.py` now sees processed files for these datasets.
7. **Data to verify**: every number that will appear in the UI is listed in `PENDING.md` under "Data to verify".

## 2. Checks and tests (write first)

- Each adapter: field mapping and unit handling from a small synthetic fixture created in a temporary directory; `null` with `note` for gaps; province mapping; stage mapping for projects (the stage names of the schema; an unknown stage is an error with the exact message); `capex_usd` and `capacity_per_year` units; determinism (pure, byte-identical output).
- Negative cases with the exact message: unknown resource, unmapped province, a negative production, a year outside the schema's range, a duplicate `(resource, geo, year)` row, a project without `geo` or `status`, a projection row whose unit differs from the resource's contract unit.
- Consistency checks added to `scripts/dataset_checks.py` if they do not exist: provinces sum to the national value within the tolerance the source's rounding allows (state it), projects reference known resources, no `production_actual` metric in the projections.
- The processed files validate against their schemas; every record has `source` and `retrieved_at`; the provenance hashes match.
- The scene's data smoke test passes with the processed files and `forecast_output` is untouched.
- Tests never write inside the real `data/` directory.

## 3. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Every figure traces to a registered source; gaps are `null` with notes; units are the contract's; conflicts documented and the primary source named by the human.
- [ ] Raw files registered, processed files and provenance produced by the pipeline, sources registered and references rebuilt.
- [ ] `PENDING.md`: "Data to verify" lists the numbers; `LASTCONTEXT.md` overwritten.
- [ ] PR description: what changed, what was verified, what the human must verify (10 URLs and 3 numbers per scope, unit conversions, the province mapping, the primary-source choices).
