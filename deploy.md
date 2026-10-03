# Task: `deploy`

Branch: `task/deploy`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md`, `docs/release-checklist.md`, `web/vite.config.ts`, `web/package.json`, `web/index.html`, `web/references.html`, `web/src/data/useDataset.ts` and its tests, `web/src/data/registry.ts`, `.github/workflows/*.yml`, the release gate (`build:release`) and the content gate for `placeholder: true` first.
Prerequisites: `integration` and `references-page` are merged into `main`. `performance-a11y` should be merged first; if it is not, say so in the PR.

## Goal

Everything needed to publish the application as a static site that survives being shared widely: host-neutral cache and security headers, data cache busting, link-preview metadata (title, description, preview image) that cannot go out as a placeholder, a release job, and a smoke script that checks a deployed URL. The hosting provider is the human's decision; this task produces artifacts for both common static hosts without depending on either.

Strict TDD where it applies. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No hosting account, token, secret or deploy automation that needs credentials. No analytics, trackers, cookies or third-party scripts, fonts or embeds (the e2e suite already fails on cross-origin requests; keep it that way).
- No new dependency in npm. The Vite plugin below is written inline in `vite.config.ts`.
- No visual redesign. The preview image is supplied by the human; do not generate or fabricate one.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Page metadata

`web/src/content/meta.ts` exports `META = { title, description, url, ogImage, themeColor, placeholder }`:
- `title` uses the existing app title constant (do not choose a new title); `description` is "Placeholder description. Replace before release." with `placeholder: true`; `url` is `https://example.invalid/` (a reserved invalid host, clearly fake); `ogImage` is `/og.png`; `themeColor` is the page background token value.
- The existing placeholder gate (the one behind `build:release`) fails while `placeholder` is true, and an additional release check fails when `web/public/og.png` does not exist, when it is not a PNG of exactly 1200 by 630 pixels (read the header bytes; no image library), or when it is larger than 600 KB. Messages say which condition failed. The normal dev build only warns.

An inline Vite plugin (`transformIndexHtml`) injects into both HTML entries: `<title>`, `<meta name="description">`, `<meta name="theme-color">`, `<link rel="canonical">`, Open Graph tags (`og:type` website, `og:title`, `og:description`, `og:url`, `og:image` as an absolute URL built from `META.url` and `ogImage`, `og:image:width`, `og:image:height`) and `twitter:card` `summary_large_image`. The references page gets its own title ("Sources and attributions | <title>"). The function that builds the tags is pure and exported for tests. Escape all values for HTML attributes.

## 2. Data cache busting

`useDataset` first reads `_version.json` once per page load (shared promise, `cache: 'no-store'`) and requests every data file with the query `?v=<data_version>`. If `_version.json` cannot be read, it requests the files without the query and the scene still works (no crash, a console-free fallback). The terrain and geometry loaders append the same `?v=` using the version found in their own metadata sha256 fields (`dem_inputs` hash for terrain, `input_sha256` for geometry, truncated to 12 characters) when available.
- Tests: exact request URLs with and without a version; one `_version.json` request for several datasets; fallback when it fails; existing hook tests keep passing.
- In the e2e suite add one test asserting that data requests carry `?v=`.

## 3. Headers (host-neutral)

Create the header rules once as data in `web/headers.config.json` and generate both host formats from it with a script `web/scripts/gen-headers.ts` (run with `tsx`, part of `npm run build`): `web/dist/_headers` (the format used by Cloudflare Pages and Netlify) and `web/vercel.json` `headers` section (merge with an existing `vercel.json` if present; otherwise create it). A test checks that both outputs are generated from the same config and contain the same rules.

Rules:
- `/assets/*` (hashed build files): `Cache-Control: public, max-age=31536000, immutable`.
- `/*.html` and `/`: `Cache-Control: public, max-age=0, must-revalidate`.
- `/data/*`: `Cache-Control: public, max-age=31536000, immutable` (safe because requests carry `?v=`); `/data/_version.json`: `Cache-Control: no-cache`.
- `/terrain/*` and `/geo/*`: `Cache-Control: public, max-age=86400`.
- Security headers on everything: `Content-Security-Policy` with `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (ECharts writes inline styles; note this in the file), `img-src 'self' data: blob:`, `font-src 'self'`, `connect-src 'self'`, `worker-src 'self' blob:`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`; `Cross-Origin-Opener-Policy: same-origin`. No `Strict-Transport-Security` in the file (hosts add it; the smoke script only checks it on the deployed URL).
- Static tests: the CSP contains every directive above exactly; no `'unsafe-eval'`; no wildcard origins; every path pattern appears once.

Check by running the built site under the CSP: add an e2e project (or a test) that serves `dist` with these headers applied by a tiny Node static server written in the test helper using only Node built-ins, loads every scene, and fails on any CSP violation event (`securitypolicyviolation`) or console error. If a violation reveals that a scene needs a looser directive, stop and tell me; do not loosen the policy silently.

## 4. Other static files

`web/public/robots.txt` allowing everything and no sitemap (single-page experience); `web/public/favicon.svg` is supplied by the human: if it is missing, the release check fails with a clear message and the dev build warns; reference it from both HTML entries. No service worker.

## 5. Release job

A CI workflow job `release` that runs only for tags matching `v*` and for manual dispatch: install, `python scripts/precheck.py`, `npm run build:release`, bundle budget check, the e2e suite against the release build, and upload `web/dist` as an artifact named `site`. It must fail while any gate fails; no `continue-on-error`. The existing expected-failure step for the release gate (from `integration`) stays on pull requests and is not part of this job. Document in `docs/deploy.md` that the human removes that step when real data lands.

## 6. Smoke script for a deployed URL

`scripts/smoke_deployed.py <base-url> [--expect-real-data]` (Python standard library only; this script is the one place network access is intended; it never runs in the unit tests against the internet):
- Fetches `/`, `/references.html`, `/data/_version.json`, `/robots.txt`, `/favicon.svg`, `/og.png`, every file listed in `/data/_manifest.json` with `?v=<version>`, and the terrain and geometry metadata when `/data/_manifest.json` or the page references them.
- Asserts: status 200; the content types; the `Cache-Control` of each class of file equals the config; the security headers equal the config; `Content-Encoding` is `br` or `gzip` for JS, CSS, JSON and HTML; `Strict-Transport-Security` is present when the URL is `https`; the URL scheme is `https` unless the host is `localhost`; the HTML contains the Open Graph tags and `og:image` is an absolute `https` URL that returns 200 with `image/png`; with `--expect-real-data` the manifest has no `origin: mock` and `/data/references.json` has `mock: false`.
- Output: one line per check `PASS <name>` or `FAIL <name> <reason>`; exit 0 only if all pass; exit 1 any failure; exit 2 usage error or unreachable host.
- Tests (pytest) start a local `http.server` thread serving a temporary directory with a custom handler that sets headers, and cover: all checks pass on a correct fixture; each failure class (wrong cache header, missing security header, missing compression, missing OG tag, relative `og:image`, mock origin under `--expect-real-data`, 404 file) produces the exact `FAIL` line and exit 1; an unreachable port exits 2. These tests use only `localhost`.

## 7. Docs (`docs/deploy.md`)

Decision table for the human, with the facts the human must verify at the time of choosing (transfer quota and fair-use terms of the plan, build minutes, header file support, custom domain and HTTPS, preview deployments) written as questions, not as claims. The exact steps for each of the two hosts using the generated files; how to point the host at `web/dist` and the build command; how to publish a release (tag, wait for the `release` job, deploy the artifact or let the host build, run the smoke script); the rollback procedure (redeploy the previous tag); how to test link previews (paste the URL in the social tools the human uses); what the CSP allows and why `style-src` needs `'unsafe-inline'`; and a note that the preview image, favicon, description and final URL are human deliverables.

## 8. Tests (write first where applicable)

Meta tags function (exact output string for a fixture, escaping of quotes and ampersands, absolute `og:image`, the references title); the release checks for placeholder, missing/invalid/oversized `og.png` (build PNG header bytes in the test: signature, IHDR width 1200 and height 630; also wrong size, not a PNG, too large), missing favicon; `useDataset` versioning; headers generation (same rules in both formats, exact values, CSP directives, no `'unsafe-eval'`); the CSP e2e run; the smoke script suite; the workflow file is syntactically valid and the `release` job lacks `continue-on-error` (parse the YAML in a test with the parser already available in the repository, or a plain text assertion if none exists). All tests assert exact values and messages; none writes inside the real `data/` or `web/public/` (use temporary directories; the `og.png` fixtures are generated in temporary directories).

## 9. Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes; the CI result was read or the PR says "pushed, CI not checked".
- [ ] No npm dependency added; no analytics or third-party origin anywhere; no secrets; no checker silenced; no `as unknown as`.
- [ ] Both header formats are generated from one config; the CSP e2e shows zero violations on every scene.
- [ ] `build:release` fails today and the PR shows each failing condition (mock data, placeholder meta, missing `og.png` and favicon); the dev build only warns about the metadata.
- [ ] `docs/deploy.md` written; `docs/release-checklist.md` updated with the human deliverables (description, URL, preview image, favicon, host choice, smoke run).
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the CSP and whether any scene needs more, the cache rules, the version query behavior, the smoke script against a real deployment, the host decision, the human deliverables).
