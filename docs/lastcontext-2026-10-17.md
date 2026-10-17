# LASTCONTEXT Snapshot — 2026-10-17

Snapshot histórico de contexto acumulado durante la jornada de trabajo del 17 de octubre de 2026.

## 1. Estado del Repositorio y Ramas
- **Rama principal**: `main` sincronizada con `origin/main` en commit `53f515e` (`Merge pull request #124 from agustindiazcano/task/data-ai-usage`).
- **PRs integrados hoy**:
  - **PR #124 (`task/data-ai-usage`)**: Pestaña «Uso de AI» en `DataPage.tsx`, tooltips interactivos de referencias `[n]` (`RefLink.tsx`), botones modales de ayuda `?` (`ChartHelp.tsx`), gráfico regional fijado en 2D (`WorldStep.tsx`).
  - **PR #121 (`task/nav-deadline-badge`)**: Badge en navbar `En desarrollo hasta el deadline 31/10` con punto pulsante accesible (`tokens.css`, `ui.css`, `Header.tsx`).
  - **PR #122 (`task/map-drill-transition`)**: C7 transición suave entre país, provincia y departamentos (cámara MapLibre / ECharts a 450 ms con curva `cubicInOut`, fade + scale).
  - **PR #119 (`task/map-zoom-limits`)**: C8 ampliación de límites de zoom (`ZOOM_MAX` 8 -> 32) en mapas de país y departamentos.
  - Correcciones C1 a C6:
    - C1 `res-minerals-extend`: incorporación de cobre (116,7 Mt), boro (3.ª reserva mundial) y molibdeno (2,2+ Mt) a la minería provincial y proyectos (Taca Taca con NI 43-101).
    - C2 `res-sector-filter-panel`: desglose sectorial provincial aislado en `ResourcesStep.tsx`.
    - C3 `res-province-drilldown`: drilldown automático a departamentos mineros.
    - C4 `res-department-projects`: panel lateral expandido con proyectos mineros al hacer click en departamento.
    - C5 `map-search`: buscador unificado con autocompletado y normalización de tildes para provincias y departamentos.
    - C6 `province-profile-slide`: panel comparativo de perfiles socioeconómicos y productivos provinciales.

## 2. Componentes y Arquitectura Incorporada
1. **Pestaña «Uso de AI» (`web/src/datasets/AiUsageView.tsx`)**:
   - Framework de ingeniería de contexto y orquestación multi-agente en paralelo.
   - Tabla comparativa técnica entre ramas tradicionales (`git switch / checkout`) y `git worktree`: aislamiento total de build artifacts (`node_modules`, `.vite`), prevención de bloqueos de archivos en Windows (`EBUSY`, `.lock`), sin colisiones de dependencias entre agentes.
   - Gobernanza *Human-in-the-Loop* (HITL): aprobación humana obligatoria en cada PR, sin merge autónomo a `main`.
   - Pipeline de validación estricto: TDD con tests ejecutados exclusivamente en CI de GitHub Actions (Regla #1), suites de TypeScript estricto, ESLint 10, Ruff, Ajv, schemas JSON, Vitest, Playwright y mutmut.
2. **Sistema de Referencias Numeradas (`web/src/ui/RefLink.tsx`)**:
   - Chips canónicos `[n]` para cada fuente (`[48] FMI`, `[52] Banco Mundial`, `[28] INDEC`).
   - Tooltip flotante con diseño propio al hacer *hover* o *focus*, indicando el título formal de la fuente y URL.
   - Apertura segura de la cita en nueva pestaña (`target="_blank"` con `rel="noopener noreferrer"`).
3. **Ayuda Contextual y Modal Explicativo (`web/src/ui/ChartHelp.tsx`)**:
   - Botón `?` en cabeceras de diapositivas y gráficos en «Hacia el 2056» y «Simulador».
   - Tooltip ligero en *hover* y ventana modal accesible (WAI-ARIA, `dialog`, trampa de foco) en click con desglose de «Cómo leer este gráfico», metodología y fuentes relacionadas.
4. **Gráfico de Mayores Economías en 2D (`web/src/tour/WorldStep.tsx`)**:
   - Gráfico de barras de PBI, PBI per cápita y población de pares latinoamericanos fijado permanentemente en 2D (`mode="2d"`).

## 3. Reglas Críticas Establecidas
- **Regla #1**: Los tests corren en la nube (CI de GitHub Actions), nunca localmente. No ejecutar suites locales que consuman tokens o tiempo innecesariamente.
- **Tokens de color**: Prohibido usar literales (`#hex`, `rgb`, `hsl`) fuera de `web/src/styles/tokens.css`. Todo componente debe referenciar `var(--token)` o `color-mix()`.
- **Datos auditables**: Todo dato visible debe contar con `source` y `retrieved_at` explícitos.
