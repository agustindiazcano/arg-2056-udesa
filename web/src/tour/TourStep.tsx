import React from 'react';
import { ChartStep } from './ChartStep.js';

/** The chart of a step of the Recorrido. One lazy chunk keeps ECharts out of the initial load. */
export function TourStep({ step }: { step: number }) {
  return <ChartStep step={step} />;
}
