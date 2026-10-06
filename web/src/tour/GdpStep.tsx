import React, { useMemo } from 'react';
import { buildGdp } from '../charts/builders/gdp.js';
import { EChart } from '../charts/EChart.js';
import { Chart2D3D } from '../charts3d/Chart2D3D.js';
import { useStore } from '../state/store.js';
import { Segmented } from '../ui/Segmented.js';
import { GDP_MOCK, gdpLinesSpec } from './gdpMock.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

/** Step 1 of the Recorrido: the GDP of Argentina, observed and projected, in 2D or in 3D. Made-up data, labelled as such. */
export function GdpStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const { option, summary } = useMemo(() => buildGdp(GDP_MOCK), []);
  const spec = useMemo(() => gdpLinesSpec(GDP_MOCK), []);

  return (
    <section className="gdp-step" aria-label="PBI de la Argentina">
      <header className="gdp-head">
        <div>
          <h2>PBI de la Argentina</h2>
          <p className="gdp-sub">
            {GDP_MOCK.unit}, 1990 a 2056 · <span className="gdp-mock">{GDP_MOCK.source}</span>
          </p>
        </div>
        <Segmented
          label="Vista"
          options={VIEWS}
          value={mode}
          onChange={(next) => {
            if (next !== mode) dispatch({ type: 'toggle3D' });
          }}
        />
      </header>
      <div className="gdp-chart">
        <Chart2D3D spec={spec}>
          <EChart option={option} aria-label={summary} />
        </Chart2D3D>
      </div>
    </section>
  );
}
