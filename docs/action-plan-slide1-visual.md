# Plan de acción: ajustes visuales y comparación de países en la diapositiva 1

Fuente: `test/corrections-1.png` (anotaciones en rojo sobre «El PBI de Argentina desde 1960»).
Código afectado: `web/src/tour/WorldStep.tsx`, `WorldTable.tsx`, `worldData.ts`, `web/src/charts/builders/tourCharts.ts` (`buildFollowedSeries`), `web/src/charts3d/` (spec de líneas 3D), `web/src/tour/stepInfo.ts`.
Reglas que aplican: `AGENTS.md` secciones 5, 6, 8 y 12 (tests solo en CI, sin literales de color fuera de `tokens.css`, nada de textos de «pendiente/mock» en la UI, datos con `source` + `retrieved_at`).

## 1. Qué dice la imagen

| # | Anotación | Lectura | Certeza |
|---|---|---|---|
| V1 | «agregar USA, chile, brasil, mexico, uruguay» sobre el gráfico grande | Selector para comparar otros países en el gráfico principal; esos cinco como atajos | Alta |
| V2 | Tachado de «PBI real de» en la punta de la línea | La etiqueta de la punta pasa a ser solo bandera + puesto en el ranking del año | Alta (confirmado en tu mensaje) |
| V3 | Subrayado rojo bajo el subtítulo (unidad · fuente · referencias) | La unidad pasa dentro del `?` (D4) | Alta |
| V4 | Flecha al `?` junto al título principal | Mantener el `?` pegado al título (ya está); revisar alineación vertical | Baja |
| V5 | Recuadros sobre las unidades; flechas a los `?` de las tablas | Las unidades se meten dentro del `?` de cada tabla (D4) | Alta |
| V6 | «en 2025» tachado en «Mayores economías de la región»; flecha del `?` al recuadro vacío a su derecha; flecha del Gráfico/Tabla al recuadro vacío arriba a la derecha | Título sin año; `?` en la misma línea que el título; el conmutador Gráfico/Tabla sube a la esquina superior derecha de la tarjeta | Alta |
| V7 | (tu mensaje) tocar la tablita de PBI per cápita | El gráfico grande cambia a PBI per cápita; tocar la de PBI lo devuelve a PBI | Alta |

V3 y V5 quedaron confirmados por la aclaración del 2026-10-17; V4 es cosmético y no bloquea.

## 2. Diseño de la parte funcional (V1, V2, V7)

### 2.1 Métrica activa del gráfico grande (V7)
- Nuevo estado `mainMetric: 'gdp' | 'percapita'` en `WorldStep` (local, como `regionMetric`; no va al store porque solo lo usa esta diapositiva).
- `WorldTable` pasa a ser seleccionable: el encabezado de cada tabla es un `<button>` con `aria-pressed` (teclado: Enter/Espacio) y un borde/realce con token cuando está activa. El `?` queda fuera del botón para no anidar controles.
- Con `percapita` el gráfico grande usa `gdpPerCapitaAt` y la unidad de `REGION_METRICS.percapita`; el contador del año («2025 · 13,1 k») y el título accesible cambian con la métrica.
- El eje Y se recalcula por métrica; el ranking de la tabla activa es el que se muestra en la bandera de la punta (V2).

### 2.2 Países comparables (V1)
- Nuevo estado `compare: string[]` (nombres de países, Argentina siempre presente y fija, máximo 10 líneas).
- Selector bajo el contador del año: botones-bandera (activar/desactivar) para Estados Unidos, Australia, Japón, Alemania, Chile, Uruguay y España; Argentina, Brasil y México arrancan activos. Sin buscador libre (D1). Teclado: Tab, Espacio/Enter, `aria-pressed`.
- Datos: ya existen en `worldGdp.json` (PBI y población 1960-2025 de todos los países), no se agrega ninguna cifra. En PBI per cápita se respeta el corte de ≥ 1 millón de habitantes de `worldRankingAt`; un país sin dato en un año queda como hueco, sin interpolar ni rellenar (`AGENTS.md` sección 6).
- Colores por país desde `tokens.categorical` (sin literales); Argentina en `ink`/blanco, como hoy.
- Escala lineal por defecto; el conmutador a logarítmica solo aparece si una línea queda aplastada (D2).

### 2.3 Etiqueta de la punta: bandera + puesto (V2)
- Cada línea termina en una etiqueta con la bandera del país y su puesto en el ranking mundial **del año que alcanzó la línea** (`rankingTable` ya da el puesto de Argentina precomputado; para los demás, el índice en `worldRankingAt`). El puesto cambia mientras corre la animación.
- 2D (ECharts): `endLabel` con `rich` + imagen de bandera, o una serie de «cabezas» (como la serie `Hoy` de `buildFollowedSeries`) con `label.formatter` rich. 3D: sprite/etiqueta del spec de líneas con la misma imagen y número.
- El nombre del país queda en la leyenda de chips y en el `aria-label`/tabla, no en el gráfico.
- **Banderas:** SVG de `flag-icons` (D3); sin emoji.

### 2.4 Texto aclaratorio dentro del `?`, en todas las slides (D4)
- `ChartHelp` (`web/src/ui/ChartHelp.tsx`) gana una prop opcional `lead: string`: se renderiza **primero**, antes del cuerpo, en celeste (clase `chart-help-lead`, color de la familia `--sky-*` de `tokens.css`), en el tooltip y en el popup.
- Qué va en `lead`: la unidad y la aclaración de medición que hoy viven como subtítulo suelto (p. ej. «miles de millones de USD de 2015 (PBI real, a precios constantes)», «USD de 2015 por persona») y notas como la de la escala logarítmica.
- Barrido por las 12 vistas que usan `ChartHelp` (`AiStep`, `ChartStep`, `CompositionStep`, `DevelopmentStep`, `ExportsStep`, `ForecastUncertaintyStep`, `ProductivityStep`, `ProvinceStep`, `ResourcesStep`, `Rule70Step`, `TourSidebar`, `WorldStep`): por cada gráfico con subtítulo de unidad, el subtítulo se quita del cuerpo y pasa como `lead`. La fuente y las referencias `[n]` se quedan visibles.
- El PR de `ChartHelp` + `WorldStep` va primero y fija el patrón; el resto, un PR por grupo de vistas.
- Test: render de `ChartHelp` con `lead` -> es el primer hijo del tooltip y del popup y lleva la clase celeste; sin `lead`, nada cambia.

### 2.5 Línea de crecimiento promedio de la región, solo con PBI (V8)
- Pedido (2026-10-17): en el gráfico grande, **solo cuando la métrica es PBI** (no per cápita), una línea extra con el crecimiento promedio de la región. «Solo para PBI puntuado» lo leo como «solo para PBI»; confirmar si «puntuado» quería decir otra cosa.
- **Dato que falta:** `worldGdp.json` solo trae 11 países de la región (los diez mayores de América Latina y el Caribe + Uruguay), y promediar solo esos sesgaría el dato hacia Brasil y México. Hay que traer el **agregado oficial del Banco Mundial para América Latina y el Caribe (código `LCN`)**: PBI real a dólares constantes de 2015 (`NY.GDP.MKTP.KD`, serie 1960-2025) y su crecimiento anual (`NY.GDP.MKTP.KD.ZG`). El script `scripts/build_world_gdp.py` ya filtra por `region.id == 'LCN'`, así que la extensión natural es pedir el agregado `LCN` con la misma API y guardarlo en `worldGdp.json` con `source`, `url` y `retrieved_at` (`AGENTS.md` sección 6). El dato se descarga al implementar, no se inventa ni se reconstruye a mano; si la API no lo devuelve, se anota en `docs/data-requests.md` como pendiente para traer a mano.
- **Cómo se dibuja:** el gráfico principal muestra niveles de PBI (miles de millones de USD de 2015), y un promedio de crecimiento es una tasa (%). Mezclarlos en el mismo eje no funciona. Opciones en D7.
- La línea se anima con el mismo reloj que las demás, sin puesto en el ranking (no es un país): su etiqueta de punta es el texto «Región» con la tasa, no bandera. Su explicación y la definición del promedio (promedio ponderado por PBI del agregado LCN vs. promedio simple de países) va como `lead` celeste en el `?`.
- Test: `regionGrowth(year)` pura (la tasa del año coincide con el agregado del dataset, hueco = `null`); la línea no existe con la métrica per cápita.

## 3. Ajustes visuales (V3-V6)

| # | Cambio | Archivo |
|---|---|---|
| V6a | Título «Mayores economías de la región» sin «en {shownYear}» (el año ya está en el contador grande) | `WorldStep.tsx` |
| V6b | `?` en la misma línea que el título: hoy `tour-caption` es una columna y el `?` cae abajo; pasar a fila con `flex-wrap: nowrap` y `align-items: center` | `WorldStep.tsx` + CSS de `.tour-caption` |
| V6c | Conmutador Gráfico/Tabla en la esquina superior derecha de la tarjeta (`margin-left: auto`); los botones PBI / PBI per cápita / Población quedan debajo, ocupando su fila | `WorldStep.tsx` + CSS |
| V5a | Un `ChartHelp` por tabla junto a su título («PBI real», «PBI per cápita real») con texto propio (qué mide, por qué per cápita solo ≥ 1 M de habitantes); el del encabezado de la tarjeta se conserva | `WorldTable.tsx`, `stepInfo.ts` |
| V5b | La unidad de cada tabla sale del cuerpo y va como `lead` celeste de su `?` | `WorldTable.tsx` |
| V3 | Subtítulo del encabezado sin la unidad larga (pasa al `lead` del `?` del título): «Banco Mundial (WDI), 1960 a 2025 · [refs]» | `WorldStep.tsx` |
| V4 | Alinear verticalmente el `?` del título con la línea de base del `h2` | CSS de `.slide-title-row` |

Todos los estilos nuevos con `var(--token)` (la prueba `shellUi.test.tsx` rechaza literales).

## 4. Pasos, dependencias y tests

Una rama por paso (`task/<slug>`), PR chicos, CI en la nube antes del PR. Tests escritos primero (TDD) para la lógica; los visuales con prueba de render (Vitest + Testing Library) y el snapshot de Playwright solo en CI.

| # | | Paso | Depende de | Test que lo cierra |
|---|---|---|---|---|
| 1 | 🔴 | `help-lead-text`: prop `lead` celeste en `ChartHelp` + `WorldStep` (unidades y subtítulo pasan al `?`, un `?` por tabla, título sin año, `?` en línea, Gráfico/Tabla arriba a la derecha) | nada | Render: `lead` primero y celeste; título sin año; conmutador en el encabezado |
| 2 | 🔴 | `slide1-main-metric` (V7): tabla clickeable y gráfico grande per cápita | 1 | `mainSeries(metric, country)` pura; click y teclado cambian unidad y `aria-pressed` |
| 3 | 🟡 | `slide1-compare-countries` (V1, D1, D2): banderas seleccionables, líneas extra, conmutador logarítmico condicional | 2, D3 | `compareSeries(names, metric)` (huecos `null`); `isSquashed(series)` pura; el conmutador solo existe si `isSquashed` |
| 4 | 🟡 | `slide1-flag-rank-labels` (V2): bandera + puesto en la punta, 2D y 3D | 3 | `rankAtYear` coincide con `worldRankingAt`; el `endLabel` no contiene texto de país |
| 5 | 🟡 | `slide1-region-growth` (V8): traer el agregado LCN del Banco Mundial y dibujar la línea de crecimiento promedio de la región, solo con PBI | 3, D7 | `regionGrowth(year)` pura; la línea no aparece con per cápita |
| 6 | 🟡 | `help-lead-all-slides`: aplicar `lead` al resto de las vistas (D4), PR por grupo | 1 | Render por vista |
| 7 | 🟢 | Revisión visual en el navegador, 2D y 3D, ancho de teléfono, `prefers-reduced-motion` | 1-6 | Humano; Playwright en CI |

## 5. Decisiones tomadas (2026-10-17)

| # | Decisión | Resolución |
|---|---|---|
| D1 | Países del gráfico | Por defecto solo Argentina, Brasil y México. Activables: Estados Unidos, Australia, Japón, Alemania, Chile, Uruguay, España (sin buscador libre). Cada opción se muestra como bandera, sin texto; el nombre va en `aria-label` y en un tooltip propio (nunca `title` nativo). |
| D2 | Escala del eje Y | Lineal. El conmutador a logarítmica **aparece solo cuando una línea queda aplastada** (criterio: el valor máximo de una línea visible < 10 % del máximo del eje; función pura testeable). Sin aplastamiento, no hay conmutador. Lo explica el texto del `?` de esa tarjeta. |
| D3 | Banderas | SVG de `flag-icons` (MIT) copiados a `web/public/flags/` (solo los países usados); licencia en `docs/sources.md`. Sin emoji, sin dependencia npm. |
| D4 | Textos aclaratorios (unidades, notas) | Se mueven dentro del `?` como **primera línea, en celeste** (token de `tokens.css`, familia `--sky-*`), tanto en el tooltip como en el popup. Criterio **para todas las slides** (ver 2.4). |
| D5 | Puesto de países no-Argentina en per cápita | El del ranking de ≥ 1 M de habitantes. |
| D7 | Cómo mostrar el crecimiento promedio de la región junto a niveles de PBI | (a) eje secundario a la derecha en % anual, con línea punteada · (b) línea de la región **indexada** a nivel (PBI de la región con base igual a Argentina en 1960) · (c) panel chico debajo del gráfico con la tasa. **Recomiendo (a):** es lo más directo y no inventa un nivel; el `?` aclara que el eje derecho es una tasa. Decisión tuya. |
| D6 | V3, V4, V5 | Resueltos por D4: unidades y nota del subtítulo salen del cuerpo y pasan al `?`; las tablas conservan solo su título corto. |

## 6. Verificación humana pendiente (no hay cifras nuevas)
- Las banderas elegidas para cada país (y la bandera de Argentina, con el sol).
- Que el puesto de la punta coincide con el ranking del Banco Mundial del año en pantalla.
- Que los diez países (Argentina, Brasil, México y los siete activables) tienen datos 1960-2025 en `worldGdp.json`; si alguno tiene huecos, el gráfico lo muestra como corte, no como valor.
