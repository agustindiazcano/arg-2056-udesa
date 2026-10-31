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
import { AI_SCENARIOS, SCENARIO_CURVE_FLAGS, buildScopeIndexSeries } from './aiScenarios.js';
import type { AiProjectionScope } from './aiScenarios.js';
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
import './aiEvidence.css';

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

const SCOPES: ReadonlyArray<{ value: AiProjectionScope; label: string }> = [
  { value: 'arg', label: 'Argentina' },
  { value: 'world', label: 'Mundo' },
  { value: 'groups', label: 'Se suben a la ola vs. Como Argentina' }
];

const speedFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

const pct = (v: number, digits = 1): string => `${v >= 0 ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
const num = (v: number, digits = 1): string => v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** How each scenario is called in the summary, next to its name. */
const TONE: Record<string, string> = { base: 'neutro / con fricción', moderate: 'intermedio', optimistic: 'frontera tecnológica' };

type ChartKind = 'gdp' | 'percapita' | 'population';

const CHART_TITLES: Record<ChartKind, string> = { gdp: 'PBI real de Argentina', percapita: 'PBI per cápita de Argentina (miles de USD)', population: 'Población de Argentina (millones)' };
const CHART_ORDER: readonly ChartKind[] = ['gdp', 'percapita', 'population'];

type Line = { name: string; values: Array<number | null>; color: string };

/** Attaches 3 small country flags onto each scenario curve at the latest drawn point so the viewer sees which countries sit on each trajectory. */
function addScenarioCurveFlags(option: object, years: number[], series: Line[], year: number): object {
  const o = option as { series?: Array<Record<string, unknown>> };
  if (!o.series || series.length < 3) return option;
  const orderIds: ReadonlyArray<'base' | 'moderate' | 'optimistic'> = ['base', 'moderate', 'optimistic'];
  const lastIdx = Math.max(0, Math.min(years.length - 1, Math.floor(year) - (years[0] ?? 2026)));
  const xLabel = String(years[lastIdx] ?? years.at(-1) ?? 2056);
  const updated = o.series.map((s, idx) => {
    if (idx >= 3 || String(s.name ?? '').includes('(cabeza)')) return s;
    const scenarioId = orderIds[idx]!;
    const flags = SCENARIO_CURVE_FLAGS[scenarioId];
    const yVal = series[idx]?.values[lastIdx] ?? series[idx]?.values.at(-1);
    if (yVal === null || yVal === undefined) return s;
    const rich: Record<string, unknown> = {};
    flags.forEach((f, fi) => {
      rich[`f${fi}`] = { width: 16, height: 11, backgroundColor: { image: f.flag } };
    });
    return {
      ...s,
      markPoint: {
        silent: true,
        animation: false,
        symbol: 'circle',
        symbolSize: 1,
        data: [
          {
            name: flags.map((f) => f.country).join(', '),
            coord: [xLabel, yVal],
            label: {
              show: true,
              position: idx === 2 ? 'top' : idx === 1 ? 'insideTopRight' : 'bottom',
              distance: 6,
              formatter: flags.map((_, fi) => `{f${fi}|}`).join(' '),
              rich
            }
          }
        ]
      }
    };
  });
  return { ...o, series: updated };
}

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
  refs: readonly CountryReference[] = [],
  withCurveFlags = false
) {
  const { option } = buildFluidLines(years, series, year, {
    unit,
    labelEvery,
    summary,
    showHead: true
  });
  const withRefs = addReferenceLines(option, refs, { range: axisRange(series).max - axisRange(series).min, unit });
  const withMilestones = withDots ? addMilestones(withRefs, years, series, year, baseValue) : withRefs;
  return withCurveFlags ? addScenarioCurveFlags(withMilestones, years, series, year) : withMilestones;
}

/** The y range `buildFluidLines` gives the axis of these lines (the same margins). */
function axisRange(series: Line[]): { min: number; max: number } {
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null && Number.isFinite(v)));
  return { min: Math.floor(Math.min(...all) * 0.97), max: Math.ceil(Math.max(...all) * 1.02) };
}

type AiPanel = 'main' | 'small' | 'numbers';

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
  const [scope, setScope] = useState<AiProjectionScope>('arg');
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [focus, setFocus] = useState<ChartKind>('gdp');
  const { elapsed, clock, seek, playing, play, pause } = useTimeline(run, reduced, speed);
  const stepSpeed = (by: 1 | -1) => setSpeed((v) => SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(v) + by))] ?? v);

  const FIRST = from1960 && scope === 'arg' ? 1960 : 2026;
  const SPAN = LAST - FIRST;

  const gdp = useMemo(() => aiImpactData(), []);
  const perCapita = useMemo(() => perCapitaSeries(), []);
  const pop = useMemo(() => populationPath(), []);
  const rows = useMemo(() => summaries(), []);

  const hist = useMemo(() => argentinaReal(), []);
  const histPop = useMemo(() => hist.years.map((y) => populationAt('Argentina', y) ?? 0), [hist]);
  const histPerCapita = useMemo(() => hist.years.map((y, i) => Math.round((hist.values[i]! / (histPop[i] || 1)) * 100) / 100), [hist, histPop]);

  const year = FIRST + followFrame(elapsed).reveal * SPAN;
  const shownYear = Math.min(LAST, Math.floor(year + 1e-6));
  const at = shownYear - FIRST;

  const activeYears = useMemo(() => (from1960 && scope === 'arg' ? [...hist.years, ...gdp.years] : gdp.years), [from1960, scope, hist, gdp]);

  const scopeData = useMemo(() => (scope === 'arg' ? null : buildScopeIndexSeries(scope, gdp.years)), [scope, gdp.years]);

  const gdpLines: Line[] = useMemo(() => {
    if (scopeData) return scopeData.series;
    return gdp.series.map((s) => ({ name: s.name, values: from1960 ? [...hist.values, ...s.values] : s.values, color: s.color }));
  }, [gdp, from1960, hist, scopeData]);

  const activeUnit = scopeData ? scopeData.unit : gdp.unit;
  const mainGdpTitle =
    scope === 'arg'
      ? CHART_TITLES.gdp
      : scope === 'world'
        ? 'Proyección del PBI mundial (Índice 2026 = 100)'
        : 'Países que se suben a la ola vs. países como Argentina (Índice 2026 = 100)';

  const gdpSummary = `${mainGdpTitle}, de ${formatValue(gdpLines[0]!.values[0] ?? null, activeUnit)} en ${FIRST} a ${LAST}: ${gdpLines
    .map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, activeUnit)}`)
    .join(', ')}`;

  const perCapitaYears = useMemo(() => (from1960 ? [...hist.years, ...gdp.years] : gdp.years), [from1960, hist, gdp]);
  const perCapitaLines: Line[] = useMemo(
    () => perCapita.series.map((s) => ({ name: s.name, values: from1960 ? [...histPerCapita, ...s.values] : s.values, color: s.color })),
    [perCapita, from1960, histPerCapita]
  );
  const perCapitaSummary = `PBI per cápita por escenario: ${perCapita.series.map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, perCapita.unit)} en 2056`).join(', ')}`;

  const popYears = useMemo(() => (from1960 ? [...hist.years.slice(0, -1), ...pop.years] : pop.years), [from1960, hist, pop]);
  const popValues = useMemo(() => (from1960 ? [...histPop.slice(0, -1), ...pop.values] : pop.values), [from1960, histPop, pop]);
  const popLines: Line[] = useMemo(() => [{ name: 'Población', values: popValues, color: tokens.blue }], [popValues]);
  const popSummary = `Población de Argentina de ${num(popValues[0]!)} millones en ${FIRST} a ${num(popValues.at(-1)!)} en ${LAST}`;

  const bigInterval = from1960 && scope === 'arg' ? 15 : 5;
  const smallInterval = from1960 && scope === 'arg' ? 25 : 10;

  const gdpRefs = useMemo(() => (scope === 'arg' ? countryReferences('gdp', axisRange(gdpLines)) : []), [scope, gdpLines]);
  const perCapitaRefs = useMemo(() => countryReferences('percapita', { ...axisRange(perCapitaLines), scale: 1000 }), [perCapitaLines]);

  const options = useMemo(() => {
    const perCapitaBase = perCapita.series[0]!.values[0];
    const gdpBase = gdpLines[0]!.values[0];
    return {
      gdp: {
        big: lineOption(activeYears, gdpLines, year, activeUnit, gdpSummary, true, gdpBase, bigInterval, gdpRefs, true),
        small: lineOption(activeYears, gdpLines, year, activeUnit, gdpSummary, false, undefined, smallInterval, [], false)
      },
      percapita: {
        big: lineOption(perCapitaYears, perCapitaLines, year, perCapita.unit, perCapitaSummary, true, perCapitaBase, bigInterval, perCapitaRefs, true),
        small: lineOption(perCapitaYears, perCapitaLines, year, perCapita.unit, perCapitaSummary, false, undefined, smallInterval, [], false)
      },
      population: {
        big: lineOption(popYears, popLines, year, 'M', popSummary, false, undefined, bigInterval),
        small: lineOption(popYears, popLines, year, 'M', popSummary, false, undefined, smallInterval)
      }
    };
  }, [activeYears, gdpLines, year, activeUnit, gdpSummary, bigInterval, smallInterval, gdpRefs, perCapitaYears, perCapitaLines, perCapita, perCapitaSummary, perCapitaRefs, popYears, popLines, popSummary]);
  const summaries3: Record<ChartKind, string> = { gdp: gdpSummary, percapita: perCapitaSummary, population: popSummary };
  const bigSpec = useMemo(
    () =>
      linesSpec({
        title: mainGdpTitle,
        unit: activeUnit,
        xLabels: activeYears.map(String),
        series: gdpLines.map((s) => ({ ...s, tone: 'muted' as const })),
        follow: true,
        summary: gdpSummary
      }),
    [mainGdpTitle, activeUnit, activeYears, gdpLines, gdpSummary]
  );
  const bigSpecTimed = useMemo(() => ({ ...bigSpec, clock }), [bigSpec, clock]);
  const step3Info = STEP_INFO[3]!;
  const headValue =
    focus === 'gdp'
      ? formatValue(gdpLines[1]!.values[at] ?? null, activeUnit)
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
            {FIRST} a {LAST} · La curva optimista (verde) corresponde a economías frontera productoras de cómputo (EE. UU., AIPI 0,68); Argentina hoy no está en ese tren (AIPI 0,47 y fricción estructural)
            {!compact && <> · <RefList ids={step3Info.refs} /></>}
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented
            label="Proyección"
            options={SCOPES}
            value={scope}
            onChange={(next) => {
              setScope(next);
              setFocus('gdp');
            }}
          />
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
          {scope === 'arg' && (
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
          )}
        </div>
      </header>

      <PanelRail compact={compact} items={AI_PANELS} active={panel} onPick={setPanel} />
      <div className="prov-grid ai-grid-layout" data-compact={compact || undefined}>
        <Reveal k="main" className="gdp-chart rule70-card ai-main-card" {...panelAttrs(compact, panel, 'main')}>
          <div className="rule70-card-head">
            <div className="ai-head-group">
              <strong>{focus === 'gdp' ? mainGdpTitle : CHART_TITLES[focus]}</strong>
              <ChartHelp title="Escenarios del PBI real con IA" lead={activeUnit} paragraphs={[step3Info.paragraphs[0]!, step3Info.paragraphs[1]!]} how={step3Info.how} refs={step3Info.refs} />
              <span className="ai-head-year">{shownYear}: {headValue}</span>
            </div>
            <div className="rule70-legend">
              {AI_SCENARIOS.map((s, idx) => {
                const flags = SCENARIO_CURVE_FLAGS[s.id];
                const label = scopeData ? scopeData.rates[idx]!.name : s.name;
                return (
                  <span key={s.id} className="ai-legend-item">
                    <span className="rule70-key" style={{ background: s.color }} aria-hidden="true" /> {label}
                    <span className="ai-curve-flags" aria-label={`Países representativos en curva ${label}: ${flags.map((f) => f.country).join(', ')}`}>
                      {flags.map((f) => (
                        <img key={f.country} src={f.flag} alt={f.country} title={f.country} width={16} height={12} />
                      ))}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="ai-scope-banner">
            {scope === 'arg' && (
              <span>
                <strong>Curva verde, si Argentina creciera a la tasa del escenario optimista</strong> (+5,06 % anual medio 2026-2056: salto de adopción 2027-2030 y +1,5 pp/año de productividad de Goldman Sachs). Con la fricción actual (AIPI 0,47, ~45 % de informalidad y +51 % de sobrecosto a tokens importados), <strong>Argentina hoy se ubica entre la curva roja (Base, +2,80 %) y la azul (Moderado, +3,33 %)</strong>.
              </span>
            )}
            {scope === 'world' && (
              <span>
                <strong>Proyección del Mundo (2026 = 100):</strong> Tasas globales calibradas sobre línea base de 2,50 % anual: Pesimista <strong>+2,62 %</strong> (+0,12 pp IA, Acemoglu), Neutro <strong>+3,00 %</strong> (+0,50 pp IA, FMI/OCDE) y Optimista <strong>+3,45 %</strong> (+0,95 pp IA, Goldman Sachs +7 % PBI global).
              </span>
            )}
            {scope === 'groups' && (
              <span>
                <strong>Divergencia estructural (Mind the Gap, FMI WP/25/76):</strong> Los países que se suben a la ola (EE. UU., Australia, Alemania; AIPI 0,68+) crecen al <strong>3,20 % anual</strong> (+1,40 pp IA), mientras que las economías con fricción como Argentina (AIPI 0,47) crecen al <strong>2,17 % anual</strong> (+0,17 pp IA neutro; rango 0,00 a +0,42 pp).
              </span>
            )}
          </div>
          <div className="rule70-chart ai-main-chart">
            {focus === 'gdp' ? (
              <TourChart spec={bigSpecTimed} mode={view} key={`${run}-${from1960}-${scope}`}>
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
              <strong>{scope === 'arg' ? `Indicadores en ${shownYear}` : `Tasas calibradas e índice en ${shownYear}`}</strong>
            </div>
            <table className="rule70-table ai-table" aria-label={`Indicadores por escenario en ${shownYear}`}>
              <thead>
                <tr>
                  <th scope="col">{shownYear}</th>
                  {AI_SCENARIOS.map((s, idx) => (
                    <th key={s.id} scope="col">
                      {scopeData ? scopeData.rates[idx]!.name : s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Crecimiento anual medio 2026-2056</th>
                  {scopeData
                    ? scopeData.rates.map((r) => <td key={r.id}>{pct(r.annualGrowthPct, 2)}</td>)
                    : rows.map((r) => <td key={r.id}>{pct(r.averageGrowth, 2)}</td>)}
                </tr>
                <tr>
                  <th scope="row">{scopeData ? 'Impulso neto IA (literatura)' : 'Aporte anual de la IA a la PTF'}</th>
                  {scopeData
                    ? scopeData.rates.map((r) => <td key={r.id}>{r.aiBoostPp}</td>)
                    : AI_SCENARIOS.map((s) => <td key={s.id}>{`+${num(s.aiPoints[0], 1)} a +${num(s.aiPoints[1], 1)} pp/año`}</td>)}
                </tr>
                <tr>
                  <th scope="row">{scopeData ? 'PBI real (Índice 2026 = 100)' : 'PBI real de Argentina (miles de millones de USD)'}</th>
                  {shownYear < 2026 && !scopeData
                    ? AI_SCENARIOS.map((s) => <td key={s.id}>{num(hist.values[shownYear - 1960] ?? 0)}</td>)
                    : gdpLines.map((s) => <td key={s.name}>{num(s.values[shownYear - 2026] ?? 0)}</td>)}
                </tr>
                {scopeData ? (
                  <>
                    <tr>
                      <th scope="row">{`Variación acumulada 2026-${shownYear}`}</th>
                      {gdpLines.map((s) => (
                        <td key={s.name}>{pct((s.values[shownYear - 2026] ?? 100) - 100, 1)}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Años para duplicar el PBI</th>
                      {scopeData.rates.map((r) => (
                        <td key={r.id}>{`${num(Math.log(2) / Math.log(1 + r.annualGrowthPct / 100), 1)} años`}</td>
                      ))}
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <th scope="row">PBI per cápita Arg. (miles de USD)</th>
                      {shownYear < 2026
                        ? AI_SCENARIOS.map((s) => <td key={s.id}>{num(histPerCapita[shownYear - 1960] ?? 0, 2)}</td>)
                        : perCapita.series.map((s) => <td key={s.name}>{num(s.values[shownYear - 2026] ?? 0, 2)}</td>)}
                    </tr>
                    <tr>
                      <th scope="row">Población Arg. (millones)</th>
                      {AI_SCENARIOS.map((s) => (
                        <td key={s.id}>
                          {num(shownYear < 2026 ? histPop[shownYear - 1960] ?? 0 : pop.values[shownYear - 2025] ?? pop.values.at(-1)!)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <ul className="ai-summary" aria-label="Resumen de los escenarios">
              {scopeData
                ? scopeData.rates.map((r) => {
                    const flags = SCENARIO_CURVE_FLAGS[r.id];
                    return (
                      <li key={r.id}>
                        <span className="rule70-key" style={{ background: r.color }} aria-hidden="true" />
                        <strong>{`${r.name}:`}</strong>
                        {` ${pct(r.annualGrowthPct, 2)} anual (${r.aiBoostPp}). ${r.detail} `}
                        <span className="ai-curve-flags">
                          {flags.map((f) => (
                            <img key={f.country} src={f.flag} alt={f.country} title={f.country} width={15} height={11} />
                          ))}
                        </span>
                      </li>
                    );
                  })
                : rows.map((r, k) => {
                    const flags = SCENARIO_CURVE_FLAGS[r.id];
                    return (
                      <li key={r.id}>
                        <span className="rule70-key" style={{ background: AI_SCENARIOS[k]!.color }} aria-hidden="true" />
                        <strong>{`${r.name} (${TONE[r.id]}):`}</strong>
                        {` ${pct(r.averageGrowth, 2)} anual, el PBI cambia ${pct(r.gdpChange)} y el PBI per cápita ${pct(r.perCapitaChange)} entre 2026 y 2056; duplicar el PBI llevaría ${num(r.doublingYears)} años. ${AI_SCENARIOS[k]!.comment}. `}
                        <span className="ai-curve-flags">
                          {flags.map((f) => (
                            <img key={f.country} src={f.flag} alt={f.country} title={f.country} width={15} height={11} />
                          ))}
                        </span>
                      </li>
                    );
                  })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
