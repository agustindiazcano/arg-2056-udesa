# LASTCONTEXT.md

## State
- **Branch**: `task/slide1-default-percapita`
- **Features added**:
  1. **Diapositiva 1 (`WorldStep.tsx`) - Mayores economías de la región**:
     - Se configuró por defecto la métrica de comparación regional en `'percapita'` (PBI per cápita real, USD constantes de 2015).
     - Test unitario agregado en `web/tests/unit/worldReplay.test.tsx` verificando que la comparación regional abre con el botón "PBI per cápita" en `aria-pressed="true"`.
- **Precheck**:
  - `python scripts/precheck.py` 100% OK (PASS en ruff, pytest 343 tests, terrain 142 tests, validate-data, check-budget, references, web-lint, web-typecheck y web-test con 2048 tests unitarios).

## Next
- Merge / PR de `task/slide1-default-percapita`.
- Continuar con el plan de correcciones pendientes en `PENDING.md` (C8 `map-zoom-limits` y C7 `map-drill-transition`).
