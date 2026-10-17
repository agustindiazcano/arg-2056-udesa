# Task: `polish`

Branch: `task/polish`. Several PRs, one per area (tokens and type, motion, charts, scenes, story caption, performance pass); each follows this brief. Read `AGENTS.md` (section 8: visual polish comes last), `LASTCONTEXT.md`, `PENDING.md` (the "Visual debt" lists are this task's backlog), `design.md` (binding; its open decisions are the first thing to resolve), `docs/performance.md`, `docs/release-checklist.md`, `web/src/styles/tokens.ts`, `tokens.css` and `contrast.ts`, `web/src/charts/` (builders, `EChart`, `DataTable`), every scene under `web/src/scenes/`, `web/src/story/` and the e2e suite first.
Prerequisites: the model and data tasks of `PENDING.md` are done (`AGENTS.md` section 8 forbids starting polish before), or the human explicitly starts it earlier for the scenes that exist. **Human decisions before the task starts, otherwise stop and tell me which:** the table below.

## Decisions required (the human answers; the recommendation is first)

| # | Decision | Options |
|---|---|---|
| D-polish-1 | UI language and number locale (`design.md` open decision 1) | Spanish (the likely final choice; every label, the story text, `APP_LOCALE`, `Intl` formats, `lang` on the pages) or English |
| D-polish-2 | Typeface (open decision 2) | system sans (today) or one display face, bundled (no CDN: the CSP allows `font-src 'self'` only) with its license recorded in the References page |
| D-polish-3 | The real red arm of the diverging ramp (`DIVERGING`, `--div-1..5`; a placeholder today) | the design color the human supplies (never invented) |
| D-polish-4 | The focus ring color | `--color-focus` (#ffc107, in use) or the `design.md` value #3987e5 |
| D-polish-5 | `--state-critical` as text (4.05:1 on `--page`, 3.62:1 on `--surface`, below 4.5) | a lighter critical text token (a new color, the human's) or an icon plus a different treatment |
| D-polish-6 | Motion library | GSAP (`design.md` section 5 says it arrives at polish; one new dependency at an exact version, loaded only where used) or CSS only |
| D-polish-7 | Scope of this pass | which items of the "Visual debt" lists are in; the rest stay as debt |

## Goal

Raise the look and the feel of what already works to the standard of `design.md`, without changing what it says or does. Every change is visual or motion: nothing about data, logic, keys or state may change.

Atomic commits. Before every push run `python scripts/precheck.py`. Strict TDD applies to anything with logic (formatters, token mappings, a motion timeline's values); visual changes are guarded by the existing tests, the contrast and axe checks, and screenshots.

## Out of scope (do NOT do)

- No new feature, no new chart, no change to a number or a claim on screen, no change to the `KeyAction` union, `KEY_MAP`, the store shape or the `Scene` type. No Andes art direction (that is `andes-integration` and the human's prototype).
- No color literal outside `tokens.ts` and `tokens.css`; **no color is invented**: a new color is a decision of the table above, supplied by the human, and passes the contrast tests before it is used.
- Nothing from another origin (fonts included). No `unsafe-eval`, no looser CSP. No decorative motion that ignores `prefers-reduced-motion` (the single global rule stays the only mechanism for CSS; JS motion reads `useReducedMotion`).
- No new dependency other than the one D-polish-6 may add, at an exact version, explained in the PR. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Areas (one PR each; skip what D-polish-7 leaves out)

1. **Tokens and type**: apply D-polish-1 to D-polish-5. Spacing scale (4, 8, 12, 16, 24, 32, 48) and radius (4) from `design.md` become tokens used everywhere instead of the ad hoc inline values in the scenes; buttons, chips and sliders get one consistent style that meets 3:1 for their edges and 4.5:1 for their text; the focus ring is one style for every interactive element.
2. **Motion** (`design.md` section 5): scene change as a 400 ms fade plus 24 px translate, ease-out cubic; counters and series draw-in 600 ms; no bounce or overshoot; GSAP timelines (if D-polish-6 says so) are created and killed with the component (`AGENTS.md` section 8), triggered by state and key events, never by scroll. Under reduced motion: no transition, no draw-in, the final state at once. A test per timeline checks its durations, easing names and cleanup.
3. **Charts**: the debt items for the charts (hatched fill for the no-data provinces in the choropleth as `design.md` asks, the "History | Forecast" divider and the history line in the fan, the selected-province border above its neighbours, country names instead of ISO codes where the data allows, direct labels, consistent tooltips, the home country in `ink` and peers in `muted` in the economy chart). Builders stay pure; their option structure tests are updated deliberately and the diff of each expectation is explained in the PR.
4. **Scenes**: layout, spacing and hierarchy of sandbox, economy, resources, forecast and AI scenes against `design.md` (one idea per scene: a large headline, one main chart, one supporting element); responsive behavior at 1280x720 and at phone width (no horizontal page scroll: the e2e check exists); the ranking beyond the top 10 and the selected province outside it (debt item) get a stated behavior.
5. **Story caption panel**: look and feel, larger dot hit targets (at least 24 px), the `Placeholder` tag, a collapse transition, and the panel no longer covering the bottom of the stage (it is fixed at the bottom today; the scene container already reserves `--story-panel-height`).
6. **Performance pass**: run Lighthouse on the production build and record the scores in `docs/release-checklist.md` (section 4); fix what the report names that is cheap (image sizes, layout shifts, long tasks); re-measure `npm run check:bundle` and tighten `web/budgets.json` with the human's approval; tune nothing in the quality tiers without measurements on real devices (the human supplies them).

## 2. Tests and checks

- The existing suites stay green: unit, contrast (`TEXT_PAIRS`, `TEXT_PAIRS_LARGE` extended with every new pair), lint (`jsx-a11y`), axe e2e on every scene, the CSP e2e, the keyboard and viewport specs, the bundle budgets.
- New: tokens used (a test fails on a hard-coded spacing or color in the scene files, listing the line), motion values and cleanup, reduced-motion behavior for every timeline, the no-data fill and the divider in the builders' option structures, hit-target sizes of the story dots in the e2e (bounding boxes).
- Screenshots of each scene at 1440x900 and 390x844 are attached to the PR (the e2e screenshot job already stores them) for the human's review; no pixel-diff gate is added in this task.

## 3. Acceptance checklist

- [ ] Every decision of the table answered and recorded in `docs/decisions.md`; the PR states which areas are in.
- [ ] No data, logic, key or state change; no invented color; no color literal outside the token files; nothing from another origin.
- [ ] Tests committed failing first where there is logic; all suites, contrast, axe and CSP green; `python scripts/precheck.py` passes; e2e run or "e2e not run locally". CI result read or "pushed, CI not checked".
- [ ] Reduced motion honored by every new motion; GSAP (if used) at an exact version, justified, and disposed with the component.
- [ ] `PENDING.md` "Visual debt" lists updated item by item (done or still open); `LASTCONTEXT.md` overwritten.
- [ ] PR description (per area): what changed, what was verified, screenshots, what the human must verify (the look against `design.md`, the Lighthouse scores, the new contrast numbers).
