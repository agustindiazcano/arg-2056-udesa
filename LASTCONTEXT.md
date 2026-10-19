# LASTCONTEXT.md

## State
- **Branch**: `task/fix-slide2-map-click` (Fix province/department click interactions on the Slide 2 Argentina map).
- **Hitos completados en la sesión**:
  1. **Diagnóstico de causa raíz en Diapositiva 2 (`ResourcesStep.tsx`, `ProvinceStep.tsx`, `ProvinceProfileStep.tsx`)**:
     - En `web/src/styles/ui.css`, la regla `.res-grid .gdp-chart > .tour-chart > * { width: 100%; height: 100%; }` (especificidad `0,3,0`, línea 2385) carecía de `:not(.tour-view-switch)`, a diferencia de `.prov-map > .tour-chart > *:not(.tour-view-switch)` (`0,2,0`, línea 1022). Esto hacía que el contenedor `<div className="tour-view-switch">` (`position: absolute; z-index: 3; pointer-events: auto`) se expandiera al 100% × 100% sobre el mapa de Argentina e interceptara todos los clicks del mouse.
     - En `web/src/three/Map3D.tsx`, al seleccionar una provincia y cargarse los departamentos (`hit.userData.isDept`), el handler `onUp` hacía `if (hit.userData.isDept) return;`, impidiendo seleccionar departamentos (para ver proyectos mineros en `ResourcesStep.tsx`) o deseleccionar la provincia. Además, el `flyTo` usaba `Math.min(stage.pose.radius, fit)` en lugar de `Math.min(startRadius, fit)`.
  2. **Correcciones implementadas**:
     - `web/src/styles/ui.css`: agregado `:not(.tour-view-switch)` en `.tour-grid > .gdp-chart > .tour-chart > *`, `.res-grid .gdp-chart > .tour-chart > *` y `.ai-grid > .gdp-chart > .tour-chart > *`.
     - `web/src/charts3d/types.ts` y `web/src/three/Map3D.tsx`: soporte para `selectedDepartment` y `onSelectDepartment` en `Map3DSpec`, selección/deselección de departamentos en 3D con resaltado visual y migas de pan (`map-breadcrumb-bar`), y corrección de `startRadius` en `flyTo`.
     - `web/src/tour/ResourcesStep.tsx`: conexión de `selectedDepartment` y `onSelectDepartment` en `mapSpec`, `zoomToSelected` en el fallback 2D `ProvinceMap`, y selección de provincia al hacer click en una barra del gráfico nacional de provincias (`drilldown.kind === 'provinces'`).
     - `web/src/ui/MapSearch.tsx` y `web/src/tour/ProvinceProfileStep.tsx`: `pointerEvents: 'auto'` explícito en el contenedor del buscador y en la tabla accesible de perfiles provinciales.
  3. **Tests unitarios (TDD)**:
     - Actualizados `web/tests/unit/chart3dHostCss.test.ts` y `web/tests/unit/resourcesStepDrilldown.test.tsx`.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`.

## Next
- Subir rama `task/fix-slide2-map-click` a `origin`, verificar que todos los checks de GitHub Actions pasen en la nube (`gh run list` / `gh run watch`) y abrir el Pull Request.
