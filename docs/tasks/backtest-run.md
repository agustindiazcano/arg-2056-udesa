# Task: `backtest-run`

Branch: `task/backtest-run`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 5 is binding: the protocol, the criteria C1 to C5 and what to do when one fails), `docs/decisions.md`, `docs/backtest.md`, `docs/montecarlo.md`, `model/backtest/`, `model/src/argmodel/scenarios/`, `model/params/params.json` and `docs/audits/main.md` first.
Prerequisites: `model-montecarlo` and `backtest-baselines` are merged into `main`, **and the real series of `data-economy-population` for 1990 to 2025 are committed and verified by the human**. Without real data this task must not run: stop and tell me.

## Goal

Run the pre-registered protocol once, honestly, and publish the result as it is. The model is calibrated on data up to 2005, forecasts from the 2005 origin, and is compared with what happened in 2006 to 2025 against the baselines, with the criteria that were written before any code existed. A negative result is a valid result.

Strict TDD for the runner and the report writer. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **Do not tune anything on the test window.** No parameter, no bracket, no mechanism and no multiplicative correction may change after seeing a result. If a criterion fails, the report says which and with what numbers; a change of mechanism happens in a **separate** PR with a decision in `docs/decisions.md`.
- No change to the criteria, the thresholds (`1.25`, `8 of 12`, `20%`) or the horizons. No cherry-picking of cases, seeds or runs: the seed is 2056 and the run is done once per code version.
- No new dependency. Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/backtest/run.py                 python -m backtest.run --data ... --out ...
model/backtest/report.py              builds the report from the numbers
model/backtest/baseline.json          the stored result and tolerance used by the CI regression gate (AGENTS.md section 7)
docs/backtest-report.md               written by the runner, committed with the PR
model/tests/test_backtest_run.py
.github/workflows/ci.yml              the `backtest_gate` job (it is commented in the file: enable it here)
```

## 2. Behavior

- The runner reads the real data, slices the training window first (through `train_slice`), calibrates what the design calibrates (`pop.kappa_f`, the location and scale of `g_A` as the design says), runs the Monte Carlo from the 2005 origin and compares with the observed series.
- **The report** lists, for each of the 12 cases: the observed value, the p10, p50 and p90, the p50 absolute log error, the best baseline and its error, the bias, and whether the observed value lies inside p10 to p90. Then **C1 to C5 as pass or fail with the numbers behind each**, in the form the design states them: C1 (lower error than the best baseline at horizons 10 and 20 for `gdp_per_capita_usd` and `population`), C2 (at horizon 5 not more than 1.25 times the best baseline error), C3 (at least 8 of 12 inside p10 to p90, with the binomial arithmetic of the design quoted), C4 (scenario separation), C5 (conservation and the identities). Resources: "not testable" (no project vintages).
- Any case "not available" is listed with its note and counted as not passed for C3, with that stated.
- **The regression gate** (`AGENTS.md` section 7): `baseline.json` stores the result of this run and a tolerance; the CI job fails if a later run's errors regress beyond it. The tolerance is a proposal in the PR for the human to confirm; the gate is enabled by uncommenting the `backtest_gate` job, which must run with no `continue-on-error`.
- The report states plainly what the backtest does **not** show (no crisis mechanism, the thin left tail, no resource backtest, the low power of C3) using the limits of the design.

## 3. Tests (write first)

- The runner is deterministic: the same inputs give the same report byte for byte.
- A hand-built tiny data set with a known answer: the report's numbers equal the hand-computed errors, bias and coverage; C1 to C5 are judged as the design says on that set, including one set where each criterion fails (the message names the criterion and the numbers).
- A run on data that **changes only after 2005** gives an identical calibration (the no-leak test at the level of the runner).
- The report writer escapes nothing it should not and lists all 12 cases and the 5 criteria (exact structure).
- The gate: a result inside the tolerance passes with exit 0; a regression fails with exit 1 and a message naming the case and both numbers; a missing `baseline.json` exits 2.
- The CI workflow text has the job and no `continue-on-error` or `|| true`.

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] The real run done once; `docs/backtest-report.md` committed with every criterion pass or fail and its numbers; nothing tuned on the test window.
- [ ] `baseline.json` and the tolerance proposed; the CI gate enabled. `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: the verdict per criterion in a table, what changed, what was verified, what the human must verify (the tolerance, the interpretation of any failure, whether the model may be shown to the public as it stands).
