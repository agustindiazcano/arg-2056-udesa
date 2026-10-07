import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatValue } from '../charts/format.js';
import { barsSpec } from '../charts3d/specs.js';
import type { Map3DSpec } from '../charts3d/types.js';
import { useQualityOptional } from '../runtime/CapabilityProvider.js';
import { useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { mapSummary } from '../scenes/forecast/mapSelectors.js';
import type { ProvinceId } from '../types/province.js';
import { PRODUCTION_UNIT, SECTOR_VALUES, mapValuesOf, rankedProvinces } from './provinceMock.js';

// the 3D renderers load only here, with Three.js in its own chunk
const Bars3D = lazy(() => import('../three/Bars3D.js').then((m) => ({ default: m.Bars3D })));
const Map3D = lazy(() => import('../three/Map3D.js').then((m) => ({ default: m.Map3D })));

const TITLE = 'Prueba 3D';

/** Counts the wheel events and the scrolls of the page, so that a zoom or a slide that nobody asked for shows its cause. */
function EventProbe() {
  const counts = useRef({ wheel: 0, ctrl: 0, scroll: 0 });
  const [text, setText] = useState('rueda: 0 · con Ctrl: 0 · scroll: 0 · scrollY: 0');
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      counts.current.wheel += 1;
      if (e.ctrlKey) counts.current.ctrl += 1;
    };
    const onScroll = () => {
      counts.current.scroll += 1;
    };
    window.addEventListener('wheel', onWheel, { capture: true, passive: true });
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    const id = window.setInterval(() => {
      const c = counts.current;
      setText(`rueda: ${c.wheel} · con Ctrl: ${c.ctrl} · scroll: ${c.scroll} · scrollY: ${Math.round(window.scrollY)}`);
    }, 250);
    return () => {
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('scroll', onScroll, true);
      window.clearInterval(id);
    };
  }, []);
  return (
    <p data-testid="lab-probe" style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--font-sm)' }}>
      {text}
    </p>
  );
}

const box: React.CSSProperties = { position: 'relative', height: 480, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' };

/**
 * The only slide of the Recorrido while the 3D is rebuilt: the map of the provinces and a chart of bars, each alone in a box
 * with the camera of the Data Dashboard (drag, wheel, buttons), and nothing else around them. Made-up values.
 */
export function LabStep() {
  const provinces = useProvinces();
  const quality = useQualityOptional();
  const [selected, setSelected] = useState<ProvinceId | null>(null);
  const values = useMemo(() => mapValuesOf(SECTOR_VALUES.mineria), []);
  const rows = useMemo(() => rankedProvinces(SECTOR_VALUES.mineria), []);
  const formatProduction = useCallback((v: number) => formatValue(v, PRODUCTION_UNIT), []);
  const pickProvince = useCallback((id: string | null) => setSelected(id as ProvinceId | null), []);

  const mapSpec = useMemo<Map3DSpec | null>(
    () =>
      provinces.status !== 'success'
        ? null
        : {
            kind: 'map',
            title: 'Producción de minería por provincia',
            geo: provinces.geo,
            values,
            metric: 'level',
            selectedId: selected,
            formatValue: formatProduction,
            onSelect: pickProvince,
            summary: mapSummary(values, 'level', 'producción de minería (datos de prueba)', 2025, PRODUCTION_UNIT)
          },
    [provinces, values, selected, formatProduction, pickProvince]
  );
  const barSpec = useMemo(
    () =>
      barsSpec(
        rows.slice(0, 8).map((r) => ({ label: r.short, value: r.value })),
        { title: 'Producción de minería por provincia', unit: PRODUCTION_UNIT, highlight: rows.find((r) => r.id === selected)?.short ?? null, summary: 'Producción de minería por provincia (datos de prueba)' }
      ),
    [rows, selected]
  );

  const webgl = quality?.caps.webgl2 === true;
  return (
    <section className="gdp-step" aria-label={TITLE} style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <h2>{TITLE}</h2>
      <EventProbe />
      {!webgl ? (
        <p role="status" className="poster">
          Este equipo no tiene WebGL2: no se puede mostrar el 3D.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
          <div style={box}>
            <Suspense fallback={<p className="poster">Cargando el mapa...</p>}>{mapSpec ? <Map3D spec={mapSpec} free /> : <p className="poster">Cargando la geometría...</p>}</Suspense>
          </div>
          <div style={box}>
            <Suspense fallback={<p className="poster">Cargando las barras...</p>}>
              <Bars3D spec={barSpec} free />
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
}
