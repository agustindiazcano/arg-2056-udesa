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
  it.each(AI_EVIDENCE_SLIDES)('registers $title at the end with downloadable, sourced data', (def) => {
    render(<AiEvidenceStep step={def.id} />);
    expect(screen.getByRole('heading', { level: 2, name: def.title })).toBeDefined();
    expect(TOUR_ORDER.slice(-4)).toContain(def.id);
    for (const id of def.refs) expect(REFERENCES.some((r) => r.id === id)).toBe(true);
    for (const table of aiEvidenceTables(def.id)) {
      expect(withMeta(table).retrievedAt).toBe('2026-10-30');
      for (const row of table.rows) expect(row).toHaveLength(table.columns.length);
    }
  });
  it('lets readers inspect each token provider without inventing monthly percentiles', () => {
    render(<AiEvidenceStep step={28} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gemini' }));
    expect(screen.getByText('>3,2 × 10¹⁵ tokens/mes')).toBeDefined();
    expect(screen.getByText(/no solamente la app Gemini/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT' }));
    expect(screen.getByText(/no tráfico exclusivo de ChatGPT/)).toBeDefined();
  });
  it('shows a keyboard-operable LATAM map and separates API from subscriptions', () => {
    render(<AiAccessStep />);
    const chile = screen.getByRole('button', { name: /Chile: 19/ });
    fireEvent.keyDown(chile, { key: 'Enter' });
    expect(chile.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Costo por token' }));
    expect(screen.getByRole('table', { name: 'Precios de API por millón de tokens' })).toBeDefined();
    expect(screen.getByText(/Una suscripción mensual no compra/)).toBeDefined();
  });
  it('changes research views while keeping the units visible', () => {
    render(<AiEvidenceStep step={29} />);
    fireEvent.click(screen.getByRole('button', { name: 'Otros repositorios' }));
    expect(screen.getByRole('img', { name: /Preprints.org: 31691/ })).toBeDefined();
    expect(screen.getByText(/no se suman ni equivalen/)).toBeDefined();
  });
});
