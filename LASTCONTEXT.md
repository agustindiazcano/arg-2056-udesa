# Last Context

## State
- **Branch**: `task/readme-methodology`
- **Task**: Document data methodology and ingestion pipeline in README.
- **Key changes**:
  - Added "Metodología y pipeline de datos" section to `README.md`.
  - Documented automated API pipelines (World Bank, IMF, Sec. Energía, MAGyP) generating structured JSON datasets.
  - Documented extraction, normalization and automated validation of official non-API documents (INDEC, Sec. Minería, USGS).
  - Clarified decoupled architecture and strict traceability (no hardcoded ad-hoc values in UI).
  - Validated with full `python scripts/precheck.py` (ruff, pytest, terrain, validate-data, check-budget, references, web-lint, web-typecheck, web-test).

## Next
- Human review of README methodology addition.
- Open PR for `task/readme-methodology`.
