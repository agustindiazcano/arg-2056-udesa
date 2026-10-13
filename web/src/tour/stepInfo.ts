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
    heading: 'Dónde estuvo y dónde está la Argentina',
    paragraphs: [
      'Este gráfico sigue el producto de la Argentina y su lugar en el ranking, año por año desde 1900, frente al resto del mundo y frente a la región.',
      'El producto se mide en dólares internacionales de 2011, que corrigen las diferencias de precios entre países, de modo que un dólar compra lo mismo en todos lados.'
    ],
    how: 'Mové el control del año para ver cómo cambia el ranking. Alterná entre el PBI total y el PBI por habitante: el primero depende del tamaño del país; el segundo, del nivel de vida.',
    data: 'prueba',
    note: 'Los datos reales ya están procesados (Proyecto Maddison 2020, de 1900 a 2018), pero esta pantalla todavía dibuja datos de prueba hasta que se extiendan hasta 2026.',
    refs: ['W1']
  },
  1: {
    heading: 'El PBI de la Argentina, de 1990 a 2056',
    paragraphs: [
      'La línea muestra el PBI observado hasta hoy y la proyección esperada hasta 2056, con un abanico que va del escenario más bajo al más alto.',
      'El cuadro de indicadores resume la economía hoy: PBI, población, PBI por habitante, exportaciones, crecimiento e inversión, con los últimos valores publicados por el Banco Mundial.'
    ],
    how: 'Mirá primero la línea de la proyección y después el ancho del abanico: cuanto más ancho, más incierto es el futuro. El abanico no es un pronóstico de lo que va a pasar sino de lo que podría pasar.',
    data: 'parcial',
    note: 'Los seis indicadores son reales (Banco Mundial, 2025). La serie del PBI y la proyección siguen siendo de prueba hasta que se conecten las cuentas nacionales del INDEC y el modelo.',
    refs: ['W3']
  },
  2: {
    heading: 'Qué produce cada provincia',
    paragraphs: [
      'El mapa colorea cada provincia según su producción. Al elegir un sector (minería, agro o hidrocarburos) el mapa cambia para mostrar quién aporta más.',
      'La Argentina no es un solo país económico: la producción se concentra en pocas provincias y cada una vive de recursos distintos.'
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
      'Los estudios más citados dan un efecto moderado: hasta 0,66 % de productividad total en diez años según Acemoglu, y alrededor de 1,1 % anual según una estimación de Anthropic.'
    ],
    how: 'Compará la distancia entre las dos líneas en 2056. No es una predicción: depende de cuánto de la economía se adapta y de qué tan rápido.',
    data: 'prueba',
    note: 'Las dos líneas son de prueba. Las cifras de los estudios están citadas pero no se abrieron las páginas originales (ver Data).',
    refs: ['P8', 'P9', 'P10a']
  },
  4: {
    heading: 'De qué viven las exportaciones',
    paragraphs: [
      'Las exportaciones de bienes de enero a julio de 2026 sumaron 58.365 millones de dólares, 22,9 % más que un año antes.',
      'Las manufacturas de origen agropecuario son el rubro más grande (18.911 millones), seguidas por las manufacturas industriales (15.554), los productos primarios (14.749) y los combustibles y la energía (9.151), que crecieron 49,9 %.'
    ],
    how: 'Cada barra es un gran rubro del INDEC, en miles de millones de dólares, acumulado de enero a julio. La barra más alta es la que más aporta.',
    data: 'real',
    note: 'INDEC, informe de agosto de 2026. Es un acumulado de siete meses, no un año completo. Los complejos exportadores de 2025 (soja, petróleo y gas, minería) están pendientes.',
    refs: ['E1']
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
      'La minería exportó 4.673 millones de dólares en 2024 y la Secretaría de Minería tenía 316 operaciones y proyectos en cartera en mayo de 2025, de los cuales solo 25 producían.',
      'Una parte importante de lo que viene pasa por el Régimen de Incentivo para Grandes Inversiones (RIGI): la prensa cuenta 13 proyectos mineros aprobados por unos 25.000 millones de dólares, con Vicuña (San Juan), Agua Rica (Catamarca) y Rincón (Salta) a la cabeza.'
    ],
    how: 'La barra gris es lo que produce hoy y la azul lo que podrían producir los proyectos; la línea vertical es el rango de incertidumbre. Los proyectos RIGI están en la tabla de la sección Data.',
    data: 'prueba',
    note: 'Las barras son de prueba. La cartera y las exportaciones de 2024 vienen de la Secretaría de Minería; la lista de proyectos RIGI es de prensa y las fuentes no coinciden en montos: todavía no está verificada contra el Boletín Oficial.',
    refs: ['E3', 'E5', 'R1', 'R2', 'R3']
  },
  9: {
    heading: 'Hidrocarburos: el piso y el techo',
    paragraphs: [
      'La producción de petróleo promedió unos 860.000 barriles por día en 2025, 13 % más que el año anterior, y Vaca Muerta aportó el 62 % del petróleo y el 53 % del gas.',
      'Hay un oleoducto (Vaca Muerta Sur) con cerca de 80 % de obra y proyectos de gas natural licuado y de ampliación de la producción, varios dentro del RIGI.'
    ],
    how: 'La línea es la producción esperada; la franja es el piso y el techo según cuánto se desarrolle Vaca Muerta. Los proyectos están en la tabla de la sección Data.',
    data: 'prueba',
    note: 'La línea y la franja son de prueba. Las cifras de producción y proyectos vienen de prensa y de un informe del IAE que todavía no se leyó completo.',
    refs: ['E4', 'R2', 'R3', 'R6', 'R8', 'R10']
  },
  10: {
    heading: 'Agro: lo que se produce y lo que se podría',
    paragraphs: [
      'El campo es la base histórica de las exportaciones argentinas. Cada grupo de barras compara la producción de hoy con la que podría alcanzarse con más tecnología, riego o superficie.',
      'El potencial no es una promesa: depende de precios, clima y reglas de exportación.'
    ],
    how: 'La barra gris es la producción actual y la azul la potencial. La diferencia entre ellas es el margen de crecimiento.',
    data: 'prueba',
    note: 'Los valores son de prueba. Falta la serie por cultivo del MAGyP (toneladas por campaña) y un estudio de potencial.',
    refs: []
  },
  11: {
    heading: 'Cómo se reparte lo que exportamos',
    paragraphs: [
      'El mismo total de exportaciones del paso 4, ahora como porcentaje de lo exportado entre enero y julio de 2026.',
      'Las manufacturas de origen agropecuario son el 32,4 %; las industriales, el 26,6 %; los productos primarios, el 25,3 %; y los combustibles y la energía, el 15,7 %.'
    ],
    how: 'Cada barra es la parte del total que corresponde a un rubro. Las cuatro suman 100 %.',
    data: 'real',
    note: 'INDEC, informe de agosto de 2026, acumulado de enero a julio. Para ver soja, petróleo o minería por separado hacen falta los complejos exportadores de 2025.',
    refs: ['E1']
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
      'El stock de recursos es lo que está en el suelo y todavía no se produjo. La Secretaría de Minería estima recursos de litio por 122 millones de toneladas de carbonato equivalente (21 millones como reservas) y de cobre por 116,7 millones de toneladas.',
      'También hay 105 millones de onzas de oro y 3.216 millones de onzas de plata. Valuarlos depende del precio y de cuánto se pueda extraer a un costo razonable.'
    ],
    how: 'Cada barra es el valor del stock de un recurso, en miles de millones de dólares. Recurso no es lo mismo que reserva: la reserva es la parte que hoy se puede extraer con ganancia.',
    data: 'prueba',
    note: 'Las barras son de prueba. Las cantidades físicas vienen de la Secretaría de Minería (ARMINERA 2025, a verificar); falta valuarlas y sumar petróleo, gas, tierra y agua.',
    refs: ['E3', 'E5']
  }
};
