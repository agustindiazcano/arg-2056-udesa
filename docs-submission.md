# Task: `docs-submission`

Status: **draft brief, blocked by the contest's rules.** The competition deadline and evaluation criteria are open questions in `PENDING.md` ("Blocked / questions"); this brief fixes what can be fixed now and lists what the human must supply before an agent starts. Do not start while the table below has unanswered rows.

Branch: `task/docs-submission`. One PR (two if the written submission and the in-app pages are separated). Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md`, `docs/assumptions.md`, `docs/decisions.md`, `docs/backtest-report.md` and `docs/sensitivity-report.md` (if they exist), `docs/params.md`, `docs/montecarlo.md`, `docs/provinces-model.md`, `docs/ai-overlay.md`, `docs/sources.md`, `docs/release-checklist.md`, `docs/deploy.md`, `docs/performance.md`, the References page (`web/src/references/`) and the contest's own rules (provided by the human) first.
Prerequisites: `model-montecarlo` and `backtest-run` are merged (the methodology page reports what the backtest found, including failures), `deploy` is merged (it is), and the human has supplied the contest's rules.

## What the human must supply first

| # | Item | Why |
|---|---|---|
| 1 | The contest's name, official rules, deadline and the **evaluation criteria** with their weights | the structure of every document below follows them; none can be written without them |
| 2 | The required deliverables and their formats (written report, slides, video, repository, a URL) and any length or language limits | `docs-submission`, `demo-video` and the README depend on them |
| 3 | The submission language (Spanish, English or both) | decides `D-polish-1` as well |
| 4 | The author or team names and affiliations to credit, and the license the human wants for the code and for the content | nothing may be guessed |
| 5 | Which claims the human is willing to make publicly given the backtest result | the methodology page can only state what the evidence supports |

## Goal

The documents that let a judge understand, trust and reproduce the project: a README that gets a stranger from clone to running app and tests; a methodology page and a limitations page that state the model, its assumptions, its backtest result (pass or fail, with the numbers) and what it does not do; the credits and licenses; and the submission text itself, written from the repository's own documents and nothing else.

Atomic commits. Before every push run `python scripts/precheck.py`. Documents that contain figures are checked by tests where a figure is generated (see below).

## Out of scope (do NOT do)

- **No new claim.** Every statement about the model, the data or Argentina comes from a repository document, the backtest report or a registered source, and says where. No marketing superlatives, no prediction presented as a fact, no number that is not in the data or the reports. If the backtest failed a criterion, the methodology page says so plainly.
- No application feature, no model change, no data change. The in-app pages (if the human wants methodology and limitations inside the app) reuse the existing page pattern of the References page (a Vite entry or a route of the shell; ask which) and the design tokens.
- No tracking and no third-party embeds. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Deliverables (adjust to the contest's list)

1. `README.md` at the repository root: what the project is in two paragraphs; the live URL; how to run it (Node and Python versions, `npm ci`, `npm run data:sync`, `npm run dev`); how to run the checks (`python scripts/precheck.py`, `npm run test:e2e`); the repository layout (from `AGENTS.md` section 4); where the data and the model are documented; the license; credits. Every command in it is run by the agent and works, or is marked not run.
2. **Methodology** (`docs/methodology.md`, and an in-app page if asked): the principle "the AI decides, the engine measures" in the project's own words, the components with their equations (copied from the model docs, not retyped from memory), the uncertainty design (scenarios as terciles of TFP growth, the meaning of p10 to p90), the AI overlay and why it is conditional, the backtest protocol and its **result**, the sensitivity result, and the list of assumptions that remain unsourced (generated from `docs/assumptions.md`).
3. **Limitations** (`docs/limitations.md`, same treatment): what is not modeled (the list of `docs/model-design.md` section 1), the failure modes of each component, the thin left tail, no resource backtest, the proxy for provinces, the single-sex cohorts, what the figures are not (not predictions about the real world beyond the model's assumptions).
4. **Credits and licenses**: the data sources and attributions (generated from the References page data, not retyped), the libraries and their licenses (from the lockfiles), fonts, the terrain and geometry attributions.
5. **The submission text** in the contest's format and language, with every figure and claim footnoted to a document of the repository.

## 2. Tests and checks

- Every command quoted in the README is run in a clean checkout by a script (`scripts/check_readme.py` with an exact list of commands and expected exit codes, run in CI) or listed as not run.
- The assumptions list and the attributions in the documents are **generated** by a script from `docs/assumptions.md` and `data/processed/sources.json`; a test fails when the generated text and the committed document differ.
- A link check over the documents (relative links resolve; external links are listed for the human to check by hand, no network in tests).
- A test that every number in `docs/methodology.md` that comes from a report appears in that report (a small, explicit table of quoted figures).

## 3. Acceptance checklist

- [ ] The contest's rules supplied and the deliverables list matched to them; the table of "What the human must supply" fully answered.
- [ ] No claim without a document or a source behind it; failed criteria stated as failed.
- [ ] README commands verified; generated sections in sync (tests); links resolve.
- [ ] `docs/release-checklist.md` section 6 updated; `PENDING.md` and `LASTCONTEXT.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (every claim against the contest's criteria, the credits, the license, the tone).
