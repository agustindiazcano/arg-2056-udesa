/**
 * The text of the side panel of each chart of the Recorrido (steps 0 to 13; step 14 has its own text): what the chart shows, how to read it,
 * how real its data is and which references (ids of `REFERENCES`) it comes from. Where the data is still made up the panel says so; the
 * state of every slide is in `docs/data-requests.md`, section 0.
 */

export type StepData = 'real' | 'parcial' | 'prueba';

export interface StepInfo {
  heading: string;
  paragraphs: string[];
  how: string;
  data: StepData;
  /** one line on where the numbers come from and what is missing */
  note: string;
  refs: string[];
}

export const STEP_INFO: Record<number, StepInfo> = {
  0: {
    heading: 'Dónde estuvo y dónde está Argentina',
    paragraphs: [
      'Este gráfico sigue el PBI real de Argentina, a precios constantes (dólares de 2015), año por año de 1960 a 2025, frente al resto del mundo y frente a la región. En 2025 fue de 609.200 millones de dólares de 2015, el puesto 22 del mundo según el Banco Mundial.',
      'El PBI real quita el efecto de los precios: mide cuánto se produce, no cuánto vale a los precios del año; por eso sirve para comparar épocas. El PBI per cápita real es ese valor dividido por la población. Los botones de abajo cambian el gráfico de barras de la región entre PBI, PBI per cápita y población.'
    ],
    how: 'Mové el control del año para ver cómo cambia el ranking. Las barras de la región se reordenan de mayor a menor en cada año. El ranking de PBI per cápita cuenta solo países de un millón de habitantes o más.',
    data: 'real',
    note: 'Banco Mundial (WDI), PBI real en dólares constantes de 2015, 1960 a 2025; algunos países no tienen dato en los primeros años. La población de Argentina de 2022 a 2025 es la proyección oficial del INDEC (Censo 2022); el resto, del Banco Mundial. El año 2026 no se dibuja porque todavía no es un dato observado.',
    refs: ['W5', 'I1', 'F1']
  },
  2: {
    heading: 'Qué produce cada provincia',
    paragraphs: [
      'El mapa colorea cada provincia según su producción. Al elegir un sector (minería, agro o hidrocarburos) el mapa cambia para mostrar quién aporta más.',
      'Argentina no es un solo país económico: la producción se concentra en pocas provincias y cada una vive de recursos distintos.'
    ],
    how: 'Tocá una provincia para ver su valor. El color más intenso es el valor más alto.',
    data: 'prueba',
    note: 'Los valores por provincia son de prueba. Los indicadores de arriba sí son reales (Banco Mundial, 2025). Falta traer la producción por provincia de la Secretaría de Energía, Minería y MAGyP.',
    refs: ['W3']
  },
  3: {
    heading: 'Cuarta revolución industrial: de la euforia al ajuste estructural',
    paragraphs: [
      'Tres escenarios del PBI real hasta 2056 con contabilidad del crecimiento (capital, trabajo y PTF) más el impulso de la inteligencia artificial. La literatura reciente marca un contraste profundo: mientras Goldman Sachs (Briggs y Kodnani, 2023) proyectó +1,5 puntos porcentuales anuales de productividad (+7 % en el PBI global en 10 años), Daron Acemoglu (MIT, NBER w32487) aplicó el teorema de Hulten y estimó apenas +0,9 % a +1,6 % acumulado en una década (~0,1 a 0,15 pp/año).',
      'La curva verde (Optimista) representa el techo teórico de economías frontera productoras de cómputo y modelos (Estados Unidos, Australia, Alemania, con un Índice de Preparación para la IA del FMI de 0,68). Argentina hoy no está en ese tren: tiene un AIPI de 0,47 (FMI), cerca de 45 % de informalidad laboral y es importadora neta de tokens con un sobrecosto fiscal de hasta 51 %.',
      'El documento de trabajo del FMI «Mind the Gap» (WP/25/76) y el Anthropic Economic Index (arXiv:2511.15080) confirman que las ganancias de PTF se concentran en países de altos ingresos, mientras que en economías emergentes con fricción estructural el impulso neto de la IA es de ~0,00 pp/año en el caso pesimista, +0,17 pp/año en el neutro y +0,42 pp/año en el optimista.',
      'Con el selector «Proyección» podés alternar entre el PBI de Argentina, la proyección agregada del Mundo y la comparación directa entre el grupo de países que se suben a la ola (Frontera) y los países con fricción estructural como Argentina.'
    ],
    how: 'Usá el botón «Proyección» arriba para comparar Argentina, el Mundo y los dos grupos de países (los que se suben a la ola vs. como Argentina). Mirá las banderas en cada curva: EE. UU., Australia y Alemania en la curva verde (frontera); España, Chile y Uruguay en la intermedia; Argentina, Brasil y México en la curva con fricción.',
    data: 'parcial',
    note: 'Los escenarios salen de un informe pasado por el responsable y de la síntesis de Goldman Sachs, FMI WP/25/76, FMI AIPI, Acemoglu (NBER w32487) y Anthropic Economic Index. 2026 es el mismo valor de las otras diapositivas (crecimiento del FMI).',
    refs: ['P8', 'P9', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'AI59', 'AI60', 'AI61', 'AI62']
  },
  4: {
    heading: 'De qué viven las exportaciones',
    paragraphs: [
      'Argentina exportó bienes por 87.111 millones de dólares en 2025, 9,3 % más que en 2024 (datos provisorios). El INDEC los agrupa en complejos exportadores, que reúnen la materia prima con los productos elaborados de una misma cadena.',
      'El complejo soja es el primero (21.442 millones, uno de cada cuatro dólares), seguido por el petrolero-petroquímico (11.772, un récord desde 2002), el automotriz (8.784) y el maicero (6.660). Los diez principales complejos juntan el 77,7 % de lo exportado.',
      'Con el botón «% del total» el mismo gráfico muestra cómo se reparte: la soja es el 24,6 %; el petróleo y la petroquímica, el 13,5 %; los autos, el 10,1 %; y el maíz, el 7,6 %. El oro y la plata (5,6 %) crecieron 27,7 % y el trigo (4,2 %) 32,0 % respecto de 2024.'
    ],
    how: 'Elegí dólares o % del total, el año (el informe que tenemos trae 2024 y 2025; los otros años están deshabilitados porque no hay dato) y, si querés, un complejo para ver cómo cambió. Cada barra es un complejo exportador. «Otros complejos» reúne a los 27 restantes y «Resto de exportaciones» a lo que no entra en ningún complejo.',
    data: 'real',
    note: 'INDEC, «Complejos exportadores, año 2025» (marzo de 2026, datos provisorios), solo bienes: no incluye servicios. En Data está también el acumulado de enero a julio de 2026 por gran rubro (58.365 millones, 22,9 % más que un año antes).',
    refs: ['E7', 'E1']
  },
  5: {
    heading: '¿Cuánto hay que crecer por año para duplicar el PBI? La regla del 70',
    paragraphs: [
      'Una forma rápida de saber cuánto tarda en duplicarse algo que crece a una tasa constante: se divide 70 por la tasa en %. A 3 % por año tarda unos 23 años. La regla del 72 es la misma idea con otra constante; la fórmula exacta es t = ln 2 / ln(1 + r).',
      'Con el deslizador elegís la tasa y ves el tiempo exacto, las dos reglas y cuánto se equivoca cada una. El gráfico del error muestra para qué tasas anda mejor cada regla, y el de crecimiento, en escala lineal o logarítmica (donde un crecimiento constante es una recta). El recuadro de Argentina dice en qué año se duplicaría el PBI real de 2026 a esa tasa.',
      'En la pestaña «Países reales» se ve lo que pasó de verdad: China entre 1979 y 2010, Corea del Sur entre 1960 y 1990, India, Estados Unidos y Argentina, o cualquier otro país y período. Se compara la tasa entre los extremos con la ajustada sobre todos los años, se cuenta cuántas veces se duplicó el nivel y se ve cuánto tardaba en duplicarse en cada ventana de diez años.',
      'La pestaña «Escenarios» compara dos tasas durante N años (cuántas veces se multiplica cada nivel, cuánto más alto termina el que crece más y, si arrancan en niveles distintos, cuándo se cruzan) y la de «Proyecciones del FMI» muestra el crecimiento que el FMI proyecta para once países y cuánto tardaría en duplicarse el PBI a ese ritmo.'
    ],
    how: 'Mové el deslizador o escribí una tasa entre 0,1 y 20 %. En la escala logarítmica cada línea horizontal es una duplicación.',
    data: 'real',
    note: 'No es una medición: es una cuenta. Los datos son el PBI real y la población del Banco Mundial (de Argentina, la del INDEC), los mismos de los otros gráficos.',
    refs: ['W5', 'I1']
  },
  8: {
    heading: 'Recursos naturales: minería, hidrocarburos, agro y stock',
    paragraphs: [
      'La minería exportó 4.673 millones de dólares en 2024: oro 3.141 (67 %), plata 652, litio 645 y el resto 235. En mayo de 2025 la Secretaría de Minería tenía 316 operaciones y proyectos en cartera, solo 25 en producción.',
      'La Secretaría proyecta exportaciones de 25.500 millones de dólares en 2035: 11.700 de cobre, 11.300 de litio y unos 2.500 de oro y plata. Para lograrlo calcula inversiones por 30.200 millones entre 2025 y 2031, con el pico en 2026 (7.510 millones). Una parte pasa por el RIGI: la prensa cuenta 13 proyectos mineros aprobados por unos 25.000 millones.',
      'Argentina produjo en 2025 un promedio de 793,7 mil barriles de petróleo por día, 13 % más que en 2024 (700,7), y 141,4 millones de metros cúbicos de gas por día. En 2015 eran 532,4 mil barriles y 117,5 millones de m³.',
      'El campo es la base histórica de las exportaciones argentinas. En la campaña 2024/25 se produjeron 51,1 millones de toneladas de soja, 51,7 de maíz y 5,5 de girasol; la última campaña de trigo publicada (2025/26) dio 27,9 millones. El gráfico las muestra en toneladas, no en dólares.',
      'El stock de recursos es lo que está en el suelo y todavía no se produjo. La Secretaría de Minería estima recursos de litio por 122 millones de toneladas de carbonato equivalente (21 millones como reservas) y de cobre por 116,7 millones de toneladas. El USGS (2026) calcula 28 millones de toneladas de litio contenido como recursos argentinos, los mayores del mundo.'
    ],
    how: 'Elegí la pestaña: Minería (barra gris 2024, azul la proyección a 2035), Hidrocarburos (línea llena la producción de petróleo; la punteada y la franja, lo esperado), Agro (toneladas por campaña de los cuatro cultivos) y Stock (valor de lo que hay bajo la tierra). Los proyectos, la serie desde 1950 y las toneladas, superficie y rendimiento por campaña están en las tablas de la sección Data.',
    data: 'parcial',
    note: 'Minería: Secretaría de Minería, ARMINERA 2025, leído a mano de imágenes; la proyección es de la Secretaría. Hidrocarburos: la historia de 2015 a 2025 es real (Secretaría de Energía, datos abiertos); la proyección y la franja son de prueba. Agro: toneladas reales del MAGyP (series nacionales). Stock: las barras son de prueba; las cantidades físicas vienen de ARMINERA 2025. Las listas de proyectos del RIGI son de prensa y no están verificadas.',
    refs: ['E3', 'E4', 'E5', 'E6', 'E8', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R8', 'R10']
  },
  12: {
    heading: 'De qué se compone el PBI y qué se exporta',
    paragraphs: [
      'El valor agregado de 2025 por sector: la industria manufacturera aporta el 18,0 %, el comercio el 15,2 %, las actividades inmobiliarias y empresariales el 13,9 % y la agricultura y ganadería el 8,5 %.',
      'Más de la mitad del producto son servicios; los sectores que más exportan (agro, minería, energía) pesan menos en el PBI que en las exportaciones.',
      'A la derecha, la composición de las exportaciones de bienes de 2025 por complejo exportador (INDEC): sirve para comparar lo que pesa cada sector en la producción con lo que pesa en lo que el país vende afuera.'
    ],
    how: 'Cada rectángulo es la parte del valor agregado total que aporta un sector (izquierda) o la parte de las exportaciones que explica un complejo (derecha); también podés verlos en barras o en torta. El botón «Exportaciones por año y complejo» muestra las exportaciones en dólares o en porcentaje, por año y por complejo.',
    data: 'real',
    note: 'INDEC, cuadro 4 del informe de avance del nivel de actividad del segundo trimestre de 2026: precios de 2004, datos preliminares. A precios corrientes las proporciones cambian.',
    refs: ['E2', 'E7']
  }
};
