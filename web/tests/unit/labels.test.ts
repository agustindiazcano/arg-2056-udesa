import { describe, it, expect } from 'vitest';
import {
  indicatorLabel,
  indicatorSentence,
  positionLabel,
  positionPhrase,
  projectStatusLabel,
  resourceLabel,
  scenarioLabel
} from '../../src/content/labels.js';

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

describe('scenarioLabel', () => {
  it('uses the names of the control bar', () => {
    expect(['pessimistic', 'expected', 'optimistic'].map(scenarioLabel)).toEqual(['Pesimista', 'Esperado', 'Optimista']);
  });
});

describe('indicatorLabel', () => {
  it('names every indicator in Spanish', () => {
    expect(
      [
        'gdp_constant_usd',
        'gdp_per_capita_usd',
        'population',
        'hdi',
        'exports_usd',
        'imports_usd',
        'resource_production'
      ].map(indicatorLabel)
    ).toEqual([
      'PIB',
      'PIB per cápita',
      'Población',
      'IDH',
      'Exportaciones',
      'Importaciones',
      'Producción de recursos'
    ]);
  });

  it('returns an unknown indicator unchanged', () => {
    expect(indicatorLabel('inflation')).toBe('inflation');
  });
});

describe('indicatorSentence', () => {
  it('lowercases a word but keeps an acronym, and adds the resource in brackets', () => {
    expect(indicatorSentence('gdp_constant_usd')).toBe('PIB');
    expect(indicatorSentence('population')).toBe('población');
    expect(indicatorSentence('resource_production', 'gold')).toBe('producción de recursos (oro)');
    expect(indicatorSentence('resource_production')).toBe('producción de recursos');
  });
});

describe('positionLabel and positionPhrase', () => {
  it('say where a value sits against the model range, as a label and inside a sentence', () => {
    expect((['below', 'inside', 'above'] as const).map(positionLabel)).toEqual([
      'Por debajo del rango',
      'Dentro del rango',
      'Por encima del rango'
    ]);
    expect((['below', 'inside', 'above'] as const).map(positionPhrase)).toEqual([
      'por debajo del rango del modelo',
      'dentro del rango del modelo',
      'por encima del rango del modelo'
    ]);
  });
});
