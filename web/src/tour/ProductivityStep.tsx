import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildColumns, buildLines } from '../charts/builders/tourCharts.js';
import { barsSpec, linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { Segmented } from '../ui/Segmented.js';
import { PRODUCTIVITY_TITLE } from './slideTitles.js';
import { TourChart } from './TourChart.js';
import { COUNTRIES, DATA_SOURCES, PERIODS, PRODUCTIVITY_STEPS, LAST_YEAR, cumulative2011, num, periodFrom, seriesOf } from './productivity.js';
import type { Metric, Period, ProductivityStepDef, SourceLink } from './productivity.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const PERIOD_OPTIONS = PERIODS.map((p) => ({ value: String(p), label: `Desde ${p}` }));

function Links({ links }: { links: readonly SourceLink[] }) {
  return (
    <>
      {links.map((l, i) => (
        <React.Fragment key={l.url}>
          {i > 0 && ', '}
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        </React.Fragment>
      ))}
    </>
  );
}

const CAVEAT = `La PWT 11.0 termina en ${LAST_YEAR}: no incluye 2024 ni 2025.`;
const TOTAL = PRODUCTIVITY_STEPS.length;

/** The steps that open with Argentina alone (the yearly change of output per hour, step 4): the other countries turn on with a click. */
const ONLY_ARGENTINA: ReadonlySet<number> = new Set([3]);

const initialHidden = (step: number): Set<string> => new Set(ONLY_ARGENTINA.has(step) ? COUNTRIES.filter((c) => c.code !== 'AR').map((c) => c.code) : []);

function LineBody({ def, period, hidden }: { def: ProductivityStepDef; period: Period; hidden: Set<string> }) {
  const built = useMemo(() => {
    const metric = def.metric as Metric;
    const kind = def.kind as 'level' | 'change';
    const shown = COUNTRIES.filter((c) => !hidden.has(c.code));
    const cut = shown.map((c) => {
      const s = seriesOf(metric, kind, c.code);
      return { c, ...periodFrom(s.years, s.values, period) };
    });
    const xLabels = (cut[0]?.years ?? []).map(String);
    const summary = `${def.chart} (${def.unit}), ${xLabels[0]} a ${xLabels.at(-1)}: ${cut.map((s) => `${s.c.name} ${num(s.values.at(-1) ?? 0)} en ${xLabels.at(-1)}`).join(', ')}`;
    const { option } = buildLines(
      xLabels,
      cut.map((s) => ({ name: s.c.name, values: s.values, color: s.c.color })),
      { unit: kind === 'change' ? '%' : '', labelEvery: period === 1955 ? 8 : 4, summary }
    );
    const spec = linesSpec({
      title: def.chart,
      unit: kind === 'change' ? '%' : '',
      xLabels,
      series: cut.map((s) => ({ name: s.c.name, values: s.values, tone: s.c.code === 'AR' ? 'highlight' : 'muted', color: s.c.color })),
      summary
    });
    return { option, spec, summary };
  }, [def, period, hidden]);
  return (
    <TourChart spec={built.spec}>
      <EChart option={built.option} aria-label={built.summary} />
    </TourChart>
  );
}

function BarsBody({ metric, title }: { metric: Metric; title: string }) {
  const built = useMemo(() => {
    const rows = COUNTRIES.map((c) => ({ label: c.name, value: cumulative2011(metric, c.code) }));
    const summary = `${title}, variación acumulada 2011-${LAST_YEAR}: ${rows.map((r) => `${r.label} ${num(r.value)} %`).join(', ')}`;
    const { option } = buildColumns(rows.map((r) => r.label), [{ name: title, values: rows.map((r) => r.value), color: '#898781' }], { unit: '%', highlight: 'Argentina', summary });
    return { option, spec: barsSpec(rows, { title, unit: '%', highlight: 'Argentina', summary }), summary };
  }, [metric, title]);
  return (
    <TourChart spec={built.spec}>
      <EChart option={built.option} aria-label={built.summary} />
    </TourChart>
  );
}

/**
 * Step 14 of the Recorrido, "Productividad": five steps (TFP level and change, output per hour level and change, what changed
 * between 2011 and 2023) with the chart on the left and the text on the right. Penn World Table data, see `productivity.ts`.
 */
export function ProductivityStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const [n, setN] = useState(0);
  const [period, setPeriod] = useState<Period>(1955);
  // the countries turned off, kept apart for each step so that the choice of one chart does not leak into another
  const [hiddenByStep, setHiddenByStep] = useState<Record<number, Set<string>>>({});
  const hidden = hiddenByStep[n] ?? initialHidden(n);
  const def = PRODUCTIVITY_STEPS[n]!;
  const toggle = (code: string) =>
    setHiddenByStep((all) => {
      const next = new Set(all[n] ?? initialHidden(n));
      if (next.has(code)) next.delete(code);
      else if (next.size < COUNTRIES.length - 1) next.add(code);
      return { ...all, [n]: next };
    });

  return (
    <section className="gdp-step prov-step prod-step" aria-label="Productividad">
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{PRODUCTIVITY_TITLE}</h2>
          <p className="gdp-sub">
            PTF y producto por hora trabajada, Argentina, Estados Unidos, Chile y Brasil, 1955 a {LAST_YEAR} · <Links links={DATA_SOURCES} />
          </p>
        </Reveal>
        <div className="tour-controls">
          {def.kind !== 'bars' && <Segmented label="Período" options={PERIOD_OPTIONS} value={String(period) as `${Period}`} onChange={(v) => setPeriod(Number(v) as Period)} />}
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
        <Reveal k={`chart-${n}`} className="gdp-chart prov-map">
          <div className="tour-caption">
            <strong>{def.chart}</strong>
            <span className="prod-unit">{def.unit}</span>
            {def.kind !== 'bars' && (
              <ul className="tour-legend" aria-label="Países">
                {COUNTRIES.map((c) => (
                  <li key={c.code}>
                    <button type="button" className="prod-legend" aria-pressed={!hidden.has(c.code)} onClick={() => toggle(c.code)}>
                      <span className="tour-swatch" style={{ background: c.color }} aria-hidden="true" />
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {def.kind === 'bars' ? (
            <>
              <div className="tour-chart">
                <BarsBody metric="tfp" title="PTF" />
              </div>
              <div className="tour-chart">
                <BarsBody metric="oph" title="Producto por hora" />
              </div>
            </>
          ) : (
            <div className="tour-chart">
              <LineBody def={def} period={period} hidden={hidden} />
            </div>
          )}
        </Reveal>

        <Reveal k={`text-${n}`} delay={0.07} className="gdp-chart prod-text" role="region" aria-label={`Paso ${n + 1} de ${TOTAL}`}>
          <p className="prod-kicker">{`Paso ${n + 1} de ${TOTAL}`}</p>
          <h3>{def.heading}</h3>
          {def.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <details open>
            <summary>Cómo leer este gráfico</summary>
            <p>{def.how}</p>
          </details>
          <p className="prod-note">{def.note}</p>
          <p className="prod-note">
            Fuentes: <Links links={[...DATA_SOURCES, ...(def.links ?? [])]} />. Cada país contra sí mismo, base 1955 = 100. {CAVEAT}
          </p>

          <div className="prod-nav">
            <div role="tablist" aria-label="Pasos de la diapositiva" className="prod-tabs">
              {PRODUCTIVITY_STEPS.map((s, i) => (
                <button key={s.heading} type="button" role="tab" className="chip" aria-selected={i === n} title={s.chart} onClick={() => setN(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button type="button" className="btn" disabled={n === 0} onClick={() => setN(n - 1)}>
              Anterior
            </button>
            <button type="button" className="btn" disabled={n === TOTAL - 1} onClick={() => setN(n + 1)}>
              Siguiente
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
