# Model data status

Companion of the table "Series needed for 1990-2025" in `model-design.md` section 5 (that design is not edited). Updated 2026-10-14.

| Series | Needed for | Status |
|---|---|---|
| `external_forecasts`: IMF (Argentina and ten peers: growth, investment, population, 2025-2031), OECD long-term scenarios (Argentina: GDP volume, potential output, population, working-age population, 2025-2056, six scenarios), UN WPP 2024 (Argentina: population, fertility, life expectancy, 2025-2056, Low/Medium/High) | `g_A` bands, population component, comparison of the model | **real** (`data/processed/external_forecasts.json`, dataset `external_forecasts_macro`, built by `scripts/fetch_external_forecasts.py` and the adapter `external_forecasts.py`) |
| `economy_series` real, `gdp_constant_usd`, `gdp_per_capita_usd`, `population`, 1990-2025 | metrics, B1-B3 | real series exist in the Recorrido (`web/src/tour/worldGdp.json`, World Bank constant 2015 USD); not yet in the pipeline: needs a dataset `economy_series` with raw files; `hdi` missing |
| Age-structured population, fertility schedule, life tables, 1990-2025 | population component, B4 | no contract; UN WPP has the files (`Population by single age`, life tables), not downloaded |
| Population projection vintage ~2005 | B4 | missing (UN WPP 2004 or INDEC 2005 revision; the human must find the file) |
| Investment series and capital stock | `K_0` | no contract; IMF `NID_NGDP` and OECD `KTPV_AV` exist but the history (INDEC FBCF, PWT `rnna`) is missing |
| `forecast_vintages` for GDP growth | `sigma_gA` | missing: the IMF API serves only the current WEO; old WEO editions must be downloaded one by one |
| Resource value added history and project vintages | resource block | missing |
| `resource_production` history 1990-2025 | agriculture, baselines | partial in the Recorrido (energy, MAGyP); not in the pipeline |

## What the external projections say (Argentina)

| Source | Figure |
|---|---|
| IMF WEO (2026-09-30) | real growth 2026 2.06 %, 2027 3.46 %, 2028 4.16 %, 2029 3.85 %, 2030 3.33 %, 2031 3.01 % |
| OECD EO 117 long-term scenarios | real GDP growth 2026-2056 as an annual average: BAU1 1.94 %, BAU2 1.73 %, ET1 1.57 %, ET2 1.78 %, ET3 1.53 %, ET4 1.74 % (computed from the levels, not stored) |
| UN WPP 2024, population 2056 | Low 43.2, Medium 48.0, High 53.1 million (fertility 1.05, 1.55, 2.05) |
| OECD, population 2056 | 49.99 million (working age 15-74: 37.36 million) |

Differences to keep in mind: the OECD and the UN populations differ (49.99 against 48.05 million in 2056) and neither equals the INDEC projection used for the present (46.387 million in 2025); the IMF total investment goes from 13.1 % of GDP in 2025 to 20.5 % in 2031, a jump the source does not explain.
