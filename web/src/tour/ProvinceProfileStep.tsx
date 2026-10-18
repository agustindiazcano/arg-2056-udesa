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
import {
  PROFILE_METRICS,
  PROVINCE_PROFILES,
  formatProfileValue,
  getProfileMetric,
  rankProvincesByProfileMetric
} from './provinceProfileData.js';
import type { ProfileMetric } from './provinceProfileData.js';
import { SHORT, mapValuesOf } from './provinceMock.js';

export const PROFILE_TITLE = 'Perfil por provincia: indicadores socioeconómicos';

export function ProvinceProfileStep({ embedded = false }: { embedded?: boolean } = {}) {
  const provinces = useProvinces();
  const [metric, setMetric] = useState<ProfileMetric>('pbg_usd_m');
  const [selected, setSelected] = useState<ProvinceId | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const activeMetricDef = useMemo(
    () => PROFILE_METRICS.find((m) => m.id === metric) ?? PROFILE_METRICS[0]!,
    [metric]
  );

  const rankedRows = useMemo(() => rankProvincesByProfileMetric(metric), [metric]);

  const mapValues = useMemo(() => {
    return PROVINCES.map((p) => getProfileMetric(p.id, metric));
  }, [metric]);

  const selectedProfile = selected ? PROVINCE_PROFILES[selected] : null;
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
      [{ name: activeMetricDef.label, values: rankedRows.map((r) => r.value), color: tokens.categorical[0] ?? tokens.muted }],
      {
        unit: activeMetricDef.unit,
        highlight: selectedShort,
        summary,
        dense: { barWidth: 14, rotate: 55 }
      }
    );
    return { option, summary };
  }, [rankedRows, activeMetricDef, metric, selectedShort]);

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
          {embedded ? <h3 className="composition-title">{PROFILE_TITLE}</h3> : <h2>{PROFILE_TITLE}</h2>}
          <p className="gdp-sub">
            {activeMetricDef.sourceNote} · <RefList ids={[activeMetricDef.refId]} />; seleccioná un indicador y tocá una provincia para ver su ficha
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
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
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
                className="seg"
                style={{ fontSize: '0.8rem', padding: '3px 10px' }}
              >
                ← Ver todo el país
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px'
            }}
          >
            {selectedProfile ? (
              <>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">PBI provincial</span>
                  <span className="tour-ind-value">{selectedProfile.pbg_usd_m.toLocaleString('es-AR')} M USD</span>
                  <span className="tour-ind-unit">{selectedProfile.pbg_share.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} % del país</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">PBI per cápita</span>
                  <span className="tour-ind-value">{selectedProfile.gdp_per_capita_usd.toLocaleString('es-AR')} USD</span>
                  <span className="tour-ind-unit">anuales por habitante</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Coparticipación</span>
                  <span className="tour-ind-value">{selectedProfile.coparticipacion_share.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
                  <span className="tour-ind-unit">coeficiente ley 23.548</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Exportaciones</span>
                  <span className="tour-ind-value">{selectedProfile.exports_usd_m.toLocaleString('es-AR')} M USD</span>
                  <span className="tour-ind-unit">bienes anuales</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Población</span>
                  <span className="tour-ind-value">{selectedProfile.population.toLocaleString('es-AR')} hab.</span>
                  <span className="tour-ind-unit">Censo 2022</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Pobreza</span>
                  <span className="tour-ind-value">{selectedProfile.poverty_pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
                  <span className="tour-ind-unit">personas bajo LP</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Desempleo</span>
                  <span className="tour-ind-value">{selectedProfile.unemployment_pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
                  <span className="tour-ind-unit">tasa desocupación</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Empleo registrado</span>
                  <span className="tour-ind-value">{selectedProfile.registered_jobs_k.toLocaleString('es-AR')} mil</span>
                  <span className="tour-ind-unit">{selectedProfile.private_jobs_k}k privados · {selectedProfile.public_jobs_k}k públicos</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Seguridad</span>
                  <span className="tour-ind-value">{selectedProfile.security_rate.toLocaleString('es-AR')}</span>
                  <span className="tour-ind-unit">delitos / 100k hab.</span>
                </div>
              </>
            ) : (
              <>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">PBI nacional</span>
                  <span className="tour-ind-value">600.000 M USD</span>
                  <span className="tour-ind-unit">total 24 provincias</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">PBI per cápita promedio</span>
                  <span className="tour-ind-value">13.032 USD</span>
                  <span className="tour-ind-unit">promedio nacional</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Exportaciones totales</span>
                  <span className="tour-ind-value">84.800 M USD</span>
                  <span className="tour-ind-unit">complejos provinciales</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Población total</span>
                  <span className="tour-ind-value">46.044.703 hab.</span>
                  <span className="tour-ind-unit">Censo 2022</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Pobreza nacional</span>
                  <span className="tour-ind-value">41,7 %</span>
                  <span className="tour-ind-unit">promedio aglomerados</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Desempleo nacional</span>
                  <span className="tour-ind-value">6,4 %</span>
                  <span className="tour-ind-unit">promedio EPH</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Empleo registrado</span>
                  <span className="tour-ind-value">8.880 mil</span>
                  <span className="tour-ind-unit">6.380k privados · 2.500k públicos</span>
                </div>
                <div className="res-total" style={{ padding: '8px 12px' }}>
                  <span className="tour-ind-label">Seguridad</span>
                  <span className="tour-ind-value">2.750</span>
                  <span className="tour-ind-unit">delitos / 100k hab. promedio</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Reveal>

      <div className="res-grid">
        {/* Left Side: Ranking and Accessible Table */}
        <div className="res-left">
          <Reveal k={`chart-${metric}`} delay={0.1} className="gdp-chart">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong className="composition-title">
                {`${activeMetricDef.label} por provincia (${activeMetricDef.unit})`}
              </strong>
              <button
                type="button"
                onClick={() => setShowTable((t) => !t)}
                className="seg"
                style={{ fontSize: '0.8rem', padding: '2px 8px' }}
              >
                {showTable ? 'Ver gráfico' : 'Ver tabla'}
              </button>
            </div>

            <div className="tour-chart" style={{ minHeight: '340px' }}>
              {showTable ? (
                <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.85rem',
                      color: 'var(--ink)'
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', textAlign: 'left' }}>
                        <th style={{ padding: '6px' }}>#</th>
                        <th style={{ padding: '6px' }}>Provincia</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>{activeMetricDef.shortLabel}</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>PBI per cápita</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Pobreza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedRows.map((r, idx) => {
                        const prof = PROVINCE_PROFILES[r.id];
                        const isSelected = r.id === selected;
                        return (
                          <tr
                            key={r.id}
                            onClick={() => setSelected((curr) => (curr === r.id ? null : r.id))}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '6px', color: 'var(--ink-muted)' }}>{idx + 1}</td>
                            <td style={{ padding: '6px', fontWeight: isSelected ? 700 : 400 }}>{r.name}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{formatProfileValue(metric, r.value)}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{formatProfileValue('gdp_per_capita_usd', prof.gdp_per_capita_usd)}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{formatProfileValue('poverty_pct', prof.poverty_pct)}</td>
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
        <Reveal k={`map-${metric}`} delay={0.14} className="gdp-chart prov-map res-map">
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
