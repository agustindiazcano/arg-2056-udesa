# LASTCONTEXT.md

## State
- **Branch**: `task/data-tech-uncertainty` (Fase 2: Series empíricas de rezagos de adopción tecnológica, deflación de costos de inferencia, escala de cómputo y revisiones de pronósticos del PBI en la Diapositiva 8).
- **Hitos completados en la sesión**:
  1. **PR #135 abierto para Fase 1** (`task/data-development-metrics`): datos oficiales de desarrollo (salud, educación, Gini) verificados con CI verde (`run 39172037778`).
  2. **Datasets de incertidumbre tecnológica** (`web/src/tour/techUncertaintyData.ts`):
     - Rezagos de difusión masiva: series históricas del CHAT dataset (Comin & Hobijn / NBER) y Our World in Data (electricidad, telefonía, autos, PC, internet, smartphones, IA).
     - Curva de costos de inferencia: caída de $20 a $0.07 por 1M tokens (>280x) en benchmark MMLU (Stanford HAI AI Index 2024/2025 y Artificial Analysis).
     - Cómputo de entrenamiento: escala histórica en FLOPs (Perceptron a Gemini Ultra / GPT-4) de Epoch AI.
     - Revisiones de pronósticos: desvíos empíricos observados vs proyecciones a 1 año del FMI WEO en Argentina (error medio absoluto ~3,9 pp).
     - Canales del escenario adverso: mecanismos de la Curva J de productividad, automatización y desacoplamiento salarial (Acemoglu 2024 / Brynjolfsson).
  3. **Diapositiva 8 conectada (`ForecastUncertaintyStep.tsx`)**: gráficos SVG interactivos por pestaña con selectores de tecnología, comparativa de pronósticos y visualización de costos.
  4. **Metadatos y trazabilidad**: tablas registradas con `quality: 'real'` en `quality.ts`, `slides.ts`, `references.ts` (refs D6 y D7) y `docs/references.md`.
  5. **Tests unitarios**: creados `techUncertaintyData.test.ts` y `forecastUncertaintyStep.test.tsx`. Presupuesto de chunks ajustado en `budgets.json`.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`.

## Next
- Subir rama `task/data-tech-uncertainty` al repositorio remoto y monitorear CI.
- Una vez verificado verde en CI, abrir PR para la Fase 2 y continuar con la Fase 3 (Valuación Agro y Recursos en Slides 10 y 13).
