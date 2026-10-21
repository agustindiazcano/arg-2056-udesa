# LASTCONTEXT.md

## State
- **Branch**: `task/slide2-unify-and-rigi`.
- **Hitos completados en la sesión**:
  1. **Fase 1 completada (`slide2-unify-and-rigi`)**:
     - **Unificación en Diapositiva 2 (`ResourcesStep.tsx`)**: Eliminada la pestaña redundante "Producción por provincia" (`ProvinceStep`); selector superior "Mostrar" simplificado a dos opciones: `Recursos y RIGI` (activa por defecto) y `Perfil provincial`.
     - **Capa RIGI en el Mapa Nacional**: Incorporado botón/toggle interactivo `★ RIGI` en la barra de controles; al activarse, el mapa colorea las provincias adheridas por volumen de inversión ($ M USD), despliega tiles de totales RIGI (inversión total, proyectos aprobados y en evaluación), y muestra marcadores geográficos (scatter pins) con tooltips enriquecidos (empresa, rubro, inversión, estado).
     - **Drilldown Provincial y Departamental de Recursos y RIGI**: Al seleccionar una provincia, el mapa realiza zoom suave a sus departamentos mostrando tanto los proyectos de recursos habituales como los del RIGI; el panel inferior despliega las fichas técnicas con badges semánticos (mineral/obra, estado, `★ RIGI`, resolución oficial, inversión y referencias con `RefList`).
  2. **Enriquecimiento del dataset RIGI (`rigiProjects.ts` y `provinceDrilldown.ts`)**:
     - Agregadas coordenadas geográficas `[lng, lat]`, departamentos normalizados e identificadores provinciales (`provinceIds`) para todos los proyectos mineros y energéticos del RIGI.
     - Funciones puras añadidas: `getAllRigiProjects`, `getRigiProjectsByProvince`, `getRigiProvinceTotals`, `getRigiTotalsSummary`, `rigiMapValues`, y `getProvinceProjects`.
  3. **Corrección de test intermitente en CI (`andesScene.test.tsx` y `CrossingInfo.tsx`)**:
     - `CrossingInfo`: Se aseguró captura en `window` y `document`, y se añadió handler `onKeyDown` nativo en el elemento `<section role="dialog">`.
     - `andesScene.test.tsx`: La prueba `'closes the crossing pop-up with Escape'` ahora ejecuta el despacho de `Escape` sobre `document` y `document.body` dentro de `waitFor(..., { timeout: 5000 })`, evitando flakes por retrasos en el ciclo de vida de React bajo carga extrema de CI con 227 workers concurrentes.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **TDD**: Commits atómicos separados en `test(...)`, `feat(...)` y `docs(...)`.
- **Tokens de color**: Ningún `#hex`/`rgba()` en archivos `.tsx` ni en archivos CSS fuera de `tokens.css`.

## Next
- PR para `task/slide2-unify-and-rigi` listo para revisión y aprobación humana.
- Iniciar Fase 2: `slide2-province-profile-traffic-light` (mapa semáforo y gráficos en perfil provincial).
