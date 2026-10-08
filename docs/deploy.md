# Deploy

How the site is built, served and checked. The host is **Vercel** (decided by the human). Files for Cloudflare Pages and
Netlify are generated too, so a change of host needs no code.

## 1. What the build produces

| File | What it is |
|---|---|
| `web/dist/` | the static site (`npm run build` in `web/`) |
| `web/dist/_headers` | the header rules in the Cloudflare Pages and Netlify format |
| `vercel.json` (repository root) | the header rules in the Vercel format, plus the build settings. The Vercel project builds from the repository root, so the generated `headers` go here and the other keys are kept. |

Both header formats come from one file, `web/headers.config.json`, through `web/scripts/gen-headers.ts` (part of
`npm run build`). `tsx scripts/gen-headers.ts --check` (also a unit test) fails when the committed `vercel.json` headers
are not what the config generates: after editing the config, run `npm run build` and commit `vercel.json`.

### Header rules

| Path | Cache-Control |
|---|---|
| `/assets/*` (hashed build files) | `public, max-age=31536000, immutable` |
| `/` and `/*.html` | `public, max-age=0, must-revalidate` |
| `/data/*` | `public, max-age=31536000, immutable` (safe because every request carries `?v=<data_version>`) |
| `/data/_version.json` | `no-cache` |
| `/terrain/*`, `/geo/*` | `public, max-age=86400` |

Security headers on everything: the Content-Security-Policy below, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`,
`Cross-Origin-Opener-Policy: same-origin`. `Strict-Transport-Security` is not in the file: the hosts add it, and the smoke
script checks it on the deployed URL.

When two rules match one file the later one wins for the same header, so the specific rules come last. That is how
`/data/_version.json` gets `no-cache` although `/data/*` matches it. Hosts differ in how they combine rules, which is why
the smoke script checks the real answer of the deployed host.

### Content-Security-Policy

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.maptiler.com; font-src 'self';
connect-src 'self' https://api.maptiler.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
```

- The only other origin is `https://api.maptiler.com` (satellite imagery, terrain and fonts of the Andes map, loaded by MapLibre; `VITE_MAPTILER_KEY` is read at build time and is public in the bundle, so restrict it by allowed origins in the MapTiler account). The policy has no `unsafe-eval`.
- `style-src` needs `'unsafe-inline'` because ECharts writes inline styles on its elements.
- No `eval` is needed because the schema validators are **precompiled at build time**
  (`web/src/validation/generated.js`, made by `npm run gen:validators` from `data/schemas`; `gen-validators --check` is a
  unit test). After changing a schema in `data/schemas/`, run it and commit the result.
- `worker-src blob:` and `img-src blob:` are there for the map and terrain work to come.
- Vercel Web Analytics and Speed Insights load from `/_vercel/...` on the same origin, which `'self'` allows. They are only
  on in a Vercel build, so the CSP end-to-end run does not exercise them: check the browser console on the first preview.

## 2. Data cache busting

`_version.json` is read once per page load (`cache: 'no-store'`) and every data file is requested as
`/data/<file>.json?v=<data_version>`. If `_version.json` cannot be read the files are requested without the query and the
app still works. Terrain and province geometry use the hash in their own metadata (`dem_inputs`, `input_sha256`).
The province loader now reads `provinces.meta.json` before `provinces.geojson`, because the hash is in the metadata.

## 3. Page metadata (human deliverables)

`web/src/content/meta.ts` holds the title, description, final URL and preview image path. It is a placeholder
(`placeholder: true`, URL `https://example.invalid/`), which the release gate rejects. The human supplies:

| Deliverable | Where | Check |
|---|---|---|
| description and final URL | `web/src/content/meta.ts`, set `placeholder: false` | release gate (`check_no_mock.py --content`) |
| preview image | `web/public/og.png`, PNG, exactly 1200x630, at most 600 KB | `scripts/check_release_assets.py` |
| favicon | `web/public/favicon.svg` (the placeholder text `PLACEHOLDER` must go) | `scripts/check_release_assets.py` |

`npm run build` only warns about them; `npm run build:release` fails.

## 4. Release

1. Replace the mock data and the placeholders; read `docs/release-checklist.md`.
2. Tag: `git tag v<version>` and push the tag. The CI job `release` runs `python scripts/precheck.py`,
   `npm run build:release`, `npm run check:bundle` and the Playwright suite against the release build, then uploads
   `web/dist` as the artifact `site`. It fails while any gate fails; there is no `continue-on-error`.
3. Deploy: Vercel builds the pushed commit by itself (`vercel.json`), or deploy the `site` artifact on another host.
4. Smoke the deployed URL: `python scripts/smoke_deployed.py https://<your-domain> --expect-real-data`. Exit 0 means every
   check passed; each line is `PASS <name>` or `FAIL <name> <reason>`.
5. Link previews: paste the URL in the social tools you use (the sharing debuggers of the networks) and look at the card.

The expected-failure step of the pull request job (`Release gate fails on mock data`) stays until real data lands; delete
it in the same PR that makes the release gate pass (`docs/release-checklist.md`, item 1).

### Rollback

Redeploy the previous tag (Vercel: Deployments > the previous production deployment > Promote, or push the old tag again).
Data files are cached for a year but keyed by `?v=`, and `_version.json` is never cached, so a rollback serves the old
data version at once.

## 5. Choosing or changing the host (questions for the human)

These are questions to check at the time of choosing, not claims.

| Question | Vercel (current) | Cloudflare Pages | Netlify |
|---|---|---|---|
| Transfer quota and fair-use terms of the plan? | check | check | check |
| Build minutes included? | check | check | check |
| Does it read `_headers` or `vercel.json` headers? | `vercel.json` | `_headers` | `_headers` |
| Custom domain and HTTPS included? | check | check | check |
| Preview deployments per pull request? | yes (verify on the plan) | check | check |
| Is the project a commercial or competition use the plan allows? | check | check | check |

For Cloudflare Pages or Netlify: build command `cd web && npm ci && npm run data:sync && python ../scripts/build_references.py
&& npm run build`, output `web/dist` (the `_headers` file is already inside it).

## 6. Not verified

- The build and headers on Vercel itself: the generated `vercel.json` patterns follow the Vercel documentation but were not
  run there. The first deploy plus `smoke_deployed.py` is the check.
- The Vercel Analytics and Speed Insights scripts under the CSP (see above).
- The precedence of overlapping header rules on each host (see section 1).
