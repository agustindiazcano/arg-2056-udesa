Read roadmap.md to see whats next

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

4. geo-provinces.md  [DONE - PR open, waiting for review]

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

5. scene-forecast-map.md 

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

6. scene-economy.md

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

7. scene-sandbox.md

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

- Next Steps:

1	model-params	Necesita tu docs/model-design.md
2	model-population	Necesita el diseño
3	model-growth-core	Necesita el diseño
4	model-resources	Necesita el diseño
5	model-ai-overlay	Necesita el diseño
6	model-montecarlo	Necesita el diseño
7	backtest-baselines	Necesita el diseño
8	backtest-run	Necesita el diseño
9	sensitivity	Necesita el diseño
10	model-provinces	Necesita el diseño
11	model-ts-port (opcional)	Necesita el diseño
Andes		
12	andes-integration	Necesita tu renderer
13	data-andes	Mejor después de que vuelva la investigación
Escenas		
14	storytelling-substeps	Se puede escribir ya
15	scene-forecast-map-3d (opcional)	Depende del renderer
Datos reales		
16	data-resources	Mejor con los archivos de investigación a la vista
17	data-economy-population	Ídem
18	data-research-inputs	Ídem
19	references-page	Se puede escribir ya
Calidad		
20	integration	Se puede escribir ya
21	performance-a11y	Se puede escribir ya
22	mutation-testing (opcional)	Se puede escribir ya
23	polish	Necesita decisiones de diseño tuyas
Entrega		
24	docs-submission	Necesita criterios del concurso
25	deploy	Necesita elegir hosting
26	demo-video (opcional)	Depende de lo que pida el concurso

8. references-page.md

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

9. storytelling-substeps.md

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

10. integration.md

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

