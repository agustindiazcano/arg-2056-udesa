# Plan de acción: correcciones nuevas (escena Recursos, vista Hacia el 2056)

Fuente: `test/correcciones-nuevas.png` (anotaciones del revisor sobre Recursos naturales > Producción por provincia > Minería).
Reglas que aplican: `AGENTS.md` secciones 5, 6 y 12. TDD para lógica, nada de cifras sin `source` + `retrieved_at`, nada de textos de "pendiente/mock" en la UI. Una rama por tarea (`task/<slug>`), PR chicos.

## 1. Correcciones detectadas

| # | Anotación (resumen) | Color | Tarea |
|---|---|---|---|
| C1 | Agregar boro, cobre, molibdeno; buscar el proyecto Taca Taca | rojo | `res-minerals-extend` |
| C2 | Si el filtro es Minería, el panel de composición debe mostrar minería (hoy muestra Minería/Agro/Hidrocarburos) | rojo | `res-sector-filter-panel` |
| C3 | Si se selecciona Salta, mostrar departamentos si hay datos; si no, producción minera por sector minero (en vez del ranking de provincias) | rojo | `res-province-drilldown` |
| C4 | Click en un departamento lo expande y lista los proyectos mineros cuando haya datos | rojo | `res-department-projects` |
| C5 | Buscador por provincia o departamento | naranja | `map-search` |
| C6 | Nueva diapositiva por provincia: PBI provincial, coparticipación, PBI per cápita, exportaciones, población, pobreza, desempleo, empleo privado / público / registrado; filtro de seguridad si hay datos | naranja | `province-profile-slide` |
| C7 | La transición entre provincia y departamento es brusca: falta transición | naranja | `map-drill-transition` |
| C8 | Zoom del mapa poco libre: debe permitir acercar más | naranja | `map-zoom-limits` |

## 2. Orden de ejecución

1. `map-zoom-limits` (C8) y `map-drill-transition` (C7): solo mapa, sin datos nuevos.
2. `res-sector-filter-panel` (C2): lógica de selección, con test de store/selector.
3. `res-province-drilldown` (C3) y `res-department-projects` (C4): dependen de C7 y de datos por departamento.
4. `map-search` (C5): índice provincia + departamento ya cargado desde `web/public/geo/`.
5. `res-minerals-extend` (C1): datos nuevos, pasa por pipeline y verificación humana.
6. `province-profile-slide` (C6): la más grande; depende de datos nuevos (ver sección 4). Partir en una PR por fuente de datos.

## 3. Detalle por tarea

### C8 `map-zoom-limits`
- Revisar `minZoom` / `maxZoom` y el `fitBounds` de la vista provincia en `web/src/map/` (MapLibre o SVG, lo que use la escena). Subir el zoom máximo para llegar a nivel departamento.
- Mantener botones +, - y reset; respetar `prefers-reduced-motion`.
- Test: el límite de zoom configurado permite el nivel mínimo requerido (valor en una constante testeable).

### C7 `map-drill-transition`
- Animar el cambio país > provincia > departamento (interpolación de cámara/viewBox, fundido de capas) con duración corta y easing; con reduced motion, cambio instantáneo.
- Disparo por cambio de estado (provincia/departamento seleccionado), no por scroll ni por frame.
- Limpiar timelines y listeners al desmontar.
- Test: el cambio de selección dispara la transición una vez; con reduced motion no hay animación.

### C2 `res-sector-filter-panel`
- Con filtro Minería, el treemap de la provincia pasa a composición por mineral/sector minero; con Hidrocarburos y Agro, equivalente; con Total, la composición actual por sector.
- Un selector puro (`sector`, `province`) > datos del panel, con tests por cada combinación y el caso sin datos (se oculta el panel, sin mensajes de "pendiente").

### C3 `res-province-drilldown`
- Al seleccionar una provincia: si hay datos por departamento para el sector, mostrar el ranking de departamentos; si no, mostrar producción por sector minero (mineral) de esa provincia.
- Reemplaza el gráfico "provincias que producen" cuando hay provincia seleccionada.
- Tests de la regla de fallback (departamentos con datos / sin datos).

### C4 `res-department-projects`
- Click en un departamento lo expande (panel o tarjeta) con los proyectos mineros de la tabla de proyectos, solo si existen registros; si no hay, no se muestra nada.
- Datos: proyectos con `source` y `retrieved_at`; ubicación a nivel departamento. Taca Taca (Salta, cobre) entra con C1.

### C5 `map-search`
- Campo de búsqueda con autocompletado (provincia y departamento), normalización de tildes y mayúsculas, navegable con teclado (flechas, Enter, Esc).
- Seleccionar un resultado actualiza el store (provincia / departamento) y dispara la transición de C7.
- Test: normalización, orden de resultados, selección actualiza el store.

### C1 `res-minerals-extend`
- Agregar boro, cobre y molibdeno a `data/processed/` vía `scripts/` (no editar a mano), con esquema JSON actualizado y `npm run gen:validators`.
- Fuentes preferidas: Secretaría de Minería, USGS. Proyecto Taca Taca: ubicación, estado, capex y producción esperada con una fuente primaria; si falta un dato, `null` con `note`.
- Cada cifra nueva en la UI va a "Data to verify" en `PENDING.md`.

### C6 `province-profile-slide` (decisión: se hace al final, con datos mock)
- Se implementa con datos mock siguiendo el mecanismo existente (`docs/mock-data.md`, `docs/tasks/mock-data.md`): registros marcados como mock en los datos y en `data/processed/`, nunca en la UI (la UI no dice que son de prueba ni pendientes).
- Los mock quedan listados en `docs/mock-data.md` y en "Data to verify" de `PENDING.md`; el gate de release (`scripts/check_no_mock.py`) sigue fallando hasta reemplazarlos por datos reales.
- Se ejecuta después de C8, C7, C2, C3, C4, C5 y C1.
- Nueva diapositiva con ficha de provincia (provincia seleccionada, con tabla alternativa accesible): PBI provincial, participación en el PBI nacional, PBI per cápita, exportaciones, población, coparticipación, pobreza, desempleo, empleo privado, público y registrado.
- Gráficos según reglas: barras para rankings, coropleta para el mapa, sin tortas.
- Filtro de seguridad (indicador de delitos) solo si hay una fuente oficial con serie provincial; si no, se omite la opción (sin texto de pendiente en la UI).
- Registrar el pedido de datos en `docs/data-requests.md` y las fuentes en `docs/sources.md` / `docs/references.md`.

## 4. Datos necesarios y fuentes candidatas (a verificar por un humano)

| Dato | Fuente candidata | Estado |
|---|---|---|
| PBI provincial / per cápita | INDEC, Dirección Nacional de Asuntos Provinciales, IMF/CEPAL estimaciones | falta |
| Coparticipación | Ministerio de Economía, Dirección Nacional de Asuntos Provinciales | falta |
| Exportaciones por provincia | INDEC (exportaciones por provincia) | parcial |
| Población | INDEC censo 2022, UN WPP | existe a nivel provincia |
| Pobreza, desempleo | INDEC EPH (aglomerados, no siempre provincia: documentar el límite) | falta |
| Empleo privado / público / registrado | Secretaría de Trabajo (SIPA), Ministerio de Capital Humano | falta |
| Seguridad | Ministerio de Seguridad (SNIC) | falta, a evaluar |
| Proyectos mineros, Taca Taca | Secretaría de Minería, USGS, informes de la empresa | falta |
| Producción minera por departamento | Secretaría de Minería | a confirmar si existe |

## 5. Definición de hecho (por tarea)

- Test fallido primero, ahora en verde; `python scripts/precheck.py` pasa antes de cada push.
- Sin cifras sin fuente; `PENDING.md` y `LASTCONTEXT.md` actualizados.
- Sin textos de "pendiente", "por investigar" o "mock" en la UI.
- PR describe qué cambió, qué se verificó y qué falta verificar por un humano.
