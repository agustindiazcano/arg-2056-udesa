# Last Context

## State
- Plan approved by the human: presentation first (design, 3D map country to zone, transitions, story, filters, Andes) with believable mock data, in Spanish, dark cinematic style. Phases F1 to F8 are in the plan file (`~/.claude/plans/a-ver-falta-armar-moonlit-bunny.md`).
- **F1 done on branch `task/mock-credible`**: `scripts/gen_mock.py` rewritten with `scripts/mock_shapes.py` (anchors and tables). Economy with six indicators and real units (GDP = GDP per capita x population, Argentina leads in 1913 and shows its crises), provinces that add up to the country, resources by province in sector units, a forecast that continues from 2025 with asymmetric fans, a modest AI overlay and province series for GDP, GDP per capita and population, real sector and product names, a coherent Andes march. All `source: MOCK`.
- `data/mock/` regenerated (13 files; the five research mocks are now committed and registered as optional in `web/src/data/registry.ts`). `docs/mock-data.md` explains the story and how to regenerate. New tests: `data/tests/test_mock_credible.py` (23); the mock tests now read JSON as UTF-8 (they failed on Windows with accents).
- Found by the richer data: a nested scroll box in the Resources projects table failed axe (`scrollable-region-focusable`); removed it (the page scrolls).
- precheck OK, 61 e2e tests pass locally. Pushed, CI not checked.

## Decisions
- Mock values are illustrative orders of magnitude, not facts; the badge and the release gate stay. Names of real places and companies are avoided in the Andes and project mocks.
- The fan has no history yet: the forecast chart needs a code change (F2/F3) to draw 1990 to 2025 from `economy_series`; the mock already continues from 2025.
- Country names are still ISO codes in the UI (the Spanish pass of F2 adds a name table).

## Next step
- F2: design system and shell in Spanish (tokens, HUD, filters, shared components). The map approach for F5 (Three.js own, country to zone) awaits the human's confirmation; the DEM and province geometry are human steps.
