import { describe, expect, it } from 'vitest';
import { CHART_STEPS, INDEX_STEP, TOUR_ORDER, stepNumber } from '../../src/tour/chartSteps';
import { buildSlides } from '../../src/datasets/slides';

describe('the order and the numbers of the slides of Hacia el 2056', () => {
  it('opens with the index and follows the requested sequence of slides', () => {
    expect(TOUR_ORDER).toEqual([20, 0, 8, 3, 21, 28, 16, 26, 5, 12, 14, 27, 29, 17]);
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
    expect(stepNumber(3)).toBe(3); // AI impact goes right after slide 2
    expect(stepNumber(21)).toBe(4); // AI access goes right after AI impact
    expect(stepNumber(28)).toBe(5); // Tokens goes right after AI access
    expect(stepNumber(16)).toBe(6); // Desarrollo humano goes right after Tokens
    expect(stepNumber(26)).toBe(7); // LLM Adoption Pyramid goes right after Desarrollo humano
    expect(stepNumber(5)).toBe(8);
    expect(stepNumber(12)).toBe(9);
    expect(stepNumber(14)).toBe(10);
    expect(stepNumber(2)).toBe(-1); // Producción por provincia is a view of the Recursos slide
    expect(stepNumber(4)).toBe(-1); // Exportaciones is a view of the Composición slide
    expect(stepNumber(17)).toBe(13); // forecast uncertainty is at the end
  });

  it('puts the slides of the Data page in the same order, labelled with the same numbers (the index has no data)', () => {
    const slides = buildSlides();
    expect(slides.map((s) => s.id)).toEqual([...TOUR_ORDER.filter((id) => id !== INDEX_STEP).map(String), 'sim']);
    expect(slides.find((s) => s.id === '14')!.label).toBe('10 · Productividad');
    slides.filter((s) => s.id !== 'sim').forEach((s, i) => expect(s.label.startsWith(`${i + 1} · `), s.label).toBe(true));
  });
});

describe('the slides after the 2nd', () => {
  it('places AI impact at 3, AI access at 4, Tokens at 5, Development at 6, and LLM Pyramid at 7', () => {
    expect([3, 21, 28, 16, 26, 5, 12, 14, 27, 29, 17].map(stepNumber)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });
});
