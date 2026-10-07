import React from 'react';
import { ChartStep } from './ChartStep.js';

/** Step 1 of the Recorrido: the GDP of Argentina, observed and projected, in 2D or in 3D. It shares the frame of the other steps. */
export function GdpStep() {
  return <ChartStep step={1} />;
}
