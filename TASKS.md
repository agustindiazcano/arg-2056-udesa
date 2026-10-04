Read roadmap.md to see whats next

Every brief lives in the repository root as `<slug>.md`. The older prompts below say `docs/tasks/<slug>.md` and `docs/design.md`: they are the same files, now at the root (`<slug>.md`, `design.md`). The prompt of each task is the section named after it; the status table is "Next Steps" below.

0. audit.md  [DONE - PR #17 merged]

TARGET: <main | task slug | branch name>   (replace before sending)

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/audit.md
Then read the brief of every task in scope (docs/tasks/*.md), docs/design.md, docs/afaw-light.md and docs/model-design.md if it exists.

Then execute the audit described in docs/tasks/audit.md exactly, on TARGET.

Rules:
- Create branch `audit/<target>`. Never touch `main`, never merge, never push to `main`.
- Read-only: change no source file, test, data or config. The only file you commit is docs/audits/<target>.md. Do all experiments (mutations, temporary edits, independent recomputations) in a scratch copy and never commit them.
- Do not trust any claim from PR descriptions, LASTCONTEXT.md or PENDING.md. Verify by running commands or reading the code.
- Every finding needs evidence: file and line, or the exact command and its output. Do not report a finding without evidence.
- Report every check in the brief as passed, failed, or not applicable (with the reason).
- Do not fix anything, even trivial issues. Write each fix as one line that can be pasted into a "Helper A" prompt.
- Never claim CI is green. Say "not checked" unless you read the run status.
- If something in the brief is ambiguous, stop and ask me instead of guessing.

When finished: write the report in the format of the brief, and a PR description with the verdict, the count of findings per severity, and the three findings I should read first.


1. model-design.md  [DONE - PR #18 merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/model-design.md
Then read every file the brief lists in its first paragraph, and any file under data/raw/research/ if it exists.

Then execute the task described in docs/tasks/model-design.md exactly.

Rules:
- Create branch `task/model-design`. Never touch `main`, never merge, never push to `main`.
- This is a design task: write documentation only. No code, no schema changes, no data files, no mock data.
- Follow the brief literally, especially the five binding principles (mechanism first, parsimony, falsifiability, no ad hoc corrections, honest sourcing). Copy contract names, indicator names and file names from the repository, not from memory.
- Every parameter and every empirical claim must have a source_id from docs/sources.md or the research sources.csv files, or be marked `needs_source`, or be declared `assumption: true` with its range and reason. Never write an unsourced number as if it were sourced. Never convert between different quantities except by exact arithmetic that you spell out.
- Write the backtest success criteria now, as relations to the baselines, before any implementation exists.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Atomic commits, format `type(scope): summary` (for example `docs(model): add growth accounting section`). Run `python scripts/precheck.py` before every push; never push if it fails.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous, contradicts the repository, or needs a decision that only the human can take, list it in section 9 (open decisions) with your recommendation instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md as the brief says, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.v

2. scene-forecast.md  [DONE - PR #19 merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and chart convention)
5. docs/tasks/scene-forecast.md
Then read docs/tasks/forecast-contract.md, docs/tasks/scene-resources.md and the code that scene-resources produced (builders, EChart, DataTable, useDataset, tokens.ts).

Then execute the task described in docs/tasks/scene-forecast.md exactly.

Rules:
- Create branch `task/scene-forecast`. Never touch `main`, never merge, never push to `main`.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contract. Do not recall them from memory and do not invent colors.
- Add no dependency (echarts is already installed). If another one seems necessary, stop and ask me.
- Do not change the `KeyAction` union or `KEY_MAP`. Do not edit AGENTS.md, CLAUDE.md or GEMINI.md. Do not touch model code, schemas or the mock generator.
- If the mock forecast_output lacks a series the brief needs, stop and tell me which one. Do not invent data and do not extend the mock.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Tests must assert exact values and structures, never only "no error". Tests never write inside the real `data/` or `web/public/data/` directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify (look and feel against docs/design.md, wording of the caveat and of the p10-p90 label, mock coverage).

3. terrain-bake.md  [DONE - PR #20 merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/terrain-bake.md
Then read docs/design.md, docs/data-pipeline.md, docs/sources.md, scripts/precheck.py and .github/workflows/*.yml.

Then execute the task described in docs/tasks/terrain-bake.md exactly.

Rules:
- Create branch `task/terrain-bake`. Never touch `main`, never merge, never push to `main`.
- If the data-pipeline task is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy field names, enums, constants, formulas, tolerances and exit codes from it. Do not recall them from memory.
- The only dependencies you may add are numpy, rasterio and Pillow, pinned, in scripts/terrain/requirements.txt, used only under scripts/terrain/. No npm dependency. If anything else seems necessary, stop and ask me.
- No network access in the tool or in tests. Do not download any data. Do not commit any real DEM data or real terrain output. Do not choose bounding boxes: the example config must use obviously fake values.
- Do not touch rendering code or scenes. Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Do not fake CI: no `|| true`, no `continue-on-error`. The terrain CI job must always run.
- Tests must assert exact values, bytes, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

4. geo-provinces.md  [DONE - PR #21 merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/geo-provinces.md
Then read docs/design.md, docs/data-pipeline.md, docs/sources.md, the PROVINCES constant and the 24 province ids in web/src/types, and web/package.json.

Then execute the task described in docs/tasks/geo-provinces.md exactly.

Rules:
- Create branch `task/geo-provinces`. Never touch `main`, never merge, never push to `main`.
- If the data-pipeline task is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy field names, constants (including the earth radius), formulas, tolerances, exit codes and the list of properties from it. Do not recall them from memory.
- The only dependencies you may add are the devDependencies listed in the brief, with exact versions. No runtime dependency. If anything else seems necessary, stop and ask me.
- No network access in the tool or in tests. Do not download any data. Do not commit any real geometry or real build output. The example config must use obviously fake values.
- Do not choose the source dataset and do not decide how disputed or claimed territories are drawn: those are my decisions and go in the PR description.
- Do not touch rendering code or scenes. Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, bytes, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

5. scene-forecast-map.md  [DONE - PR #22 merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and chart convention)
5. docs/tasks/scene-forecast-map.md
Then read docs/tasks/scene-forecast.md, docs/geo.md and the code from scene-forecast, scene-resources and geo-provinces (selectors, builders, EChart, DataTable, tokens.ts, web/src/geo/, ProvinceFilter and the store reducer).

Then execute the task described in docs/tasks/scene-forecast-map.md exactly.

Rules:
- Create branch `task/scene-forecast-map`. Never touch `main`, never merge, never push to `main`.
- If scene-forecast or geo-provinces is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them. Do not recall them from memory and do not invent colors.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union or `KEY_MAP`. Use only store actions that already exist; if selecting a province needs one that does not, stop and tell me.
- Do not fabricate geometry except tiny hand-built test fixtures. If the real geometry files are absent, the scene must show the fallback described in the brief and not crash.
- Do not touch model code, schemas, the mock generator or the geometry build tool. Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0, nor as the low end of the color scale.
- Tests must assert exact values and structures, never only "no error". Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

6. scene-economy.md  [DONE - PR #23 merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and chart convention)
5. docs/tasks/scene-economy.md
Then read docs/data-dictionary.md, data/schemas/economy_series.schema.json, data/mock/economy_series.json, docs/tasks/scene-resources.md, docs/tasks/scene-forecast.md and the code they produced (builders, EChart, DataTable, useDataset, formatValue, tokens.ts, the store).

Then execute the task described in docs/tasks/scene-economy.md exactly.

Rules:
- Create branch `task/scene-economy`. Never touch `main`, never merge, never push to `main`.
- If scene-forecast or scene-resources is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the schema. Do not recall them from memory and do not invent colors.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union or `KEY_MAP`. Use only store actions that already exist.
- If the mock economy_series lacks something the brief needs (countries, years from 1880, indicators), stop and tell me exactly what is missing. Do not invent data and do not extend the mock.
- Do not write any real historical claim: the era list is placeholders only, as the brief says.
- Do not touch schemas, the mock generator or model code. Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Tests must assert exact values and structures, never only "no error". Tests never write inside the real data/ or web/public/data/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

7. scene-sandbox.md  [DONE - merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and chart convention)
5. docs/tasks/scene-sandbox.md
Then read docs/tasks/forecast-contract.md, docs/tasks/scene-forecast.md and the code from shell, scene-resources and scene-forecast (store, useKeyboard, selectors, builders, EChart, DataTable, useDataset, formatValue, tokens.ts).

Then execute the task described in docs/tasks/scene-sandbox.md exactly.

Rules:
- Create branch `task/scene-sandbox`. Never touch `main`, never merge, never push to `main`.
- If shell or scene-forecast is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy formulas, constants, bounds, colors, token names and field names from them and from the contract. Do not recall them from memory and do not invent colors.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union, `KEY_MAP` or the store shape. The sandbox state is local to the scene.
- If useKeyboard does not ignore events from input elements, stop and tell me. Do not change the shell in this PR.
- If the mock forecast_output lacks something the brief needs, stop and tell me exactly what. Do not invent data and do not extend the mock.
- Do not implement any simulation, randomness or economic model: only the exact arithmetic described in the brief.
- Do not touch schemas, the mock generator or model code. Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Tests must assert exact values and structures, never only "no error". Tests never write inside the real data/ or web/public/data/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

- Next Steps (status of every task; the brief and the prompt exist for all of them):

Legend: DONE = merged. READY = can start now. BLOCKED = needs the human input named in the last column.

| # | Slug | Status | Needs |
|---|---|---|---|
| | **Done, with a brief** | | |
| 1 | contract, forecast-contract, precheck, mock-data, shell, composition-contract, projections-contract, scene-resources, data-pipeline, research-contracts, model-design, audit, scene-forecast, terrain-bake, geo-provinces, scene-forecast-map, scene-economy, scene-sandbox, references-page, storytelling-substeps, integration | DONE | |
| 2 | performance-a11y | DONE (PR #29) | |
| 3 | deploy | DONE (PR #34, host: Vercel) | first deploy and `smoke_deployed.py` by the human |
| | **Done, outside the briefs** (no brief; each one is a PR) | | |
| 4 | vercel-config, vercel-python-venv (PRs #30, #31) | DONE | |
| 5 | vercel-analytics (PR #32): Vercel Web Analytics and Speed Insights | DONE | enable both in the Vercel project |
| 6 | visits-archive (PR #33): weekly archive of the analytics and the Visits section | DONE | secrets, Actions permission and one manual run (`docs/visits.md`) |
| | **Model (order of `docs/model-design.md` section 8)** | | |
| 7 | model-params | READY | (`D-res-3` decided: ten value-added constants, 35 entries) |
| 8 | model-population-hardening | READY | |
| 9 | population-age-contract | READY | |
| 10 | model-population-drivers | BLOCKED | model-params, model-population-hardening, population-age-contract merged |
| 11 | model-growth-core | BLOCKED | model-params, model-population-hardening merged |
| 12 | model-hdi | BLOCKED | model-params, model-population-drivers, model-growth-core merged; goalposts are needs_source |
| 13 | model-resources | BLOCKED | model-params merged |
| 14 | model-ai-overlay | BLOCKED | model-params merged |
| 15 | model-montecarlo | BLOCKED | tasks 10 to 14 merged; real runs also need parameter values |
| 16 | backtest-baselines | READY | (real runs need the series of task 24) |
| 17 | backtest-run | BLOCKED | model-montecarlo, backtest-baselines, real series 1990 to 2025 verified |
| 18 | sensitivity | BLOCKED | model-montecarlo (the published result needs real ranges) |
| 19 | model-provinces | BLOCKED | model-montecarlo |
| 20 | model-ts-port (optional) | BLOCKED | model-growth-core, model-ai-overlay (and drivers, hdi for the full port) |
| | **Scenes** | | |
| 21 | scene-ai-revolution | READY | |
| 22 | andes-integration | PARTIAL (first cut, PR open) | scene works on a made-up terrain; real terrain outputs committed still needed (D-andes-1 to D-andes-4 decided) |
| 23 | scene-forecast-map-3d | SUPERSEDED | replaced by presentation-3d |
| 23b | presentation-3d (six PRs) | IN PROGRESS | F2b merged, D-3d-1 to D-3d-6 decided (3D first), real province geometry done |
| 23c | map-navigation | DONE (PR open) | (3D first, D-3d-6) zoom, pan and reset on 2D maps; free orbit, pan, zoom and reset on 3D |
| 23d | fullscreen-viewer | READY | better after map-navigation: big-view popup with carousel, name, filters and statistics |
| | **Real data** | | |
| 24 | data-economy-population | BLOCKED | research files, my verification, population-age-contract merged (D-gdp-1 decided) |
| 25 | data-resources | BLOCKED | research files (mining, energy, agro) and my verification |
| 26 | data-andes | BLOCKED | research files (Andes) and my verification |
| 27 | data-research-inputs | BLOCKED | research files, their documented format and my verification |
| | **Quality and delivery** | | |
| 28 | mutation-testing (optional) | READY | |
| 29 | polish | DECIDED | D-polish-3 color from the human; model and data tasks done, unless the human starts it earlier (3D first, D-3d-6) |
| 30 | docs-submission | BLOCKED | the contest's rules (table in the brief); backtest-run |
| 31 | demo-video (optional) | BLOCKED | what the contest requires |

8. references-page.md  [DONE - merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color and typographic convention)
5. docs/tasks/references-page.md
Then read docs/data-pipeline.md, docs/data-dictionary.md, docs/terrain.md, docs/geo.md, scripts/datapipe/sources.py, data/schemas/sources.schema.json, scripts/precheck.py, web/package.json, web/vite.config.ts and the shell code (layout, Hud, MockBadge).

Then execute the task described in docs/tasks/references-page.md exactly.

Rules:
- Create branch `task/references-page`. Never touch `main`, never merge, never push to `main`.
- If shell or data-pipeline is not merged into main, or scripts/datapipe/sources.py lacks the URL normalization and source registry, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy field names, enums, exit codes, message formats and the citation format from them. Do not recall them from memory and do not invent colors.
- Add no dependency, in Python or in npm. Reuse the URL normalization from datapipe.sources; do not re-implement it.
- Do not change the `Scene` type, the store, `KeyAction` or `KEY_MAP`. The only shell change allowed is one footer link, with a test.
- Do not invent sources or data. With mock data the page must show its empty state.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

9. storytelling-substeps.md  [DONE - merged]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/storytelling-substeps.md
Then read docs/tasks/shell.md and the shell code (store reducer and its tests, KeyAction, KEY_MAP, useKeyboard, TabBar, Hud, MockBadge, the Scene, Year and Scenario types, PROVINCES). Read the scene code only to see which store fields each scene reads.

Then execute the task described in docs/tasks/storytelling-substeps.md exactly.

Rules:
- Create branch `task/storytelling-substeps`. Never touch `main`, never merge, never push to `main`.
- If shell, scene-resources, scene-forecast or scene-sandbox is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy field names, action names, keys, tolerances and message formats from them. Do not recall them from memory and do not invent colors.
- Add no dependency. If one seems necessary, stop and ask me.
- This task may extend `KeyAction` and `KEY_MAP` only with PageDown, PageUp and Home as the brief says. Every existing entry must keep its meaning, and a test must prove it.
- All state changes from step navigation must be computed atomically in the reducer.
- Write no real story text and no real historical or economic claim: all step content is placeholder, flagged `placeholder: true`.
- Do not add campaign-day control, scene-local controls, touch gestures or presenter mode.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Tests must assert exact values and full state objects, never only "no error". Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

10. integration.md  [DONE - merged, PR #28]

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/integration.md
Then read docs/design.md, docs/afaw-light.md, docs/data-pipeline.md, scripts/precheck.py, .github/workflows/*.yml, web/package.json, web/vite.config.ts, scripts/check_data_budget.py, the shell code (store, KEY_MAP, TabBar, Hud, MockBadge, scene registry), web/src/data/useDataset.ts and the parsers in web/src/types/.

Then execute the task described in docs/tasks/integration.md exactly.

Rules:
- Create branch `task/integration`. Never touch `main`, never merge, never push to `main`.
- If any prerequisite task listed in the brief is not merged into main, stop and tell me which.
- Strict TDD where it applies (library and script code): commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy constants, file names, exit codes, budgets formulas and message formats from it. Read real labels, ids, YEARS_PER_SECOND and SPEEDS from the code, not from memory.
- The only dependency you may add is `@playwright/test` (devDependency, exact version). If another seems necessary, stop and ask me.
- Do not change application behavior or refactor scenes. Add the smallest possible `data-testid` only where no semantic locator exists, and list each one in the PR description.
- Do not put the browser suite in scripts/precheck.py; it runs in CI.
- If you cannot run Chromium in your environment, say "e2e not run locally" in LASTCONTEXT.md and in the PR. Never claim the suite passes unless you ran it or read the CI run.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. No `continue-on-error`, no `|| true`. If a checker complains, fix the cause.
- Tests must assert exact values, texts, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.

11.

Prerequisite: `composition-contract` merged. Run it BEFORE `scene-resources`.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/projections-contract.md
Then read docs/tasks/composition-contract.md; docs/sources.md.
 
Then execute the task described in docs/tasks/projections-contract.md exactly.
 
Rules:
- Create branch `task/projections-contract`. Never touch `main`, never merge, never push to `main`.
- If composition-contract is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy enums, field names, patterns and rules from it. Do not recall them from memory.
- Do not add any dependency, in Python or in npm. The mock generator stays Python standard library only and stays deterministic. Type the TS parsers with `ajv.compile<T>()`.
- No UI, no model code, no real data. Keep `production_actual` out of this dataset.
- Do not fake CI: no `|| true`, no `continue-on-error`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## data-pipeline (framework only)
 
Prerequisite: `shell`, `composition-contract` and `projections-contract` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/data-pipeline.md
Then read docs/data-dictionary.md; docs/sources.md; scripts/validate_data.py, scripts/dataset_checks.py, scripts/gen_mock.py, scripts/check_no_mock.py, scripts/precheck.py and the sync-mock script.
 
Then execute the task described in docs/tasks/data-pipeline.md exactly.
 
Rules:
- Create branch `task/data-pipeline`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy field names, enums, exit codes, budget constants and message formats from it. Do not recall them from memory.
- Do not add any dependency, in Python or in npm. No network access anywhere in the pipeline or its tests.
- Do not process or commit any real data. Keep the existing tests of the scripts you change passing.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## research-contracts
 
Prerequisite: `projections-contract` and `data-pipeline` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/research-contracts.md
Then read docs/data-dictionary.md; docs/research-prompts.md (scopes 5 and 6, the output field lists); scripts/validate_data.py, scripts/dataset_checks.py, scripts/gen_mock.py, scripts/check_no_mock.py.
 
Then execute the task described in docs/tasks/research-contracts.md exactly.
 
Rules:
- Create branch `task/research-contracts`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy field names, enums, patterns, tolerances and message formats from it. Do not recall them from memory.
- Do not add any dependency, in Python or in npm. The mock generator stays Python standard library only and stays deterministic. Type the TS parsers with `ajv.compile<T>()`.
- Do not compute averages, errors, trends or conversions between metrics anywhere. The only arithmetic allowed is the compounding verification described in the brief.
- Do not process or commit any real data.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-design (design document only, no code)
 
Prerequisite: none. Run it with the strongest model available.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/model-design.md
Then read docs/afaw-light.md, docs/data-dictionary.md, docs/sources.md, docs/research-prompts.md, docs/tasks/forecast-contract.md, the schemas in data/schemas/, and any file under data/raw/research/ if it exists.
 
Then execute the task described in docs/tasks/model-design.md exactly.
 
Rules:
- Create branch `task/model-design`. Never touch `main`, never merge, never push to `main`.
- Atomic commits, format `type(scope): summary` (for example `docs(model): add growth accounting section`).
- This is a design task: write documentation only. No code, no schema changes, no data files, no mock data.
- Follow the brief literally, especially the five binding principles (mechanism first, parsimony, falsifiability, no ad hoc corrections, honest sourcing). Copy contract names, indicator names and file names from the repository, not from memory.
- Every parameter and every empirical claim must have a source_id from docs/sources.md or the research sources.csv files, or be marked `needs_source`, or be declared `assumption: true` with its range and reason. Never write an unsourced number as if it were sourced. Never convert between different quantities except by exact arithmetic that you spell out.
- Write the backtest success criteria now, as relations to the baselines, before any implementation exists.
- If the brief is ambiguous, contradicts the repository, or needs a decision only the human can take, list it in section 9 (open decisions) with your recommendation instead of guessing.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## audit
 
Prerequisite: none. Replace TARGET before sending. Use a different model from the one that wrote the code when possible.
 
```
You are working in the repository `argentina-2056`. You are an independent reviewer, not an implementer.
 
TARGET: <main | task slug | branch name>   (replace before sending)
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/audit.md
Then read the brief of every task in scope (docs/tasks/*.md), docs/design.md, docs/afaw-light.md and docs/model-design.md if it exists.
 
Then execute the audit described in docs/tasks/audit.md exactly, on TARGET.
 
Rules:
- Create branch `audit/<target>`. Never touch `main`, never merge, never push to `main`.
- Read-only: change no source file, test, data or config. The only file you commit is docs/audits/<target>.md. Do all experiments (mutations, temporary edits, independent recomputations) in a scratch copy and never commit them.
- Do not trust any claim from PR descriptions, LASTCONTEXT.md or PENDING.md. Verify by running commands or reading the code.
- Every finding needs evidence: file and line, or the exact command and its output. Do not report a finding without evidence.
- Report every check in the brief as passed, failed, or not applicable (with the reason).
- Do not fix anything, even trivial issues. Write each fix as one line that can be pasted into a "Helper A" prompt.
- Never claim CI is green. Say "not checked" unless you read the run status.
- If something in the brief is ambiguous, stop and ask me instead of guessing.
 
When finished: write the report in the format of the brief, and a PR description with the verdict, the count of findings per severity, and the three findings I should read first.
```
 
---
 
## scene-forecast
 
Prerequisite: `shell`, `forecast-contract`, `mock-data` and `scene-resources` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/scene-forecast.md
Then read docs/tasks/forecast-contract.md, docs/tasks/scene-resources.md and the code scene-resources produced (builders, EChart, DataTable, useDataset, tokens.ts).
 
Then execute the task described in docs/tasks/scene-forecast.md exactly.
 
Rules:
- Create branch `task/scene-forecast`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contracts. Do not recall them from memory and do not invent colors.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Add no dependency (echarts is already installed). If another one seems necessary, stop and ask me.
- Do not change the `KeyAction` union or `KEY_MAP`. Do not touch model code, schemas or the mock generator.
- If the mock forecast_output lacks a series the brief needs, stop and tell me which one. Do not invent data and do not extend the mock.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## terrain-bake
 
Prerequisite: `data-pipeline` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/terrain-bake.md
Then read docs/design.md, docs/data-pipeline.md, docs/sources.md, scripts/precheck.py and .github/workflows/*.yml.
 
Then execute the task described in docs/tasks/terrain-bake.md exactly.
 
Rules:
- Create branch `task/terrain-bake`. Never touch `main`, never merge, never push to `main`.
- If the data-pipeline task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy field names, enums, constants, formulas, tolerances and exit codes from it. Do not recall them from memory.
- The only dependencies you may add are numpy, rasterio and Pillow, pinned, in scripts/terrain/requirements.txt, used only under scripts/terrain/. No npm dependency. If anything else seems necessary, stop and ask me.
- No network access in the tool or in tests. Do not download any data. Do not commit any real DEM data or real terrain output. Do not choose bounding boxes: the example config must use obviously fake values.
- Do not touch rendering code or scenes. Do not fake CI: the terrain CI job must always run.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## geo-provinces
 
Prerequisite: `data-pipeline` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/geo-provinces.md
Then read docs/design.md, docs/data-pipeline.md, docs/sources.md, the PROVINCES constant and the 24 province ids in web/src/types, and web/package.json.
 
Then execute the task described in docs/tasks/geo-provinces.md exactly.
 
Rules:
- Create branch `task/geo-provinces`. Never touch `main`, never merge, never push to `main`.
- If the data-pipeline task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy field names, constants (including the earth radius), formulas, tolerances, exit codes and the list of properties from it. Do not recall them from memory.
- The only dependencies you may add are the devDependencies listed in the brief, with exact versions. No runtime dependency. If anything else seems necessary, stop and ask me.
- No network access in the tool or in tests. Do not download any data. Do not commit any real geometry or real build output. The example config must use obviously fake values.
- Do not choose the source dataset and do not decide how disputed or claimed territories are drawn: those are my decisions and go in the PR description.
- Do not touch rendering code or scenes.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## scene-forecast-map
 
Prerequisite: `scene-forecast` and `geo-provinces` merged. The manual check needs the real geometry committed by the human.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/scene-forecast-map.md
Then read docs/tasks/scene-forecast.md, docs/geo.md and the code from scene-forecast, scene-resources and geo-provinces (selectors, builders, EChart, DataTable, tokens.ts, web/src/geo/, ProvinceFilter and the store reducer).
 
Then execute the task described in docs/tasks/scene-forecast-map.md exactly.
 
Rules:
- Create branch `task/scene-forecast-map`. Never touch `main`, never merge, never push to `main`.
- If scene-forecast or geo-provinces is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contracts. Do not recall them from memory and do not invent colors.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union or `KEY_MAP`. Use only store actions that already exist; if selecting a province needs one that does not, stop and tell me.
- Do not fabricate geometry except tiny hand-built test fixtures. If the real geometry files are absent, the scene must show the fallback described in the brief and not crash.
- Missing data must also never be painted as the low end of the color scale.
- Do not touch model code, schemas, the mock generator or the geometry build tool.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## scene-economy
 
Prerequisite: `shell`, `mock-data`, `scene-resources` and `scene-forecast` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/scene-economy.md
Then read docs/data-dictionary.md, data/schemas/economy_series.schema.json, data/mock/economy_series.json, docs/tasks/scene-resources.md, docs/tasks/scene-forecast.md and the code they produced.
 
Then execute the task described in docs/tasks/scene-economy.md exactly.
 
Rules:
- Create branch `task/scene-economy`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contracts. Do not recall them from memory and do not invent colors.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union or `KEY_MAP`. Use only store actions that already exist.
- If the mock economy_series lacks something the brief needs (countries, years from 1880, indicators), stop and tell me exactly what is missing. Do not invent data and do not extend the mock.
- Do not write any real historical claim: the era list is placeholders only, as the brief says.
- Do not touch schemas, the mock generator or model code.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## scene-sandbox
 
Prerequisite: `shell` and `scene-forecast` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/scene-sandbox.md
Then read docs/tasks/forecast-contract.md, docs/tasks/scene-forecast.md and the code from shell, scene-resources and scene-forecast (store, useKeyboard, selectors, builders, EChart, DataTable, useDataset, formatValue, tokens.ts).
 
Then execute the task described in docs/tasks/scene-sandbox.md exactly.
 
Rules:
- Create branch `task/scene-sandbox`. Never touch `main`, never merge, never push to `main`.
- If shell or scene-forecast is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contracts. Do not recall them from memory and do not invent colors.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Missing data (`null`) must never be rendered as 0 anywhere.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union, `KEY_MAP` or the store shape. The sandbox state is local to the scene.
- If useKeyboard does not ignore events from input elements, stop and tell me. Do not change the shell in this PR.
- If the mock forecast_output lacks something the brief needs, stop and tell me exactly what. Do not invent data and do not extend the mock.
- Do not implement any simulation, randomness or economic model: only the exact arithmetic described in the brief.
- Do not touch schemas, the mock generator or model code.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## references-page
 
Prerequisite: `shell` and `data-pipeline` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/references-page.md
Then read docs/data-pipeline.md, docs/data-dictionary.md, docs/terrain.md, docs/geo.md, scripts/datapipe/sources.py, data/schemas/sources.schema.json, scripts/precheck.py, web/package.json, web/vite.config.ts and the shell code (layout, Hud, MockBadge).
 
Then execute the task described in docs/tasks/references-page.md exactly.
 
Rules:
- Create branch `task/references-page`. Never touch `main`, never merge, never push to `main`.
- If shell or data-pipeline is not merged into main, or scripts/datapipe/sources.py lacks the URL normalization and source registry, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contracts. Do not recall them from memory and do not invent colors.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Follow the brief and docs/design.md literally. Copy field names, enums, exit codes, message formats and the citation format from them. Do not recall them from memory and do not invent colors.
- Add no dependency, in Python or in npm. Reuse the URL normalization from datapipe.sources; do not re-implement it.
- Do not change the `Scene` type, the store, `KeyAction` or `KEY_MAP`. The only shell change allowed is one footer link, with a test.
- Do not invent sources or data. With mock data the page must show its empty state.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## storytelling-substeps
 
Prerequisite: `shell`, `scene-resources`, `scene-forecast` and `scene-sandbox` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/storytelling-substeps.md
Then read docs/tasks/shell.md and the shell code (store reducer and its tests, KeyAction, KEY_MAP, useKeyboard, TabBar, Hud, MockBadge, the Scene, Year and Scenario types, PROVINCES). Read the scene code only to see which store fields each scene reads..
 
Then execute the task described in docs/tasks/storytelling-substeps.md exactly.
 
Rules:
- Create branch `task/storytelling-substeps`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite task is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy colors, token names, field names and chart conventions from them and from the contracts. Do not recall them from memory and do not invent colors.
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Follow the brief and docs/design.md literally. Copy field names, action names, keys, tolerances and message formats from them. Do not recall them from memory and do not invent colors.
- Add no dependency. If one seems necessary, stop and ask me.
- This task may extend `KeyAction` and `KEY_MAP` only with PageDown, PageUp and Home as the brief says. Every existing entry must keep its meaning, and a test must prove it.
- All state changes from step navigation must be computed atomically in the reducer.
- Write no real story text and no real historical or economic claim: all step content is placeholder, flagged `placeholder: true`.
- Do not add campaign-day control, scene-local controls, touch gestures or presenter mode.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## integration
 
Prerequisite: `shell`, `scene-resources`, `scene-forecast`, `scene-economy`, `scene-sandbox`, `storytelling-substeps`, `references-page` and `data-pipeline` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/integration.md
Then read docs/design.md, docs/afaw-light.md, docs/data-pipeline.md, scripts/precheck.py, .github/workflows/*.yml, web/package.json, web/vite.config.ts, scripts/check_data_budget.py, the shell code (store, KEY_MAP, TabBar, Hud, MockBadge, scene registry), web/src/data/useDataset.ts and the parsers in web/src/types/.
 
Then execute the task described in docs/tasks/integration.md exactly.
 
Rules:
- Create branch `task/integration`. Never touch `main`, never merge, never push to `main`.
- If any prerequisite task listed in the brief is not merged into main, stop and tell me which.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy constants, file names, exit codes, budget formulas and message formats from it. Read real labels, ids, YEARS_PER_SECOND and SPEEDS from the code, not from memory.
- The only dependency you may add is `@playwright/test` (devDependency, exact version). If another seems necessary, stop and ask me.
- Do not change application behavior or refactor scenes. Add the smallest possible `data-testid` only where no semantic locator exists, and list each one in the PR description.
- Do not put the browser suite in scripts/precheck.py; it runs in CI.
- If you cannot run Chromium in your environment, say "e2e not run locally" in LASTCONTEXT.md and in the PR. Never claim the suite passes unless you ran it or read the CI run.
- No `continue-on-error`, no `|| true`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## performance-a11y
 
Prerequisite: `integration` merged (`performance-a11y` and `deploy` come after it).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/performance-a11y.md
Then read docs/afaw-light.md, docs/release-checklist.md, web/budgets.json, web/vite.config.ts, web/package.json, web/playwright.config.ts, the e2e suite, web/src/charts/EChart.tsx and its tests, every chart builder, the scene registry, tokens.css and tokens.ts.
 
Then execute the task described in docs/tasks/performance-a11y.md exactly.
 
Rules:
- Create branch `task/performance-a11y`. Never touch `main`, never merge, never push to `main`.
- If integration is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and docs/design.md literally. Copy constants, thresholds, rule lists and message formats from the brief. Do not recall them from memory.
- The only dependencies you may add are `@axe-core/playwright` and `eslint-plugin-jsx-a11y` (devDependencies, exact versions). If another seems necessary, stop and ask me.
- Do not change colors, spacing or typography. If a contrast check fails, stop and tell me which token pair and which ratio; do not fix it yourself.
- Do not change the `KeyAction` union, `KEY_MAP` or the store shape. Do not add Andes scene work or particle code.
- Do not disable any lint rule or accessibility rule. Every axe exception needs an explicit entry with a reason.
- If you cannot run Chromium in your environment, say "e2e not run locally" in LASTCONTEXT.md and in the PR. Never claim the suite passes unless you ran it or read the CI run.
- No `continue-on-error`, no `|| true`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## deploy
 
Prerequisite: `integration` and `references-page` merged; `performance-a11y` should be merged first.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/design.md   (binding for every color, spacing and typographic convention)
5. docs/tasks/deploy.md
Then read docs/release-checklist.md, web/vite.config.ts, web/package.json, web/index.html, web/references.html, web/src/data/useDataset.ts and its tests, web/src/data/registry.ts, .github/workflows/*.yml, the release gate (`build:release`) and the content gate for `placeholder: true`.
 
Then execute the task described in docs/tasks/deploy.md exactly.
 
Rules:
- Create branch `task/deploy`. Never touch `main`, never merge, never push to `main`.
- If integration or references-page is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy header values, directives, constants, exit codes and message formats from it. Do not recall them from memory.
- Add no npm dependency. The Vite plugin is written inline in vite.config.ts. Python code uses the standard library only.
- No analytics, trackers, cookies or third-party scripts, fonts or embeds. No secrets, tokens or credentials anywhere.
- Do not generate or fabricate the preview image, favicon, description or final URL: they are human deliverables and the release gates must fail while they are missing or placeholder.
- If a scene needs a looser CSP directive, stop and tell me; do not loosen the policy silently.
- No `continue-on-error`, no `|| true`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## mutation-testing (optional)
 
Prerequisite: `integration` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs/tasks/mutation-testing.md
Then read docs/afaw-light.md, scripts/precheck.py, .github/workflows/*.yml, web/package.json, the Vitest configuration and the pyproject or pytest configuration.
 
Then execute the task described in docs/tasks/mutation-testing.md exactly.
 
Rules:
- Create branch `task/mutation-testing`. Never touch `main`, never merge, never push to `main`.
- If integration is not merged into main, stop and tell me.
- Strict TDD where it applies: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief literally. Copy scopes, thresholds, exit codes and file names from it. Do not recall them from memory.
- The only dependencies you may add are Python `mutmut` (pinned) and npm devDependencies `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` (exact versions). If another seems necessary, stop and ask me.
- Do not change application code or existing tests in this PR. Record weak tests in the report instead.
- scripts/mutation.py must never exit 0 when a mutation tool did not run.
- If you cannot run the mutation tools in your environment, say "mutation not run" in LASTCONTEXT.md and in the PR and use the empty baseline described in the brief.
- No `continue-on-error`, no `|| true`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-params
 
Prerequisite: `model-design` merged. `D-res-3` is decided (human, 2026-10-04): ten value-added constants, 35 entries in all.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-params.md   (the brief, in the repository root)
Then read docs/model-design.md (every parameter table, sections 2, 3, 4 and 7), docs/assumptions.md, docs/decisions.md, scripts/precheck.py, pytest.ini and model/src/argmodel/population/.
 
Then execute the task described in model-params.md exactly.
 
Rules:
- Create branch `task/model-params`. Never touch `main`, never merge, never push to `main`.
- If model-design is not merged into main, stop and tell me. `D-res-3` is decided (ten): apply it as the brief says.
- Strict TDD: commit each failing test first, then the code that makes it pass.
- Follow the brief literally. Copy ids, ranges, units and roles from docs/model-design.md, not from memory. Never invent a value, a range or a source_id: an entry the design marks needs_source has `value: null`.
- No new dependency. No model equations, no random draws.
- Record decision `D-params-1` in docs/decisions.md as the brief says and tell me in the PR.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-population-hardening
 
Prerequisite: none (the cohort step and its TypeScript port are merged).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-population-hardening.md   (the brief, in the repository root)
Then read docs/audits/main.md (F5, F8, F9), docs/model-design.md section 2.1 and D-pop-1, model/src/argmodel/population/cohort.py, web/src/model-ts/population.ts, model/tests/test_population.py, web/tests/parity/population.test.ts, model/parity/gen_parity.py and model/parity/population_parity.json.
 
Then execute the task described in model-population-hardening.md exactly.
 
Rules:
- Create branch `task/model-population-hardening`. Never touch `main`, never merge, never push to `main`.
- Strict TDD: every behavior starts as a failing test.
- Do not change the equations, the signatures or the results for valid input. The golden file stays byte-identical for valid cases.
- Python and TypeScript must throw the same message text for the same invalid input (the table in the brief).
- Negative cohorts: raise (D-pop-1 recommendation) unless I told you otherwise. Never clamp silently.
- No new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## population-age-contract
 
Prerequisite: none.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. population-age-contract.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.1 and D-data-1, docs/data-dictionary.md, docs/data-pipeline.md, data/schemas/population.schema.json, scripts/dataset_checks.py, scripts/gen_mock.py, scripts/validate_data.py, web/src/types/, web/src/data/registry.ts, composition-contract.md and research-contracts.md.
 
Then execute the task described in population-age-contract.md exactly.
 
Rules:
- Create branch `task/population-age-contract`. Never touch `main`, never merge, never push to `main`.
- Strict TDD where it applies: commit each failing test first, then the code.
- Contract only: schemas, checks, a deterministic mock, TypeScript parsers. No real data, no model code, no UI.
- Copy field names, enums and conventions from the repository, not from memory. The mock generator stays Python standard library only and deterministic. No new dependency.
- Run `npm run gen:validators` in web/ after adding schema names and commit the generated file.
- Stay inside the data budget; do not change the existing contracts.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-population-drivers
 
Prerequisite: `model-params`, `model-population-hardening` and `population-age-contract` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-population-drivers.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.1 (binding), sections 5 and 7, docs/assumptions.md, docs/decisions.md, docs/params.md, model/params/params.json, model/src/argmodel/params/, model/src/argmodel/population/cohort.py and the schemas and mock of population-age-contract.
 
Then execute the task described in model-population-drivers.md exactly.
 
Rules:
- Create branch `task/model-population-drivers`. Never touch `main`, never merge, never push to `main`.
- If model-params, model-population-hardening or population-age-contract is not merged into main, stop and tell me.
- Strict TDD: hand-computed cases before code.
- Do not change `step_population` or `project_population`. No random draws, no Monte Carlo, no scenarios, no calibration on real data.
- Every parameter comes from the params loader; no literal parameter in the code (the brief's grep test).
- Do not clamp negative cohorts (D-pop-1: the step raises). No new dependency.
- Add the working-age definition (15 to 64) to docs/assumptions.md as the brief says.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-growth-core
 
Prerequisite: `model-params` and `model-population-hardening` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-growth-core.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.2 (binding), sections 2.3 and 2.5 for how the resource block and the AI term attach, sections 5 and 7, docs/assumptions.md, docs/decisions.md, docs/params.md, model/params/params.json and model/src/argmodel/.
 
Then execute the task described in model-growth-core.md exactly.
 
Rules:
- Create branch `task/model-growth-core`. Never touch `main`, never merge, never push to `main`.
- If model-params or model-population-hardening is not merged into main, stop and tell me.
- Strict TDD: hand-computed cases and property tests before code.
- No human capital (D-growth-1), no resource data, no AI estimates (the AI term is an input array), no randomness, no calibration.
- No literal parameter in the code. K_0 and participation have no source: they are arguments and gaps to report. No new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-hdi
 
Prerequisite: `model-params`, `model-population-drivers` and `model-growth-core` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-hdi.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.6 (binding) and D-hdi-1, docs/assumptions.md, docs/params.md, model/params/params.json, model/src/argmodel/params/, docs/population-model.md and docs/growth-model.md.
 
Then execute the task described in model-hdi.md exactly.
 
Rules:
- Create branch `task/model-hdi`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite is not merged into main, stop and tell me which.
- Strict TDD: a hand-computed index before code.
- Do not invent the goalposts: they are needs_source arguments with no default in the code. No provincial HDI, no time trend on hdi, no clipping unless the design says so.
- No new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-resources
 
Prerequisite: `model-params` merged (works on the mock data and the assumption values).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-resources.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.3 (binding), sections 4 and 5, docs/assumptions.md, docs/decisions.md, docs/params.md, model/params/params.json, docs/data-dictionary.md, the schemas and mocks of projects, production_projections and resource_production.
 
Then execute the task described in model-resources.md exactly.
 
Rules:
- Create branch `task/model-resources`. Never touch `main`, never merge, never push to `main`.
- If model-params is not merged into main, stop and tell me.
- Strict TDD: every mechanism has a hand-computed case before code.
- The block is additive and separate (D-res-1): capex never enters K (D-res-2) and guidance or forecast projection rows are never added to the simulated output. The reserve constraint stays inactive and is reported as such.
- Parameters without a source are arguments with no default. No price model, no random draws, no new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-ai-overlay
 
Prerequisite: `model-params` merged; `model-growth-core` should be merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-ai-overlay.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.5 (binding) and D-ai-1, D-ai-2, docs/assumptions.md, docs/params.md, model/params/params.json, docs/data-dictionary.md (ai_estimates), data/schemas/ai_estimates.schema.json, web/src/types/research.ts and gen_ai_estimates in scripts/gen_mock.py.
 
Then execute the task described in model-ai-overlay.md exactly.
 
Rules:
- Create branch `task/model-ai-overlay`. Never touch `main`, never merge, never push to `main`.
- If model-params is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first.
- Only the two admissible quantities enter (tfp_growth_pp_per_year and tfp_level_gain_pct_cumulative through its validated annualization). Never convert or average other metrics; nothing is dropped silently.
- If no admissible record exists the overlay is not produced. The overlay is independent of the scenario and not backtestable: say so in the docs.
- No random draws here, no UI, no new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-montecarlo
 
Prerequisite: `model-population-drivers`, `model-growth-core`, `model-hdi`, `model-resources` and `model-ai-overlay` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-montecarlo.md   (the brief, in the repository root)
Then read docs/model-design.md section 4 (binding) and sections 1, 5 and 7, docs/assumptions.md, docs/decisions.md, docs/params.md, model/params/params.json, the docs of every component task, data/schemas/forecast_output.schema.json, scripts/forecast_checks.py and data/mock/forecast_output.json.
 
Then execute the task described in model-montecarlo.md exactly.
 
Rules:
- Create branch `task/model-montecarlo`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite is not merged into main, stop and tell me which.
- Strict TDD: commit each failing test first.
- No new mechanism, no tuning, no multiplicative correction. A parameter without a value or range stops the run; never fill it.
- Same seed gives byte-identical output; the same random numbers are reused for ai_overlay on and off and for all geographies. No wall clock, no global random state, no new dependency.
- If turning p10 and p90 into the triangular distribution needs a choice the design does not make, stop and tell me.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## backtest-baselines
 
Prerequisite: none for the code (written and tested on synthetic series and the mock); real runs wait for the series of data-economy-population.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. backtest-baselines.md   (the brief, in the repository root)
Then read docs/model-design.md section 5 (binding) and D-bt-1, docs/decisions.md, docs/data-dictionary.md, the economy_series, population and external_forecasts schemas, web/src/types/economy.ts, scripts/dataset_checks.py and model/backtest/.
 
Then execute the task described in backtest-baselines.md exactly.
 
Rules:
- Create branch `task/backtest-baselines`. Never touch `main`, never merge, never push to `main`.
- Strict TDD: commit each failing test first.
- The test window can never be read by any fit (the slicing test of the brief). Do not run the model and do not write the report (that is backtest-run).
- Do not change the criteria C1 to C5 or their numbers. ARIMA is implemented by conditional least squares with numpy; no statsmodels, no new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## backtest-run
 
Prerequisite: `model-montecarlo` and `backtest-baselines` merged, and the real series of data-economy-population for 1990 to 2025 committed and verified by me.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. backtest-run.md   (the brief, in the repository root)
Then read docs/model-design.md section 5 (binding), docs/decisions.md, docs/backtest.md, docs/montecarlo.md, model/backtest/, model/src/argmodel/scenarios/, model/params/params.json and docs/audits/main.md.
 
Then execute the task described in backtest-run.md exactly.
 
Rules:
- Create branch `task/backtest-run`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite is missing, or the real series are not committed and verified, stop and tell me. Do not run on mock data.
- Strict TDD for the runner and the report writer.
- Do not tune anything on the test window: no parameter, bracket, mechanism or correction changes after seeing a result. A failed criterion is reported as failed with its numbers. Run once per code version, seed 2056.
- Do not change the criteria, thresholds or horizons. Enable the commented `backtest_gate` CI job with no `continue-on-error`.
- No new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## sensitivity
 
Prerequisite: `model-montecarlo` merged; the published result needs real parameter values and ranges.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. sensitivity.md   (the brief, in the repository root)
Then read docs/model-design.md section 6 (binding), docs/assumptions.md, docs/params.md, model/params/params.json, docs/montecarlo.md, model/src/argmodel/ and the component docs.
 
Then execute the task described in sensitivity.md exactly.
 
Rules:
- Create branch `task/sensitivity`. Never touch `main`, never merge, never push to `main`.
- If model-montecarlo is not merged into main, stop and tell me.
- Strict TDD on analytic functions with known answers (the linear function and Ishigami of the brief).
- Measure only: change no parameter, range or mechanism because of a result. A run with placeholder ranges is labelled PLACEHOLDER RANGES and must not be quoted.
- Implement Saltelli and Jansen with numpy; no SALib, no scipy, no new dependency. Update the sensitivity column of docs/assumptions.md only from the measured indices.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-ts-port (optional)
 
Prerequisite: `model-growth-core` and `model-ai-overlay` merged (and `model-population-drivers` and `model-hdi` for the full port).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-ts-port.md   (the brief, in the repository root)
Then read docs/model-design.md section 7 (binding) and section 6, the docs of the component tasks, docs/params.md, model/params/params.json, the Python modules of those components, web/src/model-ts/population.ts, web/tests/parity/population.test.ts, model/parity/gen_parity.py, scene-sandbox.md and web/src/scenes/sandbox/.
 
Then execute the task described in model-ts-port.md exactly.
 
Rules:
- Create branch `task/model-ts-port`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite is not merged into main, stop and tell me which.
- Strict TDD: hand-computed cases and property tests first; golden vectors only in addition to them.
- No Monte Carlo, no per-project draws, no provinces, no resource block, no per-frame computation. Messages for invalid input are identical to Python's.
- No new runtime dependency. Do not change the KeyAction union, KEY_MAP, the store shape or the visual design of the sandbox. Keep `npm run check:bundle` passing.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## model-provinces
 
Prerequisite: `model-montecarlo` merged.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. model-provinces.md   (the brief, in the repository root)
Then read docs/model-design.md section 2.4 (binding), D-prov-1 and D-hdi-1, docs/decisions.md, docs/params.md, docs/montecarlo.md, model/src/argmodel/scenarios/, model/src/argmodel/resources/, the forecast_output and population schemas, scripts/forecast_checks.py and web/src/types/province.ts.
 
Then execute the task described in model-provinces.md exactly.
 
Rules:
- Create branch `task/model-provinces`. Never touch `main`, never merge, never push to `main`.
- If model-montecarlo is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first.
- Provinces reuse the national draws and must sum to the national value in every draw. No other GDP proxy, no provincial HDI, no new random generator, no new dependency.
- Keep the drift variant off by default and reported as not validated until the pre-registered 18-of-24 test runs on real data.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## scene-ai-revolution
 
Prerequisite: `scene-forecast`, `scene-sandbox`, `storytelling-substeps`, `references-page` and `performance-a11y` merged (they are).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. scene-ai-revolution.md   (the brief, in the repository root)
Then read design.md (binding), docs/model-design.md section 2.5, docs/data-dictionary.md (ai_estimates), data/schemas/ai_estimates.schema.json, web/src/types/research.ts, scene-forecast.md, scene-sandbox.md, storytelling-substeps.md and the code they produced (fan builder, EChart, DataTable, useDataset, story, references, the data registry).
 
Then execute the task described in scene-ai-revolution.md exactly.
 
Rules:
- Create branch `task/scene-ai-revolution`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite is not merged into main, stop and tell me.
- Strict TDD: commit each failing test first, then the code.
- Follow the brief and design.md literally. No new estimate and no invented number: every figure comes from ai_estimates.json or forecast_output.json with its source. Only admissible quantities form the range; the other metrics appear only in the context list, never combined.
- The caveat (conditional, not a prediction, TFP growth only) is always visible.
- Wire ai_estimates.json as the brief says (commit only the generator's output, registry, smoke test); do not edit the generator. If the mock forecast lacks a needed series, stop and tell me exactly which.
- Do not change the KeyAction union, KEY_MAP, the store shape or the forecast scene. No new dependency. No color literal outside the token files. null is never rendered as 0.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## andes-integration
 
Prerequisite: `performance-a11y` and `deploy` merged (they are). Human inputs first: the terrain outputs committed, the real or mock Andes data. The renderer decisions D-andes-1 to D-andes-4 are taken (docs/decisions.md).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. andes-integration.md   (the brief, in the repository root)
Then read design.md, docs/terrain.md, docs/performance.md, docs/deploy.md (the CSP), docs/data-dictionary.md, data/schemas/andes_events.schema.json, data/mock/andes_events.json, web/src/terrain/, web/src/runtime/, web/src/state/, web/src/types/campaign.ts, web/src/story/, the placeholder web/src/scenes/andes/index.tsx and the proof of concept test/map_test1.html.
 
Then execute the task described in andes-integration.md exactly.
 
Rules:
- Create branch `task/andes-integration`. Never touch `main`, never merge, never push to `main`.
- If the terrain outputs are not committed or the renderer decision is not answered in the brief, stop and tell me which.
- Strict TDD for every piece of logic; rendering code is verified by its inputs, outputs and the e2e run.
- Nothing from another origin: no CDN, tiles, fonts or textures. The CSP stays as it is; if the renderer needs a looser directive, stop and tell me. Per-frame code reads precomputed arrays only.
- No art direction and no invented color: prototype colors become tokens only with my approval, listed in the PR. Every figure comes from the data; no claim about the crossing that is not in it.
- Do not change the KeyAction union, KEY_MAP, the store shape or the Scene type. The only new dependency is the renderer I approved, at an exact version, bundled in the Andes chunk only.
- Use useQuality, QUALITY_PRESETS, WebGLRequired and useReducedMotion. Dispose everything on unmount.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## data-andes
 
Prerequisite: `data-pipeline` and `references-page` merged. Human input first: the Andes research files in data/raw/research/andes/ and my verification of 10 URLs and 3 numbers.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. data-andes.md   (the brief, in the repository root)
Then read docs/data-pipeline.md, docs/data-dictionary.md, docs/terrain.md, data/schemas/andes_events.schema.json, data/schemas/raw_manifest.schema.json, data/schemas/sources.schema.json, data/mock/andes_events.json, scripts/datapipe/, scripts/validate_data.py, scripts/build_references.py and the research files.
 
Then execute the task described in data-andes.md exactly.
 
Rules:
- Create branch `task/data-andes`. Never touch `main`, never merge, never push to `main`.
- If the research files or my verification are missing, stop and tell me what is missing.
- Strict TDD for the adapter. No network access.
- No invented, interpolated or filled figure: a gap is null with a note. Do not choose between historians' figures: list the options and stop where no primary source is named.
- Never hand-edit data/processed/. No schema change (stop and tell me what does not fit). No new dependency.
- List every number that will appear in the UI under Data to verify in PENDING.md.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## data-resources
 
Prerequisite: `data-pipeline` and `references-page` merged. Human input first: the mining, energy and agro research files and my verification of 10 URLs and 3 numbers per scope.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. data-resources.md   (the brief, in the repository root)
Then read docs/data-pipeline.md, docs/data-dictionary.md, docs/model-design.md section 2.3, the schemas and mocks of resource_production, projects and production_projections, scripts/datapipe/, scripts/dataset_checks.py, scripts/validate_data.py and the research files.
 
Then execute the task described in data-resources.md exactly.
 
Rules:
- Create branch `task/data-resources`. Never touch `main`, never merge, never push to `main`.
- If the research files or my verification are missing, stop and tell me what is missing.
- Strict TDD for each adapter. No network access.
- No invented, interpolated or filled figure: a gap is null with a note. Units are the contract's; any conversion is exact arithmetic written, tested and documented. production_actual stays out of production_projections.
- A row whose province cannot be mapped is an error, not a dropped row. Do not choose between conflicting sources: record the one I name as primary.
- Never hand-edit data/processed/. No schema change. No new dependency. List every number for the UI under Data to verify in PENDING.md.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## data-economy-population
 
Prerequisite: `data-pipeline`, `references-page` and `population-age-contract` merged. Human input first: the economy and population research files, my verification of 10 URLs and 3 numbers per scope, and my answer to D-gdp-1 (GDP basis).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. data-economy-population.md   (the brief, in the repository root)
Then read docs/data-pipeline.md, docs/data-dictionary.md, docs/model-design.md sections 2.1, 2.2 and 5, docs/assumptions.md, the schemas and mocks of economy_series, population, composition and the four age-structured datasets, scripts/datapipe/, scripts/dataset_checks.py and the research files.
 
Then execute the task described in data-economy-population.md exactly.
 
Rules:
- Create branch `task/data-economy-population`. Never touch `main`, never merge, never push to `main`.
- If the research files or my verification are missing, stop and tell me what is missing. D-gdp-1 is decided (docs/decisions.md).
- Strict TDD for each adapter. No network access.
- No invented, interpolated or filled figure. Never splice two series silently and never mix PPP and market values: keep them as separate records and document the overlap. Do not touch observations after 2005: the split belongs to the backtest code.
- Never hand-edit data/processed/. No schema change. If the age-structured files exceed the data budget, stop and tell me. No new dependency. List every number for the UI under Data to verify in PENDING.md.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## data-research-inputs
 
Prerequisite: `research-contracts`, `data-pipeline` and `references-page` merged. Human input first: the research files for forecasts, vintages, base rates, AI estimates and the dataset catalog, my verification of 10 URLs and 3 numbers per scope, and the documented format of the research files.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. data-research-inputs.md   (the brief, in the repository root)
Then read research-contracts.md, docs/data-pipeline.md, docs/data-dictionary.md, docs/model-design.md, docs/assumptions.md, the five research schemas, web/src/types/research.ts, scripts/dataset_checks.py, scripts/datapipe/ and the research files.
 
Then execute the task described in data-research-inputs.md exactly.
 
Rules:
- Create branch `task/data-research-inputs`. Never touch `main`, never merge, never push to `main`.
- If the research files or their documented format are missing, stop and ask me.
- Strict TDD for each adapter. No network access.
- No record without an opened source (source_url, locator, snippet, conflict-of-interest note as the schemas require). Do not convert or combine different quantities and do not map a record to a scenario on your own.
- Never enter a source_id in params.json: write docs/model-inputs-status.md as a proposal for me. Never hand-edit data/processed/. No schema change. No new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## polish
 
Prerequisite: the model and data tasks of PENDING.md done (or my explicit go for the scenes that exist). D-polish-1 to D-polish-7 are decided in docs/decisions.md (D-polish-3, the red of the diverging ramp, is the one color I still supply; never invent it); do the 3D items first (D-3d-6).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. polish.md   (the brief, in the repository root)
Then read design.md (binding), docs/performance.md, docs/release-checklist.md, web/src/styles/ (tokens.ts, tokens.css, contrast.ts), web/src/charts/, every scene under web/src/scenes/, web/src/story/, the e2e suite and the Visual debt lists of PENDING.md.
 
Then execute the task described in polish.md exactly.
 
Rules:
- Create branch `task/polish`. Never touch `main`, never merge, never push to `main`.
- If a decision of the brief's table is unanswered, stop and ask me.
- Visual and motion changes only: no new feature, no change to a number or claim on screen, no change to KeyAction, KEY_MAP, the store shape or the Scene type.
- No invented color: a new color is a decision of mine and passes the contrast tests first. No color literal outside the token files. Nothing from another origin; no looser CSP.
- Every motion honors prefers-reduced-motion. The only new dependency allowed is the one D-polish-6 names, at an exact version, justified in the PR.
- Strict TDD for anything with logic. Keep contrast, axe, CSP, keyboard and viewport specs and the bundle budgets green; tighten budgets only with my approval.
- One PR per area of the brief; skip what I left out.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## docs-submission (draft brief, blocked)
 
Prerequisite: `model-montecarlo`, `backtest-run` and `deploy` merged, and I have supplied the contest's rules (the table of the brief).
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. docs-submission.md   (the brief, in the repository root)
Then read docs/model-design.md, docs/assumptions.md, docs/decisions.md, docs/backtest-report.md and docs/sensitivity-report.md (if they exist), the model docs, docs/sources.md, docs/release-checklist.md, docs/deploy.md, docs/performance.md, the References page and the contest rules I provide.
 
Then execute the task described in docs-submission.md exactly.
 
Rules:
- Create branch `task/docs-submission`. Never touch `main`, never merge, never push to `main`.
- If the contest rules or any row of the brief's table are missing, stop and tell me what is missing.
- No new claim: every statement comes from a repository document, the backtest report or a registered source, and says where. A failed criterion is stated as failed.
- No application, model or data change. Generated sections (assumptions, attributions) are produced by a script and covered by a test. Run every README command in a clean checkout or mark it not run.
- No tracking, no third-party embeds, no new dependency.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## presentation-3d (program of six PRs; run one part at a time)

Prerequisite: F2b merged; D-3d-1 to D-3d-6 are decided in docs/decisions.md (3D is the priority).

```
You are working in the repository `argentina-2056`.

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. presentation-3d.md   (the brief, in the repository root)
Then read design.md, docs/ui.md, docs/performance.md, docs/geo.md, storytelling-substeps.md, andes-integration.md, test/dashboard_3d_PoC.html (look and mechanics only), and the code under web/src/{app,scenes,story,charts,runtime,state}/.

Then execute ONLY the part I name (<part>: engine, shell, charts-a, story or charts-b) of presentation-3d.md exactly.

Rules:
- Create branch `task/presentation-3d-<part>`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite or a D-3d decision is missing, stop and tell me.
- Strict TDD for the logic (camera, easing, heights, scaling). The 2D charts stay unchanged.
- No new data, indicator or selector; null is never a height. One 3D library (Three.js, exact version, bundled). Nothing from another origin, no looser CSP, no color literal outside the token files.
- Use useQuality, QUALITY_PRESETS, WebGLRequired and useReducedMotion. Dispose everything on unmount. Do not change KeyAction, KEY_MAP or the store shape beyond what the brief lists.
- Story text is a draft from the mock data, marked for my sign-off.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```

---

## scene-forecast-map-3d (SUPERSEDED by presentation-3d: do not run)
 
Prerequisite: `scene-forecast-map` and `andes-integration` merged, the real province geometry committed, and I confirm the 3D variant is wanted.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. scene-forecast-map-3d.md   (the brief, in the repository root)
Then read design.md, docs/geo.md, docs/performance.md, scene-forecast-map.md, andes-integration.md and the code they produced (ProvinceMap, mapSelectors, the provinceMap builder, web/src/geo/, web/src/runtime/, the Andes renderer).
 
Then execute the task described in scene-forecast-map-3d.md exactly.
 
Rules:
- Create branch `task/scene-forecast-map-3d`. Never touch `main`, never merge, never push to `main`.
- If a prerequisite is missing, stop and tell me.
- Strict TDD for the logic (heights, scaling, camera).
- No new data, indicator or selector: heights come from the existing map selectors; null is never a height. Use the renderer andes-integration shipped; no second 3D library.
- The 2D map stays the default and the fallback (no WebGL2, low tier). Do not change KeyAction, KEY_MAP or the store shape; the existing toggle3D action is the switch.
- Nothing from another origin, no looser CSP, no color literal outside the token files. The 3D code loads only in 3D mode.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 
---
 
## demo-video (optional, draft brief)
 
Prerequisite: the real story steps and data in place, `deploy` merged, and I have said what the contest requires.
 
```
You are working in the repository `argentina-2056`.
 
Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. demo-video.md   (the brief, in the repository root)
Then read docs/release-checklist.md, docs/deploy.md, docs/performance.md, docs-submission.md and the contest rules I provide, web/src/content/steps/index.ts, web/src/story/ and web/src/state/.
 
Then execute the task described in demo-video.md exactly.
 
Rules:
- Create branch `task/demo-video`. Never touch `main`, never merge, never push to `main`.
- If the contest requirements are missing, stop and tell me.
- Documentation and one small script only: no video, audio or recording artifact, no recording tool, no text-to-speech, no new dependency.
- No new claim: every narration line cites the scene, step or document it comes from. No application change: list what the demo needs that the app cannot do.
- scripts/demo_preflight.py uses the standard library only and is tested against a local fixture server, never the real internet.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings, exit codes and messages, never only "no error". Every script test includes the positive case. Tests never write inside the real data/ or web/public/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.
 
When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
 

---

## map-navigation

Prerequisite: dashboard D1 to D6 merged; D-3d-1 to D-3d-6 decided (3D first).

```
You are working in the repository `argentina-2056`.

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. map-navigation.md   (the brief, in the repository root)
Then read docs/dashboard.md, design.md, docs/performance.md, docs/decisions.md (D-3d-6) and the files the brief lists.

Then execute the task described in map-navigation.md exactly.

Rules:
- Create branch `task/map-navigation`. Never touch `main`, never merge, never push to `main`.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and design.md literally. Copy names, limits and keys from them; do not recall them from memory and do not invent colors. No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union, `KEY_MAP` or the store shape.
- Pure camera and view math in their own modules, tested with exact values; a drag of 4 px or less is a click; the camera survives the year animation.
- Clean up WebGL contexts, listeners and GSAP timelines on unmount; respect `prefers-reduced-motion`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings and structures, never only "no error". Tests never write inside the real data/ or web/public/data/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```

---

## fullscreen-viewer

Prerequisite: dashboard D1 to D6 merged; `map-navigation` merged, or say in the PR that the popup shows the maps and 3D views as they are.

```
You are working in the repository `argentina-2056`.

Before doing anything, read these files in this order:
1. AGENTS.md
2. LASTCONTEXT.md
3. PENDING.md
4. fullscreen-viewer.md   (the brief, in the repository root)
Then read docs/dashboard.md, design.md, docs/performance.md, docs/decisions.md (D-3d-6) and the files the brief lists.

Then execute the task described in fullscreen-viewer.md exactly.

Rules:
- Create branch `task/fullscreen-viewer`. Never touch `main`, never merge, never push to `main`.
- Strict TDD: commit each failing test first, then the code that makes it pass. Atomic commits, format `type(scope): summary`.
- Follow the brief and design.md literally. Copy names, limits and keys from them; do not recall them from memory and do not invent colors. No color literal outside `web/src/styles/tokens.ts` and `tokens.css`.
- Add no dependency. If one seems necessary, stop and ask me.
- Do not change the `KeyAction` union, `KEY_MAP` or the store shape.
- The popup is a lazy chunk and keeps the main budget; its keys are handled in the capture phase and do not leak to the global handler; only one WebGL context alive at a time; focus is trapped and returned.
- Clean up WebGL contexts, listeners and GSAP timelines on unmount; respect `prefers-reduced-motion`.
- Do not edit AGENTS.md, CLAUDE.md or GEMINI.md.
- Before every push run `python scripts/precheck.py`. Never push if it fails.
- Never silence a checker: no `as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`, `--fix`, `--unsafe-fixes`. If a checker complains, fix the cause.
- Tests must assert exact values, strings and structures, never only "no error". Tests never write inside the real data/ or web/public/data/ directories.
- Never claim CI is green. Say "pushed, CI not checked" unless you read the run status.
- If anything in the brief is ambiguous or seems wrong, stop and ask me instead of guessing.

When finished: overwrite LASTCONTEXT.md, update PENDING.md, and write a PR description with (a) what changed, (b) what was verified, (c) what the human must verify.
```
