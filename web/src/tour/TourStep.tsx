import React from 'react';
import { LabStep } from './LabStep.js';

/**
 * The Recorrido has one slide for now: a clean test of the 3D map and bars (the others were taken out while the 3D is rebuilt;
 * `ChartStep`, `ProvinceStep`, `WorldStep` and `GdpStep` are still in the folder, unused). The step number does not matter.
 */
export function TourStep(_props: { step: number }) {
  return <LabStep />;
}
