# LASTCONTEXT.md

## State
- **Branch**: `task/slide2-layout-fixes` (from `main` after PR #154). Human review of slides 2, 6 and 7 by eye (1366x768 and 1920x1080).
- **Slide 2** (Recursos / Perfil por provincia / Mapa del RIGI): one layout for the three parts (the «Mostrar» buttons under the title on the left; the embedded part has no second padding); a single card in the left column takes the full height (`res-left--single`); standalone buttons use `.btn` (they were `.seg`, only styled inside `.segmented`); the table of the profile is a real styled table (`.prov-table`); the traffic light of the profile map is now drawn: `buildProvinceMap` puts the colours in `geo.regions` (the map series shares the geo component through `geoIndex`, so colours only on the series data came out grey).
- **Slide 6** (IA): the country reference lines (flags) are only on the big chart, not on the small ones.
- **Slide 7** (desarrollo), education against peers: four World Bank WDI series for Argentina and seven peers (`SE.SEC.ENRR`, `SE.TER.ENRR`, `SE.SCH.LIFE`, `SE.XPD.TOTL.GD.ZS`; `scripts/build_development_series.py`, `developmentSeries.json`, entries built in `developmentData.ts`); PISA mathematics 2012, 2018, 2022 for the eight countries (`scripts/build_pisa_series.py`, `pisaSeries.json`; OECD tables via Our World in Data; 2015 left out, Argentina did not take part nationally); España and Estados Unidos added to the PISA ranking.
- Tests: targeted only (`provinceMapBuilder`, `developmentData`, `developmentView`, `developmentStep`, `provinceProfileStep`, `resourcesParts`); the rest runs in CI.

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
- Human: approve PR #154 and the slide 2, 6, 7 PR and the open items above; then the next task.
- Then `backtest-baselines` (READY for the code) or `model-growth-core` (blocked by 1 and 2, which are done: check the brief).
