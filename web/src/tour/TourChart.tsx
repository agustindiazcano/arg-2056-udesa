import React, { Suspense, lazy, useState } from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { useStore } from '../state/store';
import { Segmented } from '../ui/Segmented';
import { Spinner } from '../ui/Spinner';
import { specTable } from './specTable';

const TourChart3D = lazy(() => import('../tour3d/TourChart3D'));

const VIEWS = [
  { value: 'chart', label: 'Gráfico' },
  { value: 'table', label: 'Tabla' }
] as const;

type View = (typeof VIEWS)[number]['value'];

function DataTable({ spec }: { spec: Chart3DSpec }) {
  const t = specTable(spec);
  return (
    <div className="tour-table">
      <table aria-label={t.title}>
        <thead>
          <tr>
            {t.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * `Chart2D3D` of the Recorrido: the same flat chart or its 3D version, loaded behind a spinner (see `tour3d/TourChart3D`), with a
 * Gráfico | Tabla switch (the chart first, unless `defaultView` says table) when there is a spec to make the table from.
 */
export function TourChart({ spec, defaultView = 'chart', mode: forced, children }: { spec?: Chart3DSpec; defaultView?: View; mode?: '2d' | '3d'; children: React.ReactNode }) {
  const globalMode = useStore((s) => s.mode);
  // a step that opens its maps flat passes its own mode; the others follow the global one
  const mode = forced ?? globalMode;
  const quality = useQualityOptional();
  const [view, setView] = useState<View>(defaultView);
  return (
    <>
      {spec && (
        <div className="tour-view-switch">
          <Segmented label="Contenido" options={VIEWS} value={view} onChange={setView} />
        </div>
      )}
      {spec && view === 'table' ? (
        <DataTable spec={spec} />
      ) : mode === '3d' && spec && quality?.caps.webgl2 ? (
        <Suspense fallback={<Spinner label="Cargando la vista 3D..." />}>
          <TourChart3D spec={spec} />
        </Suspense>
      ) : (
        children
      )}
    </>
  );
}
