# Last Context

**Task completed**: Implemented research contracts (`task/research-contracts`).
- Created draft-2020-12 JSON schemas for `external_forecasts`, `forecast_vintages`, `base_rates`, `ai_estimates`, and `dataset_catalog`.
- Written `scripts/dataset_checks.py` to enforce domain-specific constraints (e.g. valid scenario mapping rules, numeric nullness, publication limits) matching `research-contracts.md` perfectly.
- Generated mock data deterministic generators (`scripts/gen_mock.py`) matching the complex conditions laid out in the brief.
- Implemented TS validators in `web/src/types/research.ts` (`ajv.compile<T>`), data models, and complex selectors (`selectExternalForecasts`, `selectAiEstimates`, `spreadByScenario`) according to the brief constraints.
- Updated `docs/data-dictionary.md` to reflect these new datasets and constraints.
- Resolved pipeline integration, making sure strict lints, typescript constraints, and ruff checks pass seamlessly in `scripts/precheck.py` without bypassing rules.

**Next step**: A human must review the PR, verify that mock data looks correct, and merge it.

**Status**: Tests pass perfectly. Prechecks complete properly. No new dependencies introduced. TDD fully applied.
