0. audit.md

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


1. model-design.md

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

2. scene-forecast.md

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

3. terrain-bake.md

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

4. geo-provinces.md

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


