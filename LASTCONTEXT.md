# LASTCONTEXT.md

## State (2026-10-17)
- **Stack of three branches, all CI green, no PR opened** (merge in order; each is based on the previous): `task/tour-nav-menu` -> `task/nav-gold-palette` -> `task/intro-load-lights`.
- **Slide 1 (plan `docs/action-plan-slide1-visual.md`), CI green, no PR**: `task/help-lead-text` (step 1: `lead` line in `ChartHelp`) -> `task/slide1-main-metric` (steps 2 to 6: clickable ranking tables, flags to compare countries, log scale only when a line is squashed, flag + place at the tip of the lines, regional growth line on a right axis (2D, PBI only), `lead` on the other slides). Merge in that order; the nav stack above is independent of it (both touch `ui.css` at the end: expect a trivial conflict).
- **Worktree** `../arg-2056-udesa-nav` (node_modules is a junction to the main checkout); the human works in the main checkout, so do not switch branches there.

## What was done
1. `tour-nav-menu`: «Hacia el 2056» tab has a chevron and a dropdown of the slides, «0 · Índice» first (`web/src/app/TourMenu.tsx`, titles from the light `web/src/tour/menuItems.ts`, `slideTitles.ts` no longer imports the world data). Hover, click (pins) and Down arrow open it; Escape closes it.
2. `nav-gold-palette`: tokens `--nav-gold*` derived from `--intro-light` (the home «2056»); navbar, navbar logo, Andes navbar and the all-lit provinces on hover of «Hacia el 2056» use it.
3. `intro-load-lights`: during the flat load the provinces light up one by one (300 to 1300 ms), all lit when the map tilts (`loadLightPlan` in `web/src/intro/layout.ts`).
4. `PENDING.md`: removed references to the deleted `test/` prototypes; queued the slide 1 plan and these tasks.

## Rules in force
- RULE #1: tests run only in CI. No colour literals outside `tokens.css`. Main chunk budget: do not import charts or data JSON from the app shell.

## Next
- Open the PRs (human approves). One Andes unit test (`closes the crossing pop-up with Escape`) failed once in CI with no related change and passed on re-run: probably flaky.
- Human: look at the menu, the gold and the intro load by eye.
