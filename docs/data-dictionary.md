# Data Dictionary

## Units
| Unit | Meaning |
|---|---|
| `t_per_year` | Tonnes per year |
| `oz_per_year` | Ounces per year |
| `bbl_per_day` | Barrels per day |
| `mm3_per_day` | Million cubic meters per day |
| `mtpa` | Million tonnes per annum |
| `t` | Tonnes |
| `ha` | Hectares |
| `other` | Other units (requires `note`) |

**Conversions**: Exact conversions are allowed (for example, converting kt to `t` by multiplying by 1000). Rule: always record the original value and unit in the `note` field.

## Unit Basis
Recommended `unit_basis` values:
- `lithium`: `lce` (Lithium Carbonate Equivalent)
- `copper`: `contained_cu` (Contained Copper)

## Year and Period Label Conventions
- For `capacity_*` metrics: `year` is the year the capacity is expected to be in place.
- For agriculture: `year` is the calendar year in which the campaign ends. The `period_label` field holds the campaign string (for example, campaign "2030/31" has `year` 2031).

## Metrics
| Metric | Meaning |
|---|---|
| `capacity_nameplate` | The maximum designed production capacity (nameplate capacity). |
| `production_expected` | Expected production for the period. |
| `guidance` | Official company guidance for production. |
| `forecast` | Third-party or aggregate forecast. |

## Scenarios
| Scenario | Meaning |
|---|---|
| `base` | Base or expected case. |
| `low` | Pessimistic or low case. |
| `high` | Optimistic or high case. |
| `not_stated` | Scenario not explicitly stated in the source. |

## Research Agent Mapping
Table mapping the research agent's `findings.json` fields to the JSON schemas:

| research field | maps to |
|---|---|
| `stage` | `projects.status` (same 8 values) |
| `metric: capacity_nameplate / production_expected / guidance / forecast` | `production_projections.metric` |
| `metric: production_actual` | `resource_production` (not this dataset) |
| `metric: capex` | `projects.capex_usd` |
| `metric: resource_estimate / reserve_estimate / price_assumption` | not modeled yet |
| `source_id` + sources registry | `source` (title and publisher), `source_url`, `retrieved_at` |
| `locator`, `confidence`, `assumptions`, `stage_as_of` | same names |

## Macro and Demographic Research Contracts

The following files track external data used to model macroeconomic trends, demographic baselines, AI impacts, and dataset metadata.

### external_forecasts
Forecasts from major institutions (e.g., IMF, World Bank, UN) covering variables such as GDP growth, population, and fertility rates.
- **Scenario Mapping**: The central or aseline scenario from sources must be mapped to expected in our scenario_mapping.

### ase_rates
Historical reference data (e.g., growth spurts in peer countries) used to ground scenario assumptions.

### i_estimates
Projections of AI's impact on productivity, employment, and economic growth.
- **Metric Rules**: Data must strictly distinguish between annual percentage points (pp) and cumulative percentages (pct).
- **Compounding Rule**: The only acceptable arithmetic during validation is verifying that a compounded annualized percentage point (PP) figure correctly compounds to the reported cumulative figure over the stated horizon. Other conversions (e.g. GDP level to growth) are not allowed.

### dataset_catalog
Registry of foundational datasets (e.g., UN WPP) tracking access status, versions, and recommended use.

### macro_assumptions
Underlying macroeconomic assumptions (e.g., target capital expenditure, population trends) that inform the forecast models.


## Age-Structured Demographic Contracts (`population-age-contract`)

The demographic component of the model (`docs/model-design.md` section 2.1) uses four age-structured datasets to drive the cohort-component population projection. Every record includes `source` (title and publisher) and `retrieved_at` (ISO date `YYYY-MM-DD`). Gaps are explicit `null` with a `note`.

### `population_by_age.json`
Population count by single year of age (0 to 100, where 100 denotes age 100 and over) for a given geography and calendar year.
- **Fields**:
  - `geo`: Geography identifier (`AR` or province ISO id `AR-A` through `AR-Z`).
  - `year`: Calendar year (integer).
  - `age`: Single year of age, integer $0 \le a \le 100$ ($100$ is the open interval $100+$).
  - `sex`: Sex group (`both`, single-sex model in v1).
  - `persons`: Number of individuals (non-negative number or `null` with `note`).
  - `source`: Citation / publisher string.
  - `retrieved_at`: Retrieval date (`YYYY-MM-DD`).
  - `note`: Optional explanation (required when `persons` is null).
- **Consistency Rules**:
  - For each `(geo, year)`, all 101 single ages (0 to 100) must appear exactly once.
  - When a corresponding `(geo, year)` record exists in `population.json`, the sum of `persons` across all ages must match the `population.json` total within $0.5\%$.

### `fertility_schedule.json`
Normalized age pattern of fertility and total fertility rate by calendar year.
- **Fields**:
  - `geo`: Geography identifier (`AR` or province ISO id `AR-A` through `AR-Z`).
  - `year`: Calendar year (integer).
  - `age`: Age of mother (integer 0 to 100; active reproductive range typically 15 to 49).
  - `shape_f`: Share of the fertility schedule at age $a$ (non-negative number or `null` with `note`).
  - `female_share`: Proportion of the cohort at age $a$ that is female (number in $[0, 1]$ or `null` with `note`).
  - `tfr`: Total Fertility Rate (births per woman, repeated across all ages in the same year).
  - `source`, `retrieved_at`, `note`: Standard provenance fields.
- **Consistency Rules**:
  - For each `(geo, year)`, the sum of `shape_f` across all ages must sum to $1.0$ within an absolute tolerance of $10^{-9}$.
  - `female_share` must lie in $[0, 1]$.
  - `tfr` must be identical across all rows for a given `(geo, year)`.

### `life_table.json`
Standard period life table with age-specific survival probabilities and life expectancy at birth.
- **Fields**:
  - `geo`: Geography identifier (`AR` or province ISO id `AR-A` through `AR-Z`).
  - `year`: Calendar year (integer).
  - `age`: Single year of age (integer 0 to 100).
  - `survival`: Probability $S_a$ of surviving from age $a$ to age $a+1$ (number in $[0, 1]$ or `null` with `note`). For age 100, $S_{100}$ is the annual survival probability in the open interval $100+$.
  - `e0`: Period life expectancy at birth in years (number or `null` with `note`).
  - `source`, `retrieved_at`, `note`: Standard provenance fields.
- **Consistency Rules and Formula**:
  - For each `(geo, year)`, all 101 ages (0 to 100) must appear exactly once.
  - `survival` must lie in $[0, 1]$ (with $S_{100} < 1.0$ to ensure finite open interval life expectancy).
  - `e0` must be constant across all rows for a given `(geo, year)`.
  - **Life Expectancy Consistency Formula**: The reported life expectancy at birth $e_0$ must equal the life expectancy implied by the `survival` vector within an absolute tolerance of $0.1$ years:
    $$l_0 = 1.0$$
    $$l_{a+1} = l_a \cdot S_a \quad \text{for } a = 0, \dots, 99$$
    $$L_a = \frac{l_a + l_{a+1}}{2} = 0.5(l_a + l_{a+1}) \quad \text{for } a = 0, \dots, 99$$
    $$L_{100+} = \frac{l_{100}}{1 - S_{100}}$$
    $$e_0^{\text{implied}} = \sum_{a=0}^{99} L_a + L_{100+} = 0.5 + \sum_{a=1}^{99} l_a + 0.5\,l_{100} + \frac{l_{100}}{1 - S_{100}}$$
    $$\left|e_0 - e_0^{\text{implied}}\right| \le 0.1$$
    This uses the standard discrete approximation where individuals dying in age interval $[a, a+1)$ live on average half a year ($a_x = 0.5$), and the open interval $100+$ assumes constant annual survival $S_{100}$ giving remaining life expectancy $e_{100} = \frac{1}{1 - S_{100}}$.

### `migration_schedule.json`
Normalized age pattern of net migration and total net migrants by calendar year.
- **Fields**:
  - `geo`: Geography identifier (`AR` or province ISO id `AR-A` through `AR-Z`).
  - `year`: Calendar year (integer).
  - `age`: Single year of age (integer 0 to 100).
  - `shape_m`: Share of net migration at age $a$ (signed number summing to 1 across the pattern, or `null` with `note`).
  - `net_migrants`: Total net migrants in persons per year (signed number, repeated across all ages in the same year).
  - `source`, `retrieved_at`, `note`: Standard provenance fields.
- **Consistency Rules**:
  - For each `(geo, year)`, the sum of `shape_m` across all ages must sum to $1.0$ within an absolute tolerance of $10^{-9}$.
  - `net_migrants` must be identical across all rows for a given `(geo, year)`.
