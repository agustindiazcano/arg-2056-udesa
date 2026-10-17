import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildColumns, buildShares } from '../charts/builders/tourCharts.js';
import { buildPie } from '../charts/builders/pie.js';
import { formatValue } from '../charts/format.js';
import { barsSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { MetricToggle } from '../ui/MetricToggle.js';
import { Segmented } from '../ui/Segmented.js';
import { EXPORTS_TITLE } from './slideTitles.js';
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

const FORMS = [
  { value: 'treemap', label: 'Treemap' },
  { value: 'pie', label: 'Torta' },
  { value: 'bars', label: 'Barras' }
] as const;

type Form = (typeof FORMS)[number]['value'];

const METRICS = [
  { value: 'usd', label: 'Dólares' },
  { value: 'share', label: '% del total' }
] as const;

const TITLE = EXPORTS_TITLE;

/**
 * Step 4 of the Recorrido, "Exportaciones": the exports of goods by exporting complex (INDEC) in dollars or as a share of the total, for a year,
 * or one complex across the years. It replaces the old steps 4 (dollars) and 11 (shares). The years without data in the repository stay
 * visible and disabled.
 */
export function ExportsStep({ embedded = false }: { embedded?: boolean } = {}) {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const [metric, setMetric] = useState<ExportMetric>('usd');
  const [year, setYear] = useState(2025);
  const [complex, setComplex] = useState('');
  const [form, setForm] = useState<Form>('treemap');

  const built = useMemo(() => {
    const unit = EXPORT_UNIT[metric];
    const rawRows = complex ? complexOverYears(complex, metric) : exportRows(year, metric);
    const rows = complex ? rawRows : [...rawRows].sort((a, b) => b.value - a.value);
    const highlight = complex ? String(year) : rows[0]!.label;
    const what = complex ? `${complex}, por año` : `Exportaciones de bienes por complejo exportador en ${year}`;
    const summary = `${what} (INDEC), ${metric === 'usd' ? 'miles de millones de USD' : '% del total'}: ${rawRows.map((r) => `${r.label} ${formatValue(r.value, unit)}`).join(', ')}`;
    const bars = buildColumns(rows.map((r) => r.label), [{ name: what, values: rows.map((r) => r.value), color: tokens.muted }], { unit, highlight, summary }).option;
    // one complex over the years is a series, not parts of a whole: it stays in bars
    const shape = complex ? 'bars' : form;
    const flat = shape === 'treemap' ? buildShares(rows, { unit, summary }).option : shape === 'pie' ? buildPie(rows, { unit, summary }).option : null;
    return { option: flat ?? bars, flat: flat !== null, summary, spec: barsSpec(rows, { title: what, unit, highlight, summary }) };
  }, [metric, year, complex, form]);
  const totals = useMemo(() => {
    const usd = exportRows(year, 'usd');
    const total = usd.reduce((sum, r) => sum + r.value, 0);
    const top = [...usd].sort((a, b) => b.value - a.value)[0]!;
    const fmt = (v: number, d = 1) => v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
    return [
      { label: `Exportaciones de bienes en ${year}`, value: fmt(total), unit: 'miles de millones de USD' },
      { label: 'Complejo más grande', value: top.label, unit: `${fmt(top.value)} mil millones de USD (${fmt((top.value / total) * 100)} % del total)` },
      { label: 'Complejos', value: String(usd.length), unit: 'con datos en el año' }
    ];
  }, [year]);

  return (
    <section className="gdp-step" aria-label={embedded ? `${TITLE}, por año y complejo` : TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          {embedded ? <h3 className="composition-title">{TITLE}</h3> : <h2>{TITLE}</h2>}
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
          <Segmented label="Gráfico" options={FORMS} value={form} onChange={setForm} />
          {(form === 'bars' || complex !== '') && (
            <Segmented
              label="Vista"
              options={VIEWS}
              value={mode}
              onChange={(next) => {
                if (next !== mode) dispatch({ type: 'toggle3D' });
              }}
            />
          )}
        </div>
      </header>
      <ul className="res-totals" aria-label="Totales de las exportaciones">
        {totals.map((t) => (
          <li key={t.label} className="res-total">
            <span className="tour-ind-label">{t.label}</span>
            <span className="tour-ind-value">{t.value}</span>
            <span className="tour-ind-unit">{t.unit}</span>
          </li>
        ))}
      </ul>
      <div className="tour-grid" data-count={1} data-layout="grid">
        <Reveal k={`${metric}-${year}-${complex}-${form}`} className="gdp-chart">
          <div className="tour-chart">
            {built.flat ? (
              <EChart option={built.option} aria-label={built.summary} />
            ) : (
              <TourChart spec={built.spec}>
                <EChart option={built.option} aria-label={built.summary} />
              </TourChart>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
