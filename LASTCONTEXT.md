# Last Context

**Task:** Execute `docs/tasks/composition-contract.md` (Implementation of data schemas and mock data for composition and projects).

**State:**
- Completed TDD cycle for `composition.schema.json` and `projects.schema.json`.
- Implemented `check_composition` and `check_projects` in `dataset_checks.py`.
- Updated `validate_data.py` to enforce the schemas and dataset checks.
- Wrote mock data generators (`gen_composition`, `gen_projects`) in `scripts/gen_mock.py` matching the strict schema constraints and invariants.
- Fixed TS type exports (`types/composition.ts`, `types/projects.ts`) and wrote generic selector/parser functions using `ajv` and `ajv-formats`.
- All `precheck.py` validation passes (including `ruff`, `pytest`, schema validation, TS lint, typecheck, and vitest).

**Decisions:**
- Decided to use `ajv-formats` to enforce `date` formatting in our strict `draft-2020` parsing.
- Stored all TS types and selector logic cleanly with corresponding tests checking order invariants (`projects.ts` orders by `capex_usd` descending with nulls last).

**Next Step:**
Wait for a human code review on `task/composition-contract`. If merged, proceed to `task/projections-contract` as per the agreed sequence.
