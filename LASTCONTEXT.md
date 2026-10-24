# LASTCONTEXT.md

## State
- **Branch**: `task/agro-by-province-real` (top of a stack of 9 branches, each a PR against the previous one, the first against `main`). Written 2026-10-23.
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

## Human checks pending
- AI plan list prices (A22) and Argentine taxes (A20, A21) against ARCA and the official pricing pages; VAT rates of the other countries are the general ones; Brazil left out.
- Livestock figures (BCR, 2025 estimates) against SAGyP and the Anuario Porcino; milk density assumption.
- Provincial HDI against the PNUD report.
- RIGI investment split among provinces for projects that cross provinces.
- Education and life expectancy by province: no data in the repo yet.
- Sugar cane is not in the MAGyP file, so it is not in «Otros cultivos».

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente (solo los tests puntuales de lo tocado).
- Nunca mergear ni pushear a `main`; un humano aprueba cada PR.
- Commits atómicos: `test(...)`, `feat(...)`, `data(...)`, `docs(...)`, `fix(...)`.

## Next
- Read the CI of the 9 branches and merge the stack in order (each PR is against the previous branch).
- Fill the human checks above; then the education and life expectancy by province.
- Fill the content of slides 10 to 14 once the human decides what each one holds.
