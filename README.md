# Argentina 2056: del Cruce de los Andes a la Cuarta Revolución Industrial

Un relato interactivo, con datos, que une el Cruce de los Andes (1817) con el desafío de la Argentina hacia 2056: recursos, economía, población y el impacto de la inteligencia artificial y la automatización (la «Cuarta Revolución Industrial» en el sentido de Klaus Schwab, Foro Económico Mundial).

- **Los Andes**: mapa 3D con satélite y relieve reales; la marcha de la columna principal del Ejército de los Andes, las otras columnas del cruce y el encuentro de las fuerzas, con figuras en miniatura.
- **Recorrido al 2056**: una presentación guiada con gráficos 2D y 3D.
- **Data Dashboard** (oculto por ahora): economía, recursos, pronóstico 2056 con abanico de incertidumbre, revolución IA y simulador.

La incertidumbre se muestra como abanico de percentiles; las cifras en disputa, como rangos; los vacíos, como «sin dato». Los supuestos y las reglas de datos están en [`AGENTS.md`](AGENTS.md) y [`docs/assumptions.md`](docs/assumptions.md).

## Cómo correrlo

```bash
cd web
npm ci
cp .env.example .env.local   # completar VITE_MAPTILER_KEY (satélite y relieve de MapTiler)
npm run dev
```

Sin `VITE_MAPTILER_KEY` la escena de los Andes muestra un aviso y un fondo liso. La clave queda en el bundle: restringila por origen en MapTiler. Antes de un push: `python scripts/precheck.py`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `web/` | Aplicación (Vite, React, TypeScript, MapLibre GL, Three.js, ECharts) |
| `model/` | Modelo de pronóstico en Python, con backtest |
| `data/` | Datos, esquemas y generador de datos de prueba |
| `docs/` | Decisiones, supuestos, diseño y fuentes |

## Referencias

La lista completa, con qué dato sale de cada fuente y qué falta verificar, está en [`docs/references.md`](docs/references.md).

### Cruce de los Andes (1817)

1. UNCuyo, *Historia virtual de Mendoza*, «El Cruce de los Andes». <http://historiavirtual.mza.uncu.edu.ar/mendoza-independiente/cruce.html>
2. Los Andes (Mendoza), nota sobre el Cruce de los Andes, con las instrucciones de San Martín a Las Heras del 15-01-1817. <https://www.losandes.com.ar/el-historico-cruce-de-1817-por-juan-marcelo-calabria>
3. Diario de Cuyo, «Crónica de una epopeya», 2017-05-01. <https://www.diariodecuyo.com.ar/columnasdeopinion/Cronica-de-una-epopeya-20170501-0057.html>
4. Wikipedia, «Rutas sanmartinianas». <https://es.wikipedia.org/wiki/Rutas_sanmartinianas>
5. Wikipedia, «Batalla de Chacabuco». <https://es.wikipedia.org/wiki/Batalla_de_Chacabuco>
6. Museo Histórico Nacional, «El cruce de la Cordillera de los Andes». <https://museohistoriconacional.cultura.gob.ar/noticia/el-cruce-de-la-cordillera-de-los-andes/>
7. El Arcón de la Historia, «El cruce de la cordillera de los Andes (18/01/1817 al 08/02/1817)». <https://elarcondelahistoria.com/el-cruce-de-la-cordillera-de-los-andes-18011817-al-08021817/>
8. Estado general del Ejército de los Andes (Mendoza, 31-12-1816), en Espejo, *El paso de los Andes* (por verificar en el original).
9. Plano de la batalla de Chacabuco coordinado por B. Mitre, en *Historia de San Martín*. <https://www.memoriachilena.gob.cl/602/w3-article-546948.html>

### Mapa y terreno

10. MapTiler: imágenes satelitales, modelo de elevación Terrain-RGB v2 y geocodificador. <https://www.maptiler.com>
11. © OpenStreetMap contributors (nombres y posiciones de los lugares). <https://www.openstreetmap.org/copyright>

### Marco conceptual

12. Schwab, K. (2016). *La Cuarta Revolución Industrial*. Foro Económico Mundial.

> Las posiciones de los lugares son aproximadas, las fechas intermedias entre las documentadas son estimaciones marcadas como tales, y las cifras de efectivos varían según la fuente. Todo está señalado en [`docs/references.md`](docs/references.md).
