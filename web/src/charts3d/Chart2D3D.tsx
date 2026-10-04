import React, { Suspense, lazy } from 'react';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { useStore } from '../state/store';
import type { Chart3DSpec } from './types';

// Three.js lives in its own chunk: it loads only when a 3D view is shown (the 2D dashboard is on screen first).
const Chart3D = lazy(() => import('../three/Chart3D'));

interface Chart2D3DProps {
  /** the data of the 3D version; a view without one stays flat */
  spec?: Chart3DSpec;
  /** the flat chart */
  children: React.ReactNode;
}

/**
 * One view in both versions: the flat chart (2D) or the same data in space (3D). It is flat when the mode is 2D, when
 * the view has no 3D version and when the device has no WebGL2 (or there is no capability provider).
 */
export function Chart2D3D({ spec, children }: Chart2D3DProps) {
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
        <Chart3D spec={spec} />
      </Suspense>
    );
  }
  return <>{children}</>;
}
