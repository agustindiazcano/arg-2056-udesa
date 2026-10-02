# Last Context

**Task:** Execute `docs/tasks/projections-contract.md` (migrate projects schema, create production_projections schema, checks, TS types, mock generation, and docs).

**State:**
- Created branch `task/projections-contract`.
- Migrated `projects.schema.json` to include new statuses, `company`, `owners`, updated `capacity_unit` enum, and added description to `start_year`.
- Created `production_projections.schema.json` with strict validation rules using Draft 2020-12 schemas.
- Implemented `check_projections` in `scripts/dataset_checks.py` and wired it into `scripts/validate_data.py`.
- Created TS types in `web/src/types/projections.ts`, exported them in `index.ts`.
- Updated `scripts/gen_mock.py` to generate the new fields for projects and the `production_projections.json` mock file, supporting disagreed sources and capacity forecasts.
- Created `docs/data-dictionary.md` containing units, basis, year conventions, and schema mappings.
- Wrote full unit tests for schema, checks, and TS types.
- All `precheck.py` validation passes (including `ruff`, `pytest`, schema validation, TS lint, typecheck, and vitest tests).

**Decisions:**
- MOCK source disagreement was handled using "MOCK2" in the generation logic to clearly pass provenance checks.
- Handled `rfc3987` dependency absence for URI validation in Python by adding a regex pattern constraint for `source_url` so validation tests would properly catch bad URIs without needing extra dependencies.

**Next Step:**
- Submit a PR for human review of `task/projections-contract` and verify `year` agriculture conventions, enums, unit list, and the decision to keep `production_actual` out.
