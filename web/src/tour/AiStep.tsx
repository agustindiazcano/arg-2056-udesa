import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { addMilestones } from '../charts/builders/milestones.js';
import { addReferenceLines } from '../charts/builders/referenceLines.js';
import { buildFluidLines } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { FOLLOW_MS, followFrame } from '../charts3d/followAnim.js';
import { linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useReducedMotion } from '../runtime/useReducedMotion.js';
import { SPEEDS } from '../state/reducer.js';
import { Segmented } from '../ui/Segmented.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { TourChart } from './TourChart.js';
import { tokens } from '../styles/tokens.js';
import { AI_SCENARIOS } from './aiScenarios.js';
import { perCapitaSeries, populationPath, summaries } from './aiModel.js';
import { countryReferences } from './countryReferences.js';
import type { CountryReference } from './countryReferences.js';
import { GDP_UNIT } from './gdpFacts.js';
import { AI_TITLE } from './slideTitles.js';
import { STEP_INFO } from './stepInfo.js';
import { aiImpactData } from './tourData.js';
import { useTimeline } from './useTimeline.js';
import { useCompact } from './compact.js';
import { PanelRail, panelAttrs } from './PanelRail.js';
import type { PanelItem } from './PanelRail.js';
import { argentinaReal, populationAt } from './worldData.js';

const LAST = 2056;

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
const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const speedFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

const pct = (v: number, digits = 1): string => `${v >= 0 ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
const num = (v: number, digits = 1): string => v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** How each scenario is called in the summary, next to its name. */
const TONE: Record<string, string> = { base: 'neutro', moderate: 'intermedio', optimistic: 'favorable' };

type ChartKind = 'gdp' | 'percapita' | 'population';

const CHART_TITLES: Record<ChartKind, string> = { gdp: 'PBI real de Argentina', percapita: 'PBI per cápita (miles de USD)', population: 'Población (millones)' };
const CHART_ORDER: readonly ChartKind[] = ['gdp', 'percapita', 'population'];

type Line = { name: string; values: Array<number | null>; color: string };

/** The lines drawn up to `year`, on axes that do not move while they draw (the whole range of the data is fixed). */
function lineOption(
  years: number[],
  series: Line[],
  year: number,
  unit: string,
  summary: string,
  withDots = false,
  baseValue?: number | null,
  labelEvery = 5,
  refs: readonly CountryReference[] = []
) {
  const { option } = buildFluidLines(years, series, year, {
    unit,
    labelEvery,
    summary,
    showHead: true
  });
  const withRefs = addReferenceLines(option, refs, { range: axisRange(series).max - axisRange(series).min, unit });
  return withDots ? addMilestones(withRefs, years, series, year, baseValue) : withRefs;
}

/** The y range `buildFluidLines` gives the axis of these lines (the same margins). */
function axisRange(series: Line[]): { min: number; max: number } {
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null && Number.isFinite(v)));
  return { min: Math.floor(Math.min(...all) * 0.97), max: Math.ceil(Math.max(...all) * 1.02) };
}

/**
 * Step 3 of the Recorrido, "Cuarta revolución industrial", built like the first slide: a big chart of the real GDP of Argentina from 2026 (or 1960) that draws
 * itself, year by year, with the three scenarios when the visitor presses play; on the right the GDP per person and the population (small), a table of
 * indicators at the year on screen and a summary of each scenario. There are no buttons to the charts of other slides.
 */
type AiPanel = 'main' | 'small' | 'numbers';

// on a short laptop screen the panels do not fit together: one is big and the others are small buttons
const AI_PANELS: ReadonlyArray<PanelItem<AiPanel>> = [
  { key: 'main', title: 'PBI real', icon: 'line' },
  { key: 'small', title: 'Per cápita y población', icon: 'grid' },
  { key: 'numbers', title: 'Indicadores', icon: 'table' }
];

export function AiStep() {
  const compact = useCompact();
  const [panel, setPanel] = useState<AiPanel>('main');
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [from1960, setFrom1960] = useState(false);
  // the chart draws itself in 2D; the 3D view shows the whole path with a marker on the year on screen
  const [view, setView] = useState<'2d' | '3d'>('2d');
  // the chart shown big on the left; the other two are small on the right and a click swaps them
  const [focus, setFocus] = useState<ChartKind>('gdp');
  const { elapsed, clock, seek, playing, play, pause } = useTimeline(run, reduced, speed);
  const stepSpeed = (by: 1 | -1) => setSpeed((v) => SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(v) + by))] ?? v);

  const FIRST = from1960 ? 1960 : 2026;
  const SPAN = LAST - FIRST;

  const gdp = useMemo(() => aiImpactData(), []);
  const perCapita = useMemo(() => perCapitaSeries(), []);
  const pop = useMemo(() => populationPath(), []);
  const rows = useMemo(() => summaries(), []);

  const hist = useMemo(() => argentinaReal(), []);
  const histPop = useMemo(() => hist.years.map((y) => populationAt('Argentina', y) ?? 0), [hist]);
  const histPerCapita = useMemo(() => hist.years.map((y, i) => Math.round((hist.values[i]! / (histPop[i] || 1)) * 100) / 100), [hist, histPop]);

  // the same clock as the first slide: the line is drawn in the first 10 seconds, then the 3D view pulls back
  const year = FIRST + followFrame(elapsed).reveal * SPAN;
  const shownYear = Math.min(LAST, Math.floor(year + 1e-6));
  const at = shownYear - FIRST;

  const activeYears = useMemo(() => (from1960 ? [...hist.years, ...gdp.years] : gdp.years), [from1960, hist, gdp]);

  const gdpLines: Line[] = useMemo(
    () => gdp.series.map((s) => ({ name: s.name, values: from1960 ? [...hist.values, ...s.values] : s.values, color: s.color })),
    [gdp, from1960, hist]
  );
  const gdpSummary = `PBI real de Argentina por escenario, de ${formatValue(gdpLines[0]!.values[0] ?? null, gdp.unit)} en ${FIRST} a ${LAST}: ${gdp.series
    .map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, gdp.unit)}`)
    .join(', ')}`;

  const perCapitaYears = activeYears;
  const perCapitaLines: Line[] = useMemo(
    () => perCapita.series.map((s) => ({ name: s.name, values: from1960 ? [...histPerCapita, ...s.values] : s.values, color: s.color })),
    [perCapita, from1960, histPerCapita]
  );
  const perCapitaSummary = `PBI per cápita por escenario: ${perCapita.series.map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, perCapita.unit)} en 2056`).join(', ')}`;

  const popYears = useMemo(() => (from1960 ? [...hist.years.slice(0, -1), ...pop.years] : pop.years), [from1960, hist, pop]);
  const popValues = useMemo(() => (from1960 ? [...histPop.slice(0, -1), ...pop.values] : pop.values), [from1960, histPop, pop]);
  const popLines: Line[] = useMemo(() => [{ name: 'Población', values: popValues, color: tokens.blue }], [popValues]);
  const popSummary = `Población de Argentina de ${num(popValues[0]!)} millones en ${FIRST} a ${num(popValues.at(-1)!)} en ${LAST}`;

  const bigInterval = from1960 ? 15 : 5;
  const smallInterval = from1960 ? 25 : 10;

  // where each compared country stands today: only those inside the range of the chart, so they never stretch the axis
  const gdpRefs = useMemo(() => countryReferences('gdp', axisRange(gdpLines)), [gdpLines]);
  const perCapitaRefs = useMemo(() => countryReferences('percapita', { ...axisRange(perCapitaLines), scale: 1000 }), [perCapitaLines]);

  const options = useMemo(() => {
    const perCapitaBase = perCapita.series[0]!.values[0];
    return {
      gdp: {
        big: lineOption(activeYears, gdpLines, year, gdp.unit, gdpSummary, true, gdp.series[0]!.values[0], bigInterval, gdpRefs),
        small: lineOption(activeYears, gdpLines, year, gdp.unit, gdpSummary, false, undefined, smallInterval, gdpRefs)
      },
      percapita: {
        big: lineOption(perCapitaYears, perCapitaLines, year, perCapita.unit, perCapitaSummary, true, perCapitaBase, bigInterval, perCapitaRefs),
        small: lineOption(perCapitaYears, perCapitaLines, year, perCapita.unit, perCapitaSummary, false, undefined, smallInterval, perCapitaRefs)
      },
      population: {
        big: lineOption(popYears, popLines, year, 'M', popSummary, false, undefined, bigInterval),
        small: lineOption(popYears, popLines, year, 'M', popSummary, false, undefined, smallInterval)
      }
    };
  }, [activeYears, gdpLines, year, gdp, gdpSummary, bigInterval, smallInterval, gdpRefs, perCapitaYears, perCapitaLines, perCapita, perCapitaSummary, perCapitaRefs, popYears, popLines, popSummary]);
  const summaries3: Record<ChartKind, string> = { gdp: gdpSummary, percapita: perCapitaSummary, population: popSummary };
  const bigSpec = useMemo(
    () =>
      linesSpec({
        title: 'PBI real de Argentina por escenario',
        unit: gdp.unit,
        xLabels: activeYears.map(String),
        series: gdpLines.map((s) => ({ ...s, tone: 'muted' as const })),
        follow: true,
        summary: gdpSummary
      }),
    [gdp, activeYears, gdpLines, gdpSummary]
  );
  // a new clock object is part of the spec: the 3D chart draws itself from the same time as the flat one
  const bigSpecTimed = useMemo(() => ({ ...bigSpec, clock }), [bigSpec, clock]);
  const step3Info = STEP_INFO[3]!;
  const headValue =
    focus === 'gdp'
      ? formatValue(gdpLines[1]!.values[at] ?? null, gdp.unit)
      : focus === 'percapita'
        ? formatValue(perCapitaLines[1]!.values[at] ?? null, perCapita.unit)
        : `${num(popLines[0]!.values[Math.min(at, popLines[0]!.values.length - 1)] ?? 0)} M`;

  return (
    <section className="gdp-step prov-step" aria-label={AI_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{AI_TITLE}</h2>
            <ChartHelp title={step3Info.heading} lead={GDP_UNIT} paragraphs={step3Info.paragraphs} how={step3Info.how} refs={step3Info.refs} />
          </div>
          <p className="gdp-sub">
            {FIRST} a {LAST} · {from1960 ? 'historia observada (1960-2025) y tres escenarios con la IA hacia 2056' : 'tres escenarios con la IA como impulso a la productividad'} · <RefList ids={step3Info.refs} />
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
            <span aria-hidden="true">{FIRST}</span>
            <input
              type="range"
              min={FIRST}
              max={LAST}
              step={0.25}
              value={year}
              aria-label="Línea de tiempo"
              aria-valuetext={`Año ${shownYear}`}
              onChange={(e) => seek(((Number(e.target.value) - FIRST) / SPAN) * FOLLOW_MS)}
            />
            <span aria-hidden="true">{LAST}</span>
          </label>
          <Segmented label="Vista" options={VIEWS} value={view} onChange={setView} />
          <button
            type="button"
            className={`btn ${from1960 ? 'btn--primary' : ''}`}
            onClick={() => {
              setFrom1960((v) => !v);
              setRun((n) => n + 1);
            }}
          >
            {from1960 ? 'Ver desde 2026' : 'Ver desde 1960'}
          </button>
        </div>
      </header>

      <PanelRail compact={compact} items={AI_PANELS} active={panel} onPick={setPanel} />
      <div className="prov-grid ai-grid-layout" data-compact={compact || undefined}>
        <Reveal k="main" className="gdp-chart rule70-card ai-main-card" {...panelAttrs(compact, panel, 'main')}>
          <div className="rule70-card-head">
            <div className="ai-head-group">
              <strong>{focus === 'gdp' ? CHART_TITLES.gdp : CHART_TITLES[focus]}</strong>
              <ChartHelp title="Escenarios del PBI real con IA" lead={gdp.unit} paragraphs={[step3Info.paragraphs[0]!, step3Info.paragraphs[1]!]} how={step3Info.how} refs={step3Info.refs} />
              <span className="ai-head-year">{shownYear}: {headValue}</span>
            </div>
            <div className="rule70-legend">
              {AI_SCENARIOS.map((s) => (
                <span key={s.id} className="ai-legend-item">
                  <span className="rule70-key" style={{ background: s.color }} aria-hidden="true" /> {s.name}
                </span>
              ))}
            </div>
          </div>
          <div className="rule70-chart ai-main-chart">
            {focus === 'gdp' ? (
              <TourChart spec={bigSpecTimed} mode={view} key={`${run}-${from1960}`}>
                <EChart option={options.gdp.big} aria-label={gdpSummary} />
              </TourChart>
            ) : (
              <EChart option={options[focus].big} aria-label={summaries3[focus]} />
            )}
          </div>
        </Reveal>

        <div className="prov-side ai-side-col">
          <Reveal k="small" delay={0.07} className="gdp-chart rule70-card ai-small" {...panelAttrs(compact, panel, 'small')} role="region" aria-label="Otros gráficos, tocá uno para verlo grande">
            <div className="ai-small-charts">
              {CHART_ORDER.filter((k) => k !== focus).map((k) => (
                <div key={k} className="ai-subcard ai-subcard--pick">
                  <div className="rule70-card-head">
                    <strong>{CHART_TITLES[k]}</strong>
                    <button type="button" className="btn ai-expand" aria-label={`Ver en grande: ${CHART_TITLES[k]}`} onClick={() => setFocus(k)}>
                      Ver grande
                    </button>
                  </div>
                  <div className="rule70-chart ai-subcard-chart">
                    <EChart option={options[k].small} aria-label={summaries3[k]} />
                    <button type="button" className="ai-pick-overlay" aria-hidden="true" tabIndex={-1} onClick={() => setFocus(k)} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal k="numbers" delay={0.14} className="gdp-chart rule70-card ai-numbers" {...panelAttrs(compact, panel, 'numbers')} role="region" aria-label={`Indicadores en ${shownYear}`}>
            <div className="rule70-card-head">
              <strong>Indicadores en {shownYear}</strong>
            </div>
            <table className="rule70-table ai-table" aria-label={`Indicadores por escenario en ${shownYear}`}>
              <thead>
                <tr>
                  <th scope="col">{shownYear}</th>
                  {AI_SCENARIOS.map((s) => (
                    <th key={s.id} scope="col">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Crecimiento anual medio 2026-2056</th>
                  {rows.map((r) => (
                    <td key={r.id}>{pct(r.averageGrowth, 2)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">PBI (miles de millones de USD)</th>
                  {shownYear < 2026
                    ? AI_SCENARIOS.map((s) => <td key={s.id}>{num(hist.values[shownYear - 1960] ?? 0)}</td>)
                    : gdp.series.map((s) => <td key={s.name}>{num(s.values[shownYear - 2026] ?? 0)}</td>)}
                </tr>
                <tr>
                  <th scope="row">PBI per cápita (miles de USD)</th>
                  {shownYear < 2026
                    ? AI_SCENARIOS.map((s) => <td key={s.id}>{num(histPerCapita[shownYear - 1960] ?? 0, 2)}</td>)
                    : perCapita.series.map((s) => <td key={s.name}>{num(s.values[shownYear - 2026] ?? 0, 2)}</td>)}
                </tr>
                <tr>
                  <th scope="row">Población (millones)</th>
                  {AI_SCENARIOS.map((s) => (
                    <td key={s.id}>
                      {num(shownYear < 2026 ? histPop[shownYear - 1960] ?? 0 : pop.values[shownYear - 2025] ?? pop.values.at(-1)!)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <ul className="ai-summary" aria-label="Resumen de los escenarios">
              {rows.map((r, k) => (
                <li key={r.id}>
                  <span className="rule70-key" style={{ background: AI_SCENARIOS[k]!.color }} aria-hidden="true" />
                  <strong>{`${r.name} (${TONE[r.id]}):`}</strong>
                  {` ${pct(r.averageGrowth, 2)} anual, el PBI cambia ${pct(r.gdpChange)} y el PBI per cápita ${pct(r.perCapitaChange)} entre 2026 y 2056; duplicar el PBI llevaría ${num(r.doublingYears)} años. ${AI_SCENARIOS[k]!.comment}.`}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
