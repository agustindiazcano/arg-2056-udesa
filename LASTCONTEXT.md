# Last Context

## State
- **Real data of the Recorrido** (`task/real-data-recorrido`, human request 2026-10-12): real and sourced now: steps 1 and 2 indicators (World Bank WDI 2025, ref `W3`), step 4 and 11 (INDEC ICA, exports by great item, January to July 2026, ref `E1`), step 12 (INDEC value added by sector 2025 at 2004 prices, ref `E2`), step 14 (before). Test data remains in 0, 1 (series), 2 (provinces), 3, 6, 8, 9, 10, 13 and the simulator.
- Steps 8 and 9 have, in Data, a table of RIGI and large mining / oil and gas projects from the press (`web/src/tour/rigiProjects.ts`, refs `R1` to `R11`), **unverified**: the sources disagree on amounts and counts and each row notes the discrepancy.
- `docs/data-requests.md`: section 0 (state per slide), new requests D23 to D27, section 3 with the human tasks H1 to H11 (priority, who, for which request) and ready prompts for another AI. `docs/references.md` section 4.3 and 4.4.
- Step 0 stays on test data: the real series (Maddison 2020) ends in 2018 and the slide runs to 2026; it needs the Maddison 2023 download (H5) and a refactor of `tour/worldData.ts`.
- Tests run locally: `tourCharts`, `dataSection`, `tourIndicators` (pass); `tsc --noEmit` clean. The rest goes to CI.

- **Side panel on every chart step (0 to 13)** (human request 2026-10-12): `tour/TourSidebar.tsx` (text, how to read it, a data badge real / partly real / test, and the references as links), the texts in `tour/stepInfo.ts`, the layout in `TourStep.tsx` (`.tour-frame`); open by default, the button «Ocultar texto» hides it and a vertical tab «Mostrar texto» brings it back; the choice (`sideOpen` in `useTourLayout`) stays when the step changes. Step 14 keeps its own text panel. The source line under a chart is amber only when the data is test data.
- Second pass of real data (same day): step 1 history 1990-2025 is real (World Bank constant 2015 USD, in `tour/gdpMock.ts`), step 9 history 2015-2025 is real (Vaca Muerta oil, IAE with Secretaría de Energía data, in `tour/tourData.ts`); Acemoglu and Anthropic read and cited in step 3; USGS lithium resources (28 Mt) in step 13 text. Projections and ranges stay made up and the chart sources say so.

## Next
- The human does H1 to H5 (see the doc); then wire the production by province (steps 2 and 7) and the hydrocarbons (step 9) and replace the RIGI press table with the official list.
