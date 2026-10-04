# Last Context

## State
- Task `deploy` on branch `task/deploy` (host: Vercel). precheck OK, 61 Playwright tests pass locally. Pushed, CI not checked.
- Metadata: `web/src/content/meta.ts` (placeholder, fails the release gate), `metaTags.ts` (pure tags + inline vite plugin, dev build warns), `appTitle.ts`. `scripts/check_release_assets.py` (og.png 1200x630 PNG <= 600 KB, favicon.svg not placeholder), wired into `build:release`. `robots.txt`, favicon link in both html files.
- Data cache busting: `web/src/data/version.ts` (`getDataVersion`, `versionedUrl`), used by `useDataset`, the App forecast load and the references page; terrain (`terrainVersion`) and geometry (`input_sha256`, metadata read first) use their own hashes.
- Headers: `web/headers.config.json` -> `scripts/gen-headers.ts` -> `dist/_headers` and the headers of the ROOT `vercel.json` (`--check` is a unit test). Strict CSP, no unsafe-eval.
- Validators are precompiled: `web/src/validation/generated.js` (Ajv standalone, `npm run gen:validators`, `--check` test); no Ajv in `src`. Initial main 117 KB -> 102 KB gzip.
- CSP e2e: `web/e2e/csp.spec.ts` + `helpers/staticServer.ts` serve `dist` with the real headers; zero violations. Tolerated 404: `/geo/provinces.meta.json` (`MISSING_FOR_NOW`).
- CI job `release` (tags `v*` and dispatch). `E2E_SKIP_BUILD=1` makes Playwright serve the existing dist.
- `scripts/smoke_deployed.py <url> [--expect-real-data]`. `docs/deploy.md`, release checklist updated.

## Decisions
- Human chose precompiled validators over `unsafe-eval` (the CSP broke the whole app because Ajv compiled schemas with eval). All validators now report every error.
- Headers go to the root `vercel.json` (the Vercel project builds from the root); the brief said `web/vercel.json`.
- Vercel Analytics and Speed Insights stay (the brief said no analytics; the human asked for them).
- `ruff check --fix` was used once to sort imports in a test file.

## Next step
- Human: merge; review the CSP and header rules; supply description, final URL, og.png, favicon; run the first Vercel deploy and `smoke_deployed.py`; check the Analytics scripts under the CSP.
- Not verified: Vercel header precedence for overlapping rules, the real deploy, Analytics under the CSP.
