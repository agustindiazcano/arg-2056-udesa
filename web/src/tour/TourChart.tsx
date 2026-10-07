import React, { Suspense, lazy } from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { useStore } from '../state/store';
import { Spinner } from '../ui/Spinner';

const TourChart3D = lazy(() => import('../tour3d/TourChart3D'));

/** `Chart2D3D` of the Recorrido: the same flat chart or its 3D version, loaded behind a spinner (see `tour3d/TourChart3D`). */
export function TourChart({ spec, children }: { spec?: Chart3DSpec; children: React.ReactNode }) {
  const mode = useStore((s) => s.mode);
  const quality = useQualityOptional();
  if (mode === '3d' && spec && quality?.caps.webgl2) {
    return (
      <Suspense fallback={<Spinner label="Cargando la vista 3D..." />}>
        <TourChart3D spec={spec} />
      </Suspense>
    );
  }
  return <>{children}</>;
}
