import React from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { Bars3D } from '../three/Bars3D';
import { Lines3D } from '../three/Lines3D';
import { Map3D } from '../three/Map3D';

/**
 * The 3D views of the Recorrido, one chunk. The bars and the map are the ones of the Data Dashboard with its free camera (`free`):
 * the special mode of the Recorrido (side view, wheel left to the page) is what was breaking them.
 */
export default function TourChart3D({ spec }: { spec: Chart3DSpec }) {
  switch (spec.kind) {
    case 'bars':
      return <Bars3D spec={spec} free />;
    case 'map':
      return <Map3D spec={spec} free />;
    case 'lines':
      return <Lines3D spec={spec} />;
  }
}
