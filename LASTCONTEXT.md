# LASTCONTEXT.md

## State
- **Branch**: `task/laptop-recorrido-layout` (pushed, no PR; CI of the first push failed on my test missing `// @vitest-environment jsdom`, fixed in the next push).
- **Task**: the Recorrido on a short laptop screen (1366x768, 1440x900, 1536x864); the Andes are not touched. Plan in `docs/action-plan-laptop-recorrido.md`.
- **Done**:
  1. Sweep of the nine slides at 1366x768 and 1536x864 (screenshots by Playwright against the dev server, not part of the repo). Findings are the table in the plan.
  2. `web/src/tour/compact.ts`: `COMPACT_QUERY` `(max-height: 820px) and (min-width: 901px)`, `isCompact`, `useCompact`.
  3. `web/src/tour/PanelRail.tsx`: row of small buttons (drawing + title, `aria-pressed`) and `panelAttrs` (hides the panels that are not the chosen one, compact only). Test `web/tests/unit/panelRail.test.tsx`.
  4. Wired into `WorldStep` (PBI en el tiempo / Ranking mundial / Región), `ResourcesStep` (Composición / Por provincia / Mapa) and `AiStep` (PBI real / Per cápita y población / Indicadores).
  5. CSS at the end of `web/src/styles/ui.css`: single column grids, `display: contents` for `.prov-side` and `.res-left`, reference chips under the title hidden (the side panel lists them), side panel 19 rem, KPI strip of Recursos on one row.
  6. `tokens.categorical` and `--cat-1..8`: same eight colors in the order that passes `validate_palette.js --mode dark` (the old order failed: orange next to amber, delta E 2.1 for deuteranopia). Colors 9 to 16 are unchanged and not validated (the guide allows 8).
  7. The " ·" after the subtitle of slides 1 and 6 is gone in compact mode.
- **Checked by eye** (Playwright, 1366x768): the three rails switch panels and the charts resize. `tsc` and `eslint` pass locally. No test suite was run locally (RULE #1).

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- Commits atómicos: `test(...)`, `feat(...)`, `data(...)`, `docs(...)`, `fix(...)`.
- Sin dependencias nuevas, sin silenciamiento de checkers.

## Next
- Read the CI run of `task/laptop-recorrido-layout` (`gh run list --branch task/laptop-recorrido-layout`), then open the PR.
- Human: look at slides 1, 2 and 6 on a real laptop. Left rough: the totals row of Recursos scrolls sideways at 1366 px; slides 7 and 8 scroll inside their cards at 768 px (acceptable); the reference lines of the AI per-capita chart overlap their labels.
- Then `model-population-drivers` (`docs/tasks/model-population-drivers.md`), unblocked by `population-age-contract`.
