# Task: `audit` (independent review, read-only)

Branch: `audit/<target>`. One PR containing only the report `docs/audits/<target>.md`. No fixes.
`<target>` is given in the prompt: either `main` (everything merged so far), a task slug (`shell`, `scene-resources`, ...) or a branch name (for example the growth-accounting branch).

## Purpose

Check, independently, that what previous agents delivered is correct and that their claims (PR descriptions, `LASTCONTEXT.md`, `PENDING.md`) are true. You are a reviewer, not an implementer. Do not trust any claim: verify it by running or reading.

## Rules

- Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, the brief of every task in scope (`docs/tasks/*.md`), `docs/design.md`, `docs/model-design.md` if it exists, and `docs/afaw-light.md`.
- Change no source file, no test, no data, no config. The only file you commit is the report. Experiments (mutations, temporary edits) are done in a scratch copy (`git worktree` or a temp clone) and are never committed.
- Every finding needs evidence: file and line, or the exact command and its output. A finding without evidence is not reported.
- Do not claim CI status; read the run status if you need it, otherwise say "not checked".
- Do not propose scope growth. Report defects, risks and gaps against the briefs and against `AGENTS.md`.

## Checks

### A. Process
1. For each task in scope, read `git log`: the failing-test commit must precede the implementation commit it covers. List violations.
2. Commit messages follow `type(scope): summary`. Branch names follow `task/<slug>`. Nothing was pushed to `main` directly (check the history of `main` for non-merge commits).
3. Compare each PR description and `LASTCONTEXT.md` claim with reality (for example "all tests pass", "no dependency added", "CI green"). List each false or unverifiable claim.

### B. Gates and silencing
4. Search the whole repo (excluding `node_modules`, lockfiles, build output) for: `as unknown as`, `@ts-ignore`, `@ts-expect-error` (each must have a justification and a test purpose), `eslint-disable`, `# noqa`, `# type: ignore`, `|| true`, `continue-on-error`, `--fix`, `--unsafe-fixes`, `.skip(`, `.only(`, `xfail`, `pytest.skip`, `skipif`, `retry`, loosened or commented-out thresholds. Report every hit with context.
5. Run `python scripts/precheck.py` from a clean checkout of the target. Report exit code and failing steps. Compare the steps of `precheck.py` with the steps of `.github/workflows/*.yml`: anything CI runs that precheck does not (or the reverse) is a finding.
6. Check that CI jobs are not weakened (conditions, `paths` filters that skip needed jobs, removed jobs).

### C. Dependencies
7. Diff `web/package.json`, `package-lock.json`, `pyproject.toml` / requirements against the allowed lists in the briefs. Any extra dependency is a finding.

### D. Data integrity
8. Run `python scripts/validate_data.py` on `data/mock` and on `data/processed` (whatever exists). Run the mock generator twice into temporary directories and compare bytes.
9. Search the web code for conversions of missing values to zero (`?? 0`, `|| 0`, `Number(null)`, `parseFloat` on possibly null, `.map` defaults) in charts, selectors, builders and tables. For each hit decide if `null` can reach it.
10. Search for color literals (hex, `rgb(`, `hsl(`) outside `tokens.ts` and `tokens.css`.
11. Every record in published data has `source` and `retrieved_at` (or `generated_at` for forecast output); no `MOCK` in `data/processed`.

### E. Test quality
12. Read the tests as an adversary. Flag tests that assert only "does not throw", only `returncode != 0` without the message, or that duplicate the implementation's formula to compute the expected value.
13. Run the full test suites, then `git status`: the working tree must be clean (tests must not write to real `data/` or `web/public/data/`).
14. Mutation spot check in a scratch copy: pick 8 meaningful lines in the code of the target (comparison operators, constants, off-by-one boundaries, a sign) and change one at a time; run the suite. Report which mutations survived (all tests passed). Survivors are findings, with the line and the mutation.

### F. Model code (only if the target contains model code)
15. **Parameters.** List every numeric literal in `model/src/` outside the parameter file. Each must be a structural constant (0, 1, a unit conversion) or a finding. Every parameter in the parameter file has `source_id` or `assumption: true` and a range. Cross-check three parameter sources against the cited source text where it exists in the repository.
16. **Independent recomputation.** Without importing the model, write a scratch script that recomputes by hand at least three outputs (for example one year of capital accumulation, one Cobb-Douglas output, one population cohort step) and compare. Report differences.
17. **Invariants.** Check by running: constant returns to scale (multiply capital and labor by k, output scales by k when TFP is fixed); cohort conservation (population change equals births minus deaths plus net migration); non-negativity; monotonic response of output to TFP; units consistent (look for years vs. months, percent vs. fraction, USD constant vs. current). Report each violated invariant.
18. **Determinism and seeds.** Same seed gives byte-identical output; different seeds give different Monte Carlo output; no use of wall clock or global random state; no network.
19. **Golden vectors.** Where they came from. If generated only by the same code, say so: they prove stability, not correctness.
20. **No look-ahead.** In calibration and backtest code, confirm the training data is sliced to the declared window and the test window is never read during calibration. Show the slicing lines.
21. **Conformance to `docs/model-design.md`.** Equations, parameter names, scenario definition, treatment of resources, AI overlay quantity. If the design document does not exist, report "model code without a design document" as a blocker.
22. **Double counting** between the resource block, capital accumulation and TFP: trace one resource project through the code and show where its output enters GDP and whether it also enters elsewhere.

### G. Frontend (only if the target contains web code)
23. Table view exists for every chart; `aria` attributes present; keyboard behaviour follows `KEY_MAP` and the `KeyAction` union is unchanged; `echarts` instances disposed on unmount; no console errors on load in `npm run dev` with mock data.
24. Visual fidelity to `docs/design.md` is NOT judged here (the human does that); only list obvious violations of the written rules (status colors used for data, color-only encodings, missing labels).

## Report format: `docs/audits/<target>.md`

1. Verdict in three lines: safe to build on / safe with fixes / not safe, and why.
2. Findings table sorted by severity: `id`, `severity` (blocker | major | minor), `area` (A-G), `task`, `finding`, `evidence`, `recommended fix` (one line, written so it can be pasted as a line of the "Helper A" prompt).
3. Claims that could not be verified, and why.
4. Checks that passed (one line each, with the command).
5. Mutation table: line, mutation, survived yes/no.
6. What this audit did not cover.

## Acceptance checklist

- [ ] Only `docs/audits/<target>.md` is added; `git diff --stat` shows nothing else.
- [ ] Every finding has evidence.
- [ ] Every check above is reported as passed, failed, or not applicable (with the reason).
- [ ] The mutation spot check was run in a scratch copy and nothing from it is committed.
- [ ] PR description: verdict, counts per severity, and the three findings the human should read first.
