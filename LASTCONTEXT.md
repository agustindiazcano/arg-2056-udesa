# LASTCONTEXT.md

## State
- **Branch**: `task/fix-slide2-map-click` (Fix province/department click interactions on Slide 2 Argentina map & fix DataPage chunk 404 / missing tests).
- **Hitos completados en la sesión**:
  1. **Diagnóstico y solución de clicks en el mapa de la Diapositiva 2 (`ResourcesStep.tsx`, `ProvinceStep.tsx`, `ProvinceProfileStep.tsx`)**:
     - En `web/src/styles/ui.css`, la regla `.res-grid .gdp-chart > .tour-chart > * { width: 100%; height: 100%; }` (especificidad `0,3,0`, línea 2385) carecía de `:not(.tour-view-switch)`, haciendo que `<div className="tour-view-switch">` (`position: absolute; z-index: 3; pointer-events: auto`) se estirara al 100% × 100% sobre el mapa e interceptara todos los clicks. Se agregó `:not(.tour-view-switch)` en `.tour-grid`, `.res-grid` y `.ai-grid`.
     - En `web/src/charts3d/types.ts`, `web/src/three/Map3D.tsx` y `web/src/tour/ResourcesStep.tsx`: se conectaron `selectedDepartment` y `onSelectDepartment` en 3D con resaltado visual y migas de pan (`map-breadcrumb-bar`), se corrigió el radio base (`startRadius`) de `flyTo` al cambiar de provincia, y se habilitó seleccionar una provincia haciendo click en su barra del gráfico nacional.
     - En `web/src/ui/MapSearch.tsx` y `web/src/tour/ProvinceProfileStep.tsx`: se aseguró `pointerEvents: 'auto'`.
  2. **Diagnóstico y solución del error 404 al abrir la sección "Data" (`DataPage-*.js` / `simModel-*.js`)**:
     - Causa raíz: `prefetchCharts` (`web/src/app/prefetch.ts`) precargaba `TourStep`, `TourChart3D` y `Chart3D`, pero omitía `DataPage` y `Simulator`. Si ocurría un nuevo deploy en Vercel con la pestaña abierta, al hacer click en `Data` el navegador pedía los hashes viejos (`DataPage-*.js` y `simModel-*.js`), recibía HTTP 404 y `React.lazy` lanzaba un `TypeError: Failed to fetch dynamically imported module` no capturado.
     - Solución: se agregaron `Simulator` y `DataPage` a `CHART_LOADERS` en `prefetch.ts`; se implementó recuperación automática ante chunks obsoletos (`recoverChunkLoadError`, `consumeReloadSection`, listener `vite:preloadError`, y `SectionErrorBoundary` en `App.tsx` y `Root.tsx`) que recarga una vez preservando la sección `data`.
  3. **Tests unitarios y E2E (TDD)**:
     - Unitarios: `chart3dHostCss.test.ts`, `resourcesStepDrilldown.test.tsx`, `prefetch.test.ts`, y `shellUi.test.tsx` (esperando el render real de `<DataPage />` al hacer click en `Data`).
     - E2E Playwright: `web/e2e/boot.spec.ts` ahora hace click en el botón `Data` del header y verifica que carguen las tablas y las 4 pestañas (`Data`, `Referencias`, `Metodología`, `Uso de AI`) sin errores 404 ni de consola.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`.

## Next
- Subir nuevo commit a `origin/task/fix-slide2-map-click`, verificar todos los jobs de CI en GitHub Actions y abrir el Pull Request.
