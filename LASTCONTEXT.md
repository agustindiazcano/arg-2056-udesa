# Last Context

## State
- Task `model-design` (documentation only) on branch `task/model-design`.
- Added `docs/model-design.md` (about 5,500 words), `docs/assumptions.md` (34 entries), `docs/decisions.md` (7 entries). Updated `PENDING.md` (model queue replaced by 14 implementation tasks).
- Independent audit of `main` is in PR #17 (`docs/audits/main.md`): verdict safe with fixes; blocker F1 (model code without design) is addressed by this task.
- No code, schema, data or mock changed.

## Decisions (proposals, waiting for the human)
- Scenarios are conditional terciles of the TFP-growth driver within one joint distribution.
- Resources are a separate additive block; project capex stays outside core investment.
- AI overlay modifies TFP growth only and is independent of the scenario.
- Backtest: train to 2005, test 2006-2025, single origin 2005, criteria C1-C5 written before any run.

## Not available
- `docs/sources.md`, `docs/research-prompts.md`, `data/raw/research/` do not exist: no parameter has a `source_id`; all are `needs_source` or `assumption`.
- No age-structured population dataset contract; no real series.

## Next step
- Human reviews section 9 of `docs/model-design.md` (open decisions) and `docs/assumptions.md`.
- Then start `model-params`, `model-population-hardening`, `population-age-contract`, `model-growth-core`.
- Pushed, CI not checked.
