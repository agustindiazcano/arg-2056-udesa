# Task: `contract`

Branch: `task/contract`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md` and `PENDING.md` first.

## Goal

Create the shared type contract, the dataset JSON Schemas and the base CI. Nothing else.
Strict TDD: write each failing test first, then the code, then refactor. Commit atomically.

## Out of scope (do NOT do)

- Do not install Vite, React, MapLibre, deck.gl, Three.js, D3, ECharts, GSAP, Zustand or Playwright.
- Do not load real data. Fixtures are fake and live under `*/fixtures/` or inside test files.
- Do not touch `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `LASTCONTEXT.md` except the final overwrite of `LASTCONTEXT.md` and the update of `PENDING.md`.
- Do not add dependencies other than the allowed list below.

## Allowed dependencies

- Web / TS: `typescript`, `vitest`, `ajv`, `ajv-formats`, `eslint` (with `typescript-eslint`).
- Python: `pytest`, `ruff`, `jsonschema`.
- Package manager: **npm** (commit `package-lock.json`). Do not use pnpm or yarn.

## 1. Types — `web/src/types/`

Create `web/package.json`, `web/tsconfig.json` (`"strict": true`, `noUncheckedIndexedAccess: true`) and `web/vitest.config.ts` as needed.

### `scene.ts`

```ts
export const SCENES = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
export type Scene = typeof SCENES[number];
```

Export `nextScene(s)` and `prevScene(s)`. They clamp at the ends (no wrap-around).

### `year.ts`

- `YEAR_MIN = 1810`, `YEAR_MAX = 2056`.
- `type Year = number & { readonly __brand: 'Year' }`.
- `parseYear(n: unknown): Year` throws `RangeError` if `n` is not an integer in `[YEAR_MIN, YEAR_MAX]`.

### `campaign.ts`

- `type DayOfCampaign = number & { readonly __brand: 'DayOfCampaign' }`.
- `parseDayOfCampaign(n: unknown): DayOfCampaign` throws `RangeError` unless `n` is an integer in `[0, 365]`.
- The exact campaign length is refined later in task `scene-andes`. Do not invent it here.
- `DayOfCampaign` and `Year` must be distinct types: assigning one to the other must fail type checking (add a `// @ts-expect-error` test).

### `scenario.ts`

```ts
export const SCENARIOS = ['pessimistic', 'expected', 'optimistic'] as const;
export type Scenario = typeof SCENARIOS[number];
```

### `province.ts`

`PROVINCES` is a readonly array of `{ id, name }` with exactly these 24 entries. Copy them; do not recall them from memory.

| id | name |
|---|---|
| AR-A | Salta |
| AR-B | Buenos Aires |
| AR-C | Ciudad Autónoma de Buenos Aires |
| AR-D | San Luis |
| AR-E | Entre Ríos |
| AR-F | La Rioja |
| AR-G | Santiago del Estero |
| AR-H | Chaco |
| AR-J | San Juan |
| AR-K | Catamarca |
| AR-L | La Pampa |
| AR-M | Mendoza |
| AR-N | Misiones |
| AR-P | Formosa |
| AR-Q | Neuquén |
| AR-R | Río Negro |
| AR-S | Santa Fe |
| AR-T | Tucumán |
| AR-U | Chubut |
| AR-V | Tierra del Fuego, Antártida e Islas del Atlántico Sur |
| AR-W | Corrientes |
| AR-X | Córdoba |
| AR-Y | Jujuy |
| AR-Z | Santa Cruz |

Export `type ProvinceId = typeof PROVINCES[number]['id']` and `isProvinceId(x: unknown): x is ProvinceId`.

### `keys.ts`

```ts
export type KeyAction =
  | { type: 'nextScene' } | { type: 'prevScene' }
  | { type: 'togglePlay' }
  | { type: 'speedUp' } | { type: 'speedDown' }
  | { type: 'setScenario'; scenario: Scenario }
  | { type: 'toggle3D' }
  | { type: 'openProvinceFilter' }
  | { type: 'back' };
```

Export `KEY_MAP: Readonly<Record<string, KeyAction>>` keyed by `KeyboardEvent.key`:

| key | action |
|---|---|
| `ArrowRight` | nextScene |
| `ArrowLeft` | prevScene |
| ` ` (space) | togglePlay |
| `+` and `=` | speedUp |
| `-` | speedDown |
| `1` / `2` / `3` | setScenario pessimistic / expected / optimistic |
| `d` | toggle3D |
| `p` | openProvinceFilter |
| `Escape` | back |

Export `resolveKey(key: string): KeyAction | undefined`. It is case-insensitive for letters.

### `index.ts`

Re-export everything.

### Tests (write first) — `web/tests/unit/`

- `parseYear`: accepts 1810 and 2056; rejects 1809, 2057, 1900.5, `NaN`, `'1900'`, `null`.
- `parseDayOfCampaign`: accepts 0 and 365; rejects -1, 366, 1.5, `NaN`.
- `nextScene` / `prevScene`: clamp at both ends; walking through all scenes visits each exactly once.
- `SCENES` has 6 unique entries.
- `PROVINCES` has 24 entries, all ids unique, all match `/^AR-[A-Z]$/`.
- `KEY_MAP`: no two keys map to the same action except `+` and `=`; `resolveKey('D')` equals `resolveKey('d')`; unknown key returns `undefined`.
- Type test: `Year` is not assignable to `DayOfCampaign` and vice versa.

## 2. JSON Schemas — `data/schemas/`

Draft 2020-12. One file per dataset. Common rules for **every** record:

- `source`: string, `minLength: 1`, **required**.
- `retrieved_at`: string, `format: date`, **required**.
- `note`: string, optional, **but required whenever any numeric `value` is `null`** (use `if/then`).
- `additionalProperties: false`.

Schemas:

1. `economy_series.schema.json` — `{ country (ISO 3166-1 alpha-3), year (int 1810–2056), indicator (enum: gdp_constant_usd, gdp_per_capita_usd, population, hdi, exports_usd, imports_usd), value (number|null), unit (string), source, retrieved_at, note? }`
2. `resource_production.schema.json` — `{ resource (enum: lithium, copper, gold, silver, oil, gas, soy, wheat, corn, other), geo ("AR" or a province id matching ^AR-[A-Z]$), year, value (number|null), unit, source, retrieved_at, note? }`
3. `population.schema.json` — `{ geo, year, value (number|null), unit, source, retrieved_at, note? }`
4. `andes_events.schema.json` — `{ id, name, day_of_campaign (int 0–365), date (string, ISO date), date_precision (enum: day, month, year, approximate), lat, lon, elevation_m (number|null), forces: [{ side (string), men (int|null), note? }], estimate_range? { min, max }, source, retrieved_at, note? }`

Each dataset file is a JSON array of records.

### Tests (write first) — `data/tests/` (pytest + `jsonschema`)

For each schema:
- A valid fixture passes.
- A record **without `source`** fails.
- A record **without `retrieved_at`** fails.
- A record with `value: null` and **no `note`** fails; with a `note` passes.
- A record with an unknown extra field fails.
- A record with `retrieved_at: "yesterday"` fails.

Plus: every schema file is itself valid Draft 2020-12 (`jsonschema.Draft202012Validator.check_schema`).

Also add `scripts/validate_data.py`: validates every `data/processed/<name>.json` against `data/schemas/<name>.schema.json`; exits non-zero on any failure or on a processed file with no matching schema. With an empty `data/processed/` it exits 0.

## 3. CI — `.github/workflows/ci.yml`

Triggers: `pull_request` and `push` to `main`.

Active jobs:
- `web`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` (working directory `web/`).
- `python`: Python 3.12, `pip install -r requirements-dev.txt` (create it: `pytest`, `ruff`, `jsonschema`), `ruff check .`, `pytest`.
- `data`: `python scripts/validate_data.py`.

Deferred jobs (mutation testing, backtest gate, TS/Python parity, Playwright visual): add them as **commented-out blocks** with a one-line `# enable in task <name>` note. Do NOT use `|| true`, `continue-on-error`, or `if: false` tricks that report green without running.

Add `web/package.json` scripts: `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`).

## 4. Acceptance checklist

- [ ] Every test was committed failing first (visible in git history), then made green.
- [ ] `source` and `retrieved_at` are `required` in all four schemas, and the "missing source" tests fail if the line is removed.
- [ ] `parseYear` and `parseDayOfCampaign` have the border cases above.
- [ ] No dependency outside the allowed list; `package-lock.json` committed.
- [ ] CI runs only real jobs; deferred jobs are commented out, not faked.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` task 1 moved to Done.
- [ ] PR description lists: what changed, what was verified, what the human must verify (province list vs ISO 3166-2:AR).
