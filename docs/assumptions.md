# Assumptions register

Every assumption and every unsourced number of `docs/model-design.md`. No row has a `source_id` yet: `docs/sources.md` and `data/raw/research/` do not exist. Sensitivity is from reasoning only and is to be confirmed by the `sensitivity` task.
Status: `needs_source` (a verifiable source should replace the value), `assumption` (a declared choice with a range), `sourced`.

| id | statement | component | why it is needed | range | sensitivity | status | source_id | who decides |
|---|---|---|---|---|---|---|---|---|
| A01 | Terminal total fertility rate `TFR_T` is drawn in a bracket between very low fertility and replacement level (2.1) | population | the fertility path drives births | 1.2 to 2.1 births per woman | high | needs_source | null | design |
| A02 | Convergence speed of fertility to its target `kappa_F` | population | shapes the path between `TFR_0` and `TFR_T` | 0.02 to 0.10 per year | medium | needs_source | null | design |
| A03 | Life expectancy approaches an asymptote `e0_max` | population | bounds mortality improvement with one parameter | 85 to 90 years | medium | assumption | null | design |
| A04 | Speed of life-expectancy gain `kappa_e` | population | drives survival | 0.01 to 0.04 per year | medium | needs_source | null | design |
| A05 | Net migration rate `m` constant per draw | population | migration is one of the cohort terms | -1.0 to 2.0 per 1,000 per year | medium | assumption | null | design |
| A06 | Age patterns of fertility, migration and the standard life table are data held fixed over the horizon | population | avoids one parameter per age | not applicable | medium | needs_source | null | design |
| A07 | Capital share `alpha` | growth | splits output growth between capital and labor | 0.30 to 0.45 | high | needs_source | null | design |
| A08 | Depreciation rate `delta` | growth | capital accumulation | 0.03 to 0.08 per year | medium | needs_source | null | design |
| A09 | Investment rate `s` as a fraction of core GDP | growth | capital accumulation | 0.12 to 0.25 | high | needs_source | null | design |
| A10 | TFP growth `g_A` bracket (location from base rates, scale from forecast vintages) | growth | the scenario driver | -0.005 to 0.020 per year | high | needs_source | null | human |
| A11 | Correlation between `g_A` and `s` | growth | avoids independent extremes | 0.0 to 0.5 | low | assumption | null | design |
| A12 | Participation rate held at its last observed value | growth | labor input from working-age population | not applicable | medium | assumption | null | design |
| A13 | Human capital folded into TFP | growth | parsimony | not applicable | medium | assumption | null | human |
| A14 | Initial capital stock `K_0` obtained from a source or perpetual inventory | growth | base-year identity for `A_0` | needs_source | high | needs_source | null | design |
| A15 | Resource sector is an additive block with value added per unit `v_r` constant in real terms | resources | GDP contribution of resources without a price model | `v_r`: needs_source | high | needs_source | null | human |
| A16 | Project capex is outside the core investment rate | resources | avoids double counting capital | not applicable | medium | assumption | null | human |
| A17 | Probability of reaching production by stage: logistic in stage rank (`a`, `b`) | resources | project pipeline | needs_source | high | needs_source | null | design |
| A18 | Project delay `D_p` | resources | start timing | 0 to 6 years | high | assumption | null | design |
| A19 | Utilization `u` after ramp-up | resources | output level | 0.5 to 1.0 | high | assumption | null | design |
| A20 | Ramp-up length | resources | output path | 1 to 5 years | medium | assumption | null | design |
| A21 | Oil and gas decline rates `d_oil`, `d_gas` | resources | post-plateau output | needs_source | medium | needs_source | null | design |
| A22 | Agricultural area constant at last observed value; yield grows at `g_y` | resources | agriculture volume | `g_y`: -0.005 to 0.020 per year | medium | assumption | null | design |
| A23 | Reserve constraint inactive until reserve estimates exist | resources | physical limit | not applicable | medium | needs_source | null | design |
| A24 | Equal core GDP per capita across provinces (`phi_p = 1`) | provinces | no harmonized provincial GDP | not applicable | high | assumption | null | human |
| A25 | Damping of provincial share drift `kappa_prov` | provinces | optional variant | 0 to 1 | low | assumption | null | design |
| A26 | AI overlay acts on TFP growth only; `delta_AI` from admissible estimates | ai | single quantity, no double counting | needs_source | high | needs_source | null | human |
| A27 | Adoption lag `lambda_years` | ai | timing of the effect | 5 to 15 years | medium | assumption | null | design |
| A28 | Education index target `E_T` and speed `kappa_E` | hdi | third HDI component | `E_T` 0.85 to 1.00; `kappa_E` 0.01 to 0.05 | low | assumption | null | design |
| A29 | HDI income index uses GDP per capita in place of gross national income; goalposts of the index | hdi | formula input | needs_source | medium | needs_source | null | design |
| A30 | Number of Monte Carlo draws `N = 3000` per scenario gives acceptable sampling error | uncertainty | stable quantiles | 1,000 to 10,000 | low | assumption | null | design |
| A31 | Scenario separation threshold: 20% of the pooled width at horizon 20 | scenarios | pre-registered criterion C4 | 10% to 30% | low | assumption | null | human |
| A32 | Backtest criteria numbers: factor 1.25 at horizon 5, 8 of 12 coverage | backtest | pre-registered criteria C2, C3 | 1.1 to 1.5; 7 to 10 of 12 | low | assumption | null | human |
| A33 | Provincial drift kept only if better in at least 18 of 24 provinces | provinces | pre-registered selection rule | 13 to 20 of 24 | low | assumption | null | human |
| A34 | Rule of 70 as the approximation of doubling time | sandbox | explainer | not applicable | low | assumption | null | design |
