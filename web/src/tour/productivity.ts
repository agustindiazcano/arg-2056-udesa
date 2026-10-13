import raw from './productivityData.json';
import { formatDecimal } from '../charts/format.js';

/**
 * Step 14 of the Recorrido, "Productividad": total factor productivity (TFP) and output per hour worked of Argentina, the United
 * States, Chile and Brazil, 1955-2023. The data are the Penn World Table 11.0 series downloaded through FRED (`productivityData.json`,
 * built by `productivity_slide_spec.html`; sources P6 and P7 of `docs/references.md`). Not checked by a human yet (PENDING.md).
 */
export type CountryCode = 'AR' | 'US' | 'CL' | 'BR';
export type Metric = 'tfp' | 'oph';
export type Kind = 'level' | 'change';

export interface Country {
  code: CountryCode;
  name: string;
  /** a fixed color per country that does not change when another is hidden (dark theme steps of the validated categorical palette) */
  color: string;
}

export const COUNTRIES: readonly Country[] = [
  { code: 'AR', name: 'Argentina', color: '#3987e5' },
  { code: 'US', name: 'Estados Unidos', color: '#d95926' },
  { code: 'CL', name: 'Chile', color: '#199e70' },
  { code: 'BR', name: 'Brasil', color: '#c98500' }
];

interface Raw {
  years: number[];
  tfp_index_1955_100: Record<CountryCode, number[]>;
  tfp_annual_pct: { years: number[] } & Record<CountryCode, number[]>;
  output_per_hour_index_1955_100: Record<CountryCode, number[]>;
  output_per_hour_annual_pct: { years: number[] } & Record<CountryCode, number[]>;
  cumulative_2011_2023_pct: { tfp: Record<CountryCode, number>; output_per_hour: Record<CountryCode, number> };
}
const data = raw as unknown as Raw;

export const PERIODS = [1955, 1990, 2000] as const;
export type Period = (typeof PERIODS)[number];

/** The years and values of a series: the index (1955 = 100) or the change over the year in %. */
export function seriesOf(metric: Metric, kind: Kind, code: CountryCode): { years: number[]; values: number[] } {
  if (kind === 'level') return { years: data.years, values: (metric === 'tfp' ? data.tfp_index_1955_100 : data.output_per_hour_index_1955_100)[code] };
  const block = metric === 'tfp' ? data.tfp_annual_pct : data.output_per_hour_annual_pct;
  return { years: block.years, values: block[code] };
}

/** The part of a series from a first year on. */
export function periodFrom(years: number[], values: number[], first: number): { years: number[]; values: number[] } {
  const at = Math.max(years.findIndex((y) => y >= first), 0);
  return { years: years.slice(at), values: values.slice(at) };
}

export function levelIn(metric: Metric, code: CountryCode, year: number): number {
  const s = seriesOf(metric, 'level', code);
  return s.values[s.years.indexOf(year)] ?? NaN;
}

export function changeIn(metric: Metric, code: CountryCode, year: number): number {
  const s = seriesOf(metric, 'change', code);
  return s.values[s.years.indexOf(year)] ?? NaN;
}

export function peakYear(metric: Metric, code: CountryCode): { year: number; value: number } {
  const s = seriesOf(metric, 'level', code);
  const max = Math.max(...s.values);
  return { year: s.years[s.values.indexOf(max)]!, value: max };
}

/** Spread (standard deviation) of the yearly TFP change, 1956-2023, in percentage points. */
export function annualSd(code: CountryCode): number {
  const v = data.tfp_annual_pct[code];
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length);
}

export function cumulative2011(metric: Metric, code: CountryCode): number {
  return (metric === 'tfp' ? data.cumulative_2011_2023_pct.tfp : data.cumulative_2011_2023_pct.output_per_hour)[code];
}

export const LAST_YEAR = data.years.at(-1) ?? 2023;

/** es-AR number with a true minus sign: "−20,6". */
export const num = (v: number): string => formatDecimal(v).replace('-', '−');
/** with the sign always shown: "+5,8" / "−20,6". */
export const signed = (v: number): string => (v > 0 ? '+' : '') + num(v);

export interface SourceLink {
  label: string;
  url: string;
}

/** The data of every chart of the step. */
export const DATA_SOURCES: readonly SourceLink[] = [
  { label: 'Penn World Table 11.0', url: 'https://www.rug.nl/ggdc/productivity/pwt/' },
  { label: 'FRED', url: 'https://fred.stlouisfed.org/' }
];

export interface ProductivityStepDef {
  /** more sources quoted in the text of the step (after the data sources) */
  links?: readonly SourceLink[];
  kind: 'level' | 'change' | 'bars';
  metric: Metric | 'both';
  /** the label of the chart(s) */
  chart: string;
  unit: string;
  heading: string;
  paragraphs: [string, string];
  note: string;
  how: string;
}

const all = (f: (c: Country) => string): string => COUNTRIES.map(f).join(', ');

export const PRODUCTIVITY_STEPS: readonly ProductivityStepDef[] = [
  {
    kind: 'level',
    metric: 'tfp',
    chart: 'Productividad total de los factores (PTF)',
    unit: 'índice, 1955 = 100',
    heading: 'En 2023 la PTF argentina está por debajo de la de 1955',
    paragraphs: [
      `La productividad total de los factores (PTF) es lo que queda del crecimiento cuando se descuentan el trabajo y el capital. En ${LAST_YEAR} el índice de Argentina es ${num(levelIn('tfp', 'AR', LAST_YEAR))} (1955 = 100); Estados Unidos ${num(levelIn('tfp', 'US', LAST_YEAR))}, Chile ${num(levelIn('tfp', 'CL', LAST_YEAR))} y Brasil ${num(levelIn('tfp', 'BR', LAST_YEAR))}.`,
      'Cada país se compara contra sí mismo: los niveles entre países no son comparables, las pendientes sí.'
    ],
    note: 'La PTF es un residuo: no mide la tecnología de forma directa y se mueve con el ciclo.',
    how: 'Cada línea es un país con base 1955 = 100. Una línea que baja es un país que produce menos con los mismos factores que antes.'
  },
  {
    kind: 'change',
    metric: 'tfp',
    chart: 'Variación anual de la PTF',
    unit: '% sobre el año anterior',
    heading: 'La PTF argentina es la que más se mueve de un año a otro',
    paragraphs: [
      `Entre 1956 y ${LAST_YEAR}, el desvío de la variación anual de la PTF es de ${num(Math.round(annualSd('AR') * 10) / 10)} puntos en Argentina, ${num(Math.round(annualSd('CL') * 10) / 10)} en Chile, ${num(Math.round(annualSd('BR') * 10) / 10)} en Brasil y ${num(Math.round(annualSd('US') * 10) / 10)} en Estados Unidos.`,
      `Desde 2011 la caída es sostenida, no un derrumbe: la PTF argentina acumula ${num(cumulative2011('tfp', 'AR'))} % entre 2011 y ${LAST_YEAR}.`
    ],
    note: 'Variación anual en %, redondeada a 0,1.',
    how: 'Cada punto es el cambio respecto del año anterior. La línea del cero separa los años de mejora de los de caída.'
  },
  {
    kind: 'level',
    metric: 'oph',
    chart: 'Producto por hora trabajada',
    unit: 'índice, 1955 = 100',
    heading: `El producto por hora argentino no superó su máximo de ${peakYear('oph', 'AR').year}`,
    paragraphs: [
      `En ${LAST_YEAR} el índice del producto por hora de Argentina es ${num(levelIn('oph', 'AR', LAST_YEAR))} (1955 = 100), contra ${num(levelIn('oph', 'US', LAST_YEAR))} en Estados Unidos, ${num(levelIn('oph', 'CL', LAST_YEAR))} en Chile y ${num(levelIn('oph', 'BR', LAST_YEAR))} en Brasil. El máximo argentino fue en ${peakYear('oph', 'AR').year} (${num(peakYear('oph', 'AR').value)}).`,
      'El producto por hora es el PBI real dividido por las personas empleadas y las horas anuales de cada una. Sube con más capital por hora y con más PTF.'
    ],
    note: 'La serie de horas de Argentina repite valores en 2021-2023: el último nivel es sensible a esa anomalía de la fuente.',
    how: 'Cada línea es un país con base 1955 = 100. Una línea más empinada es un país que produce cada vez más por cada hora trabajada.'
  },
  {
    kind: 'change',
    metric: 'oph',
    chart: 'Variación anual del producto por hora',
    unit: '% sobre el año anterior',
    heading: 'El producto por hora argentino cae en 2023',
    paragraphs: [
      `En ${LAST_YEAR} el producto por hora cambió ${signed(changeIn('oph', 'AR', LAST_YEAR))} % en Argentina, ${signed(changeIn('oph', 'CL', LAST_YEAR))} % en Chile, ${signed(changeIn('oph', 'BR', LAST_YEAR))} % en Brasil y ${signed(changeIn('oph', 'US', LAST_YEAR))} % en Estados Unidos.`,
      'La caída de 2023 en Argentina está influida por la anomalía de la serie de horas, que repite valores entre 2021 y 2023.'
    ],
    note: 'Variación anual en %, redondeada a 0,1.',
    how: 'Cada punto es el cambio respecto del año anterior. Los saltos de 2020 y 2021 vienen de la pandemia.'
  },
  {
    kind: 'bars',
    metric: 'both',
    chart: 'Variación acumulada 2011-2023',
    unit: '%',
    heading: 'Lo que cambió entre 2011 y 2023',
    paragraphs: [
      `PTF: ${all((c) => `${c.name} ${signed(cumulative2011('tfp', c.code))} %`)}. Producto por hora: ${all((c) => `${c.name} ${signed(cumulative2011('oph', c.code))} %`)}.`,
      'Hay estimaciones de modelos, no mediciones, del efecto de la IA: Acemoglu (NBER 32487) calcula hasta 0,66 % de PTF en diez años; Anthropic estima +1,8 % anual de productividad laboral. Son un rango, no un pronóstico.'
    ],
    links: [
      { label: 'INDEC, documento de trabajo N.º 52', url: 'https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf' },
      { label: 'Acemoglu, NBER 32487', url: 'https://www.nber.org/papers/w32487' },
      { label: 'Anthropic', url: 'https://www.anthropic.com/research/estimating-productivity-gains' }
    ],
    note: 'INDEC (2025): el VAB sube 3,6 % = 0,6 p.p. de capital + 0,2 p.p. de trabajo + 2,8 p.p. de PTF; esos datos no están en los gráficos, que terminan en 2023.',
    how: 'Cada barra es el cambio acumulado de 2011 a 2023 de un país. Una barra a la izquierda del cero es una caída.'
  }
];
