# Task: `forecast-contract`

Branch: `task/forecast-contract`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` first.
Prerequisite: task `contract` is merged into `main`.

## Goal

Fix the exact shape of the forecast model's output, so the UI and the model can be built independently against the same contract. Deliver: a JSON Schema, TS types with a parser and a selector, and extra consistency checks.
Strict TDD: write each failing test first, then the code. Atomic commits.

## Out of scope (do NOT do)

- No model code, no mock data (next task), no UI.
- No new dependencies. Use only what `contract` already installed (`ajv`, `ajv-formats`, `vitest`, `typescript`, `eslint`, `pytest`, `jsonschema`, `ruff`).
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
- Do not fake CI (`|| true`, `continue-on-error`, `if: false`).

## 1. Schema — `data/schemas/forecast_output.schema.json`

Draft 2020-12, `additionalProperties: false` everywhere. One JSON **object** (not an array):

```
{
  "model_version": string (minLength 1),
  "generated_at": string (format date),
  "source": string (minLength 1),        // "MOCK" for mock data; "argmodel@<version>" for real output
  "horizon": { "start_year": integer, "end_year": integer },
  "series": [ Series, ... ]              // minItems 1
}
```

`Series`:

```
{
  "indicator": enum [gdp_constant_usd, gdp_per_capita_usd, population, hdi, resource_production],
  "resource": enum [lithium, copper, gold, silver, oil, gas, soy, wheat, corn, other],
  "geo": "AR" or a string matching ^AR-[A-Z]$,
  "scenario": enum [pessimistic, expected, optimistic],
  "ai_overlay": enum ["off", "on"],
  "unit": string (minLength 1),
  "points": [ { "year": integer, "p10": number, "p50": number, "p90": number }, ... ]   // minItems 1
}
```

Rules in the schema (use `if/then/else`):
- `resource` is **required** when `indicator` is `resource_production`, and **forbidden** otherwise.
- All of `p10`, `p50`, `p90` are required and are never `null`.

Note: observational datasets use `source` + `retrieved_at`. This output is generated, so it uses `source` + `generated_at`. This is intended.

## 2. Extra checks (JSON Schema cannot express these)

Create `scripts/forecast_checks.py` with a function `check_forecast(doc: dict) -> list[str]` returning a list of error messages (empty list means OK):

- `p10 <= p50 <= p90` for every point.
- Years strictly increasing inside each series.
- Every year within `[horizon.start_year, horizon.end_year]`, and `start_year <= end_year`.
- No two series share the same key `(indicator, resource, geo, scenario, ai_overlay)`.

Extend `scripts/validate_data.py`: if `data/processed/forecast_output.json` exists, validate it against the schema **and** run `check_forecast`; any error exits non-zero. If it does not exist, behavior is unchanged.

## 3. TS — `web/src/types/forecast.ts` (re-export from `index.ts`)

- Types: `Indicator`, `ResourceId`, `AiOverlay`, `ForecastPoint`, `ForecastSeries`, `ForecastOutput`. Reuse `Scenario` and `ProvinceId` from `contract`. A `geo` is `'AR' | ProvinceId`.
- `parseForecastOutput(json: unknown): ForecastOutput` — validates with `ajv` against the schema file and throws an `Error` whose message includes the first validation error. Import the schema JSON by relative path (`resolveJsonModule`). If `tsconfig` `rootDir` or the bundler blocks importing from `data/schemas/`, STOP and ask; do not copy the schema.
- `selectSeries(out: ForecastOutput, q: { indicator; resource?; geo; scenario; aiOverlay }): ForecastSeries | undefined` — pure function, returns the matching series or `undefined`.

## 4. Tests (write first)

Python (`data/tests/test_forecast_contract.py`), using a small valid fixture built in the test:
- valid document passes schema and `check_forecast` returns `[]`.
- Each of these fails: missing `p50`; `p50: null`; `resource_production` without `resource`; `gdp_per_capita_usd` with a `resource`; unknown `scenario`; unknown `ai_overlay`; extra property; `geo: "AR-99"`; empty `points`.
- Each of these returns errors from `check_forecast`: `p10 > p50`; `p50 > p90`; years not increasing; year outside horizon; duplicate series key.
- `validate_data.py` exits non-zero on an invalid `forecast_output.json` placed in a temporary `data/processed/`.

TS (`web/tests/unit/forecast.test.ts`):
- `parseForecastOutput` accepts a minimal valid object; rejects missing `series`, an invalid scenario, a missing `p90`, and a `resource_production` series without `resource`.
- `selectSeries` returns the right series and returns `undefined` when nothing matches.

## 5. CI

No new jobs. Existing `web`, `python` and `data` jobs must cover the new tests. Deferred jobs stay commented out.

## 6. Acceptance checklist

- [ ] Every test committed failing first, then green (visible in `git log`).
- [ ] `resource` required-iff rule works in both directions (tested).
- [ ] Schema has no optional percentile and no nullable numbers.
- [ ] No dependency added; `package-lock.json` unchanged except if strictly required (explain in PR).
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (indicator and resource enums, percentile choice p10/p50/p90).
