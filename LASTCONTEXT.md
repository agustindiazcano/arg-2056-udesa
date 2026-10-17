# LASTCONTEXT.md

## State (2026-10-17)
- **Stack of three branches, all CI green, no PR opened** (merge in order; each is based on the previous): `task/tour-nav-menu` -> `task/nav-gold-palette` -> `task/intro-load-lights`.
- **Separate branch, CI green, no PR**: `task/help-lead-text` (slide 1 step 1: `lead` line in `ChartHelp`, sky blue, first line of tooltip and popup; units moved into the `?`).
- **Worktree** `../arg-2056-udesa-nav` (node_modules is a junction to the main checkout); the human works in the main checkout, so do not switch branches there.

## What was done
1. `tour-nav-menu`: «Hacia el 2056» tab has a chevron and a dropdown of the slides, «0 · Índice» first (`web/src/app/TourMenu.tsx`, titles from the light `web/src/tour/menuItems.ts`, `slideTitles.ts` no longer imports the world data). Hover, click (pins) and Down arrow open it; Escape closes it.
2. `nav-gold-palette`: tokens `--nav-gold*` derived from `--intro-light` (the home «2056»); navbar, navbar logo, Andes navbar and the all-lit provinces on hover of «Hacia el 2056» use it.
3. `intro-load-lights`: during the flat load the provinces light up one by one (300 to 1300 ms), all lit when the map tilts (`loadLightPlan` in `web/src/intro/layout.ts`).
4. `PENDING.md`: removed references to the deleted `test/` prototypes; queued the slide 1 plan and these tasks.

## Rules in force
- RULE #1: tests run only in CI. No colour literals outside `tokens.css`. Main chunk budget: do not import charts or data JSON from the app shell.

## Next
- Open the PRs (human approves). Slide 1 plan: `docs/action-plan-slide1-visual.md`; next step `slide1-main-metric`, then compare countries (flags), flag + rank labels, region growth (LCN), `lead` in the other slides.
- Human: look at the menu, the gold and the intro load by eye.
