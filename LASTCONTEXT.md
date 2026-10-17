# LASTCONTEXT.md

## State
- **Branch**: `task/archive-root-docs` (limpieza de raíz: briefs completados a `docs/archived/`, tareas pendientes a `docs/tasks/`, diseño y roadmap a `docs/`).
- **Snapshot archivado**: ver [lastcontext-2026-10-17.md](file:///C:/projects/projects-github-agustindiazcano/arg-2056-udesa/docs/lastcontext-2026-10-17.md) para el registro completo de la jornada.
- **Capacidades clave incorporadas**:
  1. **Pestaña «Uso de AI»** (`AiUsageView.tsx` en `DataPage.tsx`): framework de contexto, orquestación multi-agente, comparativa técnica Gitflow vs. Worktrees, gobernanza HITL y stack completo de testing.
  2. **Referencias numeradas interactivas** (`RefLink.tsx`): chips `[n]` con tooltip de metadatos de fuente y apertura en pestaña externa.
  3. **Ayuda contextual accesible** (`ChartHelp.tsx`): botones `?` con tooltip ligero y modal accesible «Cómo leer este gráfico».
  4. **Mapas y navegación**: transiciones suaves C7, límites de zoom C8, búsqueda de provincias y departamentos C5, drilldown con proyectos mineros C1-C4, panel de perfil provincial C6.
  5. **Visualización y UI**: gráfico de economías regionales fijado en 2D (`WorldStep.tsx`) y badge de deadline en navbar (`Header.tsx`).

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Multi-agente**: Usar `git worktree` para tareas paralelas independientes sin bloquear carpetas de build en Windows.
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`. Ningún mock sin documentar en `docs/mock-data.md`.

## Next
- PR #125 abierto (`task/archive-root-docs`), CI 100% verde. Pendiente aprobación humana para merge a `main`.
- Próxima sesión: iniciar la búsqueda de datos según el plan de búsqueda (agro provincial, minería Catamarca/Salta, impacto IA, perfil socioeconómico provincial).

