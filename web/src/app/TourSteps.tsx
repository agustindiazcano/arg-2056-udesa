import React from 'react';
import { useStore } from '../state/store';
import { TOUR_STEPS } from '../state/reducer';

const STEPS = Array.from({ length: TOUR_STEPS }, (_, i) => i + 1);

/** The numbered buttons of the Recorrido, in the navbar. They only select a step for now; the left and right arrow keys move it too. */
export function TourSteps() {
  const tourStep = useStore((s) => s.tourStep);
  const dispatch = useStore((s) => s.dispatch);
  return (
    <div role="group" aria-label="Pasos del Recorrido" className="tour-steps">
      {STEPS.map((n) => (
        <button key={n} type="button" className="chip" aria-pressed={tourStep === n} onClick={() => dispatch({ type: 'tourSet', step: n })}>
          {n}
        </button>
      ))}
    </div>
  );
}
