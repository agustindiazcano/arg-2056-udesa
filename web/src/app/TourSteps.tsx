import React from 'react';
import { useStore } from '../state/store';
import { TOUR_STEPS } from '../state/reducer';

/** How many numbered buttons show at once: the step and its neighbours. */
const WINDOW = 3;

/** The numbers to show: the current step in the middle, held inside 1 to TOUR_STEPS (1 2 3 at the start, 13 14 15 at the end). */
export function stepWindow(step: number): number[] {
  const first = Math.min(Math.max(step - 1, 1), TOUR_STEPS - WINDOW + 1);
  return Array.from({ length: WINDOW }, (_, i) => first + i);
}

/** The step buttons of the Recorrido, in the navbar: "Anterior", three numbers around the current step and "Siguiente". The left and right arrow keys move the step too. */
export function TourSteps() {
  const tourStep = useStore((s) => s.tourStep);
  const dispatch = useStore((s) => s.dispatch);
  const go = (step: number) => dispatch({ type: 'tourSet', step });
  return (
    <div role="group" aria-label="Pasos del Recorrido" className="tour-steps">
      <button type="button" className="chip" disabled={tourStep <= 1} onClick={() => go(tourStep - 1)}>
        Anterior
      </button>
      {stepWindow(tourStep).map((n) => (
        <button key={n} type="button" className="chip" aria-pressed={tourStep === n} onClick={() => go(n)}>
          {n}
        </button>
      ))}
      <button type="button" className="chip" disabled={tourStep >= TOUR_STEPS} onClick={() => go(tourStep + 1)}>
        Siguiente
      </button>
    </div>
  );
}
