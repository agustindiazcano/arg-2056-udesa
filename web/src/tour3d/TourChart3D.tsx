import React from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { Lines3D } from '../three/Lines3D';
import { TourBars } from './TourBars';
import { TourMap } from './TourMap';

/** The 3D renderers of the Recorrido, one chunk: bars and the map are the still ones of this folder; the lines keep the camera that follows. */
export default function TourChart3D({ spec }: { spec: Chart3DSpec }) {
  switch (spec.kind) {
    case 'bars':
      return <TourBars spec={spec} />;
    case 'map':
      return <TourMap spec={spec} />;
    case 'lines':
      return <Lines3D spec={spec} />;
  }
}
