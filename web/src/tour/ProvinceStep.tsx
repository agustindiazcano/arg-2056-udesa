import React, { useCallback, useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import type { ChartClickParams } from '../charts/EChart.js';
import { buildColumns } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { TourChart } from './TourChart.js';
import { barsSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { mapSummary } from '../scenes/forecast/mapSelectors.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { Spinner } from '../ui/Spinner.js';
import type { Map3DSpec } from '../charts3d/types.js';
import type { ProvinceId } from '../types/province.js';
import { MOCK_SOURCE } from './tourData.js';
import { PRODUCTION_UNIT, SECTOR_LABELS, SECTOR_VALUES, mapValuesOf, rankedProvinces } from './provinceMock.js';
import type { Sector } from './provinceMock.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const SECTORS = (Object.keys(SECTOR_LABELS) as Sector[]).map((value) => ({ value, label: SECTOR_LABELS[value] }));

const TITLE = 'Producción por provincia';

/**
 * Step 2 of the Recorrido: a big upright map of the provinces on the left; on the right the ranking of production by province
 * (Minería, Agro or Hidrocarburos) and under it a chart of bars with what each province produces. A click on a province, in the
 * map, in the ranking or in the bars, selects it, and the map zooms to it. Made-up values.
 */
export function ProvinceStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const provinces = useProvinces();
  const [sector, setSector] = useState<Sector>('mineria');
  const [selected, setSelected] = useState<ProvinceId | null>(null);

  const rows = useMemo(() => rankedProvinces(SECTOR_VALUES[sector]), [sector]);
  const values = useMemo(() => mapValuesOf(SECTOR_VALUES[sector]), [sector]);
  const selectedShort = rows.find((r) => r.id === selected)?.short;
  const sectorLabel = SECTOR_LABELS[sector];

  const bars = useMemo(() => {
    const summary = `Producción de ${sectorLabel.toLowerCase()} por provincia (datos de prueba), de mayor a menor: ${rows.map((r) => `${r.short} ${formatValue(r.value, PRODUCTION_UNIT)}`).join(', ')}`;
    const { option } = buildColumns(rows.map((r) => r.short), [{ name: sectorLabel, values: rows.map((r) => r.value), color: tokens.muted }], {
      unit: PRODUCTION_UNIT,
      highlight: selectedShort,
      summary,
      dense: { barWidth: 14, rotate: 55 }
    });
    const spec = barsSpec(rows.map((r) => ({ label: r.short, value: r.value })), { title: `Producción de ${sectorLabel.toLowerCase()} por provincia`, unit: PRODUCTION_UNIT, highlight: selectedShort ?? null, summary });
    return { option, summary, spec };
  }, [rows, sectorLabel, selectedShort]);

  const select = (id: ProvinceId | null) => setSelected((current) => (id === current ? null : id));
  const formatProduction = useCallback((v: number) => formatValue(v, PRODUCTION_UNIT), []);
  const pickProvince = useCallback((id: string | null) => setSelected(id as ProvinceId | null), []);
  // one spec while nothing it draws changes: a new one rebuilds the 3D map (and it would blink)
  const mapSpec = useMemo<Map3DSpec | null>(
    () =>
      provinces.status !== 'success'
        ? null
        : {
            kind: 'map',
            title: `${TITLE}: ${sectorLabel}`,
            geo: provinces.geo,
            values,
            metric: 'level',
            selectedId: selected,
            formatValue: formatProduction,
            onSelect: pickProvince,
            upright: true,
            zoomToSelected: true,
            summary: mapSummary(values, 'level', `producción de ${sectorLabel.toLowerCase()} (datos de prueba)`, 2025, PRODUCTION_UNIT)
          },
    [provinces, values, selected, sectorLabel, formatProduction, pickProvince]
  );
  const onBarClick = (params: ChartClickParams) => {
    const row = rows.find((r) => r.short === params.name);
    if (row) select(row.id);
  };

  return (
    <section className="gdp-step prov-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{TITLE}</h2>
          <p className="gdp-sub">
            {PRODUCTION_UNIT} por año; elegí un sector y tocá una provincia · <span className="gdp-mock">{MOCK_SOURCE}</span>
          </p>
        </Reveal>
        <div className="tour-controls">
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
        <Reveal k="map" className="gdp-chart prov-map">
          <div className="tour-chart">
            {provinces.status === 'loading' && <Spinner label="Cargando el mapa de las provincias..." />}
            {provinces.status === 'error' && <p style={{ color: 'var(--state-warning)' }}>{`La geometría de las provincias no está disponible: ${provinces.message}`}</p>}
            {provinces.status === 'success' && (
              <TourChart spec={mapSpec ?? undefined}>
                <ProvinceMap
                  geo={provinces.geo}
                  values={values}
                  unit={PRODUCTION_UNIT}
                  indicatorLabel={`producción de ${sectorLabel.toLowerCase()}`}
                  metric="level"
                  selectedId={selected}
                  year={2025}
                  observed
                  hideTitle
                  zoomToSelected
                  onSelect={setSelected}
                />
              </TourChart>
            )}
          </div>
        </Reveal>

        <div className="prov-side">
          <Reveal k="rank" delay={0.07} className="gdp-chart prov-rank" aria-label="Ranking de producción por provincia" role="region">
            <div className="prov-rank-head">
              <strong>Ranking de producción por provincia</strong>
              <Segmented label="Sector" options={SECTORS} value={sector} onChange={setSector} />
            </div>
            <ol className="prov-rank-list">
              {rows.map((r, i) => (
                <li key={r.id}>
                  <button type="button" className="prov-row" aria-pressed={selected === r.id} onClick={() => select(r.id)}>
                    <span className="prov-pos">{i + 1}</span>
                    <span className="prov-name">{r.short}</span>
                    <span className="prov-value">{formatValue(r.value, PRODUCTION_UNIT)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal k="bars" delay={0.14} className="gdp-chart prov-bars" role="region" aria-label="Producción por provincia en barras">
            <div className="tour-caption">
              <strong>{`Producción de ${sectorLabel.toLowerCase()} por provincia`}</strong>
            </div>
            <div className="tour-chart">
              <TourChart spec={bars.spec}>
                <EChart option={bars.option} aria-label={bars.summary} onClick={onBarClick} />
              </TourChart>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
