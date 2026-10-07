import React from 'react';
import { ChartStep } from './ChartStep.js';
import { ProvinceStep } from './ProvinceStep.js';
import { WorldStep } from './WorldStep.js';

/** The chart of a step of the Recorrido. One lazy chunk keeps ECharts out of the initial load. */
export function TourStep({ step }: { step: number }) {
  if (step === 0) return <WorldStep />;
  return step === 2 ? <ProvinceStep /> : <ChartStep step={step} />;
}
