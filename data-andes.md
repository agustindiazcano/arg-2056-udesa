# Task: `data-andes`

Branch: `task/data-andes`. One PR. Read `AGENTS.md` (section 6, data rules, including the rule for contested historical figures), `LASTCONTEXT.md`, `PENDING.md`, `docs/data-pipeline.md`, `docs/data-dictionary.md`, `docs/terrain.md`, `data/schemas/andes_events.schema.json`, `data/schemas/raw_manifest.schema.json`, `data/schemas/sources.schema.json`, `data/mock/andes_events.json`, `scripts/datapipe/` (the runner, the adapter protocol, the sources registry, `scripts/datapipe/adapters/__init__.py`), `scripts/validate_data.py`, `scripts/build_references.py` and the files under `data/raw/research/andes/` first.
Prerequisites: `data-pipeline` and `references-page` are merged (they are). **Human input before the task starts, otherwise stop and tell me what is missing:** the research session for the Andes done, its files in `data/raw/research/andes/`, and the human's verification of 10 URLs and 3 numbers of that research (`docs/data-pipeline.md`, "Human verification rule").

## Goal

The real data of the Andes scene: the events of the crossing of 1817 (battles, camps, passes, dates, places, forces and their disputed ranges), built from registered raw files through a deterministic adapter into `data/processed/andes_events.json`, validated by the existing schema, with every record's source and retrieval date, and every contested figure as a range with a note. The scene (`andes-integration`) reads this file; it never reads the mock once this lands.

Strict TDD for the adapter. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **No invention and no silent filling.** A figure the sources do not give is `null` with a `note` (the schema requires the note when `men` is `null`). Nothing is interpolated, averaged or rounded to look cleaner. No fact that is not in a registered source.
- **Do not choose between historians' figures on your own.** `AGENTS.md` section 6: one primary source per figure, the range marked, the alternatives listed in `docs/sources.md`. Which source is the primary one is the human's decision; list the options with their numbers and stop on any figure where the research files disagree and name no primary.
- No network access, in the adapter or in tests. No schema change (if the schema cannot hold something the research found, stop and tell me what). No mock data change. No UI. No new dependency.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Steps

1. **Register the raw files**: `python -m datapipe register andes <file> --source "..." --retrieved-at YYYY-MM-DD` for each file (the command and its flags are in `docs/data-pipeline.md`); the manifest is committed. A file that cannot be redistributed goes to `data/raw/_private/andes/` with `redistributable: false` as the pipeline doc says.
2. **Write the adapter** `scripts/datapipe/adapters/andes.py` with `DATASET_ID`, `OUTPUTS` (`andes_events.json` to `andes_events.schema.json`) and a **pure** `build(files, manifest)`; register it in `adapters/__init__.py`. Copy the field names and enums from the schema, not from memory.
3. **Run the pipeline** to write `data/processed/andes_events.json` and `_provenance.json` (hashes); do not hand-edit anything under `data/processed/`.
4. **Sources registry**: add each source of the dataset to `data/processed/sources.json` (the file the References page reads; see `references-page.md` for its fields) and run `python scripts/build_references.py`. Contested figures get their alternatives in `docs/sources.md` (create the file if it still does not exist, following `AGENTS.md` section 6).
5. **Overlay**: `npm run data:sync` overlays processed over mock; check the scene's data smoke test still passes.
6. **Data to verify**: list every number that will appear in the UI under "Data to verify" in `PENDING.md` until the human confirms it against the original source (`AGENTS.md` section 6).

## 2. Tests (write first)

- The adapter builds the expected records from a small fixture that mimics the real raw format (created in a temporary directory; tests never write inside `data/`): field mapping, `date_precision` handling, the `men: null` with `note`, an `estimate_range` for a contested figure, the order of the events, `day_of_campaign` within 0 to 365.
- `build` is pure: two runs give identical output; it reads only the files it is given.
- Negative cases with the exact message: a missing required column, a date that does not parse, a latitude or longitude outside Argentina and Chile's plausible box for the campaign (the box is a constant with a comment; if you cannot justify it from the terrain bounding boxes in `terrain/config.json`, use those), a negative or non-integer count, an event without a source.
- The processed file validates against the schema and the checks of `scripts/validate_data.py`; every record has `source` and `retrieved_at`.
- The provenance hash matches the processed file.
- The data budget (`scripts/check_data_budget.py`) still passes.

## 3. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Every figure traces to a registered source; every contested figure is a range with a note and alternatives in `docs/sources.md`; no primary source chosen by the agent.
- [ ] Raw files registered; `andes_events.json` and `_provenance.json` produced by the pipeline; `sources.json` updated and `references.json` rebuilt.
- [ ] `PENDING.md`: "Data to verify" lists the numbers; `LASTCONTEXT.md` overwritten.
- [ ] PR description: what changed, what was verified, what the human must verify (10 URLs and 3 numbers, the primary-source choices, the coordinates against the terrain bounding boxes).
