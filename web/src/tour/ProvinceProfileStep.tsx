import React, { useCallback, useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import type { ChartClickParams } from '../charts/EChart.js';
import { buildColumns } from '../charts/builders/tourCharts.js';
import { Reveal } from '../motion/Reveal.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { Spinner } from '../ui/Spinner.js';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { MapSearch } from '../ui/MapSearch.js';
import type { SearchResult } from '../ui/mapSearchLogic.js';
import { RefList } from '../ui/RefLink.js';
import { useCompact } from './compact.js';
import { PanelRail, panelAttrs } from './PanelRail.js';
import type { PanelItem } from './PanelRail.js';
import {
  PROFILE_METRICS,
  PROVINCE_PROFILES,
  formatProfileValue,
  getProfileMetric,
  rankProvincesByProfileMetric
} from './provinceProfileData.js';
import type { ProfileMetric } from './provinceProfileData.js';
import { SHORT, mapValuesOf } from './provinceMock.js';
import { TONE_COLORS, TONE_HEX, TONE_LABELS, hasSemaphore, semaphoreTones } from './provinceSemaphore.js';

export const PROFILE_TITLE = 'Perfil por provincia: indicadores socioeconómicos';

type ProfilePanel = 'chart' | 'map';

// on a short laptop screen the ranking and the map do not fit together: one is big and the other is a small button
const PROFILE_PANELS: ReadonlyArray<PanelItem<ProfilePanel>> = [
  { key: 'chart', title: 'Ranking', icon: 'bars' },
  { key: 'map', title: 'Mapa', icon: 'map' }
];

export function ProvinceProfileStep({ embedded = false }: { embedded?: boolean } = {}) {
  const provinces = useProvinces();
  const compact = useCompact();
  const [panel, setPanel] = useState<ProfilePanel>('chart');
  const [metric, setMetric] = useState<ProfileMetric>('pbg_usd_m');
  const [selected, setSelected] = useState<ProvinceId | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const activeMetricDef = useMemo(
    () => PROFILE_METRICS.find((m) => m.id === metric) ?? PROFILE_METRICS[0]!,
    [metric]
  );

  const rankedRows = useMemo(() => rankProvincesByProfileMetric(metric), [metric]);
  const tones = useMemo(() => semaphoreTones(metric), [metric]);
  const withSemaphore = hasSemaphore(metric);
  // the map is a traffic light too: each province in the colour of its third
  const provinceColors = useMemo(() => (withSemaphore ? Object.fromEntries([...tones].map(([id, t]) => [id, TONE_HEX[t]])) : undefined), [tones, withSemaphore]);
  // the tile of a metric of the selected province carries the colour of its place among the provinces
  const allTones = useMemo(() => new Map(PROFILE_METRICS.map((m) => [m.id, semaphoreTones(m.id)] as const)), []);

  const mapValues = useMemo(() => {
    return PROVINCES.map((p) => getProfileMetric(p.id, metric));
  }, [metric]);

  const selectedProfile = selected ? PROVINCE_PROFILES[selected] : null;
  const tileStyle = (m: ProfileMetric): React.CSSProperties => {
    const tone = selected ? allTones.get(m)?.get(selected) : undefined;
    return { padding: '8px 12px', ...(tone ? { borderLeft: `4px solid ${TONE_COLORS[tone]}` } : {}) };
  };
  const selectedShort = selected ? (SHORT[selected] ?? PROVINCES.find((p) => p.id === selected)?.name) : undefined;

  const selectProvince = useCallback((id: string | null) => {
    setSelected(id as ProvinceId | null);
    setSelectedDept(null);
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSelected(result.provinceId);
    if (result.type === 'departamento' || result.type === 'proyecto') {
      setSelectedDept(result.department ?? (result.type === 'departamento' ? result.name : null));
    } else {
      setSelectedDept(null);
    }
  }, []);

  const metricOptions = useMemo(
    () =>
      PROFILE_METRICS.map((m) => ({
        value: m.id,
        label: m.shortLabel
      })),
    []
  );

  const chartOption = useMemo(() => {
    const summary = `${activeMetricDef.label} por provincia: ${rankedRows.map((r) => `${r.short} ${formatProfileValue(metric, r.value)}`).join(', ')}`;
    const { option } = buildColumns(
      rankedRows.map((r) => r.short),
      [{ name: activeMetricDef.label, values: rankedRows.map((r) => r.value), color: tokens.categorical[0] ?? tokens.muted, ...(withSemaphore ? { colors: rankedRows.map((r) => TONE_HEX[tones.get(r.id) ?? 'mid']) } : {}) }],
      {
        unit: activeMetricDef.unit,
        highlight: selectedShort,
        summary,
        dense: { barWidth: 14, rotate: 55 }
      }
    );
    return { option, summary };
  }, [rankedRows, activeMetricDef, metric, selectedShort, tones, withSemaphore]);

  const onBarClick = (params: ChartClickParams) => {
    const row = rankedRows.find((r) => r.short === params.name);
    if (row) {
      setSelected((curr) => (curr === row.id ? null : row.id));
      setSelectedDept(null);
    }
  };

  return (
    <section className="gdp-step prov-step" aria-label={PROFILE_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          {embedded ? null : <h2>{PROFILE_TITLE}</h2>}
          <p className="gdp-sub">
            {activeMetricDef.sourceNote}
            {compact ? '; ' : <> · <RefList ids={[activeMetricDef.refId]} />; </>}seleccioná un indicador y tocá una provincia para ver su ficha
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented
            label="Indicador"
            options={metricOptions}
            value={metric}
            onChange={(v) => setMetric(v as ProfileMetric)}
          />
        </div>
      </header>

      {/* Profile KPI Cards */}
      <Reveal k={`kpi-${selected ?? 'nat'}`} delay={0.06}>
        <div className="profile-kpis">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>
              {selectedProfile
                ? `${selectedProfile.name}: ficha provincial`
                : 'Argentina: promedio y totales nacionales'}
            </strong>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setSelectedDept(null);
                }}
                className="btn"
              >
                ← Ver todo el país
              </button>
            )}
          </div>

          <div className="res-totals" role="list">
            {selectedProfile ? (
              <>
                <div role="listitem" className="res-total" style={tileStyle('pbg_usd_m')}>
                  <span className="tour-ind-label">PBI provincial</span>
                  <span className="tour-ind-value">{selectedProfile.pbg_usd_m.toLocaleString('es-AR')} M USD</span>
                  <span className="tour-ind-unit">{selectedProfile.pbg_share.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} % del país</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('gdp_per_capita_usd')}>
                  <span className="tour-ind-label">PBI per cápita</span>
                  <span className="tour-ind-value">{selectedProfile.gdp_per_capita_usd.toLocaleString('es-AR')} USD</span>
                  <span className="tour-ind-unit">anuales por habitante</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Coparticipación</span>
                  <span className="tour-ind-value">{selectedProfile.coparticipacion_share.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
                  <span className="tour-ind-unit">coeficiente ley 23.548</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('exports_usd_m')}>
                  <span className="tour-ind-label">Exportaciones</span>
                  <span className="tour-ind-value">{selectedProfile.exports_usd_m.toLocaleString('es-AR')} M USD</span>
                  <span className="tour-ind-unit">bienes anuales</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Población</span>
                  <span className="tour-ind-value">{selectedProfile.population.toLocaleString('es-AR')} hab.</span>
                  <span className="tour-ind-unit">Censo 2022</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('poverty_pct')}>
                  <span className="tour-ind-label">Pobreza</span>
                  <span className="tour-ind-value">{selectedProfile.poverty_pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
                  <span className="tour-ind-unit">personas bajo LP</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('unemployment_pct')}>
                  <span className="tour-ind-label">Desempleo</span>
                  <span className="tour-ind-value">{selectedProfile.unemployment_pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
                  <span className="tour-ind-unit">tasa desocupación</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('registered_jobs_k')}>
                  <span className="tour-ind-label">Empleo registrado</span>
                  <span className="tour-ind-value">{selectedProfile.registered_jobs_k.toLocaleString('es-AR')} mil</span>
                  <span className="tour-ind-unit">{selectedProfile.private_jobs_k}k privados · {selectedProfile.public_jobs_k}k públicos</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('hdi')}>
                  <span className="tour-ind-label">Desarrollo humano</span>
                  <span className="tour-ind-value">{selectedProfile.hdi.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                  <span className="tour-ind-unit">IDH provincial, PNUD</span>
                </div>
                <div role="listitem" className="res-total" style={tileStyle('security_rate')}>
                  <span className="tour-ind-label">Seguridad</span>
                  <span className="tour-ind-value">{selectedProfile.security_rate.toLocaleString('es-AR')}</span>
                  <span className="tour-ind-unit">delitos / 100k hab.</span>
                </div>
              </>
            ) : (
              <>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">PBI nacional</span>
                  <span className="tour-ind-value">600.000 M USD</span>
                  <span className="tour-ind-unit">total 24 provincias</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">PBI per cápita promedio</span>
                  <span className="tour-ind-value">13.032 USD</span>
                  <span className="tour-ind-unit">promedio nacional</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Exportaciones totales</span>
                  <span className="tour-ind-value">84.800 M USD</span>
                  <span className="tour-ind-unit">complejos provinciales</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Población total</span>
                  <span className="tour-ind-value">46.044.703 hab.</span>
                  <span className="tour-ind-unit">Censo 2022</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Pobreza nacional</span>
                  <span className="tour-ind-value">41,7 %</span>
                  <span className="tour-ind-unit">promedio aglomerados</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Desempleo nacional</span>
                  <span className="tour-ind-value">6,4 %</span>
                  <span className="tour-ind-unit">promedio EPH</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Empleo registrado</span>
                  <span className="tour-ind-value">8.880 mil</span>
                  <span className="tour-ind-unit">6.380k privados · 2.500k públicos</span>
                </div>
                <div role="listitem" className="res-total">
                  <span className="tour-ind-label">Seguridad</span>
                  <span className="tour-ind-value">2.750</span>
                  <span className="tour-ind-unit">delitos / 100k hab. promedio</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Reveal>

      <PanelRail compact={compact} items={PROFILE_PANELS} active={panel} onPick={setPanel} />
      <div className="res-grid" data-compact={compact || undefined}>
        {/* Left Side: Ranking and Accessible Table */}
        <div className="res-left res-left--single">
          <Reveal k={`chart-${metric}`} delay={0.1} className="gdp-chart" {...panelAttrs(compact, panel, 'chart')}>
            <div className="prov-card-head">
              <strong className="composition-title">
                {`${activeMetricDef.label} por provincia (${activeMetricDef.unit})`}
              </strong>
              <button
                type="button"
                onClick={() => setShowTable((t) => !t)}
                className="btn"
                aria-pressed={showTable}
              >
                {showTable ? 'Ver gráfico' : 'Ver tabla'}
              </button>
            </div>

            {withSemaphore && (
              <p className="semaphore-legend" aria-label="Colores del semáforo">
                {(['good', 'mid', 'bad'] as const).map((t) => (
                  <span key={t}>
                    <i style={{ background: TONE_COLORS[t] }} aria-hidden="true" /> {TONE_LABELS[t]}
                  </span>
                ))}
              </p>
            )}
            <div className="tour-chart">
              {showTable ? (
                <div className="prov-table-wrap">
                  <table className="prov-table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Provincia</th>
                        <th scope="col">{activeMetricDef.shortLabel}</th>
                        <th scope="col">PBI per cápita</th>
                        <th scope="col">Pobreza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedRows.map((r, idx) => {
                        const prof = PROVINCE_PROFILES[r.id];
                        return (
                          <tr key={r.id} data-selected={r.id === selected || undefined} onClick={() => setSelected((curr) => (curr === r.id ? null : r.id))}>
                            <td>{idx + 1}</td>
                            <th scope="row">
                              {withSemaphore && <i className="semaphore-dot" style={{ background: TONE_COLORS[tones.get(r.id) ?? 'mid'] }} role="img" aria-label={TONE_LABELS[tones.get(r.id) ?? 'mid']} />}
                              {r.name}
                            </th>
                            <td>{formatProfileValue(metric, r.value)}</td>
                            <td>{formatProfileValue('gdp_per_capita_usd', prof.gdp_per_capita_usd)}</td>
                            <td>{formatProfileValue('poverty_pct', prof.poverty_pct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EChart option={chartOption.option} onClick={onBarClick} />
              )}
            </div>
          </Reveal>
        </div>

        {/* Right Side: Province Map with Search */}
        <Reveal k={`map-${metric}`} delay={0.14} className="gdp-chart prov-map res-map" {...panelAttrs(compact, panel, 'map')}>
          <strong
            className="composition-title"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <span>{`${activeMetricDef.label}: mapa provincial`}</span>
            <MapSearch onSelect={handleSearchSelect} />
          </strong>

          <div className="tour-chart">
            {provinces.status === 'loading' && <Spinner label="Cargando el mapa de las provincias..." />}
            {provinces.status === 'error' && (
              <p style={{ color: 'var(--state-warning)' }}>
                {`La geometría de las provincias no está disponible: ${provinces.message}`}
              </p>
            )}
            {provinces.status === 'success' && (
              <ProvinceMap
                geo={provinces.geo}
                values={mapValuesOf(mapValues)}
                unit={activeMetricDef.unit}
                indicatorLabel={activeMetricDef.label}
                year={2024}
                observed
                metric="level"
                selectedId={selected}
                selectedDepartment={selectedDept}
                onSelectDepartment={setSelectedDept}
                provinceColors={provinceColors}
                onSelect={selectProvince}
                zoomToSelected
                compact
                hideTitle
              />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
