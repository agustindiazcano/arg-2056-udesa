// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DevelopmentStep } from '../../src/tour/DevelopmentStep.js';

afterEach(cleanup);

describe('DevelopmentStep', () => {
  it('renders the title and default indicator data', () => {
    render(<DevelopmentStep />);

    // Check title and head
    expect(screen.getByRole('heading', { level: 2, name: /Indicadores de desarrollo/i })).toBeDefined();

    // Check default indicator (Esperanza de vida al nacer) appears in buttons and header
    expect(screen.getAllByText(/Esperanza de vida al nacer/i).length).toBeGreaterThanOrEqual(1);

    // Check tabs
    expect(screen.getByRole('button', { name: 'Salud' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Educación' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Igualdad' })).toBeDefined();
  });

  it('switches between time series and regional comparison mode', () => {
    render(<DevelopmentStep />);

    const regionalBtn = screen.getByRole('button', { name: 'Comparación regional' });
    fireEvent.click(regionalBtn);

    expect(regionalBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Comparación con países pares de América Latina/i)).toBeDefined();

    // Should include Argentina as national reference
    expect(screen.getByText(/Argentina \(Referencia nacional\)/i)).toBeDefined();
  });

  it('changes category and updates available indicators', () => {
    render(<DevelopmentStep />);

    const educacionBtn = screen.getByRole('button', { name: 'Educación' });
    fireEvent.click(educacionBtn);

    expect(educacionBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText(/Resultados PISA/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Años de escolaridad/i).length).toBeGreaterThanOrEqual(1);
  });
});
