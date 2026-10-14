// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DataQuality } from '../../src/ui/DataQuality';

afterEach(cleanup);

describe('the data quality badge', () => {
  it('says how real the data is, with the source and the date', () => {
    render(<DataQuality quality="real" source="Banco Mundial (WDI)" retrievedAt="2026-10-12" />);
    const badge = screen.getByRole('note', { name: /datos reales/i });
    expect(badge.textContent).toContain('Datos reales');
    expect(badge.getAttribute('title')).toContain('Banco Mundial (WDI)');
    expect(badge.getAttribute('title')).toContain('2026-10-12');
    expect(screen.queryByTestId('quality-watermark')).toBeNull();
  });

  it('draws a visible mark over the chart when the data is a placeholder', () => {
    render(<DataQuality quality="placeholder" source="Datos de prueba (inventados)" retrievedAt={null} />);
    expect(screen.getByRole('note', { name: /datos de prueba/i })).toBeTruthy();
    const mark = screen.getByTestId('quality-watermark');
    expect(mark.textContent).toMatch(/datos de prueba/i);
    expect(mark.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not put the mark on partial data, only the badge', () => {
    render(<DataQuality quality="partial" source="s" retrievedAt="2026-10-13" />);
    expect(screen.getByRole('note', { name: /en parte reales/i })).toBeTruthy();
    expect(screen.queryByTestId('quality-watermark')).toBeNull();
  });
});

describe('the badge inside the charts of the Recorrido', () => {
  it('is drawn by TourChart from the quality of the table, with the mark over made-up data', async () => {
    const { TourChart } = await import('../../src/tour/TourChart');
    const { TABLE_META } = await import('../../src/datasets/quality');
    render(
      <TourChart meta={TABLE_META['chart-3']}>
        <p>chart</p>
      </TourChart>
    );
    expect(screen.getByRole('note', { name: /datos de prueba/i })).toBeTruthy();
    expect(screen.getByTestId('quality-watermark')).toBeTruthy();
    cleanup();
    render(
      <TourChart meta={TABLE_META['chart-4']}>
        <p>chart</p>
      </TourChart>
    );
    expect(screen.getByRole('note', { name: /datos reales/i })).toBeTruthy();
    expect(screen.queryByTestId('quality-watermark')).toBeNull();
  });
});
