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

export const DATA_LABEL: Record<StepData, string> = {
  real: 'Datos reales',
  parcial: 'Datos en parte reales',
  prueba: 'Datos de prueba'
};

export const STEP_INFO: Record<number, StepInfo> = {
  0: {
    heading: 'Dónde estuvo y dónde está Argentina',
    paragraphs: [
      'Este gráfico sigue el PBI nominal de Argentina, en dólares corrientes (no en paridad de poder adquisitivo), año por año de 1960 a 2025, frente al resto del mundo y frente a la región. En 2025 fue de 683.100 millones de dólares, la economía número 24 del mundo según el Banco Mundial.',
      'El PBI nominal es lo que vale la producción de un país al tipo de cambio del año; es el que usan los rankings de tamaño de la economía. El PBI per cápita es ese valor dividido por la población. Los botones de abajo cambian el gráfico de barras de la región entre PBI, PBI per cápita y población.'
    ],
    how: 'Mové el control del año para ver cómo cambia el ranking. Las barras de la región se reordenan de mayor a menor en cada año. El ranking de PBI per cápita cuenta solo países de un millón de habitantes o más.',
    data: 'real',
    note: 'Banco Mundial (WDI), PBI nominal en dólares corrientes, 1960 a 2025; algunos países no tienen dato en los primeros años. La población de Argentina de 2022 a 2025 es la proyección oficial del INDEC (Censo 2022); el resto, del Banco Mundial. El año 2026 no se dibuja porque todavía no es un dato observado: el FMI lo estima en 768.200 millones.',
    refs: ['W5', 'I1', 'F1']
  },
  1: {
    heading: 'El PBI de Argentina, de 1990 a 2056',
    paragraphs: [
      'La línea muestra el PBI nominal observado de 1990 a 2025 y la proyección esperada hasta 2056, con un abanico que va del escenario más bajo al más alto. En la historia se ven las crisis de 1995, 2001-2002, 2009 y 2020.',
      'El cuadro de indicadores resume la economía en 2025: PBI nominal, población, PBI por habitante, exportaciones, crecimiento e inversión.'
    ],
    how: 'Mirá primero la línea de la proyección y después el ancho del abanico: cuanto más ancho, más incierto es el futuro. El abanico no es un pronóstico de lo que va a pasar sino de lo que podría pasar.',
    data: 'parcial',
    note: 'La historia es real (Banco Mundial, PBI nominal en dólares corrientes). El valor de 2026 es la estimación del FMI (768.200 millones, actualización del 30-09-2026) y es el mismo en todos los gráficos del sitio. Desde 2027 la proyección y el abanico son de prueba hasta que esté el modelo. Población: INDEC; el Banco Mundial tiene 45,9 millones y el FMI 47,5 (usa la proyección anterior al censo).',
    refs: ['W3', 'W5', 'I1', 'F1']
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
    heading: 'La inteligencia artificial y el PBI',
    paragraphs: [
      'Dos líneas del PBI desde 2025: una sin la revolución de la inteligencia artificial y otra con ella. La diferencia entre ambas es lo que la IA podría agregar al producto.',
      'Los estudios dan resultados muy distintos. Acemoglu (2024) calcula un aumento de la productividad total de no más de 0,66 % en diez años (menos de 0,53 % si se descuentan las tareas difíciles de aprender). Anthropic (2025) estima, para Estados Unidos y suponiendo adopción universal en diez años, 1,8 % anual de productividad laboral y 1,08 % anual de productividad total.'
    ],
    how: 'Compará la distancia entre las dos líneas en 2056. No es una predicción: depende de cuánto de la economía se adapta y de qué tan rápido.',
    data: 'prueba',
    note: 'Las dos líneas son de prueba; parten de la estimación del FMI para 2026 (768.200 millones de dólares corrientes), el mismo valor del gráfico del PBI. Los dos estudios se leyeron el 12-10-2026; Anthropic aclara que su cifra no es una predicción y que usa supuestos fuertes. Ninguno es sobre Argentina.',
    refs: ['P8', 'P9', 'P10a']
  },
  4: {
    heading: 'De qué viven las exportaciones',
    paragraphs: [
      'Argentina exportó bienes por 87.111 millones de dólares en 2025, 9,3 % más que en 2024 (datos provisorios). El INDEC los agrupa en complejos exportadores, que reúnen la materia prima con los productos elaborados de una misma cadena.',
      'El complejo soja es el primero (21.442 millones, uno de cada cuatro dólares), seguido por el petrolero-petroquímico (11.772, un récord desde 2002), el automotriz (8.784) y el maicero (6.660). Los diez principales complejos juntan el 77,7 % de lo exportado.'
    ],
    how: 'Cada barra es un complejo exportador, en miles de millones de dólares de 2025. «Otros complejos» reúne a los 27 restantes y «Resto de exportaciones» a lo que no entra en ningún complejo.',
    data: 'real',
    note: 'INDEC, «Complejos exportadores, año 2025» (marzo de 2026, datos provisorios), solo bienes: no incluye servicios. En Data está también el acumulado de enero a julio de 2026 por gran rubro (58.365 millones, 22,9 % más que un año antes).',
    refs: ['E7', 'E1']
  },
  5: {
    heading: 'La regla del 70',
    paragraphs: [
      'Una forma rápida de saber cuánto tarda una economía en duplicarse: se divide 70 por la tasa de crecimiento anual. A 3 % por año, tarda unos 23 años.',
      'Parece un detalle, pero define el horizonte de este trabajo: a 2 % por año el PBI se duplica en 35 años; a 4 %, en 17,5.'
    ],
    how: 'Cada barra son los años que tarda en duplicarse el PBI con una tasa de crecimiento. Más crecimiento, menos años.',
    data: 'real',
    note: 'No es una medición: es una cuenta (70 dividido la tasa), por eso no tiene fuente de datos.',
    refs: []
  },
  6: {
    heading: 'Qué miran los inversores',
    paragraphs: [
      'Los capitales se mueven hacia donde ven reglas claras, estabilidad y retornos. Este gráfico ordena los factores que pesan en esa decisión.',
      'No es una encuesta publicada: es un esquema para ordenar la discusión.'
    ],
    how: 'Cada barra es el puntaje de 0 a 10 de un factor. Una barra baja es un obstáculo para invertir.',
    data: 'prueba',
    note: 'Los puntajes son de prueba. Falta una fuente que los publique, o sacar esta diapositiva.',
    refs: []
  },
  7: {
    heading: 'El mapa productivo',
    paragraphs: [
      'Cada provincia pintada según su valor productivo anual, en millones de dólares.',
      'Es la misma información del paso 2 vista como un solo número por provincia.'
    ],
    how: 'Tocá una provincia para destacarla. El tono más oscuro es el valor más alto.',
    data: 'prueba',
    note: 'Los valores son de prueba hasta que se traiga la producción por provincia.',
    refs: []
  },
  8: {
    heading: 'Minería: lo que hay y lo que viene',
    paragraphs: [
      'La minería exportó 4.673 millones de dólares en 2024: oro 3.141 (67 %), plata 652, litio 645 y el resto 235. En mayo de 2025 la Secretaría de Minería tenía 316 operaciones y proyectos en cartera, solo 25 en producción.',
      'La Secretaría proyecta exportaciones de 25.500 millones de dólares en 2035: 11.700 de cobre, 11.300 de litio y unos 2.500 de oro y plata. Para lograrlo calcula inversiones por 30.200 millones entre 2025 y 2031, con el pico en 2026 (7.510 millones). Una parte pasa por el RIGI: la prensa cuenta 13 proyectos mineros aprobados por unos 25.000 millones.'
    ],
    how: 'La barra gris son las exportaciones de 2024 y la azul la proyección para 2035, por mineral. Los proyectos de litio y de cobre, con su capacidad, y los del RIGI están en las tablas de la sección Data.',
    data: 'real',
    note: 'Secretaría de Minería, ARMINERA 2025: los números se leyeron a mano de imágenes del documento. «Cobre y resto» de 2024 es el «resto» que el gráfico no desglosa. El oro y la plata de 2035 son lo que resta del total (25,5 − 11,7 − 11,3). La proyección es de la Secretaría, no de este proyecto. La lista de proyectos del RIGI es de prensa y no está verificada.',
    refs: ['E3', 'E5', 'R1', 'R2', 'R3']
  },
  9: {
    heading: 'Hidrocarburos: el piso y el techo',
    paragraphs: [
      'Argentina produjo en 2025 un promedio de 793,7 mil barriles de petróleo por día, 13 % más que en 2024 (700,7), y 141,4 millones de metros cúbicos de gas por día. En 2015 eran 532,4 mil barriles y 117,5 millones de m³.',
      'Vaca Muerta explica el salto: 182 millones de barriles en 2025 (28,7 % más que en 2024), con un récord de 589 mil barriles por día en diciembre; aportó el 62 % del petróleo y el 53 % del gas. Hay un oleoducto (Vaca Muerta Sur) con cerca de 80 % de obra y proyectos de gas natural licuado y de ampliación, varios dentro del RIGI.'
    ],
    how: 'La línea llena es la producción nacional de petróleo, en miles de barriles por día; después de 2025 la línea punteada es la esperada y la franja es el piso y el techo según cuánto se desarrolle Vaca Muerta. Los proyectos y la serie desde 1950 están en la tabla de la sección Data.',
    data: 'parcial',
    note: 'La historia de 2015 a 2025 es real (Secretaría de Energía, datos abiertos: promedio de los doce meses de cada año; el IAE da 800,2 con la misma fuente). La proyección y la franja son de prueba. Los proyectos son de prensa y no están verificados.',
    refs: ['E6', 'E4', 'R2', 'R3', 'R6', 'R8', 'R10']
  },
  10: {
    heading: 'Agro: lo que se produce y lo que se podría',
    paragraphs: [
      'El campo es la base histórica de las exportaciones argentinas. En la campaña 2024/25 se produjeron 51,1 millones de toneladas de soja, 51,7 de maíz, y 5,5 de girasol; la última campaña de trigo publicada (2025/26) dio 27,9 millones.',
      'El gráfico compara la producción de hoy con la que podría alcanzarse con más tecnología, riego o superficie. El potencial no es una promesa: depende de precios, clima y reglas de exportación.'
    ],
    how: 'La barra gris es la producción actual y la azul la potencial. La diferencia entre ellas es el margen de crecimiento. En Data están las toneladas, la superficie y el rendimiento de cada cultivo por campaña.',
    data: 'prueba',
    note: 'Las barras del gráfico son de prueba (están en dólares). Las toneladas por cultivo son reales (MAGyP, series nacionales) y están en Data. Falta un estudio de potencial y valuar la producción.',
    refs: ['E8']
  },
  11: {
    heading: 'Cómo se reparte lo que exportamos',
    paragraphs: [
      'El mismo total del paso 4, ahora como porcentaje de las exportaciones de bienes de 2025.',
      'La soja es el 24,6 %; el petróleo y la petroquímica, el 13,5 %; los autos, el 10,1 %; y el maíz, el 7,6 %. El oro y la plata (5,6 %) crecieron 27,7 % y el trigo (4,2 %) 32,0 % respecto de 2024.'
    ],
    how: 'Cada barra es la parte del total que corresponde a un complejo. Todas las barras suman 100 %.',
    data: 'real',
    note: 'INDEC, «Complejos exportadores, año 2025» (datos provisorios). Los porcentajes son sobre las exportaciones de bienes.',
    refs: ['E7']
  },
  12: {
    heading: 'De qué se compone el PBI',
    paragraphs: [
      'El valor agregado de 2025 por sector: la industria manufacturera aporta el 18,0 %, el comercio el 15,2 %, las actividades inmobiliarias y empresariales el 13,9 % y la agricultura y ganadería el 8,5 %.',
      'Más de la mitad del producto son servicios; los sectores que más exportan (agro, minería, energía) pesan menos en el PBI que en las exportaciones.'
    ],
    how: 'Cada barra es la parte del valor agregado total que aporta un sector. Están ordenados de mayor a menor.',
    data: 'real',
    note: 'INDEC, cuadro 4 del informe de avance del nivel de actividad del segundo trimestre de 2026: precios de 2004, datos preliminares. A precios corrientes las proporciones cambian.',
    refs: ['E2']
  },
  13: {
    heading: 'Cuánto valen los recursos que hay bajo la tierra',
    paragraphs: [
      'El stock de recursos es lo que está en el suelo y todavía no se produjo. La Secretaría de Minería estima recursos de litio por 122 millones de toneladas de carbonato equivalente (21 millones como reservas) y de cobre por 116,7 millones de toneladas. El USGS (2026) calcula 28 millones de toneladas de litio contenido como recursos argentinos, los mayores del mundo.',
      'También hay 105 millones de onzas de oro y 3.216 millones de onzas de plata. Valuarlos depende del precio y de cuánto se pueda extraer a un costo razonable.'
    ],
    how: 'Cada barra es el valor del stock de un recurso, en miles de millones de dólares. Recurso no es lo mismo que reserva: la reserva es la parte que hoy se puede extraer con ganancia.',
    data: 'prueba',
    note: 'Las barras son de prueba. Las cantidades físicas vienen de la Secretaría de Minería (ARMINERA 2025, a verificar); falta valuarlas y sumar petróleo, gas, tierra y agua.',
    refs: ['E3', 'E5']
  }
};
