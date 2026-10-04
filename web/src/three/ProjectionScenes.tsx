import React, { useMemo } from 'react';
import { formatValue } from '../charts/format';
import { demoBarsSpec, demoMapValues } from '../charts3d/projectionDemo';
import type { Map3DSpec } from '../charts3d/types';
import { useProvinces } from '../scenes/forecast/ProvinceMap';
import { PROVINCES } from '../types/province';
import { Bars3D } from './Bars3D';
import { Map3D } from './Map3D';

const NAMES: Record<string, string> = Object.fromEntries(PROVINCES.map((p) => [p.id, p.name]));
const format = (value: number) => formatValue(value, 'pts');
const noSelect = () => {};

const MAP_TITLE = 'Argentina: valor por provincia';
const BARS_TITLE = 'Provincias con mayor valor';

/** The projection test: the map of Argentina and a bar chart in 3D, each with a projected title, on made-up values. */
export default function ProjectionScenes() {
  const provinces = useProvinces();
  const geo = provinces.status === 'success' ? provinces.geo : null;

  const mapSpec = useMemo<Map3DSpec | null>(() => {
    if (!geo) return null;
    return {
      kind: 'map',
      title: MAP_TITLE,
      geo,
      values: demoMapValues(geo),
      metric: 'level',
      selectedId: null,
      formatValue: format,
      onSelect: noSelect,
      summary: `${MAP_TITLE}, vista 3D con valores de prueba.`
    };
  }, [geo]);
  const barsSpec = useMemo(() => (mapSpec ? demoBarsSpec(mapSpec.values, NAMES, 6) : null), [mapSpec]);

  if (provinces.status === 'loading') {
    return (
      <p role="status" className="poster">
        Cargando la geometría de las provincias...
      </p>
    );
  }
  if (provinces.status === 'error') {
    return <p role="status" className="poster">{`La geometría de las provincias no está disponible: ${provinces.message}`}</p>;
  }
  if (!mapSpec || !barsSpec) return null;

  return (
    <div className="projection-grid">
      <section className="projection-panel" aria-label="Mapa de Argentina con título proyectado">
        <Map3D spec={mapSpec} projection={{ title: 'Argentina' }} />
      </section>
      <section className="projection-panel" aria-label="Gráfico de barras con título proyectado">
        <Bars3D spec={barsSpec} projection={{ title: BARS_TITLE }} />
      </section>
    </div>
  );
}
