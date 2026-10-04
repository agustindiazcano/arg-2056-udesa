# Task: `population-age-contract`

Branch: `task/population-age-contract`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.1 and decision `D-data-1`), `docs/data-dictionary.md`, `docs/data-pipeline.md`, `data/schemas/population.schema.json`, `data/schemas/economy_series.schema.json`, `scripts/dataset_checks.py`, `scripts/gen_mock.py`, `scripts/validate_data.py`, `web/src/types/` and `web/src/data/registry.ts` first. Read `composition-contract.md` and `research-contracts.md` as examples of how a contract task is written.
Prerequisite: none.

## Goal

The population component needs data the repository has no contract for: population by age and year, the age pattern of fertility, a standard life table and the age pattern of migration (`docs/model-design.md` section 2.1 and `D-data-1`). This task adds the **contract only**: JSON Schemas, consistency checks, a deterministic mock and the TypeScript parser. No real data and no model code. The real files arrive in `data-economy-population`.

Strict TDD where it applies. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No real data, no calibration, no model code, no UI. No new dependency (the mock generator stays Python standard library only and deterministic; parsers are typed with `ajv.compile<T>()` through the precompiled validators of `web/src/validation`).
- Do not change the existing contracts or their schemas. Do not fake CI. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not silence any checker.

## 1. The four datasets

All four follow the rules of `AGENTS.md` section 6: every record has `source` and `retrieved_at`; gaps are explicit `null` with a `note`; nothing is interpolated silently. Copy `geo`, `year` and unit conventions from `docs/data-dictionary.md` and from `population.schema.json`; do not recall them from memory.

| File | One record is | Fields (names to copy into the schema) |
|---|---|---|
| `population_by_age.json` | people of one age in one year and place | `geo` (`AR` or a province id), `year`, `age` (integer 0 to 100, where 100 means 100 and over), `sex` (`both`, the only value in v1; the model is one-sex, see design 2.1 "alternatives rejected"), `persons`, `source`, `retrieved_at`, `note` |
| `fertility_schedule.json` | the share of the fertility pattern at one age, in one year | `geo`, `year`, `age` (15 to 49 in the data; the schema allows 0 to 100), `shape_f` (shares summing to 1 for a `(geo, year)`), `female_share` (fraction of the age group that is female, 0 to 1: the design needs it for `f[a,t] = TFR_t * shape_f[a] * share_f[a]`), `tfr` (births per woman, repeated on every row of the year), `source`, `retrieved_at`, `note` |
| `life_table.json` | one row of a life table | `geo`, `year`, `age`, `survival` (probability of surviving from `age` to `age + 1`, 0 to 1), `e0` (life expectancy at birth of that table, repeated per year), `source`, `retrieved_at`, `note` |
| `migration_schedule.json` | the share of the migration pattern at one age | `geo`, `year`, `age`, `shape_m` (shares summing to 1 for a `(geo, year)`), `net_migrants` (persons per year, signed, repeated per row of the year), `source`, `retrieved_at`, `note` |

`female_share` is a share of the age group, not a share of all women. Persons and shares are non-negative (`net_migrants` and `shape_m` may be negative only if the check below allows it: `shape_m` is a pattern and sums to 1, so it may have negative entries; `persons`, `shape_f` and `survival` may not).

## 2. Files

```
data/schemas/population_by_age.schema.json  fertility_schedule.schema.json  life_table.schema.json  migration_schedule.schema.json
scripts/dataset_checks.py                   checks added next to the existing ones
scripts/gen_mock.py                         generators and the deterministic mock files in data/mock/
web/src/types/populationAge.ts              interfaces and parse functions (one per dataset)
web/src/validation/schemaNames.ts           the four names added; then run `npm run gen:validators` in web/ and commit generated.js
web/src/data/registry.ts                    four optional entries (`requiredBy: []`) and the smoke test updated
docs/data-dictionary.md                     the four datasets documented
```

## 3. Checks (in `scripts/dataset_checks.py`, called by `scripts/validate_data.py`)

Each check has an exact message; the tests assert it.
1. `population_by_age`: for each `(geo, year)` the ages 0 to 100 appear exactly once (101 rows); `persons` is not negative; the sum of ages equals the `population` dataset total for the same `(geo, year)` within `0.5%` when both exist (message names the pair and both numbers).
2. `fertility_schedule`: for each `(geo, year)` the `shape_f` sum to 1 within `1e-9`; `female_share` is in [0, 1]; `tfr` is the same on every row of the pair.
3. `life_table`: ages 0 to 100 once per `(geo, year)`; `survival` in [0, 1]; `e0` constant per pair and consistent with the survivorship: `e0` equals the life expectancy implied by the `survival` column within `0.1` year (state the exact formula in the data dictionary; use the standard discrete approximation with half a year lived in the year of death; the open interval 100+ uses `1 / (1 - survival[100])` years).
4. `migration_schedule`: `shape_m` sums to 1 within `1e-9`; `net_migrants` constant per pair.
5. Every record has `source` and `retrieved_at`; a `null` value has a `note`.

## 4. The mock

Deterministic (the existing seed), `source: "MOCK"`, small (for example `AR` only, years 2000 to 2005, so the files stay under the data budget of `scripts/check_data_budget.py`; state the sizes in the PR). The mock must pass every check above, including the consistency with the mock `population` totals if they overlap, and the release gate `scripts/check_no_mock.py` must flag it (it fails while any file has `source: MOCK`).

## 5. Tests (write first)

Per schema: a valid record accepted; each required field missing rejected; `additionalProperties` rejected; out-of-range values rejected. Per check: the positive case and one failing fixture with the exact message. The mock is byte-identical across two runs. The TypeScript parsers accept the mock and reject a corrupted copy with the validator's message. The data smoke test (`web/tests/unit/data-smoke.test.ts`) passes with the four optional files present and with them absent. Tests never write inside the real `data/` directory.

## 6. Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] No real data, no model code, no new dependency. `npm run gen:validators` run and `generated.js` committed (`gen-validators --check` passes).
- [ ] Data budget respected (sizes in the PR). `docs/data-dictionary.md` updated. `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`population-age-contract` done; `model-population-drivers` unblocked).
- [ ] PR description: what changed, what was verified, what the human must verify (field names against the real sources you plan to use; the life-expectancy formula; one sex only).
