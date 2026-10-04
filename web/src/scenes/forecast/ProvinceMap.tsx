import React, { useEffect, useMemo, useState } from 'react';
import { registerMap } from '../../charts/echarts.js';
import { MAP_NAME, buildProvinceMap } from '../../charts/builders/provinceMap.js';
import { DataTable } from '../../charts/DataTable.js';
import { EChart } from '../../charts/EChart.js';
import type { ChartClickParams } from '../../charts/EChart.js';
import { formatPercent, formatValue } from '../../charts/format.js';
import { TableToggle } from '../../ui/TableToggle.js';
import { geoWithMalvinas } from '../../geo/malvinas.js';
import { loadProvinces } from '../../geo/provinces.js';
import type { ProvincesGeo } from '../../geo/provinces.js';
import type { GeoMeta } from '../../geo/meta.js';
import { isProvinceId } from '../../types/province.js';
import type { ProvinceId } from '../../types/province.js';
import type { Scenario } from '../../types/scenario.js';
import { smallestProvinces } from './mapSelectors.js';
import type { MapMetric, MapValues } from './mapSelectors.js';

export type ProvincesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; geo: ProvincesGeo; meta: GeoMeta };

let registeredGeo: ProvincesGeo | null = null;

/** Registers the map with echarts once per loaded geometry (the provinces plus the illustrative Malvinas). */
function registerGeo(geo: ProvincesGeo): void {
  if (registeredGeo === geo) return;
  registerMap(MAP_NAME, geoWithMalvinas(geo));
  registeredGeo = geo;
}

/** Loads and validates the province geometry. A failure becomes a visible state, never an unhandled error. */
export function useProvinces(baseUrl = '/geo'): ProvincesState {
  const [state, setState] = useState<ProvincesState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    loadProvinces(baseUrl)
      .then(({ geo, meta }) => {
        if (!active) return;
        registerGeo(geo);
        setState({ status: 'success', geo, meta });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      active = false;
    };
  }, [baseUrl]);

  return state;
}

interface ProvinceMapProps {
  geo: ProvincesGeo;
  values: MapValues;
  unit: string;
  indicatorLabel: string;
  metric: MapMetric;
  selectedId: ProvinceId | null;
  scenario?: Scenario;
  year: number;
  /** Observed data: no p10-p90 range and no scenario in the tooltip and the table. */
  observed?: boolean;
  /** Without the heading: the dashboard panel already has the title. */
  hideTitle?: boolean;
  onSelect: (id: ProvinceId | null) => void;
}

const NO_DATA_TEXT = 'sin datos';

export function ProvinceMap({
  geo,
  values,
  unit,
  indicatorLabel,
  metric,
  selectedId,
  scenario,
  year,
  observed = false,
  hideTitle = false,
  onSelect
}: ProvinceMapProps) {
  const [asTable, setAsTable] = useState(false);

  const centroids = useMemo(
    () => Object.fromEntries(geo.features.map((f) => [f.properties.id, f.properties.centroid])),
    [geo]
  );
  const smallIds = useMemo(() => smallestProvinces(geo), [geo]);

  const built = useMemo(
    () =>
      buildProvinceMap(
        { geo, values, centroids, smallIds, unit, indicatorLabel },
        { metric, selectedId, scenario, year, observed }
      ),
    [geo, values, centroids, smallIds, unit, indicatorLabel, metric, selectedId, scenario, year, observed]
  );

  const handleClick = (params: ChartClickParams) => {
    const id = params.data?.provinceId ?? params.name;
    if (!isProvinceId(id)) return; // for example the illustrative Malvinas region
    onSelect(id === selectedId ? null : id);
  };

  const rows = useMemo(() => {
    const show = (x: number) => (metric === 'level' ? formatValue(x, unit) : `${formatPercent(x)} por año`);
    const withValue = geo.features
      .filter((f) => values.values[f.properties.id] !== undefined)
      .map((f) => ({ name: f.properties.name, v: values.values[f.properties.id]! }))
      .sort((a, b) => a.v.rank - b.v.rank)
      .map(({ name, v }) => ({
        rank: v.rank,
        province: name,
        p10: formatValue(v.p10, unit),
        p50: formatValue(v.p50, unit),
        p90: formatValue(v.p90, unit),
        plotted: show(v.plotted)
      }));
    const without = geo.features
      .filter((f) => values.values[f.properties.id] === undefined)
      .map((f) => f.properties.name)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        rank: NO_DATA_TEXT,
        province: name,
        p10: NO_DATA_TEXT,
        p50: NO_DATA_TEXT,
        p90: NO_DATA_TEXT,
        plotted: NO_DATA_TEXT
      }));
    return [...withValue, ...without];
  }, [geo, values, unit, metric]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        {hideTitle ? <span /> : <span>Mapa de provincias, {year}</span>}
        <TableToggle pressed={asTable} onToggle={() => setAsTable(!asTable)} />
      </div>
      <div style={{ flex: 1, minHeight: '280px' }}>
        {asTable ? (
          <DataTable
            caption="Mapa de provincias"
            columns={
              observed
                ? [
                    { key: 'rank', header: 'Puesto' },
                    { key: 'province', header: 'Provincia' },
                    { key: 'plotted', header: 'Valor' }
                  ]
                : [
                    { key: 'rank', header: 'Puesto' },
                    { key: 'province', header: 'Provincia' },
                    { key: 'p10', header: 'p10' },
                    { key: 'p50', header: 'p50' },
                    { key: 'p90', header: 'p90' },
                    { key: 'plotted', header: metric === 'level' ? 'Valor graficado (p50)' : 'Valor graficado (cambio por año)' }
                  ]
            }
            data={rows}
          />
        ) : (
          <EChart option={built.option} aria-label={built.summary} onClick={handleClick} />
        )}
      </div>
    </div>
  );
}
