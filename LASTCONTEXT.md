# Last Context

## State
- Task `references-page` on branch `task/references-page`: a build step that turns the source registry into `references.json`, and a standalone page that lists the sources behind every published file.
- Python: `scripts/datapipe/references.py` (`build_references`, `write_references`, `ReferencesError`), `data/schemas/references.schema.json`, CLI `python -m datapipe build-references` and the wrapper `scripts/build_references.py` (exit 0 / 1 errors / 2 usage). Only opened sources that a record cites are listed; not-opened sources become "leads"; terrain and province-boundary attributions come from their metadata files; output is deterministic (sorted keys, LF).
- Release gate: `scripts/check_no_mock.py --references FILE` fails when `mock` is true or no source is listed; the default run checks `web/public/data/references.json` when it exists. `npm run build:release` builds references first and passes `--references`. `scripts/precheck.py` has a ninth step `references`.
- Web: `web/references.html`, `web/src/references/{ReferencesPage.tsx,main.tsx,selectors.ts,citation.ts,references.css}`, `web/src/types/references.ts` (ajv parser), `vite.config.ts` exports `inputs` (app + references). The shell Hud has a "Sources and methods" link. Page: grouping by publisher type, accent-insensitive search, type chips, copy citation, derived-from anchors, attributions, collapsed leads, print styles.
- Removed the dead `test` block from `vite.config.ts` (`vitest.config.ts` is the real config). `KeyAction`, `KEY_MAP`, store untouched. No new dependency.
- TDD: each test commit precedes its implementation. `python scripts/precheck.py`: all 9 steps pass.

## Decisions
- Records are matched to sources by `source_url` through `normalize_url`; a record with a `source` but no `source_url` counts in `records_without_url`.
- With no `sources.json` the file is written empty (not an error) so dev and CI keep working; the release gate is what blocks it.
- `vite.config.ts` resolves the HTML entries from `process.cwd()` (vite and vitest both run from `web/`).

## Next step
- Human: review the PR; `npm run build:release` fails today on purpose (mock data, no registered sources). Check the page wording and layout in `npm run dev` at `/references.html`.
- Observation: tracked `web/fix_ts.ts` has lint errors when running `eslint .` from `web/` (the precheck lint passes); looks like a stray file, not touched.
- Next in `TASKS.md`: `storytelling-substeps`, then `integration`.
- Pushed, CI not checked.
