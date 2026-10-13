# Last Context

## State
- **PPP removed from the whole project** (human request 2026-10-13, `task/remove-ppp`): the Maddison data (`scripts/build_world_data.py`, `worldRealData.json`, `worldReference.json`) is deleted, and its references (W1, W2, D1, D11, H5) and mentions in the docs, `AGENTS.md`, the tests and the comments are gone. Nothing in the app or the docs uses PPP.
- **All GDP is real, at constant 2015 US dollars**: `scripts/build_world_gdp.py` -> `web/src/tour/worldGdp.json` (World Bank `NY.GDP.MKTP.KD`); `web/src/tour/gdpFacts.ts` is the single source (2025 observed 609.2; 2026 = 2025 x the IMF real growth 2.06 % = 621.8, shared by steps 1, 3 and the simulator); `tests/unit/gdpConsistency.test.ts` guards it. Argentina's population is the INDEC's (46.387 M in 2025). Exports stay in current USD (a flow) and say so. Rules and the IMF comparison: sections 0b and 5 of `docs/data-requests.md`.
- Official data without the human (PR #75): Energía (oil, gas, reserves), INDEC exports by complex 2025, MAGyP crops; mining of the Secretaría de Minería (PR #76, read from the ARMINERA images).

## Next
- The human: RIGI list (H1), mining and agro by province (H9), years of step 0 and the investment figure; check the mining transcription (H3b). Model and parameters for the projections from 2027.
