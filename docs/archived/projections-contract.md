# Task: `projections-contract`

Branch: `task/projections-contract`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/tasks/composition-contract.md` and `docs/sources.md` first.
Prerequisite: task `composition-contract` is merged into `main` (this task migrates what it created). Run this task BEFORE `scene-resources`.

## Why this task exists

`projects.schema.json` only holds one number of headline capacity per project. The forecasting model and the resources scene need what each project, province and the country are expected to produce **year by year**, with units, scenario, source and confidence. The research agent delivers records with that shape (`metric`, `year`, `value`, `value_low`, `value_high`, `unit`, `unit_basis`, `scenario`, `stage`, `confidence`). This task aligns the data contract with it.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No UI, no model code, no real data.
- No new dependencies.
- No reserves, resources or price-assumption datasets (later task). No capex time series (capex stays a single field of `projects`).
- Do not put actual historical production here: it already lives in `resource_production`.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Migrate `data/schemas/projects.schema.json`

Changes (keep every other field and rule as it is):
- `status` enum becomes: `operating`, `ramp_up`, `construction`, `approved`, `feasibility`, `prefeasibility`, `exploration`, `announced`. The old value `proposed` is removed (the mock and tests migrate to `announced`).
- New optional fields: `company` (string | null) and `owners` (array of non-empty strings | null).
- `capacity_unit` becomes the same enum as the projection `unit` (see section 2), or `null`.
- Add a `description` to `start_year`: "Year of first production, actual or expected."

## 2. New `data/schemas/production_projections.schema.json`

Draft 2020-12, `additionalProperties: false`, a JSON array of records.

```
{
  "entity_type": enum [project, province, national],
  "project_id": string (pattern ^[a-z0-9-]+$) | null,   // required non-null when entity_type is "project"; null otherwise
  "geo": "AR" or string matching ^AR-[A-Z]$,            // project: its province; province: that province; national: "AR"
  "resource": enum [lithium, copper, gold, silver, oil, gas, soy, wheat, corn, other],
  "metric": enum [capacity_nameplate, production_expected, guidance, forecast],
  "year": integer 1990-2056,
  "period_label": string | null,                        // for agriculture, e.g. "2030/31"; convention below
  "value": number >= 0 | null,
  "value_low": number >= 0 | null,
  "value_high": number >= 0 | null,
  "unit": enum [t_per_year, oz_per_year, bbl_per_day, mm3_per_day, mtpa, t, ha, other],
  "unit_basis": string (pattern ^[a-z0-9_]+$) | null,   // required non-null when resource is lithium or copper (for example "lce", "li_content", "contained_cu")
  "scenario": enum [base, low, high, not_stated],
  "stage_as_of": string (format date) | null,
  "assumptions": string | null,
  "source": string (minLength 1),
  "source_url": string (format uri) | null,
  "locator": string | null,
  "confidence": enum [high, medium, low],
  "retrieved_at": string (format date),
  "note": string (optional)
}
```

Rules (use `if/then`):
- `project_id` non-null iff `entity_type == "project"`.
- `unit_basis` non-null when `resource` is `lithium` or `copper`.
- If `value_low` or `value_high` is non-null, both must be non-null.
- At least one of `value` or the pair (`value_low`, `value_high`) must be non-null. If `value`, `value_low` and `value_high` are all `null`, a `note` is required.
- `unit == "other"` requires a `note`.
- Conventions (put them in `description` fields): for `capacity_*` metrics `year` is the year the capacity is expected to be in place; for agriculture `year` is the calendar year in which the campaign ends and `period_label` holds the campaign (for example campaign "2030/31" has `year` 2031).

## 3. Consistency checks — extend `scripts/dataset_checks.py`

`check_projections(projections, projects) -> list[str]` (empty list means OK):
- Duplicate key `(entity_type, project_id, geo, resource, metric, year, scenario, source)` is an error. The same key with a different `source` is **allowed** (sources can disagree and both are kept).
- `value_low <= value_high`, and when `value` is not null it lies within `[value_low, value_high]` if the range is present.
- Every `project_id` exists in `projects`, and the projection's `geo` and `resource` equal the project's.
- For a given `(project_id, metric, scenario, source)`, years are not duplicated (covered by the key) and no `production_expected` year precedes the project's `start_year` when `start_year` is not null.

Wire it into `scripts/validate_data.py`: validate `production_projections.json` against its schema; run `check_projections` when it is present. If `projects.json` is missing while a projection has `entity_type == "project"`, report an error. Same `ERROR <file> ...` format, exit code 1.

## 4. TS — `web/src/types/projections.ts` (re-export from `index.ts`)

- Types: `ProductionProjection`, `ProjectionMetric`, `ProjectionUnit`, `ProjectionScenario`, `Confidence`, `EntityType`. Update `ProjectStatus` and `ProjectRecord` for section 1.
- `parseProductionProjections(json: unknown): ProductionProjection[]` using `ajv.compile<...>` (type guard). No `as unknown as`.
- `selectProjections(records, { entityType?, projectId?, geo?, resource?, metric?, scenario? })`: filter, sorted by `year` ascending, then by `source`.
- `groupBySource(records)`: returns a map from `source` to its records, so the UI can show disagreeing sources side by side.

## 5. Mock — extend `scripts/gen_mock.py`

Same determinism rules as before (`SEED`, fixed `RETRIEVED_AT`, byte-identical output, `source: "MOCK"`). Migrate the mock `projects.json` to the new status enum and add `company` and `owners`; keep at least 2 projects per status for the 8 values where the project count allows it (raise the mock to 30 projects if needed). Generate `data/mock/production_projections.json`:
- Projects at stage `operating`, `ramp_up`, `construction` or `approved`: yearly `production_expected` rows from `start_year` up to the earlier of `start_year + 14` and 2040, ramping linearly to nameplate in 3 years, plus one `capacity_nameplate` row at `start_year + 3`.
- Projects at stage `feasibility`, `prefeasibility`, `exploration` or `announced`: only a `capacity_nameplate` row; for at least 3 of them `value` is `null` and `value_low`/`value_high` are set.
- At least 4 projects with two sources disagreeing on the same year (one `confidence: "high"`, one `"medium"`); both rows kept.
- 3 provinces × 3 resources with `forecast` rows for 2026-2035 in scenarios `low`, `base`, `high` (base between low and high every year).
- National `forecast` rows, scenario `base`, 2026-2035, for `lithium`, `copper` and `oil`; and national agriculture `forecast` for `soy`, `corn` and `wheat` in unit `t` with `period_label` such as "2030/31" (and `year` equal to the second calendar year).
- Every lithium or copper row has `unit_basis` (`lce`, `contained_cu`). Every `null` with the rules above is valid. All project rows reference existing mock projects and match their `geo` and `resource`.

## 6. Docs — `docs/data-dictionary.md`

Short document with: the units table (each `unit` value, what it means, and the exact conversions allowed, such as kt to t, with the rule "record the original in `note`"); recommended `unit_basis` values; the conventions for `year` and `period_label`; the meaning of each `metric` and `scenario`; and a table mapping the research agent's `findings.json` fields to these schemas:

| research field | maps to |
|---|---|
| `stage` | `projects.status` (same 8 values) |
| `metric: capacity_nameplate / production_expected / guidance / forecast` | `production_projections.metric` |
| `metric: production_actual` | `resource_production` (not this dataset) |
| `metric: capex` | `projects.capex_usd` |
| `metric: resource_estimate / reserve_estimate / price_assumption` | not modeled yet |
| `source_id` + sources registry | `source` (title and publisher), `source_url`, `retrieved_at` |
| `locator`, `confidence`, `assumptions`, `stage_as_of` | same names |

## 7. Tests (write first)

- Projections schema: a valid fixture passes; each of these fails: `entity_type: "project"` with `project_id: null`; `entity_type: "province"` with a non-null `project_id`; lithium row without `unit_basis`; `value_low` set and `value_high` null; all of `value`, `value_low`, `value_high` null without `note`; `unit: "other"` without `note`; unknown `metric`; `metric: "production_actual"`; negative value; `year: 1989`; missing `source`; missing `retrieved_at`; bad `source_url`; extra field.
- Projects schema (migration): each of the 8 statuses passes; `proposed` fails; `capacity_unit` outside the enum fails; `owners` with an empty string fails.
- Checks: duplicate full key errors; same key with a different `source` passes; `value_low > value_high` errors; `value` outside the range errors; unknown `project_id` errors; `geo` or `resource` different from the project's errors; `production_expected` before the project's `start_year` errors.
- `validate_data.py` with `--processed` on a temp dir: exact exit code and message fragment for each failing case, and exit code 0 for valid files; a `project` projection without `projects.json` exits 1.
- Mock: validates against both schemas and all checks; deterministic; all the properties listed in section 5 hold (statuses, disagreeing sources, scenario ordering, lithium and copper have `unit_basis`, null rows are valid).
- TS: parser accepts valid arrays and rejects invalid ones; `selectProjections` filters and sorts as specified; `groupBySource` groups correctly.
- `no-mock` gate still catches the new mock file (show it in the PR).

## 8. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no checker silenced; no `as unknown as`.
- [ ] `data/mock/projects.json` and `production_projections.json` committed and reproducible.
- [ ] `docs/data-dictionary.md` written.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the enums, the unit list, the `year` convention for agriculture, the decision to keep `production_actual` out).
