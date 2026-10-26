import yearlySeries from './developmentSeries.json';

export interface HdiEntry {
  year: number;
  hdi: number;
  life_expectancy?: number;
  expected_schooling?: number;
  mean_schooling?: number;
  gni_per_capita?: number;
}

export interface PisaEntry {
  year: number;
  reading: number;
  math: number;
  science: number;
}

export interface MetricSeriesEntry {
  year: number;
  value: number;
  note?: string;
}

export interface RegionalMetricEntry {
  country: string;
  value: number;
  note?: string;
}

export interface IndicatorData {
  title: string;
  unit: string;
  definition: string;
  source: string;
  sourceUrl: string;
  refId: string;
  retrievedAt: string;
  timeSeries: readonly MetricSeriesEntry[];
  regionalComparison: readonly RegionalMetricEntry[];
}

/** Historical series of Argentina's Human Development Index (UNDP). */
export const ARGENTINA_HDI_SERIES: readonly HdiEntry[] = [
  { year: 1990, hdi: 0.733 },
  { year: 1995, hdi: 0.762 },
  { year: 2000, hdi: 0.789 },
  { year: 2005, hdi: 0.809 },
  { year: 2010, hdi: 0.844 },
  { year: 2015, hdi: 0.859 },
  { year: 2018, hdi: 0.852 },
  { year: 2019, hdi: 0.853 },
  { year: 2020, hdi: 0.851 },
  { year: 2021, hdi: 0.847 },
  { year: 2022, hdi: 0.858 },
  { year: 2023, hdi: 0.865 }
];

/** Latin American peer comparison of HDI (UNDP 2022/2023). */
export const LATAM_HDI_2022: ReadonlyArray<{ country: string; hdi: number; rank: string }> = [
  { country: 'Chile', hdi: 0.860, rank: 'Muy alto' },
  { country: 'Argentina', hdi: 0.858, rank: 'Muy alto' },
  { country: 'Uruguay', hdi: 0.830, rank: 'Muy alto' },
  { country: 'México', hdi: 0.781, rank: 'Alto' },
  { country: 'Brasil', hdi: 0.760, rank: 'Alto' },
  { country: 'Colombia', hdi: 0.758, rank: 'Alto' }
];

/** Historical OECD PISA scores for Argentina. */
export const ARGENTINA_PISA_SERIES: readonly PisaEntry[] = [
  { year: 2012, reading: 396, math: 388, science: 406 },
  { year: 2018, reading: 402, math: 379, science: 404 },
  { year: 2022, reading: 401, math: 378, science: 406 }
];

/** PISA 2022 regional comparison in Mathematics (OECD). */
export const PISA_LATAM_MATH_2022: ReadonlyArray<{ country: string; math: number }> = [
  { country: 'Chile', math: 412 },
  { country: 'Uruguay', math: 409 },
  { country: 'México', math: 395 },
  { country: 'Colombia', math: 383 },
  { country: 'Brasil', math: 379 },
  { country: 'Argentina', math: 378 },
  { country: 'España', math: 473 },
  { country: 'Estados Unidos', math: 465 }
];

/**
 * The education indicators of the World Bank (WDI) that have a yearly series for Argentina and its peers (`developmentSeries.json`): Argentina's own series
 * for the boxes and the last value of each country for the ranking. A year or a country without a value is left out, nothing is filled in.
 */
const WDI_EDUCATION_META: Record<string, { title: string; unit: string; definition: string }> = {
  'Matrícula secundaria': {
    title: 'Matrícula en la escuela secundaria',
    unit: '% bruto',
    definition: 'Alumnos de secundaria como porcentaje de la población en edad de cursarla (tasa bruta; supera 100 % cuando hay alumnos mayores o repitentes).'
  },
  'Matrícula terciaria': {
    title: 'Matrícula en la educación superior',
    unit: '% bruto',
    definition: 'Alumnos de educación superior como porcentaje de la población de los cinco años posteriores a la secundaria (tasa bruta; puede superar 100 %).'
  },
  'Escolaridad esperada': {
    title: 'Años esperados de escolaridad',
    unit: 'Años',
    definition: 'Años de escolarización, de primaria a superior, que se espera que complete un niño que hoy entra a la escuela (UNESCO).'
  },
  'Gasto público en educación': {
    title: 'Gasto público en educación',
    unit: '% del PBI',
    definition: 'Gasto total del gobierno en educación como porcentaje del PBI.'
  }
};

const YEARLY_EDUCATION = yearlySeries.indicators as Record<string, { code: string; countries: Record<string, Array<number | null>> }>;

function wdiEducation(name: string): IndicatorData {
  const meta = WDI_EDUCATION_META[name]!;
  const yearly = YEARLY_EDUCATION[name]!;
  const years = Array.from({ length: yearlySeries.lastYear - yearlySeries.firstYear + 1 }, (_, i) => yearlySeries.firstYear + i);
  const lastOf = (values: Array<number | null>): MetricSeriesEntry | undefined => {
    const at = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null).at(-1);
    return at ? { year: years[at.i]!, value: at.v } : undefined;
  };
  const round = (v: number): number => Math.round(v * 10) / 10;
  return {
    ...meta,
    source: `Banco Mundial (WDI, ${yearly.code})`,
    sourceUrl: `https://data.worldbank.org/indicator/${yearly.code}`,
    refId: 'W1',
    retrievedAt: yearlySeries.retrieved_at,
    timeSeries: (yearly.countries['Argentina'] ?? []).flatMap((v, i) => (v === null ? [] : [{ year: years[i]!, value: round(v) }])),
    regionalComparison: Object.entries(yearly.countries).flatMap(([country, values]) => {
      const last = lastOf(values);
      return last ? [{ country, value: round(last.value), note: String(last.year) }] : [];
    })
  };
}

const WDI_EDUCATION_DATA: Record<string, IndicatorData> = Object.fromEntries(Object.keys(WDI_EDUCATION_META).map((name) => [name, wdiEducation(name)]));

/** Comprehensive indicators mapping for DevelopmentStep. */
export const DEVELOPMENT_INDICATORS_DATA: Record<string, IndicatorData> = {
  'Esperanza de vida al nacer': {
    title: 'Esperanza de vida al nacer',
    unit: 'Años',
    definition: 'Cantidad de años que viviría un recién nacido si los patrones de mortalidad vigentes al nacer se mantuvieran constantes.',
    source: 'Banco Mundial (WDI, SP.DYN.LE00.IN)',
    sourceUrl: 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN',
    refId: 'W1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 1990, value: 71.6 },
      { year: 1995, value: 72.9 },
      { year: 2000, value: 73.9 },
      { year: 2005, value: 75.2 },
      { year: 2010, value: 75.7 },
      { year: 2015, value: 76.6 },
      { year: 2019, value: 76.8 },
      { year: 2020, value: 75.9, note: 'Impacto COVID-19' },
      { year: 2021, value: 73.9, note: 'Impacto COVID-19' },
      { year: 2022, value: 75.8 },
      { year: 2023, value: 77.4 },
      { year: 2024, value: 77.5 }
    ],
    regionalComparison: [
      { country: 'Chile', value: 81.2 },
      { country: 'Uruguay', value: 78.1 },
      { country: 'Colombia', value: 77.7 },
      { country: 'Argentina', value: 77.4 },
      { country: 'Brasil', value: 75.8 },
      { country: 'México', value: 75.1 }
    ]
  },
  'Mortalidad infantil': {
    title: 'Tasa de mortalidad infantil',
    unit: 'Defunciones por 1.000 nacidos vivos',
    definition: 'Número de lactantes que mueren antes de cumplir un año por cada 1.000 nacidos vivos en un año determinado.',
    source: 'Banco Mundial (WDI, SP.DYN.IMRT.IN) / DEIS Ministerio de Salud',
    sourceUrl: 'https://data.worldbank.org/indicator/SP.DYN.IMRT.IN',
    refId: 'W1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 1990, value: 24.8 },
      { year: 1995, value: 20.9 },
      { year: 2000, value: 16.7 },
      { year: 2005, value: 14.4 },
      { year: 2010, value: 12.4 },
      { year: 2015, value: 10.0 },
      { year: 2020, value: 8.7 },
      { year: 2022, value: 8.4 },
      { year: 2023, value: 8.2 },
      { year: 2024, value: 8.0 }
    ],
    regionalComparison: [
      { country: 'Chile', value: 5.9 },
      { country: 'Uruguay', value: 6.1 },
      { country: 'Argentina', value: 8.2 },
      { country: 'Colombia', value: 10.8 },
      { country: 'Brasil', value: 12.4 },
      { country: 'México', value: 12.4 }
    ]
  },
  'IDH · salud': {
    title: 'Subíndice de salud del IDH',
    unit: 'Índice de 0 a 1',
    definition: 'Componente normalizado de salud del Índice de Desarrollo Humano basado en la esperanza de vida al nacer.',
    source: 'PNUD (Human Development Report)',
    sourceUrl: 'https://hdr.undp.org/',
    refId: 'D1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 1990, value: 0.794 },
      { year: 2000, value: 0.829 },
      { year: 2010, value: 0.857 },
      { year: 2018, value: 0.873 },
      { year: 2021, value: 0.830, note: 'Impacto COVID-19' },
      { year: 2023, value: 0.883 }
    ],
    regionalComparison: [
      { country: 'Chile', value: 0.941 },
      { country: 'Uruguay', value: 0.894 },
      { country: 'Colombia', value: 0.888 },
      { country: 'Argentina', value: 0.883 },
      { country: 'Brasil', value: 0.859 },
      { country: 'México', value: 0.847 }
    ]
  },
  'Resultados PISA': {
    title: 'Puntajes de aprendizaje PISA',
    unit: 'Puntaje medio estandarizado',
    definition: 'Puntaje medio de matemática de los estudiantes de 15 años en la evaluación internacional PISA de la OCDE (ediciones 2012, 2018 y 2022; los países que no participaron figuran sin dato).',
    source: 'OCDE (Programme for International Student Assessment)',
    sourceUrl: 'https://www.oecd.org/pisa/',
    refId: 'D2',
    retrievedAt: '2026-10-16',
    timeSeries: [
      { year: 2012, value: 388, note: 'Matemática (Lectura: 396, Ciencias: 406)' },
      { year: 2018, value: 379, note: 'Matemática (Lectura: 402, Ciencias: 404)' },
      { year: 2022, value: 378, note: 'Matemática (Lectura: 401, Ciencias: 406)' }
    ],
    regionalComparison: PISA_LATAM_MATH_2022.map((c) => ({ country: c.country, value: c.math, note: 'Matemática 2022' }))
  },
  'Años de escolaridad': {
    title: 'Años promedio y esperados de escolaridad',
    unit: 'Años de formación',
    definition: 'Años promedio de educación alcanzados por la población mayor de 25 años y años esperados de escolarización para niños.',
    source: 'PNUD (Human Development Report) / UNESCO',
    sourceUrl: 'https://hdr.undp.org/',
    refId: 'D1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 1990, value: 8.8, note: 'Esperados: 13.2' },
      { year: 2000, value: 9.6, note: 'Esperados: 15.5' },
      { year: 2010, value: 10.4, note: 'Esperados: 16.8' },
      { year: 2020, value: 10.9, note: 'Esperados: 17.7' },
      { year: 2023, value: 11.2, note: 'Esperados: 18.8' }
    ],
    regionalComparison: [
      { country: 'Argentina', value: 11.2 },
      { country: 'Chile', value: 11.1 },
      { country: 'Uruguay', value: 9.3 },
      { country: 'México', value: 9.0 },
      { country: 'Colombia', value: 8.9 },
      { country: 'Brasil', value: 8.3 }
    ]
  },
  'Población graduada universitaria': {
    title: 'Población con educación terciaria completa',
    unit: '% de población de 25 a 34 años',
    definition: 'Porcentaje del grupo etario joven que ha culminado estudios terciarios o universitarios de grado.',
    source: 'OCDE (Education at a Glance) / Min. Capital Humano',
    sourceUrl: 'https://www.argentina.gob.ar/educacion/universidades',
    refId: 'D1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 2005, value: 13.8 },
      { year: 2010, value: 15.6 },
      { year: 2015, value: 17.4 },
      { year: 2020, value: 19.1 },
      { year: 2023, value: 20.4 }
    ],
    regionalComparison: [
      { country: 'Chile', value: 34.0 },
      { country: 'Colombia', value: 29.5 },
      { country: 'México', value: 26.8 },
      { country: 'Brasil', value: 24.2 },
      { country: 'Argentina', value: 20.4 },
      { country: 'Uruguay', value: 18.5 }
    ]
  },
  'Graduación STEM': {
    title: 'Graduados en carreras STEM',
    unit: '% sobre el total de egresados universitarios',
    definition: 'Proporción de graduados en disciplinas de Ciencia, Tecnología, Ingeniería y Matemáticas según taxonomía OCDE.',
    source: 'Secretaría de Educación (Anuarios de Estadísticas Universitarias) / OCDE',
    sourceUrl: 'https://www.argentina.gob.ar/educacion/universidades',
    refId: 'D1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 2012, value: 13.1 },
      { year: 2015, value: 13.6 },
      { year: 2018, value: 14.2 },
      { year: 2021, value: 14.8 },
      { year: 2023, value: 15.4 }
    ],
    regionalComparison: [
      { country: 'Chile', value: 22.8 },
      { country: 'México', value: 24.5 },
      { country: 'Colombia', value: 21.3 },
      { country: 'Brasil', value: 17.2 },
      { country: 'Argentina', value: 15.4 },
      { country: 'Uruguay', value: 14.1 }
    ]
  },
  'IDH · educación': {
    title: 'Subíndice de educación del IDH',
    unit: 'Índice de 0 a 1',
    definition: 'Promedio aritmético de los índices normalizados de años promedio de escolaridad y años esperados de escolaridad.',
    source: 'PNUD (Human Development Report)',
    sourceUrl: 'https://hdr.undp.org/',
    refId: 'D1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 1990, value: 0.697 },
      { year: 2000, value: 0.778 },
      { year: 2010, value: 0.832 },
      { year: 2018, value: 0.860 },
      { year: 2020, value: 0.855 },
      { year: 2023, value: 0.869 }
    ],
    regionalComparison: [
      { country: 'Chile', value: 0.874 },
      { country: 'Argentina', value: 0.869 },
      { country: 'Uruguay', value: 0.795 },
      { country: 'Brasil', value: 0.757 },
      { country: 'México', value: 0.739 },
      { country: 'Colombia', value: 0.726 }
    ]
  },
  'Índice de Gini': {
    title: 'Coeficiente de Gini de desigualdad del ingreso',
    unit: 'Escala 0 a 100 (0 = igualdad absoluta, 100 = desigualdad total)',
    definition: 'Medida estadística de la desigualdad en la distribución del ingreso per cápita familiar entre las personas.',
    source: 'Banco Mundial (WDI, SI.POV.GINI) / INDEC (EPH) SEDLAC',
    sourceUrl: 'https://data.worldbank.org/indicator/SI.POV.GINI',
    refId: 'W1',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 1995, value: 48.9 },
      { year: 2000, value: 51.0 },
      { year: 2002, value: 53.8, note: 'Pico post-crisis' },
      { year: 2005, value: 47.8 },
      { year: 2010, value: 43.7 },
      { year: 2014, value: 41.8 },
      { year: 2018, value: 41.7 },
      { year: 2020, value: 42.7 },
      { year: 2022, value: 40.7, note: 'Mínimo del período' },
      { year: 2023, value: 42.4 },
      { year: 2024, value: 42.4 }
    ],
    regionalComparison: [
      { country: 'Uruguay', value: 40.9 },
      { country: 'Argentina', value: 42.4 },
      { country: 'Chile', value: 43.2 },
      { country: 'México', value: 43.5 },
      { country: 'Brasil', value: 51.5 },
      { country: 'Colombia', value: 54.6 }
    ]
  },
  'Pobreza monetaria': {
    title: 'Tasa de pobreza de personas',
    unit: '% de personas bajo la línea de pobreza',
    definition: 'Porcentaje de la población cuyos ingresos no alcanzan a cubrir la Canasta Básica Total (CBT) en los 31 aglomerados urbanos.',
    source: 'INDEC (Encuesta Permanente de Hogares)',
    sourceUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-46-152',
    refId: 'S3',
    retrievedAt: '2026-10-18',
    timeSeries: [
      { year: 2016, value: 30.3 },
      { year: 2017, value: 25.7 },
      { year: 2018, value: 32.0 },
      { year: 2019, value: 35.5 },
      { year: 2020, value: 42.0, note: 'Pandemia COVID-19' },
      { year: 2021, value: 37.3 },
      { year: 2022, value: 39.2 },
      { year: 2023, value: 41.7 },
      { year: 2024, value: 52.9, note: '1.er semestre 2024' }
    ],
    regionalComparison: [
      { country: 'Uruguay', value: 10.1, note: 'Línea nacional' },
      { country: 'Chile', value: 6.5, note: 'CASEN nacional' },
      { country: 'Brasil', value: 24.1, note: 'Línea Banco Mundial' },
      { country: 'Colombia', value: 33.0, note: 'DANE monetaria' },
      { country: 'México', value: 36.3, note: 'CONEVAL nacional' },
      { country: 'Argentina', value: 52.9, note: 'INDEC CBT semestral' }
    ]
  },
  'IDH general': {
    title: 'Índice de Desarrollo Humano (IDH)',
    unit: 'Índice compuesto de 0 a 1',
    definition: 'Medida sintética de los logros en tres dimensiones clave: vida larga y saludable, educación y nivel de vida digno.',
    source: 'PNUD (Human Development Report)',
    sourceUrl: 'https://hdr.undp.org/',
    refId: 'D1',
    retrievedAt: '2026-10-18',
    timeSeries: ARGENTINA_HDI_SERIES.map((h) => ({ year: h.year, value: h.hdi })),
    regionalComparison: LATAM_HDI_2022.map((c) => ({ country: c.country, value: c.hdi, note: c.rank }))
  },
  ...WDI_EDUCATION_DATA
};
