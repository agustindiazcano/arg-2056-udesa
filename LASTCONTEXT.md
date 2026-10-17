# LASTCONTEXT.md

## State
- **Branch**: `task/data-ai-usage` (created from `main` @ `da960a0`).
- **Features added**:
  1. Nueva pestaña **Uso de AI** (`AiUsageView.tsx`) en la sección `Data` (`DataPage.tsx`) junto a `Data`, `Referencias` y `Metodología`.
  2. Documentación detallada y estructurada de:
     - Orquestación multi-agente en simultáneo con framework propio de ingeniería de contexto y consumo directo de datos procesados sin *hardcoding* para evitar alucinaciones.
     - Dirección y validación humana (*Human-in-the-Loop*) en todo el ciclo para asegurar calidad y evitar bucles innecesarios de consumo de tiempo y tokens.
     - Flujo Gitflow con ramas por tarea, *commits* atómicos por *fix*, revisión y aprobación humana de PRs, y estrategia TDD + CI frente al alto costo en tokens del *code review* por IA.
     - Validación visual en dos etapas: primer filtro automatizado con Playwright mediante agente y producto final por iteración humana.
     - Herramientas de IA utilizadas (Claude, Claude Code, Google AI Studio, Gemini, Antigravity, Grok) y listado completo de librerías de testing y validación estática (Vitest, React Testing Library, jsdom, pytest, mutmut, Playwright, axe-core, eslint-plugin-jsx-a11y, TypeScript strict, ESLint 10, Ruff, Ajv, jsonschema y gates de presupuesto en CI).
  3. Tests actualizados en `web/tests/unit/dataSection.test.tsx` y `web/tests/unit/noDataLabels.test.tsx`.

## Next
- Verificar estado de CI del PR de `task/data-ai-usage` y aprobación humana para merge.
