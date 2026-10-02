# Task: `precheck`

Branch: `task/precheck`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` first.
Prerequisite: task `forecast-contract` is merged into `main`.

## Why this task exists

In `forecast-contract` three CI failures (a crash in `validate_data.py`, a TypeScript error, ten ruff errors) were found by CI after pushing. All three could have been found locally in seconds. Also, one test passed for the wrong reason, and one test wrote into the real `data/processed/`. This task fixes the process gap and those two defects.

Strict TDD. Atomic commits.

## Out of scope (do NOT do)

- No new dependencies (no mutmut, no Stryker: that is a later task).
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. The human will add the new rules to `AGENTS.md`.
- Do not change CI jobs. Do not fake CI.
- Do not use `ruff --fix`, `--unsafe-fixes`, `@ts-ignore`, `as unknown as`, or `# noqa` anywhere in this task.

## Part A — `scripts/precheck.py`

One command, `python scripts/precheck.py`, that runs the same cheap checks as the active CI jobs. Works on Windows and Linux.

Steps, in this order (each is a subprocess; always pass an argument list, never `shell=True`):

| step | command | cwd |
|---|---|---|
| `ruff` | `[sys.executable, "-m", "ruff", "check", "."]` | repo root |
| `pytest` | `[sys.executable, "-m", "pytest", "-q"]` | repo root |
| `validate-data` | `[sys.executable, "scripts/validate_data.py"]` | repo root |
| `web-lint` | `[npm, "run", "lint"]` | `web/` |
| `web-typecheck` | `[npm, "run", "typecheck"]` | `web/` |
| `web-test` | `[npm, "test"]` | `web/` |

Rules:
- `npm` is resolved with `shutil.which("npm")` (this finds `npm.cmd` on Windows). If it is not found, the three web steps FAIL with the message `npm not found in PATH`.
- If `web/package.json` does not exist, the web steps are `SKIPPED` (not failed).
- If `web/node_modules` does not exist, the web steps FAIL with the message `run "npm ci" in web/ first`.
- The repo root is the parent directory of `scripts/`, so the script works from any current directory.
- It never modifies files (no `--fix`).
- It runs ALL steps even if one fails, streams each step's output live, and prints a final summary table: step, `PASS` / `FAIL` / `SKIPPED`, seconds.
- Last line: `PRECHECK OK` (exit 0) or `PRECHECK FAILED: <comma-separated failed steps>` (exit 1).
- Option `--only {python,data,web}` runs a subset: `python` = `ruff` + `pytest`; `data` = `validate-data`; `web` = the three web steps.

Make it testable: pure functions `build_steps(root, only, npm_path) -> list[Step]` and `run_steps(steps, runner) -> list[Result]` with an injectable `runner`, and `main(argv, runner=...)` returning the exit code.

Tests (write first) in `data/tests/test_precheck.py`, using a fake runner (no real subprocess):
- all steps pass → exit code 0 and last line `PRECHECK OK`;
- one step fails → exit code 1, **all other steps still ran**, last line names the failed step;
- `--only data` builds only `validate-data`; `--only web` builds only the three web steps;
- `npm_path=None` → web steps FAIL with `npm not found in PATH`;
- no `web/package.json` (use `tmp_path`) → web steps `SKIPPED`, exit code 0 if the rest pass;
- no `web/node_modules` → web steps FAIL with the exact message above;
- no step uses `shell=True` (assert on the recorded calls).

## Part B — harden `scripts/validate_data.py`

- Add `--processed DIR` (default `data/processed`) and `--schemas DIR` (default `data/schemas`).
- Exit codes: `0` all valid (an empty or missing processed dir is valid); `1` any validation failure (schema error, forecast check error, or a processed file with no matching schema); errors are printed to stderr, one per line, each starting with `ERROR` and containing the file name.
- Imports at module top only. No imports inside functions.

## Part C — fix the tests of `validate_data.py`

Replace the existing test that writes into the real `data/processed/` with tests using `tmp_path` and `--processed`. Every assertion checks the **exact** exit code and a message fragment:
- empty `--processed` dir → exit code 0;
- valid `forecast_output.json` → exit code 0;
- `forecast_output.json` with `p10 > p50` → exit code 1 and stderr contains `forecast_output.json` and `p10`;
- `forecast_output.json` missing a required field → exit code 1 and stderr contains `forecast_output.json`;
- an unknown file `unknown.json` with no schema → exit code 1 and stderr contains `unknown.json`;
- no test in the repo may write inside the real `data/` directory (add one test that fails if the real `data/processed/` content changed during the test session).

## Part D — remove the type-check bypass

In `web/src/types/forecast.ts`, remove `as unknown as ForecastOutput`. Compile the schema with the generic form `ajv.compile<ForecastOutput>(schema)` so `validate(json)` acts as a type guard. If that is not possible, STOP and explain why instead of casting.

## Acceptance checklist

- [ ] Tests committed failing first, then green.
- [ ] `python scripts/precheck.py` passes on a clean checkout, on the agent's OS.
- [ ] Breaking something on purpose (an unused import; a type error; a failing test) makes `precheck` FAIL with that step named, and the other steps still run. Show the output in the PR.
- [ ] No `as unknown as`, `@ts-ignore`, `noqa`, `--fix`, `--unsafe-fixes` in the diff.
- [ ] The commands in `precheck.py` match the active commands of the `web`, `python` and `data` jobs in `.github/workflows/ci.yml` (list any difference in the PR).
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify.
