import React, { useCallback, useMemo, useState } from 'react';
import { formatValue } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { Segmented } from '../ui/Segmented.js';
import { Spinner } from '../ui/Spinner.js';
import { mapValuesOf } from './provinceMock.js';
import { rigiByProvince, rigiProjectsOf, rigiTotals } from './rigiByProvince.js';
import type { RigiFilter } from './rigiByProvince.js';

const METRICS = [
  { value: 'investment', label: 'Inversión' },
  { value: 'count', label: 'Proyectos' }
] as const;

const FILTERS: ReadonlyArray<{ value: RigiFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'en evaluación', label: 'En evaluación' }
];

type Metric = (typeof METRICS)[number]['value'];

const UNIT: Record<Metric, string> = { investment: 'millones de USD', count: 'proyectos' };
const REFS = ['R1', 'R14'] as const;

/**
 * The map of the RIGI: each province coloured by the investment (or the number) of the projects of the list in it, with a filter by status. Touching a
 * province lists its projects. A project that crosses provinces counts in each one, and its investment is split equally among them.
 */
export function RigiMapStep() {
  const provinces = useProvinces();
  const [metric, setMetric] = useState<Metric>('investment');
  const [filter, setFilter] = useState<RigiFilter>('todos');
  const [selected, setSelected] = useState<ProvinceId | null>(null);

  const rows = useMemo(() => rigiByProvince(filter), [filter]);
  const values = useMemo(() => {
    const byId = new Map(rows.map((r) => [r.id, r] as const));
    return mapValuesOf(PROVINCES.map((p) => byId.get(p.id)?.[metric] ?? 0));
  }, [rows, metric]);
  const projects = useMemo(() => (selected ? rigiProjectsOf(selected, filter) : []), [selected, filter]);
  const selectedName = PROVINCES.find((p) => p.id === selected)?.name;
  const totals = useMemo(() => rigiTotals(), []);
  const select = useCallback((id: string | null) => setSelected((cur) => (id === null || id === cur ? null : (id as ProvinceId))), []);

  const ranking = useMemo(() => [...rows].sort((a, b) => b[metric] - a[metric]), [rows, metric]);
  const nameOf = (id: ProvinceId): string => PROVINCES.find((p) => p.id === id)?.name ?? id;

  const tiles: Array<[string, string, string]> = [
    ['Inversión aprobada', totals.approvedInvestment.toLocaleString('es-AR'), 'millones de USD'],
    ['Proyectos aprobados', String(totals.approved), 'del régimen'],
    ['En evaluación', String(totals.evaluating), 'proyectos'],
    ['Provincias con proyectos', String(totals.provinces), 'de 24']
  ];

  return (
    <>
      <div className="rigi-toolbar">
        <p className="gdp-sub">
          Proyectos de minería y de petróleo y gas del RIGI · <RefList ids={REFS} />
        </p>
        <ChartHelp
          title="Mapa del RIGI"
          lead="Millones de USD o cantidad de proyectos por provincia"
          paragraphs={[
            'Cada provincia se pinta según la inversión (o la cantidad) de los proyectos del Régimen de Incentivo para Grandes Inversiones que figuran en la lista, aprobados o en evaluación.',
            'Un proyecto que cruza provincias cuenta en cada una y su inversión se reparte en partes iguales entre ellas.'
          ]}
          how="Elegí inversión o proyectos y filtrá por estado. Tocá una provincia para ver sus proyectos."
          refs={[...REFS]}
        />
        <Segmented label="Medida" options={METRICS} value={metric} onChange={setMetric} />
        <Segmented label="Estado" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <ul className="res-totals" aria-label="Totales del RIGI">
        {tiles.map(([label, value, unit]) => (
          <li key={label} className="res-total">
            <span className="tour-ind-label">{label}</span>
            <span className="tour-ind-value">{value}</span>
            <span className="tour-ind-unit">{unit}</span>
          </li>
        ))}
      </ul>

      <div className="res-grid">
        <div className="res-left">
          <Reveal k={`rigi-rank-${metric}-${filter}`} className="gdp-chart">
            <strong className="composition-title">{`Provincias por ${metric === 'investment' ? 'inversión' : 'cantidad de proyectos'} (${UNIT[metric]})`}</strong>
            <ol className="prov-rank-list">
              {ranking.map((r, i) => (
                <li key={r.id}>
                  <button type="button" className="prov-row" aria-pressed={selected === r.id} onClick={() => select(r.id)}>
                    <span className="prov-pos">{i + 1}</span>
                    <span className="prov-name">{nameOf(r.id)}</span>
                    <span className="prov-value">{metric === 'investment' ? formatValue(Math.round(r.investment), 'M USD') : r.count}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>
          {selected && (
            <Reveal k={`rigi-projects-${selected}-${filter}`} delay={0.07} className="gdp-chart" role="region" aria-label={`Proyectos del RIGI en ${selectedName}`}>
              <strong className="composition-title">
                <span>{`${selectedName}: ${projects.length} ${projects.length === 1 ? 'proyecto' : 'proyectos'}`}</span>
                <button type="button" className="btn" onClick={() => setSelected(null)}>
                  Todo el país
                </button>
              </strong>
              <ul className="rigi-projects">
                {projects.map((p) => (
                  <li key={p.name}>
                    <div>
                      <strong>{p.name}</strong> <span className="rigi-status">{p.status}</span>
                    </div>
                    <div className="draft-muted">
                      {p.company} · {p.kind}
                    </div>
                    {p.investment !== null && <div className="draft-muted">Inversión: {p.investment.toLocaleString('es-AR')} millones de USD</div>}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <Reveal k={`rigi-map-${metric}-${filter}`} delay={0.14} className="gdp-chart prov-map res-map">
          <strong className="composition-title">{`RIGI por provincia: ${metric === 'investment' ? 'inversión' : 'proyectos'}`}</strong>
          <div className="tour-chart">
            {provinces.status === 'loading' && <Spinner label="Cargando el mapa de las provincias..." />}
            {provinces.status === 'error' && <p style={{ color: 'var(--state-warning)' }}>{`La geometría de las provincias no está disponible: ${provinces.message}`}</p>}
            {provinces.status === 'success' && (
              <ProvinceMap
                geo={provinces.geo}
                values={values}
                unit={UNIT[metric]}
                indicatorLabel={`RIGI, ${metric === 'investment' ? 'inversión' : 'proyectos'}`}
                metric="level"
                selectedId={selected}
                year={2025}
                observed
                hideTitle
                zoomToSelected
                onSelect={select}
              />
            )}
          </div>
        </Reveal>
      </div>
    </>
  );
}
