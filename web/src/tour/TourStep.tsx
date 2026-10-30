import React from 'react';
// the styles of the 3D charts, the tables and the nav buttons live here; the Dashboard is not always loaded before the Recorrido
import '../dashboard/dashboard.css';
import { CompositionStep } from './CompositionStep.js';
import { AiStep } from './AiStep.js';
import { ChartStep } from './ChartStep.js';
import { ExportsStep } from './ExportsStep.js';
import { IndexStep } from './IndexStep.js';
import { ProvinceStep } from './ProvinceStep.js';
import { ResourcesStep } from './ResourcesStep.js';
import { Rule70Step } from './Rule70Step.js';
import { ProductivityStep } from './ProductivityStep.js';
import { WorldStep } from './WorldStep.js';
import { DevelopmentStep } from './DevelopmentStep.js';
import { DraftSlide } from './DraftSlide.js';
import { DRAFT_SLIDES } from './draftSlides.js';
import { INDEX_STEP } from './chartSteps.js';
import { TourSidebar } from './TourSidebar.js';

const ForecastUncertaintyStep = React.lazy(() =>
  import('./ForecastUncertaintyStep.js').then((m) => ({ default: m.ForecastUncertaintyStep }))
);
const AiAccessStep = React.lazy(() => import('./AiAccessStep.js').then((m) => ({ default: m.AiAccessStep })));
const AiEvidenceStep = React.lazy(() => import('./AiEvidenceStep.js').then((m) => ({ default: m.AiEvidenceStep })));

/** The chart of a step of the Recorrido. One lazy chunk keeps ECharts out of the initial load. */
export function TourStep({ step }: { step: number }) {
  if (step === INDEX_STEP) return <IndexStep />;
  if (step === 14) return <ProductivityStep />;
  if (step === 16) return <DevelopmentStep />;
  if (step === 17)
    return (
      <React.Suspense fallback={null}>
        <ForecastUncertaintyStep />
      </React.Suspense>
    );
  if (step === 21)
    return (
      <React.Suspense fallback={null}>
        <AiAccessStep />
      </React.Suspense>
    );
  if ([26, 27, 28, 29].includes(step))
    return (
      <React.Suspense fallback={null}>
        <AiEvidenceStep step={step} />
      </React.Suspense>
    );
  const draft = DRAFT_SLIDES.find((d) => d.id === step);
  if (draft) return <DraftSlide def={draft} />;
  // every other step has the side panel with the text and the references, next to its chart
  return (
    <div className="tour-frame">
      {step === 0 ? <WorldStep /> : step === 2 ? <ProvinceStep /> : step === 4 ? <ExportsStep /> : step === 5 ? <Rule70Step /> : step === 8 ? <ResourcesStep /> : step === 12 ? <CompositionStep /> : step === 3 ? <AiStep /> : <ChartStep step={step} />}
      <TourSidebar step={step} />
    </div>
  );
}
