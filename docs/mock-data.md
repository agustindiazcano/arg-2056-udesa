# Illustrative mock data

The app shows mock data until real data replaces it. The mock is generated, deterministic and **illustrative**: its
values are orders of magnitude chosen so that the screens tell a believable story. None of them is a sourced fact, every
record keeps `source: "MOCK"` and the release gate (`scripts/check_no_mock.py`) fails while any file is mock.

Regenerate it with `python scripts/gen_mock.py data/mock`, then `npm run data:sync` in `web/`. The generator is
`scripts/gen_mock.py`; the anchors and fixed tables are in `scripts/mock_shapes.py` (change a number there, not in the
JSON). Every value is a function of the seed (2056): the same code gives the same bytes.

## What the story is

| File | What it shows |
|---|---|
| `economy_series.json` | Seven countries, six indicators, 1880 to 2025. GDP is GDP per capita times population, so the three agree. Argentina has the highest GDP per capita in 1913 and is third in 2025, with crisis years in 1890, 1930, 1989, 2001 and 2018. Units are `USD`, `personas` and `índice`. Exports and imports start in 1960. |
| `population.json` | The country and its 24 provinces every five years, 1950 to 2025; the provinces add up to the country; Buenos Aires province is the largest. |
| `resource_production.json` | Lithium, copper, gold, oil, gas and soy by province, 1990 to 2025, in sector units (`kt LCE`, `kt Cu`, `t Au`, `kbbl/d`, `Mm3/d`, `Mt`), only in the provinces where each makes sense; the national row is the sum. |
| `forecast_output.json` | 2026 to 2056 for the three scenarios, with and without the AI overlay. It continues from the 2025 values of the other files, the fan widens every year and has a longer lower tail, the overlay adds a modest GDP gain and nothing to population. Provinces have GDP, GDP per capita and population (constant shares of the national series), no HDI. Written without indentation to stay under the 1.5 MB per-file budget. |
| `composition.json`, `projects.json`, `production_projections.json` | Real sector and product names, fictional project and company names, projects in the right provinces. |
| `andes_events.json` | An illustrative march of ten events over 21 days from east to west, with unknown elevations and an unknown opposing force shown as gaps with their note, and one contested figure as a range. It names no real battle and states no historical fact. |
| `ai_estimates.json`, `external_forecasts.json`, `forecast_vintages.json`, `base_rates.json`, `dataset_catalog.json` | The research contracts' mocks, optional in the app. |

## What protects it

`data/tests/test_mock_credible.py` states the story as tests (ranges, the GDP identity, the 1913 and 2025 ranking, the
crisis years, provinces adding up, resources in their provinces and units, the forecast continuing from 2025, fan shape,
file sizes). `data/tests/test_mock_data.py` keeps the contract invariants (schemas, provenance, nulls with notes,
scenario and overlay ordering, determinism). Nulls and gaps are kept on purpose: the app must show a gap, never a zero.
