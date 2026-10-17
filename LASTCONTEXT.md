# LASTCONTEXT.md

## State
- **Branch**: `task/data-ai-usage` (created from `main` @ `da960a0`, PR #124).
- **Features added**:
  1. Nueva pestaña **Uso de AI** (`AiUsageView.tsx`) en la sección `Data` (`DataPage.tsx`) junto a `Data`, `Referencias` y `Metodología`, documentando el framework propio de ingeniería de contexto, orquestación multi-agente en paralelo, consumo directo de datos procesados sin *hardcoding*, gobernanza *Human-in-the-Loop*, flujo Gitflow con *commits* atómicos y aprobación humana de PRs, validación visual en dos etapas (Playwright mediante agente + iteración humana), herramientas de IA y stack completo de librerías de testing y análisis estático.
  2. **Referencias numeradas (`[1]`, `[2]`, ...) con tooltips estilizados** (`RefLink.tsx`, `RefList`):
     - Numeración canónica `1..N` sobre `REFERENCES` tanto en **Hacia el 2056** (`TourSidebar`, subtítulos de slides, `ProductivityStep`) como en **Data** (`Fuentes:` por diapositiva y catálogo de `Referencias`).
     - En las diapositivas se muestran chips compactos (ej. `[48] FMI`, `[52] Banco Mundial`, `[28] INDEC`); al hacer *hover* o *focus* se despliega un tooltip con estilos propios del sistema de diseño mostrando el título completo y el texto de la URL, y al hacer click abre la referencia en una nueva pestaña (`target="_blank"`).
  3. **Tooltips y pop-ups de explicación (`?`) en cada gráfico/diapositiva** (`ChartHelp.tsx`):
     - Botón `?` junto al título de cada diapositiva y gráfico de **Hacia el 2056** y **Simulador**: al hacer *hover* muestra un tooltip flotante estilizado con el texto explicativo; al hacer click abre un pop-up modal estilizado con la explicación completa, guía «Cómo leer este gráfico» y referencias numeradas interactivas. Cero `title` nativos del navegador.
  4. Tests unitarios en `web/tests/unit/refAndHelpTooltips.test.tsx`, `web/tests/unit/dataSection.test.tsx` y `web/tests/unit/noDataLabels.test.tsx`.

## Next
- Verificar estado de CI del PR #124 (`task/data-ai-usage`) y aprobación humana para merge.
