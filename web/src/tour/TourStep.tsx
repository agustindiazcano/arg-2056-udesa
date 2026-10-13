import React from 'react';
// the styles of the 3D charts, the tables and the nav buttons live here; the Dashboard is not always loaded before the Recorrido
import '../dashboard/dashboard.css';
import { ChartStep } from './ChartStep.js';
import { ProvinceStep } from './ProvinceStep.js';
import { ProductivityStep } from './ProductivityStep.js';
import { WorldStep } from './WorldStep.js';

/** The chart of a step of the Recorrido. One lazy chunk keeps ECharts out of the initial load. */
export function TourStep({ step }: { step: number }) {
  if (step === 0) return <WorldStep />;
  if (step === 14) return <ProductivityStep />;
  return step === 2 ? <ProvinceStep /> : <ChartStep step={step} />;
}
