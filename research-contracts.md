# Task: `research-contracts`

Branch: `task/research-contracts`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/data-dictionary.md`, `docs/research-prompts.md` (scopes 5 and 6, the output field lists) and the existing `scripts/` (`validate_data.py`, `dataset_checks.py`, `gen_mock.py`, `check_no_mock.py`) first.
Prerequisite: tasks `projections-contract` and `data-pipeline` are merged into `main`.

## Why this task exists

The research agents (scopes 5 and 6) will return forecasts from institutions, past forecast vintages, base rates, dataset pointers and estimates of AI's effect on the economy. The forecasting model and the AI overlay read these as **inputs**. Without a contract they would arrive as free-form files. This task defines five contracts, their consistency checks, TS parsers and selectors, and deterministic mocks. No real data.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No UI, no model code, no Python loaders in `model/`, no real data, no adapters.
- No new dependency in Python or npm. `ajv.compile<T>` for TS parsers (no `as unknown as`).
- Do not compute anything from the data (no averages, errors, trends, conversions between metrics). The only arithmetic allowed anywhere in this task is the compounding verification in section 4.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Conventions shared by all five schemas

Draft 2020-12, `additionalProperties: false`, each file is a JSON array of records. Provenance fields on every record:

- `source_id`: string, pattern `^[a-z0-9_-]+:[A-Za-z0-9_.-]+$` (scope prefix plus the research source id, for example `economy-population:S014`; mock uses `mock:M001`).
- `source`: string, minLength 1 (title and publisher in one string; mock uses exactly `"MOCK"`).
- `source_url`: string (format uri) or null.
- `locator`: string or null.
- `snippet`: string or null. A check rejects snippets longer than 25 words.
- `confidence`: enum `high`, `medium`, `low`.
- `retrieved_at`: string (format date).
- `note`: string (optional).

Scenario vocabulary: processed data uses `pessimistic`, `expected`, `optimistic`, `not_stated`. The research output for scope 6 says `central`; the later adapter maps `central` to `expected`. Write this in `docs/data-dictionary.md`.

Null rule for numeric triples (`value`, `value_low`, `value_high`) wherever they exist: if one of `value_low` or `value_high` is non-null, both are; at least one of `value` or the pair is non-null, otherwise `note` is required. Express it with `if/then` in the schema. Numbers can be negative in these datasets (growth rates), so do not set a minimum of 0.

## 2. Schemas (in `data/schemas/`)

### 2.1 `external_forecasts.schema.json` (file `external_forecasts.json`)

Published forecasts by institutions. Fields: `id` (string, unique), `forecaster` (string), `publication_title` (string), `vintage` (string, for example "WEO April 2026"), `indicator` (enum: `gdp_growth_real_pct`, `gdp_real_level`, `gdp_per_capita_real`, `population`, `population_growth_pct`, `fertility_rate`, `life_expectancy_at_birth`, `working_age_population`, `investment_rate_pct_gdp`, `potential_growth_pct`, `tfp_growth_pct`, `exports_usd`, `hdi`, `other`), `geo` (string, minLength 1: `AR`, a province ISO id `AR-X`, or a region name), `year` (integer 1990-2100), `value`, `value_low`, `value_high` (number or null), `unit` (string, minLength 1), `price_basis` (string or null), `scenario_by_source` (string or null), `scenario_mapping` (enum above), `mapping_rationale` (string or null; required non-null when `scenario_mapping != "not_stated"`), `variant` (enum `low`, `medium`, `high`, or null), `assumptions` (string or null), plus the provenance fields. `indicator == "other"` requires `note`.

### 2.2 `forecast_vintages.schema.json` (file `forecast_vintages.json`)

Archived forecasts of real GDP growth, for measuring past forecast error. Fields: `id`, `forecaster`, `vintage_date` (date), `indicator` (enum with the single value `gdp_growth_real_pct`), `target_year` (integer 1990-2056), `horizon_years` (integer 0-10), `forecast_value` (number), `unit` (string), plus provenance fields. The outturn is NOT in this dataset (it comes from `economy_series`); never put it here.

### 2.3 `base_rates.schema.json` (file `base_rates.json`)

Fields: `id`, `description` (string), `country_or_group` (string), `period` (string), `metric` (string), `value` (number or null; null requires `note`), `unit` (string), `definition` (string, minLength 1: how an episode is defined), plus provenance fields.

### 2.4 `ai_estimates.schema.json` (file `ai_estimates.json`)

Fields (names exactly as in the research scope 6, with the scenario vocabulary above): `id`, `authors_or_institution`, `title`, `publication_date` (date), `publisher_type` (enum: `peer_reviewed`, `working_paper`, `international_org`, `central_bank`, `consultancy`, `investment_bank`, `think_tank`, `ai_company`, `government`, `other`), `sponsor_conflict_note` (string or null), `record_type` (enum: `projection`, `observed`, `exposure`, `adoption`), `geography` (enum: `global`, `advanced_economies`, `emerging_economies`, `latam`, `argentina`, `us`, `eu`, `other`), `geography_detail` (string or null), `outcome_metric` (enum: `tfp_level_gain_pct_cumulative`, `tfp_growth_pp_per_year`, `labor_productivity_gain_pct_cumulative`, `labor_productivity_growth_pp_per_year`, `gdp_level_gain_pct_cumulative`, `gdp_growth_pp_per_year`, `employment_exposed_pct`, `employment_displaced_pct`, `adoption_rate_pct`, `other`), `horizon_start_year` (integer 2000-2100), `horizon_end_year` (integer 2000-2100), `value`, `value_low`, `value_high` (number or null), `unit` (string), `scenario_by_source` (string or null), `scenario_mapping` (enum above), `mapping_rationale` (string or null; non-null when mapping is not `not_stated`), `method` (enum: `task_based_model`, `growth_model`, `survey`, `historical_analogy`, `field_experiment`, `expert_judgment`, `other`), `key_assumptions` (string or null), `time_profile` (enum: `back_loaded`, `linear`, `s_curve`, `accelerating`, `not_stated`), `derived_annualized_pp` (number or null), `derivation` (string or null), plus provenance fields. `outcome_metric == "other"` requires `note`.

### 2.5 `dataset_catalog.schema.json` (file `dataset_catalog.json`)

Pointers to datasets for calibration. Fields: `dataset_name`, `version` (string or null), `publisher`, `landing_url` (uri), `direct_download_url` (uri or null), `variables` (array of non-empty strings, minItems 1), `geographies` (array of non-empty strings, minItems 1), `years_covered` (string), `frequency` (string), `format` (string), `license_or_terms` (string or null), `access` (enum `opened`, `not_opened`), `revisions_or_rebasing_notes` (string or null), `recommended_use` (enum `calibration`, `baseline`, `scenario_structure`), plus `source_id`, `source`, `retrieved_at`, `note`. No `id` field: the key is `(dataset_name, version)`.

## 3. Checks, extending `scripts/dataset_checks.py`

Each returns `list[str]` (empty means OK); error strings name the file, the record index or id, and the reason.

- Common to all five: duplicate `id` is an error (for `dataset_catalog`, duplicate `(dataset_name, version)`); `snippet` longer than 25 words is an error; for numeric triples `value_low <= value_high` and, when `value` and the range are all present, `value` lies inside the range.
- `check_external_forecasts`: duplicate key `(forecaster, vintage, indicator, geo, year, scenario_by_source, variant, source_id)` is an error; the same key with a different `source_id` is allowed.
- `check_forecast_vintages`: `horizon_years == target_year - year(vintage_date)`, otherwise an error; `target_year >= year(vintage_date)`.
- `check_base_rates`: nothing beyond the common checks.
- `check_ai_estimates`:
  - `horizon_end_year >= horizon_start_year`.
  - `derived_annualized_pp` and `derivation` are both null or both non-null.
  - `derived_annualized_pp` is allowed only when `outcome_metric` ends with `_cumulative` (the only conversion allowed is compounding from a cumulative figure); on any other metric it is an error.
  - When `derived_annualized_pp` is present and `value` is non-null, verify exact compounding: `derived == ((1 + value/100) ** (1/n) - 1) * 100` within an absolute tolerance of 0.01, with `n = horizon_end_year - horizon_start_year` (error if `n == 0`). The convention goes in the data dictionary and the PR description flags it for the human.
  - `record_type == "adoption"` requires `outcome_metric == "adoption_rate_pct"`; `record_type == "exposure"` requires `employment_exposed_pct` or `employment_displaced_pct`; `projection` and `observed` must not use `adoption_rate_pct`.
- `check_dataset_catalog`: `access == "not_opened"` with `recommended_use` set is allowed (a pointer can still be recommended), but then `note` is required.

Wire all five into `scripts/validate_data.py`: each file is optional; when present it is validated against its schema and its check runs. Same `ERROR <file> ...` format; exit code 1 on any error.

## 4. TS: `web/src/types/research.ts` (re-export from `index.ts`)

- Types: `ExternalForecast`, `ForecastVintage`, `BaseRate`, `AiEstimate`, `DatasetCatalogEntry`, and the enums used by them (`ScenarioMapping`, `AiOutcomeMetric`, `AiRecordType`, `AiGeography`).
- Parsers with `ajv.compile<T>` (type guards): `parseExternalForecasts`, `parseForecastVintages`, `parseBaseRates`, `parseAiEstimates`, `parseDatasetCatalog`, each `(json: unknown) => T[]`, throwing a descriptive error on invalid input.
- `selectExternalForecasts(records, { indicator?, geo?, scenarioMapping?, variant?, forecaster? })`: filter, sorted by `forecaster`, `vintage`, `year`.
- `selectAiEstimates(records, { outcomeMetric, geography?, scenarioMapping?, recordType? })`: `outcomeMetric` is **required**, so a caller can never mix different quantities; sorted by `publication_date` descending, then `id`.
- `spreadByScenario(records)`: records must already share one `outcome_metric` (throw if they do not). Returns, for each of `pessimistic`, `expected`, `optimistic`, `not_stated`, `{ count, min, max, ids }`, where for each record the lower bound is `value_low ?? value` and the upper bound is `value_high ?? value`, ignoring records with no number; `min` and `max` are `null` when the scenario has no usable record. Never converts between metrics and never averages.

## 5. Mock: extend `scripts/gen_mock.py`

Same determinism rules (`SEED`, fixed `RETRIEVED_AT`, byte-identical output). Every record has `source: "MOCK"` and `source_id` of the form `mock:M###`. Write to `data/mock/`:

- `external_forecasts.json`: at least 3 forecasters; indicators `gdp_growth_real_pct`, `population`, `fertility_rate`; geo `AR` and at least 3 provinces for `population`; UN-style rows with `variant` `low`, `medium`, `high` (and `scenario_mapping` `pessimistic`, `expected`, `optimistic` respectively with a `mapping_rationale`); at least 2 rows with `not_stated` mapping; at least 3 rows with `value: null` and a range or a `note`; years up to 2056 for at least one forecaster; within each (forecaster, indicator, geo, year) group the optimistic value is above the expected one, and the expected above the pessimistic.
- `forecast_vintages.json`: at least 2 forecasters, target years 2008-2020, horizons 1 to 5, values plausible for GDP growth (between -10 and 10), consistent with `horizon_years == target_year - year(vintage_date)`.
- `base_rates.json`: at least 6 records, one with `value: null` and a `note`.
- `ai_estimates.json`: at least 14 records covering at least 3 outcome metrics; at least 3 geographies including `argentina`; all four scenario mappings; at least 3 `publisher_type` values; at least 2 with `sponsor_conflict_note`; at least 3 with `derived_annualized_pp` computed exactly from a cumulative value over `n` years (use the formula of section 3); within the same `outcome_metric` and `geography` the optimistic range is above the pessimistic one with at least a 3x ratio between their extreme bounds in at least one group, so the UI has a wide spread to display; at least 2 records of type `observed` and 2 of type `exposure`.
- `dataset_catalog.json`: at least 5 records, at least one `not_opened` with a `note`, all three `recommended_use` values present.

All mock files validate against their schemas and all checks; the `no-mock` gate still detects them (show it in the PR). `sync-data` copies them to `web/public/data/` with origin `mock` (add this to the sync test if it lists expected files).

## 6. Docs: update `docs/data-dictionary.md`

Add: a section per new file (purpose, key fields, who reads it); the `central` → `expected` mapping; the table "research field → processed field" for scopes 5 and 6 (identical names, plus `source_id` prefixed by scope, `source` built from the source title and publisher, `retrieved_at` from the source registry); the compounding convention (`n = horizon_end_year - horizon_start_year`, formula, tolerance); the rule "estimates of different quantities are never converted or averaged together" and why; a note that `forecast_vintages` has no outturn and where the outturn comes from.

## 7. Tests (write first)

Everything uses `tmp_path` and test fixtures; no real `data/` or `web/public/data/` writes.
- Schemas, per file: a valid fixture passes; each of these fails: unknown enum value for each enum field, a missing required field, an extra field, bad date, bad `source_url`, `source_id` without prefix, `value_low` set with `value_high` null, all of `value`/`value_low`/`value_high` null without `note` (where the triple exists), `mapping_rationale` null while `scenario_mapping` is not `not_stated`, `indicator` or `outcome_metric` equal to `other` without `note`, `base_rates` with `value: null` and no `note`, `dataset_catalog` with empty `variables`.
- Checks: duplicate `id`; duplicate forecast key (error) and the same key with a different `source_id` (passes); snippet of 26 words fails and 25 passes; `value_low > value_high`; `value` outside range; `horizon_years` mismatch; `target_year` before the vintage year; `ai_estimates`: `horizon_end_year < horizon_start_year`, `derived_annualized_pp` without `derivation` and the reverse, derived on a non-cumulative metric, wrong compounding (error) and exact compounding (passes) with a hand-computed example (for example a 10% cumulative gain over 10 years gives 0.9567 pp per year within tolerance), `n == 0`, `adoption` record with a different metric, `exposure` record with a GDP metric; `not_stated` catalog pointer without `note`.
- `validate_data.py` with `--processed` on a temp dir: exact exit code and message fragment for each failing case; exit 0 for valid files; each file absent is accepted.
- Mock: validates against all schemas and checks; deterministic (two runs byte-identical); every property listed in section 5 holds.
- TS: each parser accepts a valid array and rejects an invalid one with an error message naming the field; `selectExternalForecasts` filters and sorts as specified; `selectAiEstimates` without `outcomeMetric` is a type error (add a `// @ts-expect-error` test only if the repo's lint config allows it; otherwise assert it with a type-level test and say how in the PR); `spreadByScenario` throws on mixed metrics, computes `min`/`max`/`count` exactly on a hand-built fixture, returns `null` bounds for an empty scenario, and ignores records with no number.
- `no-mock` gate: show that it fails on the new mock files in a tagged build.

## 8. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no checker silenced; no `as unknown as`.
- [ ] Five schemas, five checks, wired into `validate_data.py`; five mock files committed and reproducible.
- [ ] TS parsers and selectors exported from `web/src/types/index.ts`.
- [ ] `docs/data-dictionary.md` updated.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the enums, the `central` to `expected` mapping, the `horizon_years` rule for vintages, the compounding convention and tolerance, the 25-word snippet limit, the decision that `forecast_vintages` carries no outturn, the required `outcomeMetric` in `selectAiEstimates`).
