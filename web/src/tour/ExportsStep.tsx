import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildColumns } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { barsSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { MetricToggle } from '../ui/MetricToggle.js';
import { Segmented } from '../ui/Segmented.js';
import { YearSelector } from '../ui/YearSelector.js';
import { tokens } from '../styles/tokens.js';
import { TourChart } from './TourChart.js';
import { COMPLEX_LABELS, EXPORT_UNIT, EXPORT_YEARS, EXPORT_YEARS_WITH_DATA, complexOverYears, exportRows } from './exportsData.js';
import type { ExportMetric } from './exportsData.js';
import { EXPORTS_SOURCE } from './tourData.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const METRICS = [
  { value: 'usd', label: 'Dólares' },
  { value: 'share', label: '% del total' }
] as const;

const TITLE = 'Exportaciones por complejo';

/**
 * Step 4 of the Recorrido, "Exportaciones": the exports of goods by exporting complex (INDEC) in dollars or as a share of the total, for a year,
 * or one complex across the years. It replaces the old steps 4 (dollars) and 11 (shares). The years without data in the repository stay
 * visible and disabled.
 */
export function ExportsStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const [metric, setMetric] = useState<ExportMetric>('usd');
  const [year, setYear] = useState(2025);
  const [complex, setComplex] = useState('');

  const built = useMemo(() => {
    const unit = EXPORT_UNIT[metric];
    const rows = complex ? complexOverYears(complex, metric) : exportRows(year, metric);
    const highlight = complex ? String(year) : [...rows].sort((a, b) => b.value - a.value)[0]!.label;
    const what = complex ? `${complex}, por año` : `Exportaciones de bienes por complejo exportador en ${year}`;
    const summary = `${what} (INDEC), ${metric === 'usd' ? 'miles de millones de USD' : '% del total'}: ${rows.map((r) => `${r.label} ${formatValue(r.value, unit)}`).join(', ')}`;
    const { option } = buildColumns(rows.map((r) => r.label), [{ name: what, values: rows.map((r) => r.value), color: tokens.muted }], { unit, highlight, summary });
    return { option, summary, spec: barsSpec(rows, { title: what, unit, highlight, summary }) };
  }, [metric, year, complex]);

  return (
    <section className="gdp-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{TITLE}</h2>
          <p className="gdp-sub">
            {complex ? `${complex} en los años con datos` : `${year}`} · {metric === 'usd' ? 'miles de millones de USD' : 'porcentaje del total exportado'} · <span className="gdp-source">{EXPORTS_SOURCE}</span>
          </p>
        </Reveal>
        <div className="tour-controls">
          <MetricToggle label="Medida" options={METRICS} value={metric} onChange={setMetric} />
          <YearSelector label="Año" years={EXPORT_YEARS} available={EXPORT_YEARS_WITH_DATA} value={year} onChange={setYear} />
          <label className="export-complex">
            <span>Complejo </span>
            <select aria-label="Complejo" value={complex} onChange={(e) => setComplex(e.target.value)}>
              <option value="">Todos los complejos</option>
              {COMPLEX_LABELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
      <div className="tour-grid" data-count={1} data-layout="grid">
        <Reveal k={`${metric}-${year}-${complex}`} className="gdp-chart">
          <div className="tour-chart">
            <TourChart spec={built.spec}>
              <EChart option={built.option} aria-label={built.summary} />
            </TourChart>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
