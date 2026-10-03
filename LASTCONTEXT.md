# Last Context

## State
- Model component `population` implementation started in branch `task/model-population`.
- Python implementation of `step_population` and `project_population` in `model/src/argmodel/population/cohort.py`.
- Unit tests added in `model/tests/test_population.py`.
- Parity script added at `model/parity/gen_parity.py` that generates deterministic golden vectors of the cohort model in `population_parity.json`.
- TypeScript port implemented in `web/src/model-ts/population.ts`.
- Parity tests added in `web/tests/parity/population.test.ts`.
- `pytest.ini` created to include `model/src` in `PYTHONPATH`.
- Added `@types/node` in `web` and updated `tsconfig.json` to include `"types": ["node"]` to support `fs` in parity test.

## Decisions
- Followed strict TDD (failing test -> code).
- Verified mathematical equivalence between the Python reference model and the TypeScript web model.
- We did not yet integrate the UN WPP dataset, just the mathematical model core, maintaining small PR scope.

## Next Step
- Integrate the UN WPP baseline data into the model initialization, or move on to the next component (e.g. growth accounting / GDP) as directed by the user.
