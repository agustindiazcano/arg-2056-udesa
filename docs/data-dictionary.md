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
