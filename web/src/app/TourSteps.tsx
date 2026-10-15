import React from 'react';
import { useStore } from '../state/store';
import { TOUR_STEP_LIST } from '../state/reducer';

/** How many numbered buttons show at once: the step and its neighbours. */
const WINDOW = 3;

/** The numbers to show: the current step in the middle, held inside the steps that exist (0 1 2 at the start, 12 13 14 at the end; there is no 6). */
export function stepWindow(step: number): number[] {
  const at = Math.max(TOUR_STEP_LIST.indexOf(step), 0);
  const first = Math.min(Math.max(at - 1, 0), TOUR_STEP_LIST.length - WINDOW);
  return TOUR_STEP_LIST.slice(first, first + WINDOW);
}

/** The step buttons of the Recorrido, in the navbar: "Anterior", three numbers around the current step and "Siguiente". The left and right arrow keys move the step too. */
export function TourSteps() {
  const tourStep = useStore((s) => s.tourStep);
  const dispatch = useStore((s) => s.dispatch);
  const go = (step: number) => dispatch({ type: 'tourSet', step });
  return (
    <div role="group" aria-label="Pasos hacia el 2056" className="tour-steps">
      <button type="button" className="chip" disabled={tourStep <= TOUR_STEP_LIST[0]!} onClick={() => go(TOUR_STEP_LIST[TOUR_STEP_LIST.indexOf(tourStep) - 1]!)}>
        Anterior
      </button>
      {stepWindow(tourStep).map((n) => (
        <button key={n} type="button" className="chip" aria-pressed={tourStep === n} onClick={() => go(n)}>
          {n}
        </button>
      ))}
      <button type="button" className="chip" disabled={tourStep >= TOUR_STEP_LIST.at(-1)!} onClick={() => go(TOUR_STEP_LIST[TOUR_STEP_LIST.indexOf(tourStep) + 1]!)}>
        Siguiente
      </button>
    </div>
  );
}
