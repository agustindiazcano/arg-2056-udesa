import { describe, expect, it } from 'vitest';
import { CHART_STEPS, TOUR_ORDER, stepNumber } from '../../src/tour/chartSteps';
import { buildSlides } from '../../src/datasets/slides';

// Human order of 2026-10-15: Productividad (the code and docs/data-requests.md call it step 14) goes right after step 1, and the numbers are
// renumbered 0, 1, 2... in the order the slides are shown.
describe('the order and the numbers of the slides of Hacia el 2056', () => {
  it('shows Productividad right after the GDP slide', () => {
    expect(TOUR_ORDER).toEqual([0, 1, 14, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13]);
  });

  it('is the set of the steps that exist', () => {
    expect([...CHART_STEPS].sort((a, b) => a - b)).toEqual([...TOUR_ORDER].sort((a, b) => a - b));
  });

  it('numbers the slides 0, 1, 2... with no gap, by their position', () => {
    expect(TOUR_ORDER.map(stepNumber)).toEqual(Array.from({ length: TOUR_ORDER.length }, (_, i) => i));
    expect(stepNumber(14)).toBe(2);
    expect(stepNumber(2)).toBe(3);
    expect(stepNumber(13)).toBe(12);
  });

  it('puts the slides of the Data page in the same order, labelled with the same numbers', () => {
    const slides = buildSlides();
    expect(slides.map((s) => s.id)).toEqual([...TOUR_ORDER.map(String), 'sim']);
    const prod = slides.find((s) => s.id === '14')!;
    expect(prod.label).toBe('2 · Productividad');
    slides.filter((s) => s.id !== 'sim').forEach((s, i) => expect(s.label.startsWith(`${i} · `), s.label).toBe(true));
  });
});
