# Current state
- Branch: `task/ai-access-evidence`.
- Slide order (`TOUR_ORDER` in `web/src/tour/chartSteps.ts` and `buildSlides()` in `web/src/datasets/slides.ts`): `[INDEX_STEP, 0, 8, 3, 21, 28, 16, 26, 5, 12, 14, 27, 29, 17]`.
- AI Impact slide (`step === 3`, now slide 3 in the tour, `AiStep.tsx`): added explicit clarification `"Curva verde, si Argentina creciera a la tasa del escenario optimista"` in the left chart banner when `"Argentina"` (`scope === 'arg'`) is selected, and ensured full coherence across the left chart, right auxiliary charts (`PBI per cápita de Argentina`, `Población de Argentina`), and right indicators table across all 3 scopes (`Argentina`, `Mundo`, `Se suben a la ola vs. Como Argentina`).
- Rule of 70 slide (`step === 5`, now slide 8 in the tour, `Rule70Step.tsx`): hid the confusing `"Cuánto se equivoca cada regla, según la tasa"` chart and replaced it with a clear plain-language explainer table (`"¿Cómo funciona la regla del 70 en forma simple?"`, `70 ÷ tasa`).
- Slide 10 (`step === 28`, now slide 5 in the tour, Tokens): 6-level triangular pyramid (`Nivel 1 · 24/7` to `Nivel 6 · Base`), no orange author bar on the right, humble white footnote `★ "Autor - últimos 30 días (8.000 M solo en claude code)"` below the pyramid, and `ai-token-pyramid` table in `Data`.
- Local dev server running on `http://localhost:5174/`.
- Next: verify GitHub Actions CI run on `origin/task/ai-access-evidence`. No local test suites run per RULE #1.
