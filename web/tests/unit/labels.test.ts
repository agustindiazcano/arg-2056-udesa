import { describe, it, expect } from 'vitest';
import { projectStatusLabel, resourceLabel } from '../../src/content/labels.js';

describe('resourceLabel', () => {
  it('names the resources in Spanish', () => {
    expect(
      ['lithium', 'copper', 'gold', 'silver', 'oil', 'gas', 'soy', 'wheat', 'corn', 'other'].map(resourceLabel)
    ).toEqual(['Litio', 'Cobre', 'Oro', 'Plata', 'Petróleo', 'Gas', 'Soja', 'Trigo', 'Maíz', 'Otros']);
  });

  it('returns an unknown id unchanged rather than hiding it', () => {
    expect(resourceLabel('uranium')).toBe('uranium');
  });
});

describe('projectStatusLabel', () => {
  it('names every project status in Spanish', () => {
    expect(
      [
        'operating',
        'ramp_up',
        'construction',
        'approved',
        'feasibility',
        'prefeasibility',
        'exploration',
        'announced'
      ].map(projectStatusLabel)
    ).toEqual([
      'En operación',
      'En puesta en marcha',
      'En construcción',
      'Aprobado',
      'En factibilidad',
      'En prefactibilidad',
      'En exploración',
      'Anunciado'
    ]);
  });

  it('returns an unknown status unchanged', () => {
    expect(projectStatusLabel('paused')).toBe('paused');
  });
});
