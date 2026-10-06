# Task: `data-research-inputs`

Branch: `task/data-research-inputs`. One PR per dataset if the diff is large. Read `AGENTS.md` (section 6, data rules), `LASTCONTEXT.md`, `PENDING.md`, `docs/archived/research-contracts.md`, `docs/data-pipeline.md`, `docs/data-dictionary.md` (the research contracts and the research-agent mapping), `docs/model-design.md` (where each of these datasets is used: sections 2.1, 2.2, 2.5, 4 and 5), `docs/assumptions.md`, the five schemas `external_forecasts`, `forecast_vintages`, `base_rates`, `ai_estimates` and `dataset_catalog` in `data/schemas/`, `web/src/types/research.ts`, `scripts/dataset_checks.py`, `scripts/datapipe/` and the research files under `data/raw/research/` first.
Prerequisites: `research-contracts`, `data-pipeline` and `references-page` are merged (they are). **Human input before the task starts, otherwise stop and tell me what is missing:** the research sessions for forecasts, vintages, base rates, AI estimates and the dataset catalog done, their files in `data/raw/research/<scope>/`, and the human's verification of 10 URLs and 3 numbers per scope. If the research files' format is not documented anywhere in the repository (`docs/research-prompts.md` does not exist today), stop and ask me for it before writing an adapter.

## Goal

The research inputs the model's uncertainty is built from: external forecasts (population and macro, with variants), past forecast vintages (to size the errors), base rates (how often growth episodes and project advances happen), AI estimates (the sourced range of the AI overlay) and the dataset catalog (where the real data live). They become `data/processed/` files through deterministic adapters, with the provenance the contracts demand: source, locator, snippet and conflict-of-interest note per record. These files let `model-params` replace "assumption" with a `source_id`.

Strict TDD for each adapter. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **No record without an opened source.** Every record needs the fields its schema requires for provenance (read them: `source_id`, `source_url`, `locator`, `snippet`, `sponsor_conflict_note`, `confidence`, `retrieved_at` and the rest of that schema). A figure that only a secondary summary reports is `null` with a `note`, not entered.
- **No conversion or combination of different quantities.** AI estimates keep the `outcome_metric` the source reports; the `derived_annualized_pp` of a cumulative level gain is computed only with the exact formula of `docs/model-design.md` section 2.5 and validated by the existing checks. Do not map a record to a scenario on your own: the `scenario_mapping` and its `mapping_rationale` come from the research files or are left `null` for the human.
- No network access. No schema change (stop and tell me what does not fit). No mock change. No UI. No new dependency. Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Steps

1. **Register the raw files** (`python -m datapipe register <dataset_id> <file> --source "..." --retrieved-at YYYY-MM-DD`; private files follow the `_private` rule).
2. **Adapters** in `scripts/datapipe/adapters/` (`DATASET_ID`, `OUTPUTS`, pure `build(files, manifest)`), registered in `adapters/__init__.py`, one per dataset or one per scope if the research files are organized that way. Field names and enums are copied from the schemas.
3. **Run the pipeline**; register every source in `data/processed/sources.json` (the ids used in the records must exist there; `scripts/datapipe/sources.py` normalizes URLs, reuse it) and run `python scripts/build_references.py`.
4. **Overlay and gates**: `npm run data:sync`; the checks of `scripts/dataset_checks.py` for these datasets (admissibility, annualization, ordering) pass; the data smoke test and the data budget pass.
5. **Feed the model tasks**: write `docs/model-inputs-status.md` listing, for each parameter of `model/params/params.json` that these files can source, the candidate `source_id`s and the figure they give, **as a proposal for the human** (the `source_id` is entered in `params.json` by a follow-up of `model-params`, with the human's approval, never by this task).
6. **Data to verify**: list every number that will appear in the UI (the AI range above all) under "Data to verify" in `PENDING.md`.

## 2. Tests (write first)

- Each adapter: mapping from a synthetic fixture created in a temporary directory; determinism; `null` with `note` for what the source does not state; the conflict-of-interest note carried through; the id of every record resolves in `sources.json`.
- Negative cases with the exact message: a record without `source_url` or `locator` or `snippet`, an unknown `outcome_metric`, a range with `value_low > value_high`, a `derived_annualized_pp` that does not equal the formula within `1e-9`, a vintage whose year is after its forecast year, a base rate whose denominator is zero.
- The processed files validate against their schemas; every record has `source` and `retrieved_at`; the provenance hashes match.
- `docs/model-inputs-status.md` is generated or checked so that it lists only ids that exist in `params.json` (a test).
- Tests never write inside the real `data/` directory.

## 3. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] No record without an opened source; no quantity converted except the validated annualization; no scenario mapping invented.
- [ ] Raw files registered, processed files and provenance produced by the pipeline, sources registered and references rebuilt; `docs/model-inputs-status.md` written as a proposal.
- [ ] `PENDING.md` updated ("Data to verify"; the `model-params` follow-up that enters `source_id`s; `scene-ai-revolution` and `model-ai-overlay` can use real records); `LASTCONTEXT.md` overwritten.
- [ ] PR description: what changed, what was verified, what the human must verify (10 URLs and 3 numbers per scope, the conflict-of-interest notes, the proposed parameter sources).
