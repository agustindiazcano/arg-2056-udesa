import React from 'react';
// the styles of the 3D charts, the tables and the nav buttons live here; the Dashboard is not always loaded before the Recorrido
import '../dashboard/dashboard.css';
import { ChartStep } from './ChartStep.js';
import { ExportsStep } from './ExportsStep.js';
import { ProvinceStep } from './ProvinceStep.js';
import { ProductivityStep } from './ProductivityStep.js';
import { WorldStep } from './WorldStep.js';
import { TourSidebar } from './TourSidebar.js';

/** The chart of a step of the Recorrido. One lazy chunk keeps ECharts out of the initial load. */
export function TourStep({ step }: { step: number }) {
  if (step === 14) return <ProductivityStep />;
  // every other step has the side panel with the text and the references, next to its chart
  return (
    <div className="tour-frame">
      {step === 0 ? <WorldStep /> : step === 2 ? <ProvinceStep /> : step === 4 ? <ExportsStep /> : <ChartStep step={step} />}
      <TourSidebar step={step} />
    </div>
  );
}
