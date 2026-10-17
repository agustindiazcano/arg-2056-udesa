# LASTCONTEXT.md

## State
- **Branch**: `task/rule70-convergence-developed`
- **Features added**:
  1. **Convergencia y desarrollo en diapositiva Regla del 70 (`Rule70Step.tsx`)**:
     - Pestaña interactiva «Convergencia y desarrollo» (`ConvergencePlanner.tsx`) con planificación de la tasa requerida a 20 y 30 años (2046 y 2056) para converger al nivel de PBI per cápita de economías desarrolladas.
     - Benchmarks basados en datos reales del Banco Mundial (2024, dólares constantes de 2015):
       - Portugal ($22.663 USD pc, umbral de altos ingresos europeo).
       - España ($29.245 USD pc, economía desarrollada del sur europeo).
       - Italia ($34.508 USD pc, G7 e industrialización avanzada).
       - Corea del Sur ($37.049 USD pc, milagro de convergencia acelerada).
       - Alemania ($44.028 USD pc, frontera industrial europea).
       - Australia ($61.487 USD pc, altos ingresos en recursos y capital).
       - Estados Unidos ($66.856 USD pc, frontera tecnológica e innovación global).
     - Gráfico interactivo con trayectoria proyectada de convergencia de Argentina frente al país benchmark.
     - Explicación de implicancias según la regla del 70 (duplicación de ingresos cada $70/r$ años).
  2. **Simulador del PBI (`Simulator.tsx`)**:
     - Selector interactivo de convergencia con países desarrollados en el panel lateral de factores.
     - Cálculo en tiempo real del PBI per cápita resultante en 2056 frente a la población proyectada por la ONU (WPP 2024), mostrando el porcentaje alcanzado respecto a cada país desarrollado de referencia.
  3. **Datos y calidad**:
     - Tabla `rule70-convergence` registrada en `TABLE_META` (`quality.ts`) y conectada en la diapositiva 5 en `slides.ts`.
     - Tests unitarios completos en `rule70Convergence.test.ts`, `rule70Step.test.tsx`, `rule70Explorer.test.tsx`, `rule70ScenariosUi.test.tsx` y `simulator.test.tsx`.
- **Precheck**:
  - `python scripts/precheck.py` 100% OK (PASS en ruff, pytest, terrain, validate-data, check-budget, references, web-lint, web-typecheck y web-test con 2047 tests unitarios).

## Next
- Merge / PR de `task/rule70-convergence-developed`.
- Continuar con el plan de correcciones pendientes en `PENDING.md` (C8 `map-zoom-limits` y C7 `map-drill-transition`).
