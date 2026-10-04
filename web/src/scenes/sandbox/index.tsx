import React, { useMemo, useState } from 'react';
import { buildDoublingCurve, DOUBLING_RATES } from '../../charts/builders/doublingCurve.js';
import { buildSandboxPath } from '../../charts/builders/sandboxPath.js';
import { DataTable } from '../../charts/DataTable.js';
import { EChart } from '../../charts/EChart.js';
import { formatDecimal, formatNumber, formatValue } from '../../charts/format.js';
import { positionLabel, scenarioLabel } from '../../content/labels.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import type { DashView } from '../../dashboard/types.js';
import { ChartPanel } from '../../ui/ChartPanel.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { useDataset } from '../../data/useDataset.js';
import { useStore } from '../../state/store.js';
import { parseForecastOutput, selectSeries } from '../../types/index.js';
import type { Scenario } from '../../types/index.js';
import { clampYear } from '../forecast/selectors.js';
import { compound, doublingYears, effectiveGpcPct, rule70 } from './arithmetic.js';
import { Sliders } from './Sliders.js';
import { StatTiles } from './StatTiles.js';
import {
  basePoint,
  modelEnvelope,
  pathView,
  positionVsRange,
  scenarioPreset,
  userPath
} from './selectors.js';
import { sandboxReducer, ZERO_STATE } from './state.js';
import type { SandboxAction, SandboxState } from './state.js';

const NO_DATA = 'sin datos';
const PRESETS: Scenario[] = ['pessimistic', 'expected', 'optimistic'];

export default function Scene() {
  const aiState = useStore((s) => s.aiOverlay);
  const yearFloat = useStore((s) => s.yearFloat);
  const aiOverlay = aiState === 'on';

  const { status, data } = useDataset('forecast_output', parseForecastOutput);

  const [target, setTarget] = useState(2);

  // The initial state is the expected preset (without the AI overlay), known as soon as the forecast is loaded, so
  // the sliders never flash zeros. What the visitor changes is kept on top of it.
  const initial = useMemo<SandboxState>(() => {
    const preset = data ? scenarioPreset(data, { scenario: 'expected', aiOverlay: false }) : null;
    return preset ? sandboxReducer(ZERO_STATE, { type: 'applyPreset', preset }) : ZERO_STATE; // rounded to the step
  }, [data]);
  const [changed, setChanged] = useState<SandboxState | null>(null);
  const state = changed ?? initial;
  const update = (action: SandboxAction) => setChanged(sandboxReducer(state, action));

  const baseResult = useMemo(() => (data ? basePoint(data, { scenario: 'expected' }) : null), [data]);
  const base = baseResult?.base ?? null;

  // the AI uplift only counts while the overlay is on
  const aiUsed = aiOverlay ? state.aiPp : 0;
  const effectivePct = effectiveGpcPct(state.gpcPct, aiUsed);

  const computed = useMemo(() => {
    if (!data || !base) return null;
    const path = userPath({ base, years: data.horizon.end_year - base.year, gpcPct: state.gpcPct, popPct: state.popPct, aiPp: aiUsed });
    const envelope = modelEnvelope(data, { aiOverlay });
    return { path, view: pathView(path, envelope) };
  }, [data, base, state.gpcPct, state.popPct, aiUsed, aiOverlay]);

  const year = computed ? clampYear(yearFloat, computed.path.years.map((y) => ({ year: y }))) : Math.floor(yearFloat);
  const chart = useMemo(
    () => (computed ? buildSandboxPath(computed.view, { year, effectivePct }) : null),
    [computed, year, effectivePct]
  );
  const curve = useMemo(() => buildDoublingCurve({ ratePct: effectivePct }), [effectivePct]);

  if (status === 'loading') return <SceneLoading />;
  if (status === 'error' || !data) return <SceneError />;

  const common = {
    title: 'Simulador',
    subtitle: 'Cambiar los supuestos de crecimiento y ver qué implican',
    sources: [data.source, `modelo ${data.model_version}`],
    retrievedAt: data.generated_at.slice(0, 10),
    dateLabel: 'generado el',
    notes: <p className="scope-note">Aritmética ilustrativa sobre los supuestos elegidos. No es el modelo de pronóstico.</p>
  };

  if (!base || !computed || !chart) {
    return (
      <Dashboard
        {...common}
        views={[
          {
            id: 'no-base',
            name: 'Sin punto de partida',
            thumb: { kind: 'line' },
            content: <div style={{ color: 'var(--state-warning)' }}>{baseResult?.reason ?? 'No se dispone del punto de partida.'}</div>
          }
        ]}
      />
    );
  }

  const { path, view } = computed;
  const last = path.years.length - 1;
  const firstYear = path.years[0]!;
  const lastYear = path.years[last]!;
  const gpcFirst = path.gpc[0]!;
  const gdpFirst = path.gdp[0]!;
  const popUnit = selectSeries(data, { indicator: 'population', geo: 'AR', scenario: 'expected', aiOverlay: 'off' })?.unit ?? '';
  const position = positionVsRange(path.gpc[last]!, view.lower[last] ?? null, view.upper[last] ?? null);

  const pathTable = path.years.map((y, i) => {
    const lo = view.lower[i] ?? null;
    const hi = view.upper[i] ?? null;
    const cell = (v: number | null) => (v === null ? NO_DATA : formatValue(v, view.unit));
    const at = positionVsRange(view.visitor[i] ?? null, lo, hi);
    return {
      year: y,
      visitor: cell(view.visitor[i] ?? null),
      lower: cell(lo),
      upper: cell(hi),
      expected: cell(view.expected[i] ?? null),
      position: at === null ? NO_DATA : positionLabel(at)
    };
  });

  const curveTable = DOUBLING_RATES.map((r) => ({
    rate: `${formatDecimal(r)}%`,
    exact: `${formatNumber(doublingYears(r)!, 1)} años`,
    approximate: `${formatNumber(rule70(r)!, 1)} años`
  }));

  const views: DashView[] = [
    {
      id: 'path',
      name: 'Trayectoria',
      thumb: { kind: 'fan', values: view.visitor.map((v) => v ?? 0) },
      content: (
        <ChartPanel
          title="PIB per cápita: supuestos elegidos y rango del modelo"
          chart={<EChart option={chart.option} aria-label={chart.summary} />}
          table={
            <DataTable
              caption="Trayectoria con los supuestos y el rango del modelo"
              columns={[
                { key: 'year', header: 'Año' },
                { key: 'visitor', header: 'Supuestos elegidos' },
                { key: 'lower', header: 'Modelo, piso (p10)' },
                { key: 'upper', header: 'Modelo, techo (p90)' },
                { key: 'expected', header: 'Modelo, esperado (p50)' },
                { key: 'position', header: 'Posición' }
              ]}
              data={pathTable}
              pageSize="fit"
            />
          }
        />
      )
    },
    {
      id: 'doubling',
      name: 'Duplicación',
      thumb: { kind: 'line', values: DOUBLING_RATES.map((r) => doublingYears(r) ?? 0) },
      content: (
        <ChartPanel
          title="Tiempo de duplicación"
          chart={
            <div className="doubling-view">
              <div className="doubling-chart">
                <EChart option={curve.option} aria-label={curve.summary} />
              </div>
              <div className="doubling-example">
                <div>Regla del 70: ejemplo con 7%</div>
                <div>{`7% durante 10 años multiplica por ${formatNumber(compound(1, 7, 10), 2)} (exacto)`}</div>
                <div>{`La regla del 70 dice ${formatNumber(rule70(7)!, 1)} años; lo exacto es ${formatNumber(doublingYears(7)!, 1)} años`}</div>
              </div>
            </div>
          }
          table={
            <DataTable
              caption="Tiempo de duplicación según la tasa de crecimiento"
              columns={[
                { key: 'rate', header: 'Tasa de crecimiento' },
                { key: 'exact', header: 'Exacto' },
                { key: 'approximate', header: 'Regla del 70' }
              ]}
              data={curveTable}
              pageSize="fit"
            />
          }
        />
      )
    }
  ];

  return (
    <Dashboard
      {...common}
      legend={[
        { label: 'Supuestos elegidos', tone: 'ink' },
        { label: 'Rango del modelo', tone: 'blue' }
      ]}
      rail={
        <div className="preset-list">
          {PRESETS.map((scenario) => {
            const preset = scenarioPreset(data, { scenario, aiOverlay });
            return (
              <button
                key={scenario}
                type="button"
                className="btn"
                disabled={preset === null}
                onClick={() => preset && update({ type: 'applyPreset', preset })}
              >
                {`Igualar ${scenarioLabel(scenario).toLowerCase()}`}
              </button>
            );
          })}
          <button type="button" className="btn" onClick={() => update({ type: 'reset', initial })}>
            Restablecer
          </button>
        </div>
      }
      tiles={
        <StatTiles
          firstYear={firstYear}
          lastYear={lastYear}
          gpcMultiple={gpcFirst > 0 ? path.gpc[last]! / gpcFirst : null}
          popLast={path.pop[last] ?? null}
          popUnit={popUnit}
          gdpMultiple={gdpFirst > 0 ? path.gdp[last]! / gdpFirst : null}
          effectivePct={effectivePct}
          position={position}
          target={target}
          onTargetChange={setTarget}
        />
      }
      side={
        <section aria-label="Supuestos" className="dash-sliders">
          <h2 className="panel-title">Supuestos</h2>
          <Sliders state={state} aiEnabled={aiOverlay} onChange={(field, value) => update({ type: 'set', field, value })} />
        </section>
      }
      views={views}
    />
  );
}
