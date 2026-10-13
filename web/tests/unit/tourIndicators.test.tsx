// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TOUR_INDICATORS } from '../../src/tour/indicatorsMock';
import { TourIndicators } from '../../src/tour/TourIndicators';

afterEach(cleanup);

describe('the indicators box of the Recorrido', () => {
  it('has six indicators, each with a label, a value and a unit, and says the numbers are test data', () => {
    expect(TOUR_INDICATORS).toHaveLength(6);
    for (const i of TOUR_INDICATORS) {
      expect(i.label.length).toBeGreaterThan(0);
      expect(i.value.length).toBeGreaterThan(0);
    }
    expect(TOUR_INDICATORS.map((i) => i.label)).toEqual(expect.arrayContaining(['PBI', 'Población', 'PBI per cápita', 'Exportaciones totales']));
  });

  it('renders a labelled list with the six values and the test-data notice', () => {
    render(<TourIndicators />);
    const list = screen.getByRole('list', { name: 'Indicadores de la Argentina' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText(/Datos de prueba/)).toBeTruthy();
  });
});
