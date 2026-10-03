# Last Context

**Task completed**: Implemented the data pipeline (`task/data-pipeline`).
- Created schemas `raw_manifest.schema.json` and `sources.schema.json`.
- Implemented `manifest.py` for registering raw files and verifying `MANIFEST.json`.
- Implemented `adapters/__init__.py` registry for processing raw data.
- Implemented `runner.py` with `run_dataset` and `check_dataset` ensuring atomic commits to `processed/` and provenance tracking.
- Implemented `provenance.py` to record sha256 hashes and verify data intactness.
- Implemented `sources.py` for coverage tracking and generating `sources.json`.
- Replaced `sync-mock.mjs` with `sync-data.mjs` overlaying `processed/` on top of `mock/` files.
- Added file size limit and total size limit checking in `check_data_budget.py`.
- Added strict dataset CLI via `__main__.py` with multiple endpoints (`run`, `check`, `register`, `verify-provenance`, `build-sources`).
- Updated `check_no_mock.py` to verify `_manifest.json` from `web/public/data`.
- Updated `precheck.py` to include `check_data_budget.py`.
- Added documentation in `docs/data-pipeline.md`.

**Next step**: A human needs to verify changes, test pipeline operation end-to-end, and merge the PR.

**Status**: Tests pass and CI prechecks complete properly. No new dependencies introduced. TDD fully applied.
