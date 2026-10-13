# Last Context

## State
- **Real data of the Recorrido, first pass** (`task/real-data-recorrido`, human request 2026-10-12): the indicators box of steps 1 and 2 now shows World Bank WDI 2025 values (PBI 683,1; población 45,9 M; per cápita 14.898; exportaciones de bienes y servicios 106,3; crecimiento 4,4 %; inversión 16,1 %) with reference `W3` in the Data section; the indicators table in Data has year and source columns.
- `docs/data-requests.md` has a new section 0 (state of each slide, request ids) and links found and opened for D12 to D18 (INDEC ICA and PIB reports, datos.energia.gob.ar, ARMINERA 2025, IAE Vaca Muerta, USGS MCS 2026, MAGyP mirrors); section 2b lists what was not found. `docs/references.md` section 4.3 records W3.
- Slides 1 and 2 are still flagged as test data (their GDP series and province table are made up); the indicators table inside them is real.
- Only `tourIndicators` and `dataSection` unit tests were run locally; the rest goes to CI.

## Next
- Read the opened PDFs and fill D13 (exports by complex, INDEC), D17 (GDP by sector), D14 (mining projects), then connect slide 0 to `worldRealData.json`.
