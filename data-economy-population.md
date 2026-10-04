# Task: `data-economy-population`

Branch: `task/data-economy-population`. One PR per dataset if the diff is large (`economy_series`, `population`, `composition`, then the age-structured files). Read `AGENTS.md` (section 6, data rules), `LASTCONTEXT.md`, `PENDING.md`, `docs/data-pipeline.md`, `docs/data-dictionary.md`, `docs/model-design.md` sections 2.1, 2.2 and 5 (what the model and the backtest need from these files, and the table "Series needed for 1990-2025"), `docs/assumptions.md`, the schemas `economy_series`, `population`, `composition` and the four age-structured schemas of `population-age-contract` in `data/schemas/`, their mocks in `data/mock/`, `scripts/datapipe/`, `scripts/dataset_checks.py`, `scripts/validate_data.py` and the research files under `data/raw/research/` (economy and population) first.
Prerequisites: `data-pipeline`, `references-page` and `population-age-contract` are merged. **Human input before the task starts, otherwise stop and tell me what is missing:** the research sessions for economy and population done, their files in `data/raw/research/<scope>/`, the human's verification of 10 URLs and 3 numbers per scope, and the human's answer to `D-gdp-1` (the GDP basis: constant USD and its base year, market versus PPP), because it fixes every level and unit.

## Goal

The real macro and demographic series: GDP, GDP per capita, population (and HDI) from 1810 where the sources go, the composition of GDP and exports, and the age-structured population, fertility, life-table and migration files the population component needs. They are built from registered raw files through deterministic adapters into `data/processed/`, validated by the schemas, each record with `source` and `retrieved_at`. These files are what the backtest is judged on, so their quality is the quality of the whole model claim.

Strict TDD for each adapter. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **No invented, interpolated or "filled" figure.** A gap is `null` with a `note`. Never splice two series silently: if a long series needs two sources (different base years, different definitions), keep both as separate records with their own `source` and say in `docs/sources.md` where they overlap; any rescaling is exact arithmetic written in the adapter, tested and documented, and the human approves it. Never mix PPP and market values.
- **The test window is data like any other here**: the adapter does not know about the 2005 split (the slicing belongs to the backtest code). Do not smooth, revise or "clean" observations after 2005.
- No network access (adapters and tests). No schema change (if the schema cannot hold something, stop and tell me). No mock change. No UI. No new dependency. Do not choose between conflicting sources: record the one the human names as primary and list the others in `docs/sources.md`.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Steps

1. **Register the raw files** with `python -m datapipe register <dataset_id> <file> --source "..." --retrieved-at YYYY-MM-DD`; private files follow the `_private` rule (`docs/data-pipeline.md`).
2. **Adapters** in `scripts/datapipe/adapters/` (`DATASET_ID`, `OUTPUTS`, pure `build(files, manifest)`), registered in `adapters/__init__.py`: for example `economy.py` (`economy_series.json`, `composition.json`) and `population.py` (`population.json` and the four age-structured files). Field names, enums, `unit`, `geo` ids and `indicator` names are copied from the schemas and the data dictionary.
3. **Units and basis**: the unit of every record is the contract's, with the basis fixed by `D-gdp-1`; record the base year in `unit` or `note` exactly as the data dictionary's "Unit Basis" section says. The identity `gdp_per_capita = gdp / population` is checked on every `(geo, year)` where the three exist, with the tolerance the sources' rounding allows (state it).
4. **Run the pipeline**, then **register the sources** in `data/processed/sources.json` and run `python scripts/build_references.py`; conflicts in `docs/sources.md`.
5. **Overlay and gates**: `npm run data:sync`; the data smoke test, `scripts/validate_data.py` and `scripts/check_data_budget.py` pass (the age-structured files are large: if they exceed the data budget, stop and tell me; do not drop rows silently).
6. **The model's series list**: update the table "Series needed for 1990-2025" status in `docs/model-design.md`'s companion `docs/model-data-status.md` (create it; do not edit the design) so the model and backtest tasks can see what exists.
7. **Data to verify**: every number that will appear in the UI is listed in `PENDING.md` under "Data to verify".

## 2. Checks and tests (write first)

- Each adapter: field mapping and units from a synthetic fixture created in a temporary directory; `null` with `note` for gaps; the two-source case kept as separate records; determinism (pure, byte-identical output).
- Negative cases with the exact message: unknown `geo`, a year outside the schema's range, a negative value, a duplicate `(indicator, geo, year)`, an age outside 0 to 100, a missing source or retrieval date.
- The checks of `population-age-contract` hold on the real files (101 ages per `(geo, year)`, shares summing to 1, life-expectancy consistency, age totals within 0.5% of the `population` totals) and the identity above.
- The processed files validate against their schemas; the provenance hashes match; the data smoke test passes; the release gate sees processed data for these datasets.
- Tests never write inside the real `data/` directory.

## 3. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Every figure traces to a registered source; gaps `null` with notes; no silent splice or rescale; units and basis as decided in `D-gdp-1`; primary sources named by the human.
- [ ] Raw files registered, processed files and provenance produced by the pipeline, sources registered and references rebuilt; `docs/model-data-status.md` written.
- [ ] `PENDING.md`: "Data to verify" lists the numbers and the backtest tasks are unblocked if the 1990 to 2025 series are complete; `LASTCONTEXT.md` overwritten.
- [ ] PR description: what changed, what was verified, what the human must verify (10 URLs and 3 numbers per scope, the GDP basis, any rescaling, the overlap years of spliced series).
