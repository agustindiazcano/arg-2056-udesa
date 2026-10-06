import { buildColumns, buildLines, buildShares } from '../charts/builders/tourCharts.js';
import { buildGdp } from '../charts/builders/gdp.js';
import { formatAxisNumber, formatValue } from '../charts/format.js';
import { barsSpec, linesSpec } from '../charts3d/specs.js';
import type { Bars3DSpec, Chart3DSpec } from '../charts3d/types.js';
import { tokens } from '../styles/tokens.js';
import { GDP_MOCK, gdpLinesSpec } from './gdpMock.js';
import type { BandLabels } from './gdpMock.js';
import {
  AGRO,
  EXPORTS_BY_SECTOR,
  EXPORT_COMPOSITION,
  GDP_COMPOSITION,
  INVESTOR_SCORES,
  MINING,
  MOCK_SOURCE,
  RESOURCE_STOCK,
  RULE70_HIGHLIGHT,
  aiImpactData,
  hydrocarbonsData,
  rule70Rows
} from './tourData.js';

export interface BuiltChart {
  option: object;
  summary: string;
  /** the 3D version; a step without one stays flat */
  spec?: Chart3DSpec;
}

export interface TourChartDef {
  step: number;
  title: string;
  subtitle: string;
  /** what the subtitle says about the data (every chart of the Recorrido is made up for now) */
  source: string;
  legend?: Array<{ label: string; color: string }>;
  /** the province map is drawn by its own component */
  kind: 'chart' | 'map';
  build: () => BuiltChart;
}

const NONE: () => BuiltChart = () => ({ option: {}, summary: '' });

const list = (items: string[]): string => items.join(', ');

/** The 3D bars of two series side by side: one bar per member, the second series (the potential, the project) in the accent color. */
function pairedBars(
  title: string,
  unit: string,
  categories: string[],
  names: [string, string],
  a: number[],
  b: number[],
  ranges?: { low: number[]; high: number[] }
): Bars3DSpec {
  const bars: Bars3DSpec['bars'] = [];
  categories.forEach((c, i) => {
    bars.push({ label: `${c}\n${names[0]}`, value: a[i]!, display: formatValue(a[i]!, unit), short: formatAxisNumber(a[i]!), highlight: false });
    const range = ranges ? ` (rango ${formatValue(ranges.low[i], '')}a ${formatValue(ranges.high[i], unit)})` : '';
    bars.push({ label: `${c}\n${names[1]}`, value: b[i]!, display: `${formatValue(b[i]!, unit)}${range}`, short: formatAxisNumber(b[i]!), highlight: true });
  });
  return {
    kind: 'bars',
    title,
    unit,
    bars,
    summary: `${title}, vista 3D de barras: ${bars.map((x) => `${x.label.replace('\n', ', ')} ${x.display}`).join(', ')}`
  };
}

const HYDROCARBON_LABELS: BandLabels = {
  subject: 'Producción de hidrocarburos',
  history: 'Producción observada',
  expected: 'Proyección esperada',
  range: 'Rango entre el piso y el techo'
};

const GREY = tokens.muted;
const BLUE = tokens.blue;

const ai = (): BuiltChart => {
  const d = aiImpactData();
  const without = d.series[0]!;
  const withAi = d.series[1]!;
  const summary =
    `PBI con y sin la revolución de la IA (datos de prueba), de ${formatValue(without.values[0] ?? null, d.unit)} en 2025 ` +
    `a ${formatValue(without.values.at(-1) ?? null, d.unit)} sin IA y ${formatValue(withAi.values.at(-1) ?? null, d.unit)} con IA en 2056`;
  const { option } = buildLines(d.years.map(String), d.series, { unit: d.unit, labelEvery: 4, summary });
  const spec = linesSpec({
    title: 'Impacto de la IA en el PBI',
    unit: d.unit,
    xLabels: d.years.map(String),
    series: [
      { name: without.name, values: without.values, tone: 'muted' },
      { name: withAi.name, values: withAi.values, tone: 'accent', color: BLUE }
    ],
    summary
  });
  return { option, summary, spec };
};

/** A ranking of single columns, the largest in the accent color: the shape of steps 4, 5, 6 and 13. */
function ranking(title: string, name: string, data: { unit: string; rows: Array<{ label: string; value: number }> }, highlight: string, intro: string): BuiltChart {
  const summary = `${intro}: ${list(data.rows.map((r) => `${r.label} ${formatValue(r.value, data.unit)}`))}`;
  const { option } = buildColumns(data.rows.map((r) => r.label), [{ name, values: data.rows.map((r) => r.value), color: GREY }], { unit: data.unit, highlight, summary });
  return { option, summary, spec: barsSpec(data.rows, { title, unit: data.unit, highlight, summary }) };
}

const largest = (rows: Array<{ label: string; value: number }>): string => [...rows].sort((a, b) => b.value - a.value)[0]!.label;

const mining = (): BuiltChart => {
  const m = MINING;
  const summary = `Minería, hoy y proyectos con su rango (datos de prueba): ${list(
    m.categories.map((c, i) => `${c} hoy ${formatValue(m.today[i]!, m.unit)}, proyectos ${formatValue(m.project[i]!, m.unit)} entre ${formatValue(m.low[i]!, '')}y ${formatValue(m.high[i]!, m.unit)}`)
  )}`;
  const { option } = buildColumns(
    m.categories,
    [
      { name: 'Hoy', values: m.today, color: GREY },
      { name: 'Proyectos', values: m.project, color: BLUE, range: { low: m.low, high: m.high } }
    ],
    { unit: m.unit, summary }
  );
  return { option, summary, spec: pairedBars('Minería: hoy y proyectos', m.unit, m.categories, ['hoy', 'proyectos'], m.today, m.project, { low: m.low, high: m.high }) };
};

const hydrocarbons = (): BuiltChart => {
  const data = hydrocarbonsData();
  const { option, summary } = buildGdp(data, HYDROCARBON_LABELS);
  return { option, summary, spec: gdpLinesSpec(data, HYDROCARBON_LABELS) };
};

const agro = (): BuiltChart => {
  const a = AGRO;
  const summary = `Agro, producción actual y potencial (datos de prueba): ${list(a.categories.map((c, i) => `${c} ${formatValue(a.current[i]!, a.unit)} y ${formatValue(a.potential[i]!, a.unit)}`))}`;
  const { option } = buildColumns(
    a.categories,
    [
      { name: 'Actual', values: a.current, color: GREY },
      { name: 'Potencial', values: a.potential, color: BLUE }
    ],
    { unit: a.unit, summary }
  );
  return { option, summary, spec: pairedBars('Agro: actual y potencial', a.unit, a.categories, ['actual', 'potencial'], a.current, a.potential) };
};

function shares(title: string, data: { unit: string; rows: Array<{ label: string; value: number }> }): BuiltChart {
  const summary = `${title}, en % del total (datos de prueba): ${list(data.rows.map((r) => `${r.label} ${formatValue(r.value, data.unit)}`))}`;
  const { option } = buildShares(data.rows, { unit: data.unit, summary });
  return { option, summary, spec: barsSpec(data.rows, { title, unit: data.unit, highlight: largest(data.rows), summary }) };
}

/** The charts of the Recorrido by step (step 1, the GDP, has its own component; step 2 still shows a scene). */
export const TOUR_CHARTS: Record<number, TourChartDef> = {
  1: {
    step: 1,
    title: 'PBI de la Argentina',
    subtitle: `${GDP_MOCK.unit}, 1990 a 2056`,
    source: GDP_MOCK.source,
    kind: 'chart',
    build: () => ({ ...buildGdp(GDP_MOCK), spec: gdpLinesSpec(GDP_MOCK) })
  },
  3: {
    step: 3,
    title: 'Cuarta revolución industrial: el impacto de la IA en la economía',
    subtitle: 'PBI con y sin la revolución de la IA, 2025 a 2056',
    source: MOCK_SOURCE,
    legend: [
      { label: 'Sin revolución de la IA', color: GREY },
      { label: 'Con revolución de la IA', color: BLUE }
    ],
    kind: 'chart',
    build: ai
  },
  4: {
    step: 4,
    title: 'Recursos naturales: exportaciones por sector',
    subtitle: 'miles de millones de USD por año',
    source: MOCK_SOURCE,
    kind: 'chart',
    build: () => ranking('Exportaciones por sector', 'Exportaciones', EXPORTS_BY_SECTOR, largest(EXPORTS_BY_SECTOR.rows), 'Exportaciones por sector (datos de prueba)')
  },
  5: {
    step: 5,
    title: 'Regla del 70: cuánto tarda en duplicarse el PBI',
    subtitle: 'años que tarda según el crecimiento anual (70 dividido la tasa)',
    source: 'Cálculo de la regla del 70',
    kind: 'chart',
    build: () => ranking('Años para duplicar el PBI', 'Años para duplicarse', { unit: 'años', rows: rule70Rows() }, RULE70_HIGHLIGHT, 'Regla del 70, años que tarda en duplicarse el PBI según su crecimiento anual')
  },
  6: {
    step: 6,
    title: 'Qué miran los inversores',
    subtitle: 'puntaje de 0 a 10 de cada factor',
    source: MOCK_SOURCE,
    kind: 'chart',
    build: () => ranking('Qué miran los inversores', 'Puntaje', INVESTOR_SCORES, largest(INVESTOR_SCORES.rows), 'Qué miran los inversores, de 0 a 10 (datos de prueba)')
  },
  7: { step: 7, title: 'Mapa productivo por provincia', subtitle: 'valor productivo por provincia, millones de USD', source: MOCK_SOURCE, kind: 'map', build: NONE },
  8: {
    step: 8,
    title: 'Minería: hoy vs proyecto (con rangos)',
    subtitle: 'miles de millones de USD por año; la línea vertical es el rango de los proyectos',
    source: MOCK_SOURCE,
    legend: [
      { label: 'Hoy', color: GREY },
      { label: 'Proyectos', color: BLUE }
    ],
    kind: 'chart',
    build: mining
  },
  9: {
    step: 9,
    title: 'Hidrocarburos: Vaca Muerta define el piso y el techo',
    subtitle: 'miles de barriles equivalentes por día, 2015 a 2056',
    source: MOCK_SOURCE,
    kind: 'chart',
    build: hydrocarbons
  },
  10: {
    step: 10,
    title: 'Agro: producción actual y potencial',
    subtitle: 'miles de millones de USD por año',
    source: MOCK_SOURCE,
    legend: [
      { label: 'Actual', color: GREY },
      { label: 'Potencial', color: BLUE }
    ],
    kind: 'chart',
    build: agro
  },
  11: { step: 11, title: 'Composición de las exportaciones', subtitle: 'porcentaje del total exportado', source: MOCK_SOURCE, kind: 'chart', build: () => shares('Composición de las exportaciones', EXPORT_COMPOSITION) },
  12: { step: 12, title: 'Composición del PBI', subtitle: 'porcentaje del PBI por sector', source: MOCK_SOURCE, kind: 'chart', build: () => shares('Composición del PBI', GDP_COMPOSITION) },
  13: {
    step: 13,
    title: 'El stock de recursos naturales',
    subtitle: 'valor del stock, miles de millones de USD',
    source: MOCK_SOURCE,
    kind: 'chart',
    build: () => ranking('El stock de recursos naturales', 'Stock', RESOURCE_STOCK, largest(RESOURCE_STOCK.rows), 'Stock de recursos naturales, valuado (datos de prueba)')
  }
};

/** The steps that have a chart, in order. */
export const CHART_STEP_LIST: number[] = Object.keys(TOUR_CHARTS).map(Number).sort((a, b) => a - b);
