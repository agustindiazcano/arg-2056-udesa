// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../src/charts/EChart.js', () => ({ EChart: ({ 'aria-label': label }: { 'aria-label': string }) => <div role="img" aria-label={label} /> }));
import { AiEvidenceStep } from '../../src/tour/AiEvidenceStep.js';
import { AiAccessStep } from '../../src/tour/AiAccessStep.js';
import { AI_EVIDENCE_SLIDES } from '../../src/tour/aiEvidence.js';
import { aiEvidenceTables } from '../../src/datasets/aiEvidenceTables.js';
import { REFERENCES } from '../../src/datasets/references.js';
import { withMeta } from '../../src/datasets/quality.js';
import { TOUR_ORDER } from '../../src/tour/chartSteps.js';
afterEach(cleanup);

describe('sourced AI slides', () => {
  it.each(AI_EVIDENCE_SLIDES)('registers $title with downloadable, sourced data', (def) => {
    render(<AiEvidenceStep step={def.id} />);
    expect(screen.getByRole('heading', { level: 2, name: def.title })).toBeDefined();
    expect(TOUR_ORDER.slice(-5)).toContain(def.id);
    for (const id of def.refs) expect(REFERENCES.some((r) => r.id === id)).toBe(true);
    for (const table of aiEvidenceTables(def.id)) {
      expect(withMeta(table).retrievedAt).toBe('2026-10-30');
      for (const row of table.rows) expect(row).toHaveLength(table.columns.length);
    }
  });
  it('shows the colorful triangular 7-tier token pyramid and compact white author line without the provider telemetry card', () => {
    render(<AiEvidenceStep step={28} />);
    expect(screen.queryByText('Qué publica cada proveedor y telemetría interna')).toBeNull();
    expect(screen.getByText('★ "Autor - últimos 30 días (8.000 M solo en claude code)"')).toBeDefined();
    expect(screen.getByText(/156,8× la mediana de ingeniería/)).toBeDefined();
    const tierBtn = screen.getByRole('button', { name: /Nivel 1 · Cúspide 24\/7/ });
    fireEvent.click(tierBtn);
    expect(tierBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Enjambres autónomos y loops continuos/)).toBeDefined();
  });
  it('shows by default the world population share that pays for LLMs across major language models in a colorful triangular pyramid', () => {
    render(<AiEvidenceStep step={26} />);
    const defaultBtn = screen.getByRole('button', { name: /Población mundial que paga LLMs/ });
    expect(defaultBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText(/0,61 %/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/modelos verdaderamente inteligentes/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/incrementan la productividad de forma alta/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Claude/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gemini/).length).toBeGreaterThan(0);
  });
  it('shows a keyboard-operable LATAM map including Chile and Peru and separates API from subscriptions', () => {
    render(<AiAccessStep />);
    const chile = screen.getByRole('button', { name: /Chile: 19/ });
    fireEvent.keyDown(chile, { key: 'Enter' });
    expect(chile.getAttribute('aria-pressed')).toBe('true');
    const peru = screen.getByRole('button', { name: /Perú: 18/ });
    fireEvent.click(peru);
    expect(peru.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Costo por token' }));
    expect(screen.getByRole('table', { name: 'Precios de API por millón de tokens' })).toBeDefined();
    expect(screen.getByRole('group', { name: /Mapa semáforo de América Latina: sobrecosto porcentual y precio por millón de tokens/ })).toBeDefined();
    expect(screen.getByText(/Sobrecosto por cada token en Argentina: \+51 %/)).toBeDefined();
    const tokenChile = screen.getByRole('button', { name: /Chile: \+19 % por token/ });
    fireEvent.click(tokenChile);
    expect(tokenChile.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Una suscripción mensual no compra/)).toBeDefined();
  });
  it('changes research views while keeping the units visible', () => {
    render(<AiEvidenceStep step={29} />);
    fireEvent.click(screen.getByRole('button', { name: 'Otros repositorios' }));
    expect(screen.getByRole('img', { name: /Preprints.org: 31691/ })).toBeDefined();
    expect(screen.getByText(/no se suman ni equivalen/)).toBeDefined();
  });
});
