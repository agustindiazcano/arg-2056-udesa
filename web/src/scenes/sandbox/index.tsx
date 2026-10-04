import React, { useMemo, useState } from 'react';
import { buildDoublingCurve, DOUBLING_RATES } from '../../charts/builders/doublingCurve.js';
import { buildSandboxPath } from '../../charts/builders/sandboxPath.js';
import { DataTable } from '../../charts/DataTable.js';
import { EChart } from '../../charts/EChart.js';
import { formatValue } from '../../charts/format.js';
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

const NO_DATA = 'no data';
const PRESETS: Scenario[] = ['pessimistic', 'expected', 'optimistic'];

export default function Scene() {
  const aiState = useStore((s) => s.aiOverlay);
  const yearFloat = useStore((s) => s.yearFloat);
  const dispatch = useStore((s) => s.dispatch);
  const aiOverlay = aiState === 'on';

  const { status, data } = useDataset('forecast_output', parseForecastOutput);

  const [target, setTarget] = useState(2);
  const [pathAsTable, setPathAsTable] = useState(false);
  const [curveAsTable, setCurveAsTable] = useState(false);

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

  if (status === 'loading') return <div style={{ color: 'var(--ink)' }}>Loading...</div>;
  if (status === 'error' || !data) return <div style={{ color: 'var(--state-critical)' }}>Error loading data.</div>;

  const header = (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <h1 style={{ margin: 0 }}>Sandbox</h1>
      <p style={{ margin: 0, color: 'var(--ink-2)' }}>Change the growth assumptions and see what they imply</p>
      <p style={{ margin: 0, color: 'var(--ink-2)' }}>Illustrative arithmetic on your assumptions. It is not the forecasting model.</p>
    </div>
  );

  if (!base || !computed || !chart) {
    return (
      <div style={{ color: 'var(--ink)', padding: 'var(--space-md)' }}>
        {header}
        <div style={{ color: 'var(--state-warning)' }}>{baseResult?.reason ?? 'The starting point is not available.'}</div>
      </div>
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

  const pathTable = pathAsTable
    ? path.years.map((y, i) => {
        const lo = view.lower[i] ?? null;
        const hi = view.upper[i] ?? null;
        const cell = (v: number | null) => (v === null ? NO_DATA : formatValue(v, view.unit));
        return {
          year: y,
          visitor: cell(view.visitor[i] ?? null),
          lower: cell(lo),
          upper: cell(hi),
          expected: cell(view.expected[i] ?? null),
          position: positionVsRange(view.visitor[i] ?? null, lo, hi) ?? NO_DATA
        };
      })
    : null;

  const curveTable = DOUBLING_RATES.map((r) => ({
    rate: `${r}%`,
    exact: `${doublingYears(r)!.toFixed(1)} years`,
    approximate: `${rule70(r)!.toFixed(1)} years`
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        color: 'var(--ink)',
        padding: 'var(--space-md)',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      {header}

      <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: '1 0 auto' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', minWidth: '260px' }}>
          <Sliders state={state} aiEnabled={aiOverlay} onChange={(field, value) => update({ type: 'set', field, value })} />
          <button aria-pressed={aiOverlay} onClick={() => dispatch({ type: 'setAiOverlay', aiOverlay: aiOverlay ? 'off' : 'on' })}>
            AI overlay
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {PRESETS.map((scenario) => {
              const preset = scenarioPreset(data, { scenario, aiOverlay });
              return (
                <button
                  key={scenario}
                  disabled={preset === null}
                  onClick={() => preset && update({ type: 'applyPreset', preset })}
                >
                  {`Match ${scenario}`}
                </button>
              );
            })}
            <button onClick={() => update({ type: 'reset', initial })}>Reset</button>
          </div>
        </div>

        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span>GDP per capita: your assumptions and the model range</span>
            <button aria-pressed={pathAsTable} onClick={() => setPathAsTable(!pathAsTable)}>
              Table view
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '280px' }}>
            {pathTable ? (
              <DataTable
                caption="Your path and the model range"
                columns={[
                  { key: 'year', header: 'Year' },
                  { key: 'visitor', header: 'Your assumptions' },
                  { key: 'lower', header: 'Model low (p10)' },
                  { key: 'upper', header: 'Model high (p90)' },
                  { key: 'expected', header: 'Model expected (p50)' },
                  { key: 'position', header: 'Position' }
                ]}
                data={pathTable}
              />
            ) : (
              <EChart option={chart.option} aria-label={chart.summary} />
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span>Doubling time</span>
            <button aria-pressed={curveAsTable} onClick={() => setCurveAsTable(!curveAsTable)}>
              Table view
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '200px' }}>
            {curveAsTable ? (
              <DataTable
                caption="Doubling time by growth rate"
                columns={[
                  { key: 'rate', header: 'Growth rate' },
                  { key: 'exact', header: 'Exact' },
                  { key: 'approximate', header: 'Rule of 70' }
                ]}
                data={curveTable}
              />
            ) : (
              <EChart option={curve.option} aria-label={curve.summary} />
            )}
          </div>
          <div style={{ marginTop: 'var(--space-sm)', color: 'var(--ink-2)' }}>
            <div>Rule of 70: worked example at 7%</div>
            <div>{`7% for 10 years multiplies by ${compound(1, 7, 10).toFixed(2)} (exact)`}</div>
            <div>{`Rule of 70 says ${rule70(7)!.toFixed(1)} years, exact is ${doublingYears(7)!.toFixed(1)} years`}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-md)' }}>
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
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', fontSize: '12px', color: 'var(--ink-2)' }}>
        {`Reference range: ${data.source}, model ${data.model_version}, generated ${data.generated_at}`}
      </div>
    </div>
  );
}
