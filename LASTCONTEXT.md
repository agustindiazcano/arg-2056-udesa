# LASTCONTEXT.md

## State
- **Branch**: `task/model-population-drivers` (from `main` after PR #152; `main` merged back in on 2026-10-25). CI green; PR #154.
- **Task done**: the mechanisms of section 2.1 on top of the validated cohort step. No change to `step_population` or `project_population`. No real data, no random draws, no new dependency.
  - `model/src/argmodel/population/drivers.py`: `tfr_path`, `e0_path`, `fertility_by_age`, `migration_by_age`, `life_expectancy`, `survival_for_e0` (one-parameter relational life table, Brass with slope 1, bisection on the logit shift in [-2, 2], tolerance 1e-10 years), `WORKING_AGE = (15, 64)`.
  - `projection.py`: `PopulationParams`, `ProjectionResult` (read-only arrays), `project`; a negative cohort raises `project: year t: step_population: ...`.
  - `calibrate.py`: `calibrate_kappa_f` (training window only; grid of 801 points over the bracket of `pop.kappa_f` plus golden-section refinement; a gap in the window raises).
  - Tests: `model/tests/test_population_drivers.py`, `test_population_projection.py`, `test_population_calibrate.py` (includes a scan that fails on a numeric literal outside a named constant in the three modules). Written before the code; not run locally (RULE #1), only a scratch check of the reachable e0 range of the test standard table (29.8 to 94.7 years).
  - Docs: `docs/population-model.md`; assumption A35 (working age 15 to 64) in `docs/assumptions.md`.
- **Deviation from the brief**: `life_expectancy` is written again in `argmodel` (the model package cannot import from `scripts/`); it is the same formula as `check_life_table`; the doc says they must stay equal.

## Already in `main` (merged before this task)
- **PR #151** (merged first, `task/laptop-recorrido-layout`): the Recorrido on a short laptop screen. Slides 1, 2 and 6 show one chart big and the others behind small buttons when the screen is at most 820 px tall (`web/src/tour/compact.ts`, `PanelRail.tsx`, CSS at the end of `ui.css`; plan `docs/action-plan-laptop-recorrido.md`). `tokens.categorical` and `--cat-1..8` reordered so the first eight pass `validate_palette.js --mode dark`; colors 9 to 16 not validated.

- **PR #152** `task/agro-by-province-real` (top of a stack of 9 branches, each a PR against the previous one, the first against `main`). Written 2026-10-23.
- **Stack, in merge order** (all done, CI to be read from GitHub Actions, not run locally except targeted tests):
  1. `task/ai-country-reference-lines`: slide 6 (IA): horizontal dashed lines with flags (9 countries, latest World Bank real GDP and GDP per capita) on the two charts, only those inside the axis range (`countryReferences.ts`, `referenceLines.ts`); click a small chart to bring it big to the left (`AiStep.tsx`, overlay button); the indicators card scrolls.
  2. `task/new-draft-slides`: slide 9 «¿Puede Argentina perderse la ola de la IA?» (`AiAccessStep.tsx`, `aiAccess.ts`: 20/100/200 USD plans by country with taxes; Argentina +21 % digital VAT +30 % advance = +51 %) and five outline slides 10 to 14 (`draftSlides.ts`), registered in `chartSteps.ts`, menu, index and the Data page. Ids 21 to 26.
  3. `task/development-slide-layout`: slide 7: small chips, number boxes, big yearly multi-country chart (`developmentSeries.json` from `scripts/build_development_series.py`, World Bank WDI), regional ranking table (`developmentView.ts`).
  4. `task/agro-livestock`: beef, poultry, pork and milk (BCR estimates of 2025, milk at 1.03 kg/l) in the agro treemap (`livestockArgentina.ts`).
  5. `task/province-semaphore`: slide 2: «Producción por provincia» part removed (Recursos already shows it); «Perfil por provincia» keeps the Recursos look; traffic light by thirds on bars, table and tiles (`provinceSemaphore.ts`).
  6. `task/rigi-map`: third part «Mapa del RIGI» (`RigiMapStep.tsx`, `rigiByProvince.ts`); a project that crosses provinces counts in each and its investment is split equally.
  7. `task/agro-other-crops`: «Otros cultivos» from the MAGyP full series (`agroOtherCrops.json`, `scripts/build_agro_other_crops.py`); traffic-light colours on the province map (`provinceColors` of `ProvinceMap`).
  8. `task/province-hdi`: provincial HDI (PNUD 2021, values copied from the Wikipedia table that reproduces the report) as a metric.
  9. `task/agro-by-province-real`: agro by province from `agroByProvince.json` (real MAGyP, checked against the full series) instead of made-up values; livestock, fruit and industrial crops by province are no longer shown.

- **PR #153** `task/new-slides-laptop-dataviz` (2026-10-25): review of the new slides against the dataviz guide and the laptop (1366x768).
  - Slide 7 (desarrollo) chart: `lineOption` in `developmentView.ts`: value axis fitted to the data (it started at 0 and the lines were flat), Argentina white, thicker and on top with its name at the end of the line, one fixed validated color per peer (Colombia and Uruguay had the same pink before), room on the right for the label.
  - Slide 2 «Perfil por provincia»: rail Ranking / Mapa on a short screen (`ProvinceProfileStep.tsx`), tighter header and KPI strip.
  - Slide 9 (costo de la IA) fits and follows the guide; slides 10 to 14 are text outlines (no data, nothing to chart), they fit.
  - Not done: the RIGI list card scrolls inside at 768 px; the bottom border of the profile card is cut by about 8 px at 768 px.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente (solo los tests puntuales de lo tocado).
- Nunca mergear ni pushear a `main`; un humano aprueba cada PR.
- Commits atómicos: `test(...)`, `feat(...)`, `data(...)`, `docs(...)`, `fix(...)`.

## Human checks pending
- AI plan list prices (A22) and Argentine taxes (A20, A21) against ARCA and the official pricing pages; VAT rates of the other countries are the general ones; Brazil left out.
- Livestock figures (BCR, 2025 estimates) against SAGyP and the Anuario Porcino; milk density assumption.
- Provincial HDI against the PNUD report.
- RIGI investment split among provinces for projects that cross provinces.
- Education and life expectancy by province: no data in the repo yet.
- Sugar cane is not in the MAGyP file, so it is not in «Otros cultivos».
- Relational life table choice, working age 15 to 64 (A35), `kappa_F` once real fertility data exist.

## Next
- Human: approve PR #154 and the open items above; then the next task.
- Then `backtest-baselines` (READY for the code) or `model-growth-core` (blocked by 1 and 2, which are done: check the brief).
