import { describe, expect, it } from 'vitest';
import { CHART_STEPS, INDEX_STEP, TOUR_ORDER, stepNumber } from '../../src/tour/chartSteps';
import { buildSlides } from '../../src/datasets/slides';

// Human orders of 2026-10-15: Productividad (the code and docs/data-requests.md call it step 14) goes right after the GDP slide, and the
// first slide is the index (id 20, the title "Argentina 2056" and the list of the others). The numbers are the position: 0, 1, 2...
describe('the order and the numbers of the slides of Hacia el 2056', () => {
  it('opens with the index and shows Productividad right after the GDP slide', () => {
    expect(TOUR_ORDER).toEqual([20, 0, 8, 5, 12, 14, 3, 16, 17, 21, 22, 23, 24, 25, 27, 28, 26, 29]);
    expect(TOUR_ORDER[0]).toBe(INDEX_STEP);
  });

  it('is the set of the steps that exist', () => {
    expect([...CHART_STEPS].sort((a, b) => a - b)).toEqual([...TOUR_ORDER].sort((a, b) => a - b));
  });

  it('numbers the slides 0, 1, 2... with no gap, by their position', () => {
    expect(TOUR_ORDER.map(stepNumber)).toEqual(Array.from({ length: TOUR_ORDER.length }, (_, i) => i));
    expect(stepNumber(INDEX_STEP)).toBe(0);
    expect(stepNumber(0)).toBe(1);
    expect(stepNumber(8)).toBe(2); // Recursos naturales is the second slide
    expect(stepNumber(5)).toBe(3);
    expect(stepNumber(14)).toBe(5);
    expect(stepNumber(2)).toBe(-1); // Producción por provincia is a view of the Recursos slide
    expect(stepNumber(4)).toBe(-1); // Exportaciones is a view of the Composición slide
    expect(stepNumber(3)).toBe(6); // the existing AI slide stays before the new draft slides
    expect(stepNumber(16)).toBe(7);
    expect(stepNumber(17)).toBe(8);
  });

  it('puts the slides of the Data page in the same order, labelled with the same numbers (the index has no data)', () => {
    const slides = buildSlides();
    expect(slides.map((s) => s.id)).toEqual([...TOUR_ORDER.filter((id) => id !== INDEX_STEP).map(String), 'sim']);
    expect(slides.find((s) => s.id === '14')!.label).toBe('5 · Productividad');
    slides.filter((s) => s.id !== 'sim').forEach((s, i) => expect(s.label.startsWith(`${i + 1} · `), s.label).toBe(true));
  });
});

describe('the slides after the 8th', () => {
  it('keeps access at 9 and appends adoption, tokens, the pyramid and research at 14 to 17', () => {
    expect([21, 22, 23, 24, 25, 27, 28, 26, 29].map(stepNumber)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });
});
