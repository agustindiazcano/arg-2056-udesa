# LASTCONTEXT.md

## State
- **Branch**: `task/data-development-metrics` (incorporación de series oficiales auditadas de desarrollo humano, salud, educación y equidad en la Diapositiva 7).
- **Hitos completados en la sesión**:
  1. **Series oficiales de salud, educación y desigualdad** (`web/src/tour/developmentData.ts`): incorporadas series históricas oficiales y comparativas regionales de América Latina para:
     - Salud: Esperanza de vida al nacer (1990-2024, BM WDI) y Mortalidad infantil (1990-2024, BM WDI / DEIS).
     - Educación: Resultados PISA 2012-2022 (OCDE), Años de escolaridad promedio y esperados (PNUD HDR), Graduación universitaria y perfil STEM (OCDE / Min. Capital Humano).
     - Igualdad: Coeficiente de Gini (1995-2024, BM WDI / INDEC SEDLAC) y Pobreza monetaria por aglomerados urbanos (INDEC EPH).
  2. **Diapositiva 7 conectada (`DevelopmentStep.tsx`)**: eliminados los placeholders de borrador; conectados gráficos de tendencia SVG normalizados y ranking comparativo regional con barras horizontales y destaque nacional.
  3. **Trazabilidad y calidad de datos**: tablas registradas con `quality: 'real'`, fuentes y `retrievedAt` en `quality.ts`, `slides.ts`, `references.ts` (referencia W1) y `docs/references.md`.
  4. **Tests unitarios**: creados `developmentData.test.ts` y `developmentStep.test.tsx` validando rangos, metadatos, interactividad y conmutador de modos.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Multi-agente**: Usar `git worktree` para tareas paralelas independientes sin bloquear carpetas de build en Windows.
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`. Ningún mock sin documentar en `docs/mock-data.md`.

## Next
- CI verificado verde en GitHub Actions (`run 39172037778`). Abrir PR de la Fase 1 (`feat(tour): wire official health, education, and inequality metrics to development slide`).
- Proceder con la Fase 2 del plan: Incertidumbre tecnológica, rezagos de difusión y curvas de costos de IA (Diapositiva 8 / `ForecastUncertaintyStep.tsx`).
