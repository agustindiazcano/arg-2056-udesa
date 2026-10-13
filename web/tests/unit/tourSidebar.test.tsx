// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { TourSidebar } from '../../src/tour/TourSidebar';
import { STEP_INFO } from '../../src/tour/stepInfo';
import { useTourLayout } from '../../src/tour/useTourLayout';
import { REFERENCES } from '../../src/datasets/references';

afterEach(() => {
  cleanup();
  useTourLayout.setState({ sideOpen: true });
});

describe('the side panel of the charts of the Recorrido', () => {
  it('has a text for every chart step (0 to 13) and its references exist', () => {
    const ids = new Set(REFERENCES.map((r) => r.id));
    for (let step = 0; step <= 13; step += 1) {
      const info = STEP_INFO[step];
      expect(info, `step ${step}`).toBeDefined();
      expect(info!.paragraphs.length).toBeGreaterThan(0);
      for (const ref of info!.refs) expect(ids.has(ref), `${ref} of step ${step}`).toBe(true);
    }
  });

  it('is open by default, with the text, the data badge and the linked references', () => {
    render(<TourSidebar step={4} />);
    const panel = screen.getByRole('complementary', { name: /texto y referencias/i });
    expect(within(panel).getByRole('heading', { name: STEP_INFO[4]!.heading })).toBeTruthy();
    expect(within(panel).getByText('Datos reales')).toBeTruthy();
    const link = within(panel).getByRole('link', { name: /INDEC, Intercambio comercial argentino/ });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/www\.indec\.gob\.ar/);
  });

  it('the button hides it and the other one brings it back', () => {
    render(<TourSidebar step={4} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar texto' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar texto' }));
    expect(screen.getByRole('complementary')).toBeTruthy();
  });

  it('says so when a chart has no references yet', () => {
    render(<TourSidebar step={6} />);
    expect(screen.getByText(/todavía no tiene fuentes cargadas/)).toBeTruthy();
    expect(screen.getByText('Datos de prueba')).toBeTruthy();
  });
});
