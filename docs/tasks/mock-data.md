# Task: `mock-data`

Branch: `task/mock-data`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` first.
Prerequisite: tasks `contract` and `forecast-contract` are merged into `main`.

## Goal

1. A deterministic generator of **mock** datasets that follow the real schemas, so the UI can be built before real data exists.
2. A gate that guarantees mock data can never ship.

Strict TDD. Atomic commits.

## Out of scope (do NOT do)

- No real data, no model code, no UI, no "MOCK DATA" badge (that belongs to the `shell` task).
- Do not copy mock files into `web/public/data/` (the `shell` task decides how).
- No new dependencies: Python **standard library only** (`random.Random`, `json`). No numpy.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
- Do not fake CI.

## 1. Generator — `scripts/gen_mock.py`

- Constants: `SEED = 2056`, `RETRIEVED_AT = "2026-10-02"` (fixed, NOT today's date, so output is reproducible).
- Writes to `data/mock/`: `economy_series.json`, `resource_production.json`, `population.json`, `andes_events.json`, `forecast_output.json`.
- Every record (and the forecast document) has `source: "MOCK"`.
- Output is byte-identical across runs: `json.dumps(..., indent=2, sort_keys=True, ensure_ascii=False)` plus a trailing newline.
- Each file must validate against its schema in `data/schemas/`.

### Realism requirements (so the UI is designed against realistic shapes, not smooth curves)

- **economy_series:** countries `ARG, BRA, CHL, MEX, COL, PER, URY`; years 1880–2025; indicators `gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `hdi`. `hdi` exists only from 1990. Include at least 3 `null` values (each with a `note`) and one multi-year gap for one country. Include crisis-like drops, not only monotone growth.
- **resource_production:** resources `lithium, copper, gold, oil, gas, soy`; years 1990–2025; each resource has a national record (`geo: "AR"`) and records in **between 3 and 8 provinces** (not all 24). Mix shapes: strong growth, plateau, decline. At least 3 `null` values with `note`.
- **population:** `AR` and all 24 province ids, years 1950–2025 in 5-year steps.
- **andes_events:** 10 events with ids `mock-andes-01` … `mock-andes-10`, names `MOCK event N`, `day_of_campaign` non-decreasing between 0 and 40, `lat` in [-34.5, -32.0], `lon` in [-71.0, -68.0], at least 2 distinct `date_precision` values, at least 2 events with `elevation_m: null` plus `note`, at least 1 force entry with `men: null` plus its own `note`, at least 2 forces per event named `MOCK side A` / `MOCK side B`.
- **forecast_output:** `horizon` 2026–2056. For `AR`: all five indicators (`resource_production` for each of the 6 resources) × 3 scenarios × `ai_overlay` off/on. For provinces: only `resource_production` for the provinces that have that resource in `resource_production.json` × 3 scenarios × overlay off/on. Properties that must hold:
  - fan width `p90 - p10` is non-decreasing with the year;
  - for the same series key (except scenario), same year: `p50(pessimistic) <= p50(expected) <= p50(optimistic)`;
  - for the same series key (except overlay), same year: `p50(on) >= p50(off)`;
  - `check_forecast` from `scripts/forecast_checks.py` returns `[]`.

## 2. Gate — `scripts/check_no_mock.py`

- Usage: `python scripts/check_no_mock.py [DIR ...]`. Default dirs: `data/processed` and `web/public/data`. A default dir that does not exist is skipped.
- Walks every `*.json` file under each dir, recursively. Exit code 1 (and print the offending file) if the file name contains `mock` (case-insensitive) **or** any JSON object at any depth has `"source": "MOCK"`. Otherwise exit 0.
- Invalid JSON file → exit 2 with a message.

## 3. CI — `.github/workflows/ci.yml`

- Add triggers: `workflow_dispatch` and `push` of tags matching `v*`.
- Add job `no-mock` that runs `python scripts/check_no_mock.py`, with `if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'`. This `if` is the ONLY allowed conditional; normal PRs must not run this job (mock is allowed during development).
- The existing `python` job must also run the generator tests.

## 4. Tests (write first) — `data/tests/`

- Determinism: running the generator twice into two temp dirs gives byte-identical files.
- Schemas: every generated file validates against its schema.
- Provenance: every record has `source == "MOCK"` and `retrieved_at == "2026-10-02"`.
- Every `null` numeric has a `note` (same level as the `null`).
- All province ids valid; each resource appears in 3–8 provinces; `hdi` absent before 1990.
- Forecast invariants: fan width non-decreasing, scenario ordering, overlay ordering, `check_forecast` returns `[]`.
- Gate: temp dir with a mock file name → exit 1; nested object with `source: "MOCK"` → exit 1; clean dir → exit 0; missing default dir → exit 0; broken JSON → exit 2.
- Run the generator once and commit the resulting `data/mock/*.json` files.

## 5. Acceptance checklist

- [ ] Tests committed failing first, then green.
- [ ] No third-party Python dependency added.
- [ ] `no-mock` job is gated by tag / manual trigger only, with no `|| true` or `continue-on-error`.
- [ ] `data/mock/*.json` committed and reproducible with `python scripts/gen_mock.py`.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (that mock shapes look plausible, and that the gate catches a mock file placed in `web/public/data/`).
