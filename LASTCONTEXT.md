# Current state
- Branch: `task/ai-access-evidence`.
- Slide order (`TOUR_ORDER` in `web/src/tour/chartSteps.ts` and `buildSlides()` in `web/src/datasets/slides.ts`): `[INDEX_STEP, 0, 8, 5, 12, 14, 3, 21, 16, 27, 28, 26, 29, 17]` (slides 14, 15, and 16 — draft ids `22`, `23`, `24` — are now hidden from the tour and Data page).
- Slide 10 (`step === 28`, Tokens): 6-level triangular pyramid (`Nivel 1 · 24/7`, `Nivel 2 · P99`, `Nivel 3 · P90`, `Nivel 4 · P50`, `Nivel 5 · Pro`, `Nivel 6 · Base`) showing only level, percentile, and monthly token count inside the pyramid; no orange author bar on the right; humble white footnote `★ "Autor - últimos 30 días (8.000 M solo en claude code)"` at the foot of the pyramid; and downloadable `ai-token-pyramid` table in `Data` with sources `AI55`–`AI58` and `AI68`–`AI74`.
- Slide 11 (`step === 26`, LLM Adoption Pyramid): expanded to cover language models in general (ChatGPT, Claude, Gemini, Copilot, Meta AI, DeepSeek, Cursor) with Microsoft AI Economy Institute (`AI66`) and Menlo Ventures (`AI67`) sources, rendered as a 4-tier colorful geometric triangle (`.ai-triangle-4`).
- All new data tables and references (`AI30`–`AI74`) are registered in `Data` (`aiEvidenceTables.ts`, `quality.ts`, `references.ts`) and `README.md`.
- Local dev server running on `http://localhost:5174/`.
- Next: verify GitHub Actions CI run on `origin/task/ai-access-evidence`. No local test suites run per RULE #1.
