import React from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { Lines3D } from '../three/Lines3D';
import { TourBarsSvg } from './TourBarsSvg';
import { TourMapSvg } from './TourMapSvg';

/** The 3D views of the Recorrido, one chunk: bars and the map are drawn in SVG (no WebGL); the lines keep their camera that follows. */
export default function TourChart3D({ spec }: { spec: Chart3DSpec }) {
  switch (spec.kind) {
    case 'bars':
      return <TourBarsSvg spec={spec} />;
    case 'map':
      return <TourMapSvg spec={spec} />;
    case 'lines':
      return <Lines3D spec={spec} />;
  }
}
