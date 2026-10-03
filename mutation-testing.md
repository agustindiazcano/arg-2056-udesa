# Task: `mutation-testing` (optional)

Branch: `task/mutation-testing`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/afaw-light.md`, `scripts/precheck.py`, `.github/workflows/*.yml`, `web/package.json`, `web/vitest.config.*` and the pyproject or pytest configuration first.
Prerequisite: `integration` is merged into `main`.

## Goal

Measure whether the tests actually detect wrong code, on the modules where a silent arithmetic or logic error would produce a wrong number in front of a judge. A mutation tool changes the code one small way at a time (flips a comparison, changes a constant, removes a call) and checks that at least one test fails; a change that no test notices is a **surviving mutant**, evidence of a weak test. The result is a score per module with a no-regression gate in CI. This is a measurement tool, not a coverage target to game.

Strict TDD for the scripts you write. Atomic commits. Before every push run `python scripts/precheck.py`. Mutation runs are slow and execute only in CI and on demand (decision of `docs/afaw-light.md`); they are not part of `precheck.py`.

## Out of scope (do NOT do)

- Do not change application code or existing tests to raise scores in this PR. If you notice a weak test, record it in the report; fixing weak tests happens in separate PRs from the report.
- Do not mutate generated files, mock data, configuration or tests. Do not run on `node_modules`, `dist` or `data/`.
- Dependencies allowed: Python `mutmut` (pinned, in `requirements-dev.txt` or the file the repository already uses for dev tools); npm devDependencies `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` (exact versions). Nothing else.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker. No `continue-on-error`, no `|| true`.

## 1. Scope of the mutation

Python (`mutmut`, runs on Linux; CI only, and local use through WSL or a container, documented):
- `scripts/dataset_checks.py`, `scripts/datapipe/` (all modules except the CLI wrappers), `scripts/terrain/` (all modules except the CLI), `scripts/gen_mock.py` (only the invariants part; if the file is too large to run in reasonable time, list the functions in the config and mutate only those).
- Later model code under `model/src/` is added to the same config by the model tasks (the config is a list; document how to add a path).

TypeScript (Stryker with the Vitest runner):
- `web/src/**/selectors.ts`, `web/src/charts/builders/**`, `web/src/scenes/sandbox/arithmetic.ts`, `web/src/story/**` (excluding the React components), `web/src/references/selectors.ts`, `web/src/references/citation.ts`, `web/src/terrain/decode.ts`, `web/src/geo/**` (excluding loaders that touch `fetch`), `web/src/charts/format.ts`.
- Exclude `.tsx` files, `tokens.ts` and anything under `tests/`.

## 2. Runner script and configuration

`scripts/mutation.py` (Python standard library only):
- `python scripts/mutation.py python|ts|all [--since <git ref>] [--paths ...] [--report-only]`.
- With `--since`, it computes the changed files with `git diff --name-only <ref>...HEAD`, intersects them with the configured scope, and mutates only those (this is what pull requests use; with no changed in-scope file it prints `NO_CHANGES` and exits 0).
- It runs the tools through subprocess, parses their result output into one table `file, killed, survived, timeout, score` (score = killed / (killed + survived), timeouts counted as killed, files with zero mutants skipped), writes `mutation-report.json` (sorted keys, no timestamps) and a readable `mutation-report.md`, and compares each file's score with `mutation-baseline.json`.
- Gate: a file fails when its score is lower than its baseline score minus 2 percentage points; a file with no baseline entry fails when its score is below 70% for Python and below 65% for TypeScript (constants at the top of the script, flagged as starting values for the human to tune). Exit 0 if no file fails, 1 if any fails (listing file, score, baseline), 2 for usage errors or when the tool cannot run (the message says which tool and why; never exit 0 when a tool did not run).
- `--update-baseline` rewrites `mutation-baseline.json` from the current report and is refused (exit 2) unless run from a clean working tree and with an explicit `--reason "<text>"`, which is stored in the baseline file under `"_history"` with the file list and the scores that changed. The baseline file is committed; its first version is produced by the full run in section 4.
- Survivor listing: the markdown report lists every surviving mutant (file, line, original snippet, mutated snippet, tool id) so the human can read it; limit 200 lines per file, then a count.

Tool configuration files: `[tool.mutmut]` settings in the Python configuration (paths to mutate, tests command that runs only the relevant test files for speed) and `web/stryker.config.json` (`testRunner: "vitest"`, `mutate` globs from section 1, `coverageAnalysis: "perTest"`, `reporters: ["json", "clear-text"]`, `incremental: false`, thresholds not used because the gate lives in `scripts/mutation.py`). The configuration contains no secret and no network use.

## 3. CI

A workflow job `mutation` that always runs on pull requests and installs the tools: on pull requests it runs `python scripts/mutation.py all --since origin/main`; a scheduled run (weekly, `workflow_dispatch` too) runs `python scripts/mutation.py all` over the whole scope. Both upload `mutation-report.md` and `mutation-report.json` as artifacts (also on failure). A time limit per job is set (60 minutes for the full run, 30 for pull requests); when the limit is hit the job fails, it never passes silently.

## 4. First full run

Run the full mutation once (in CI or locally on Linux). Commit `mutation-baseline.json` and the first `mutation-report.md` under `docs/mutation/first-run.md`. Do not alter code or tests. In the PR description list the ten files with the lowest scores and, for each, the first three surviving mutants, so the human can decide which tests to strengthen. If the full run cannot be executed in your environment, say "mutation not run" in `LASTCONTEXT.md` and the PR, commit the scripts and configuration with an empty baseline `{ "files": {} }`, and state that the first baseline must be produced by the CI scheduled run before the gate is meaningful (with an empty baseline the fallback thresholds apply).

## 5. Tests (write first for `scripts/mutation.py`)

Pytest, with fake tool outputs as fixtures (no mutation tool is invoked in these tests; the tool invocation is behind a function that the tests replace):
- Parsing the mutmut result format and the Stryker JSON into the common table: exact rows for small fixtures; files with zero mutants skipped; timeouts counted as killed.
- Score computation (exact values, including the all-killed and all-survived cases).
- `--since`: changed files are intersected with the configured scope; out-of-scope changes are ignored; none gives `NO_CHANGES` and exit 0 (use a temporary git repository created in the test).
- Gate: lower than baseline minus 2 points fails (exact message and exit 1), exactly baseline minus 2 passes, improvement passes, no baseline entry applies the fallback thresholds (below and above, per language).
- Tool not available: exit 2 with the tool name; tool failure: exit 2; never exit 0.
- `--update-baseline`: refused without `--reason`, refused on a dirty tree, writes the new baseline and the `_history` entry otherwise.
- Determinism: the same inputs produce byte-identical `mutation-report.json`.
- No network: tests pass with `socket.socket` monkeypatched to raise.

## 6. Docs (`docs/mutation-testing.md`)

What a mutant is and what the score means; what is in and out of scope and why; how to run locally (Linux, WSL or container) for one file; how to read the survivors; how to add a module to the scope (including future `model/src/` paths); the gate rules and the starting thresholds; how and when to update the baseline; the limits of the method (equivalent mutants exist; a high score does not prove correctness).

## 7. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] Only `mutmut`, `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` added, pinned; no checker silenced; no change to application code or existing tests.
- [ ] CI job `mutation` runs on pull requests and weekly; artifacts uploaded; time limits set.
- [ ] `mutation-baseline.json` and `docs/mutation/first-run.md` committed from a real run, or the PR states "mutation not run" with the empty baseline.
- [ ] `docs/mutation-testing.md` written.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add "strengthen tests for the ten weakest files" as a human-triggered task, and "add model paths" to the model tasks).
- [ ] PR description: what changed, what was verified, what the human must verify (the starting thresholds, the scope lists, the ten weakest files, the CI duration, that the gate cannot pass when a tool does not run).
