# LASTCONTEXT.md

## State
- **Branch**: `task/data-ai-usage` (created from `main` @ `da960a0`, PR #124).
- **Features added**:
  1. Nueva pestaña **Uso de AI** (`AiUsageView.tsx`) en la sección `Data` (`DataPage.tsx`) junto a `Data`, `Referencias` y `Metodología`, incluyendo:
     - Orquestación multi-agente en paralelo, consumo directo de datos procesados sin *hardcoding* y gobernanza *Human-in-the-Loop*.
     - Explicación detallada y tabla comparativa directa entre **Branch tradicional** (`git checkout / switch`) y **Git Worktree** (`git worktree add`), detallando por qué se utilizan *worktrees* con múltiples agentes de IA para evitar pisar cambios en compilación y bloqueos de archivos (`EBUSY` / `.lock`).
     - Flujo Gitflow con *commits* atómicos, PRs con aprobación humana, TDD + CI frente al alto costo en tokens del *code review* por IA, validación visual en dos etapas (Playwright mediante agente + iteración humana), herramientas de IA y stack completo de librerías de testing.
  2. **Referencias numeradas (`[1]`, `[2]`, ...) con tooltips estilizados** (`RefLink.tsx`, `RefList`) en **Hacia el 2056** y **Data**: chips compactos (`[48] FMI`, `[52] Banco Mundial`) con tooltip estilizado en *hover*/*focus* que muestra cita + URL y apertura en nueva pestaña al hacer click.
  3. **Tooltips y pop-ups de explicación (`?`)** (`ChartHelp.tsx`): botón `?` en cada diapositiva/gráfico de **Hacia el 2056** con tooltip estilizado en *hover* y ventana modal accesible al hacer click (sin `title` nativos y cumpliendo `eslint-plugin-jsx-a11y`).
  4. **Gráfico «Mayores economías de la región» en 2D** (`WorldStep.tsx`): el gráfico de barras de mayores economías de la región (PBI, PBI per cápita, Población) se renderiza siempre en 2D (`mode="2d"`).

## Next
- Verificar estado de CI del PR #124 (`task/data-ai-usage`) y aprobación humana para merge.
