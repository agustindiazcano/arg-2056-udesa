// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ForecastUncertaintyStep } from '../../src/tour/ForecastUncertaintyStep.js';

import { FORECAST_UNCERTAINTY_TITLE } from '../../src/tour/slideTitles.js';

afterEach(cleanup);

describe('ForecastUncertaintyStep', () => {
  it('renders title and sections correctly', () => {
    render(<ForecastUncertaintyStep />);

    expect(screen.getByRole('heading', { level: 2, name: FORECAST_UNCERTAINTY_TITLE })).toBeDefined();

    // Check tabs
    expect(screen.getByRole('button', { name: 'Difusión tecnológica' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Capacidad y costos' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Revisión de pronósticos' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Escenario adverso' })).toBeDefined();

    // Default section heading
    expect(screen.getByRole('heading', { level: 3, name: /Rezagos históricos de adopción masiva/i })).toBeDefined();
  });

  it('switches to Capacidad y costos tab and toggles cost views', () => {
    render(<ForecastUncertaintyStep />);

    const costTab = screen.getByRole('button', { name: 'Capacidad y costos' });
    fireEvent.click(costTab);

    expect(costTab.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { level: 3, name: /Colapso de costo de inferencia/i })).toBeDefined();

    // Toggle to training compute
    const computeBtn = screen.getByRole('button', { name: 'Cómputo de entrenamiento (FLOPs)' });
    fireEvent.click(computeBtn);

    expect(computeBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { level: 3, name: /Escala exponencial de cómputo de entrenamiento/i })).toBeDefined();
  });

  it('switches to Revisión de pronósticos and displays forecast revision delta', () => {
    render(<ForecastUncertaintyStep />);

    const revTab = screen.getByRole('button', { name: 'Revisión de pronósticos' });
    fireEvent.click(revTab);

    expect(revTab.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { level: 3, name: /Desvíos empíricos en pronósticos del PBI/i })).toBeDefined();
    expect(screen.getByText(/Pronóstico FMI WEO/i)).toBeDefined();
    expect(screen.getByText(/PBI real observado/i)).toBeDefined();
  });

  it('switches to Escenario adverso and selects different channels', () => {
    render(<ForecastUncertaintyStep />);

    const adverseTab = screen.getByRole('button', { name: 'Escenario adverso' });
    fireEvent.click(adverseTab);

    expect(adverseTab.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { level: 3, name: /Canales de desacoplamiento/i })).toBeDefined();

    // Switch channel to Empleo
    const empleoBtn = screen.getByRole('button', { name: 'Empleo' });
    fireEvent.click(empleoBtn);
    expect(empleoBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Automatización sesgada y sustitución de tareas/i)).toBeDefined();
  });
});
