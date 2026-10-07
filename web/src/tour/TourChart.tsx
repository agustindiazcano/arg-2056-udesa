import React, { Suspense, lazy } from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { useStore } from '../state/store';

const TourChart3D = lazy(() => import('../tour3d/TourChart3D'));

/** `Chart2D3D` of the Recorrido: the same flat chart or its 3D version, but the bars and the map are the still ones of `tour3d`. */
export function TourChart({ spec, children }: { spec?: Chart3DSpec; children: React.ReactNode }) {
  const mode = useStore((s) => s.mode);
  const quality = useQualityOptional();
  if (mode === '3d' && spec && quality?.caps.webgl2) {
    return (
      <Suspense
        fallback={
          <p role="status" className="poster">
            Cargando la vista 3D...
          </p>
        }
      >
        <TourChart3D spec={spec} />
      </Suspense>
    );
  }
  return <>{children}</>;
}
