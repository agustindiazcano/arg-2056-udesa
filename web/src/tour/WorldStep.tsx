import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildColumns, buildFollowedLines, buildFollowedSeries } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { TourChart } from './TourChart.js';
import { barsSpec, linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useReducedMotion } from '../runtime/useReducedMotion.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { WORLD_TITLE } from './slideTitles.js';
import { STEP_INFO } from './stepInfo.js';
import { elapsedForYear, seriesFrame, valueAt, yearAtElapsed } from './worldAnim.js';
import { SPEEDS } from '../state/reducer.js';
import { useTimeline } from './useTimeline.js';
import { WorldTable } from './WorldTable.js';
import { COMPARE_OPTIONS, DEFAULT_COMPARE, compareSeries, countryColor, flagSrc, isSquashed } from './worldCompare.js';
import { FIRST_YEAR, HOME, LAST_YEAR, REGION_METRICS, WORLD_SOURCE, WORLD_UNIT, mainSeries, rankAt, regionCountries, regionGrowth, regionValuesAt } from './worldData.js';
import type { RankMetric, RegionMetric } from './worldData.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const PlayIcon = () => (
  <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M3 1.5v11l9-5.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" />
  </svg>
);
const speedFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

const TITLE = WORLD_TITLE;
/** What the big chart shows for each metric of the ranking tables: its name, its unit and the label of the series. */
const GROWTH_HELP =
  'La línea punteada es el crecimiento anual del PBI real de América Latina y el Caribe (agregado del Banco Mundial, que pondera a cada país por su PBI), medido en % en el eje de la derecha. Se dibuja solo con el PBI y solo en la vista 2D.';

const SCALES = [
  { value: 'linear', label: 'Lineal' },
  { value: 'log', label: 'Logarítmica' }
] as const;

const MAIN: Record<RankMetric, { name: string; unit: string }> = {
  gdp: { name: 'PBI real de Argentina', unit: WORLD_UNIT },
  percapita: { name: 'PBI per cápita real de Argentina', unit: REGION_METRICS.percapita.unit }
};
const REGION_OPTIONS = [
  { value: 'gdp', label: 'PBI' },
  { value: 'percapita', label: 'PBI per cápita' },
  { value: 'population', label: 'Población' }
] as const;

/**
 * Step 0 of the Recorrido: the real GDP of Argentina from 1960 to 2025 as a line that draws itself year by year while the view
 * follows it, and pulls back when it reaches the last year (in 2D and in 3D); on the right the top 20 of the world's economies
 * and the largest economies of the region. Made-up values.
 */
export function WorldStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(1);
  const { elapsed, clock, seek, playing, play, pause } = useTimeline(run, reduced, speed);
  const stepSpeed = (by: 1 | -1) => setSpeed((v) => SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(v) + by))] ?? v);

  // the big chart shows the metric of the ranking table that was clicked
  const [mainMetric, setMainMetric] = useState<RankMetric>('gdp');
  const { name: SERIES_NAME, unit: MAIN_UNIT } = MAIN[mainMetric];
  const series = useMemo(() => mainSeries(mainMetric), [mainMetric]);
  const today = series.values.at(-1) ?? 0;
  // the countries drawn next to Argentina (flags to switch them) and, only when a line is squashed, the logarithmic scale
  const [compare, setCompare] = useState<string[]>([...DEFAULT_COMPARE]);
  const [logScale, setLogScale] = useState(false);
  const lines = useMemo(() => compareSeries(compare, mainMetric), [compare, mainMetric]);
  const growth = useMemo(regionGrowth, []);
  // the growth of the region is a rate: it is drawn on its own axis, only next to the PBI (not per person) and only in the flat chart
  const showGrowth = mainMetric === 'gdp';
  const squashed = isSquashed(lines);
  const log = squashed && logScale;
  const toggleCountry = (name: string) => setCompare((cur) => (cur.includes(name) ? cur.filter((c) => c !== name) : [...cur, name]));
  // the view fits the highest line at every year
  const envelope = useMemo(() => series.years.map((_, i) => Math.max(...lines.map((l) => l.values[i] ?? 0))), [series, lines]);
  const regionNames = useMemo(regionCountries, []);
  // the bars of the region show one of three values, chosen by clicking their title
  const [regionMetric, setRegionMetric] = useState<RegionMetric>('percapita');
  const metricInfo = REGION_METRICS[regionMetric];

  const summary = `${SERIES_NAME} de ${FIRST_YEAR} a ${LAST_YEAR}: de ${formatValue(series.values[0] ?? null, MAIN_UNIT)} a ${formatValue(today, MAIN_UNIT)}`;
  const frame = useMemo(() => seriesFrame(elapsed, series.years, envelope), [elapsed, series, envelope]);
  const flat = useMemo(
    () =>
      lines.length === 1
        ? buildFollowedSeries(series.years, series.values, frame, { unit: MAIN_UNIT, name: SERIES_NAME, summary, tip: { flag: flagSrc(HOME), rank: rankAt(HOME, frame.year, mainMetric) } })
        : buildFollowedLines(
            series.years,
            lines.map((l) => ({
              name: l.country,
              values: l.values,
              color: countryColor(l.country),
              main: l.country === HOME,
              // at the tip of each line: the flag and the place in the ranking of the year the line has reached
              tip: { flag: flagSrc(l.country), rank: rankAt(l.country, frame.year, mainMetric) }
            })),
            frame,
            { unit: MAIN_UNIT, summary, log, growth: showGrowth ? { name: growth.name, values: growth.values, color: tokens.ink2 } : undefined }
          ),
    [series, lines, frame, summary, MAIN_UNIT, SERIES_NAME, log, mainMetric, showGrowth, growth]
  );
  // a new object on every run: the 3D chart draws itself again
  const spec = useMemo(
    () =>
      linesSpec({
        title: SERIES_NAME,
        unit: MAIN_UNIT,
        xLabels: series.years.map(String),
        series: lines.map((l) => {
          // the 3D label travels with the head of the line and shows the place of the year it has reached
          const tip = { flag: flagSrc(l.country), rank: rankAt(l.country, LAST_YEAR, mainMetric), ranks: series.years.map((y) => rankAt(l.country, y, mainMetric)) };
          return l.country === HOME ? { name: SERIES_NAME, values: l.values, tone: 'highlight' as const, tip } : { name: l.country, values: l.values, tone: 'muted' as const, color: countryColor(l.country), tip };
        }),
        follow: true,
        log,
        summary
      }),
    [series, lines, summary, MAIN_UNIT, SERIES_NAME, log, mainMetric]
  );
  const lineSpec = useMemo(() => ({ ...spec, clock }), [spec, clock]);

  // the table and the bars of the region show the year the line has reached
  const regionValues = regionValuesAt(frame.year, regionMetric);
  const regionText = `Las mayores economías de la región, ${metricInfo.label} (${metricInfo.unit}), de ${FIRST_YEAR} a ${LAST_YEAR}: ${regionNames.map((c, i) => `${c} ${formatValue(regionValuesAt(LAST_YEAR, regionMetric)[i] ?? null, metricInfo.unit)} en ${LAST_YEAR}`).join(', ')}`;
  // the values change with the year: one option per frame, like the line; the bars are sorted from the largest to the smallest of the year the line has reached
  const regionOrder = regionNames.map((_, i) => i).sort((a, b) => (regionValues[b] ?? 0) - (regionValues[a] ?? 0));
  const regionFlat = buildColumns(
    regionOrder.map((i) => regionNames[i]!),
    [{ name: metricInfo.label, values: regionOrder.map((i) => regionValues[i] ?? 0), color: tokens.muted }],
    { unit: metricInfo.unit, highlight: HOME, summary: regionText, dense: { barWidth: 22, rotate: 35 } }
  ).option;
  // the bars in 3D read the clock too: the heights come from the year, they trade places as the order changes, the camera stays on the bar of Argentina
  const regionSpec = useMemo(
    () => ({
      ...barsSpec(
        regionNames.map((c, i) => ({ label: c, value: regionValuesAt(LAST_YEAR, regionMetric)[i] ?? 0 })),
        { title: `Mayores economías de la región: ${metricInfo.label}`, unit: metricInfo.unit, highlight: HOME, summary: regionText }
      ),
      timeline: { clock, yearAt: yearAtElapsed, valuesAt: (year: number) => regionValuesAt(year, regionMetric), focus: regionNames.indexOf(HOME), sorted: true }
    }),
    [regionNames, regionText, regionMetric, metricInfo, clock]
  );

  const shownYear = Math.floor(frame.year + 1e-6);
  const shownValue = valueAt(series.years, series.values, frame.year);
  const step0Info = STEP_INFO[0]!;

  return (
    <section className="gdp-step prov-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{TITLE}</h2>
            <ChartHelp title={step0Info.heading} lead={MAIN_UNIT} paragraphs={showGrowth ? [...step0Info.paragraphs, GROWTH_HELP] : step0Info.paragraphs} how={step0Info.how} refs={step0Info.refs} />
          </div>
          <p className="gdp-sub">
            {FIRST_YEAR} a {LAST_YEAR} · <span className="gdp-source">{WORLD_SOURCE}</span> · <RefList ids={step0Info.refs} />
          </p>
        </Reveal>
        <div className="tour-controls">
          <button type="button" className="btn btn--icon world-replay" aria-label={playing ? 'Pausar' : 'Reproducir'} onClick={playing ? pause : play}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div role="group" aria-label="Velocidad" className="control-group">
            <button type="button" className="btn btn--icon" aria-label="Más lento" onClick={() => stepSpeed(-1)}>
              −
            </button>
            <span className="speed">{speedFormat.format(speed)}×</span>
            <button type="button" className="btn btn--icon" aria-label="Más rápido" onClick={() => stepSpeed(1)}>
              +
            </button>
          </div>
          <button type="button" className="btn world-replay" onClick={() => setRun((n) => n + 1)}>
            Repetir
          </button>
          <label className="world-timeline">
            <span aria-hidden="true">{FIRST_YEAR}</span>
            <input
              type="range"
              min={FIRST_YEAR}
              max={LAST_YEAR}
              step={0.25}
              value={frame.year}
              aria-label="Línea de tiempo"
              aria-valuetext={`Año ${shownYear}`}
              onChange={(e) => seek(elapsedForYear(Number(e.target.value)))}
            />
            <span aria-hidden="true">{LAST_YEAR}</span>
          </label>
          <Segmented
            label="Vista"
            options={VIEWS}
            value={mode}
            onChange={(next) => {
              if (next !== mode) dispatch({ type: 'toggle3D' });
            }}
          />
        </div>
      </header>

      <div className="prov-grid">
        <Reveal k="main" className="gdp-chart prov-map">
          <div className="world-year" aria-hidden="true">
            <strong>{shownYear}</strong>
            <span>{formatValue(Math.round(shownValue), MAIN_UNIT)}</span>
          </div>
          <div className="world-compare" role="group" aria-label="Países a comparar con Argentina">
            <span className="world-flag world-flag--home" data-name={HOME} role="img" aria-label={`${HOME}, siempre en el gráfico`}>
              <img src={flagSrc(HOME)} alt="" width={24} height={18} />
            </span>
            {COMPARE_OPTIONS.map((o) => (
              <button
                key={o.name}
                type="button"
                className="world-flag"
                data-name={o.name}
                aria-pressed={compare.includes(o.name)}
                aria-label={o.name}
                style={{ '--line': countryColor(o.name) } as React.CSSProperties}
                onClick={() => toggleCountry(o.name)}
              >
                <img src={flagSrc(o.name)} alt="" width={24} height={18} />
              </button>
            ))}
            {squashed && (
              <span className="world-scale">
                <Segmented label="Escala" options={SCALES} value={log ? 'log' : 'linear'} onChange={(next) => setLogScale(next === 'log')} />
                <ChartHelp
                  title="Escala logarítmica"
                  paragraphs={[
                    'Una línea queda aplastada cuando su valor es menos de una décima parte del de la más alta. Con la escala logarítmica cada marca del eje vale diez veces la anterior, así que se ve cuánto crece cada país sin que el más grande tape a los demás, y una recta es un crecimiento constante.',
                    'Los valores no cambian: solo cambia cómo se reparte el eje. Por eso este botón aparece solo cuando hace falta.'
                  ]}
                />
              </span>
            )}
          </div>
          <div className="tour-chart" key={`${mode}-${run}`}>
            <TourChart spec={lineSpec}>
              <EChart option={flat.option} aria-label={summary} />
            </TourChart>
          </div>
        </Reveal>

        <div className="prov-side">
          <Reveal k="top" delay={0.07} className="gdp-chart prov-rank" role="region" aria-label="Rankings mundiales de PBI y de PBI per cápita">
            <div className="prov-rank-head">
              <strong>Ranking mundial en {shownYear}</strong>
              <ChartHelp
                title="Ranking mundial de PBI y PBI per cápita"
                paragraphs={[step0Info.paragraphs[0]!]}
                how="El ranking de PBI per cápita cuenta solo países de un millón de habitantes o más."
                refs={step0Info.refs}
              />
            </div>
            <div className="world-ranks">
              <WorldTable
                metric="gdp"
                title="PBI real"
                unit={REGION_METRICS.gdp.unit}
                help="Los países ordenados por su PBI real del año que marca la línea de tiempo. Argentina aparece aparte, con su puesto entre todos los países del Banco Mundial."
                year={frame.year}
                active={mainMetric === 'gdp'}
                onSelect={() => setMainMetric('gdp')}
              />
              <WorldTable
                metric="percapita"
                title="PBI per cápita real"
                unit={REGION_METRICS.percapita.unit}
                help="El PBI real dividido por la población. Cuenta solo países de un millón de habitantes o más. Argentina aparece aparte, con su puesto."
                year={frame.year}
                active={mainMetric === 'percapita'}
                onSelect={() => setMainMetric('percapita')}
              />
            </div>
          </Reveal>

          <Reveal k="region" delay={0.14} className="gdp-chart prov-bars" role="region" aria-label="Mayores economías de la región">
            <div className="tour-caption">
              <strong>Mayores economías de la región</strong>
              <ChartHelp
                title="Mayores economías de la región"
                paragraphs={[step0Info.paragraphs[1]!]}
                how="Las barras de la región se reordenan de mayor a menor en cada año."
                refs={step0Info.refs}
              />
              <div className="world-metric-pick">
                <span>En la región</span>
                <Segmented label="Dato de la región" options={REGION_OPTIONS} value={regionMetric} onChange={setRegionMetric} />
              </div>
            </div>
            <div className="tour-chart">
              <TourChart spec={regionSpec} mode="2d">
                <EChart option={regionFlat} aria-label={regionText} />
              </TourChart>
            </div>
          </Reveal>
        </div>
      </div>

    </section>
  );
}
