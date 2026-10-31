# Current state
- Branch: `task/ai-access-evidence`.
- Slide order (`TOUR_ORDER` in `web/src/tour/chartSteps.ts` and `buildSlides()` in `web/src/datasets/slides.ts`): `[INDEX_STEP, 0, 8, 5, 12, 14, 3, 21, 16, 27, 28, 26, 29, 17, 22, 23, 24]`.
- Slide 10 (`step === 28`, Tokens): removed the author slice from the pyramid and log bars so the triangular pyramid has 6 clean levels (`Nivel 1` to `Nivel 6`) and the author appears only in the compact white footnote at the foot of the pyramid (`★ "Autor - últimos 30 días (8.000 M solo en claude code)"`); added small methodology caption detailing Jellyfish's sample (thousands of engineers across hundreds of companies using Claude Code, Cursor, and GitHub Copilot; P50 = 51 M / ~$81, P90 = 380 M, top 2% ~2.000–2.200 M, heaviest quintile ~2.500 M/month, P99 spend ~$2.452/month), VibeCafé P99 (~4.800 M/month in Claude Code), Cursor Insights (top 10% = ~2/3 of tokens), Anthropic (~$13/day active, 90% <$30/day), and Epoch AI (`AI68`–`AI74`).
- Slide 11 (`step === 26`, LLM Adoption Pyramid): expanded to cover language models in general (ChatGPT, Claude, Gemini, Copilot, Meta AI, DeepSeek, Cursor) with Microsoft AI Economy Institute (`AI66`) and Menlo Ventures (`AI67`) sources, rendered as a 4-tier colorful geometric triangle (`.ai-triangle-4`).
- Sources `AI56`–`AI74` added to `aiEvidenceRefs.ts`, `slides.ts`, `README.md`, and `PENDING.md`.
- Local dev server running on `http://localhost:5174/`.
- Next: verify GitHub Actions CI run on `origin/task/ai-access-evidence`. No local test suites run per RULE #1.
