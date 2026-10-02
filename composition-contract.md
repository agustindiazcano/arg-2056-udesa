# Task: `composition-contract`

Branch: `task/composition-contract`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` first.
Prerequisite: tasks `precheck` and `mock-data` are merged into `main`.

## Why this task exists

The current data contract has no way to show composition of the economy (the treemap: GDP by sector, exports by product) and no investment pipeline (projects by resource and province). The resources scene and, later, the forecast model both need them. This task adds both datasets: schemas, TS types, consistency checks and mock data.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No UI, no charts, no model code, no real data.
- No new dependencies.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Schemas — `data/schemas/`

Draft 2020-12, `additionalProperties: false`, each file is a JSON array of records. Common rules: `source` (minLength 1) and `retrieved_at` (format date) required; `note` optional but required whenever any nullable numeric field is `null`.

**`composition.schema.json`**

```
{
  "kind": enum [gdp_by_sector, exports_by_product],
  "year": integer 1810-2056,
  "group": string (minLength 1),        // top-level group, for example a sector family
  "category": string (pattern ^[a-z0-9-]+$),   // id of the leaf
  "label": string (minLength 1),
  "value_usd": number | null,           // leaf value only; never negative
  "source", "retrieved_at", "note"?
}
```

**`projects.schema.json`**

```
{
  "id": string (pattern ^[a-z0-9-]+$),
  "name": string (minLength 1),
  "resource": enum [lithium, copper, gold, silver, oil, gas, soy, wheat, corn, other],
  "geo": string (pattern ^AR-[A-Z]$),   // a province id, never "AR"
  "status": enum [operating, construction, approved, proposed],
  "capex_usd": number | null,
  "start_year": integer | null,
  "capacity_per_year": number | null,
  "capacity_unit": string | null,       // required (non-null) when capacity_per_year is not null
  "source", "retrieved_at", "note"?
}
```

`value_usd` must be `>= 0` (`minimum: 0`); `capex_usd` and `capacity_per_year` too.

## 2. Consistency checks — `scripts/dataset_checks.py`

Functions returning a list of error strings (empty list means OK):
- `check_composition(records)`: `category` unique per `(kind, year)`; every `(kind, year)` has at least 2 distinct `group` values.
- `check_projects(records)`: `id` unique.

Wire both into `scripts/validate_data.py` for `composition.json` and `projects.json` in the processed dir (same `ERROR <file> ...` format, exit code 1).

## 3. TS — `web/src/types/composition.ts` and `projects.ts` (re-export from `index.ts`)

- Types `CompositionRecord`, `ProjectRecord`, `CompositionKind`, `ProjectStatus`.
- `parseComposition(json: unknown): CompositionRecord[]` and `parseProjects(json: unknown): ProjectRecord[]`, validating with `ajv.compile<...>` (generic, type guard). No `as unknown as`.
- `selectComposition(records, { kind, year })` returns the records of that kind and year. `selectProjects(records, { resource?, status? })` filters, ordered by `capex_usd` descending with `null` last.

## 4. Mock — extend `scripts/gen_mock.py`

Same determinism rules as before (`SEED`, fixed `RETRIEVED_AT`, byte-identical output, `source: "MOCK"`). Generate `data/mock/composition.json` and `data/mock/projects.json`:
- **composition:** both kinds, yearly 2000-2025; 5 groups with 3-5 leaves each; shares drift over time (some leaves grow, some shrink); at least 2 `null` values with `note`; at least one leaf that is absent (no record) in early years instead of `null`.
- **projects:** 25 records; at least 5 distinct resources; at least 2 per status; `geo` only among provinces that have that resource in the mock `resource_production`; at least 3 with `capex_usd: null` plus `note`; `capacity_unit` present whenever `capacity_per_year` is.

## 5. Tests (write first)

- Schemas: valid fixture passes; each of these fails: missing `source`, missing `retrieved_at`, unknown `kind`, negative `value_usd`, `value_usd: null` without `note`, bad `category` pattern, `geo: "AR"` in a project, `capacity_per_year` set with `capacity_unit: null`, extra field.
- Checks: duplicate `category` in the same `(kind, year)` returns an error; a `(kind, year)` with a single group returns an error; duplicate project `id` returns an error.
- `validate_data.py` with `--processed` on a temp dir: exact exit code and message fragment for each failing case, and exit code 0 for valid files.
- Mock: validates against both schemas and checks; deterministic; every `null` has a `note`; project provinces are consistent with `resource_production`.
- TS: parsers accept valid arrays, reject invalid ones; selectors filter and order as specified (`null` capex last).

## 6. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no checker silenced.
- [ ] `data/mock/composition.json` and `projects.json` committed and reproducible.
- [ ] `no-mock` gate still catches them (show it in the PR).
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (enums, the two-level `group` hierarchy).
