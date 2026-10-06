# Task: `references-page`

Branch: `task/references-page`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md` (binding for every color, spacing and typographic convention), `docs/data-pipeline.md`, `docs/data-dictionary.md`, `docs/terrain.md`, `docs/geo.md`, `scripts/datapipe/sources.py` (the source registry, URL normalization and coverage check), `data/schemas/sources.schema.json`, `scripts/precheck.py`, `web/package.json`, `web/vite.config.ts` and the shell code (layout, `Hud`, `MockBadge`) first.
Prerequisites: `shell` and `data-pipeline` are merged into `main`. If `scripts/datapipe/sources.py` does not contain the URL normalization and the source registry described in `docs/data-pipeline.md`, stop and tell me.

## Goal

A standalone References page that lists, with working links, every source that backs a number shown in the app, grouped and searchable, plus the attributions required by the terrain and the province geometry. The list is generated from the data that is actually published, so it cannot drift from the app. Sources that nobody opened are never presented as support.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No router and no new dependency. The page is a second Vite entry (`references.html`), not a scene: do not change the `Scene` type, the store, `KEY_MAP` or `KeyAction`.
- No narrative or methodology text (those are `docs-submission`). No software-credits list.
- No real sources and no real data: the registry file `sources.json` is produced by the data tasks. With only mock data the page shows an empty state.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
scripts/datapipe/references.py             build_references(...) and CLI: python -m datapipe build-references
data/schemas/references.schema.json        schema of web/public/data/references.json
web/references.html                        second Vite entry
web/src/references/main.tsx                entry point
web/src/references/ReferencesPage.tsx      the page
web/src/references/selectors.ts            pure view-model functions
web/src/references/citation.ts             formatCitation
web/src/types/references.ts                types and parseReferences (ajv.compile)
web/vite.config.ts                         add references.html to build.rollupOptions.input (export the inputs map so a test can read it)
```

Edit the shell footer or `Hud` to add one link, "Sources and methods", to `references.html` (same tab, `rel` not needed for same-origin), keyboard focusable, with a test. Make no other shell change.

## 2. Build step: `python -m datapipe build-references`

Reads `data/processed/sources.json` (the registry produced by `build-sources`), the published data files in `web/public/data/` (every `*.json` that is not `_manifest.json`, `_version.json`, `references.json`, `sources.json`), and the metadata files `web/public/terrain/*.json` and `web/public/geo/provinces.meta.json` when they exist. Writes `web/public/data/references.json`, deterministic (sorted keys, 2-space indent, trailing newline, no timestamps).

Content (schema `references.schema.json`, `additionalProperties: false`):

- `sources`: only sources that are **cited by at least one published record** and have `access == "opened"`. A record cites a source when its normalized `source_url` equals the normalized `url` of the source or of one of its `aliases` (use the normalization function from `datapipe.sources`; do not re-implement it). Each entry: `id`, `url`, `title`, `authors_or_publisher`, `publisher_type`, `publication_date` (date or null), `retrieved_at`, `language` (string or null), `license_or_terms` (string or null), `derived_from` (id or null), `used_by` (sorted list of published file names that cite it), `record_count` (integer: number of records that cite it, summed over files).
- `leads`: sources with `access == "not_opened"` (they never appear in `sources`), each `{ id, url, title, authors_or_publisher }`. The page shows them in a collapsed section titled "Not verified leads" with the sentence "These pages were not opened; no figure in this app relies on them."
- `attributions`: for each terrain and geometry metadata file that exists: `{ label, text, source_url }` where `text` is the metadata `attribution` and `label` is "Terrain" or "Province boundaries". Missing metadata files simply produce no entry.
- `stats`: `published_files` (count), `records_total` (count of records in files that have a `source` field), `records_without_url` (records whose `source_url` is null or absent, summed), `sources_used` (count), `retrieved_min` and `retrieved_max` (dates over the entries in `sources`, or null).
- `mock`: boolean, true when any published file contains a record with `source == "MOCK"`.

Failure conditions (exit code 1, message `ERROR <what> <reason>`, nothing written): a published record whose normalized `source_url` is non-null and matches no source in the registry (this reuses `check_sources_coverage`); a record that cites an `access == "not_opened"` source; `sources.json` present but invalid against its schema; an output that does not validate against `references.schema.json`. Exit code 2 for usage errors.

If `sources.json` does not exist: write the file with empty lists, zero stats, `mock` computed as above, and exit 0 (the page then shows its empty state).

Wire the command into `web/package.json` (`predev`, `build`, `build:release` run `sync-data` first and then the command; keep the existing order and behavior) and into `scripts/precheck.py`. Extend the `build:release` gate so that it also fails when `references.json` has `mock: true` or an empty `sources` list, printing which condition failed. Show in the PR that the normal dev build still passes with mock data and the release gate fails today for that reason.

## 3. Page (`ReferencesPage.tsx`)

Dark tokens only, tokens from `tokens.css` / `tokens.ts`, typography from `design.md`. Layout, top to bottom:

1. Title "Sources and attributions" and one line: "N sources back M published files. Retrieved between A and B." (from `stats`; with the empty state: "No sources are registered yet." and, when `mock` is true, the MOCK badge text "Sample data: these are not real sources").
2. Transparency line from `stats`: "R of T records have no link to a source page." shown only when `records_without_url > 0`.
3. Controls: a search box (filters by title and publisher, case-insensitive, accent-insensitive), and publisher-type chips (`aria-pressed`) built from the types present; a "Clear filters" button.
4. The list grouped by `publisher_type` in the fixed order of the enum in the schema, sections with a heading and the count. Each entry: title as an external link (`target="_blank"`, `rel="noopener noreferrer"`), `authors_or_publisher`, publication date (or "date not stated"), retrieved date, language if not null, license text if not null, "derived from <title>" (linking to the anchor of that entry if it is in the list, plain text otherwise), "used by: <files>", and a "Copy citation" button. Each entry has an anchor `id` equal to the source id so other pages can link to `references.html#<id>`.
5. Section "Attributions" listing `attributions`.
6. Collapsed section "Not verified leads" (a native `details` element) listing `leads`.
7. A link back to the app.

Accessibility: landmark roles, headings in order, the search input has a label, filter results announce the count in an `aria-live="polite"` region, all controls keyboard operable, no keyboard shortcut from the app is registered on this page. Print stylesheet: hide controls, show URLs after links, avoid page breaks inside an entry.

## 4. Pure functions

`selectors.ts`:
- `filterReferences(sources, { query, types })`: case- and accent-insensitive substring match on `title` and `authors_or_publisher`; empty query matches all; empty `types` matches all.
- `groupByType(sources)`: groups in the schema enum order, each group sorted by `title` (locale-independent comparison on normalized text), ties by `id`; empty groups omitted.
- `resolveDerived(sources)`: for each entry, the `derived_from` id resolved to the entry's title when present in the list, else `null`.

`citation.ts`: `formatCitation(source)` returns exactly `"<authors_or_publisher>. <title>. <year or 'n.d.'>. Retrieved <retrieved_at>. <url>"` (year from `publication_date`; a trailing period after the title is not doubled when the title already ends with one).

`types/references.ts`: types from the schema through the repo's existing mechanism and `parseReferences(json: unknown)` using `ajv.compile<References>`; no `as unknown as`.

## 5. Tests (write first)

Python (fixtures in `tmp_path`, no real data):
- Used-sources selection: a source cited by a published record appears with the right `used_by` and `record_count`; a registry source cited by nobody does not appear; a source cited through one of its aliases appears once; URL variants (case of host, trailing slash, fragment, `utm_*`) match through the shared normalization (use two fixture cases from the existing normalization table).
- `not_opened` sources go to `leads` and never to `sources`; a record citing a `not_opened` source fails with exit 1 and nothing written.
- A record with a non-null `source_url` absent from the registry fails with the file and record index.
- `attributions` built from terrain and geometry metadata files, in a fixed order; absent files produce none.
- `stats` exact on a small fixture (including `records_without_url`, `retrieved_min`, `retrieved_max`); `mock` true when a record has `source == "MOCK"`.
- No `sources.json`: exit 0 and the empty structure exactly; invalid `sources.json`: exit 1.
- Determinism: two runs give identical bytes. The output validates against `references.schema.json`; each schema case fails: extra field, bad date, `access` other than the allowed, missing `used_by`, negative `record_count`.
- No network: tests pass with `socket.socket` monkeypatched to raise.

TypeScript (Vitest, jsdom):
- `filterReferences`: query match, accent-insensitive, empty query, type filter, both together. `groupByType`: enum order, sorting, empty groups omitted. `resolveDerived`. `formatCitation`: exact strings for a full entry, for a null date (`n.d.`), and for a title ending with a period.
- `parseReferences` accepts valid and rejects each invalid case with an error naming the field.
- Page: empty state text; MOCK message when `mock` is true; list renders groups and counts; search and chips filter and the live region announces the count; clear filters; entry anchors exist; external links have `target` and `rel`; "Not verified leads" is inside a collapsed `details` and its sentence is present; "Copy citation" calls `navigator.clipboard.writeText` with the exact citation (mock the clipboard) and shows a short "Copied" status; no unhandled error if the clipboard is unavailable; the `records_without_url` line appears only when greater than zero.
- Shell footer link: present, points to `references.html`, focusable.
- Vite config: the exported inputs map contains `main` and `references` with existing files.
- Token drift test still passes; no color literal outside the token files.

## 6. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no color literal outside `tokens.ts` and `tokens.css`; no `as unknown as`; no change to the `Scene` type, the store or `KEY_MAP`.
- [ ] `npm run dev` serves `/references.html` with the empty state and the sample-data message; `npm run build` produces both pages.
- [ ] The release gate fails today (mock data, empty list) and the PR shows the exact failure output; the normal build still passes.
- [ ] No source with `access == "not_opened"` appears outside the collapsed leads section.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add "link each scene source line to references.html#<source_id>" as a later task, blocked until datasets carry `source_id`).
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel against `docs/design.md`; the wording of the empty, sample-data and leads texts; the decision that only cited and opened sources are listed; the citation format; that the footer link is acceptable in the shell).
