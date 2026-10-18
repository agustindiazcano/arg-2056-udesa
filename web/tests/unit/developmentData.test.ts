import { describe, expect, it } from 'vitest';
import {
  ARGENTINA_HDI_SERIES,
  ARGENTINA_PISA_SERIES,
  DEVELOPMENT_INDICATORS_DATA,
  LATAM_HDI_2022,
  PISA_LATAM_MATH_2022
} from '../../src/tour/developmentData.js';
import { buildSlides } from '../../src/datasets/slides.js';
import { TABLE_META, withMeta } from '../../src/datasets/quality.js';
import type { SlideData } from '../../src/datasets/types.js';

describe('developmentData', () => {
  it('exposes historical series and peer comparisons with valid bounds', () => {
    expect(ARGENTINA_HDI_SERIES.length).toBeGreaterThanOrEqual(10);
    expect(LATAM_HDI_2022.length).toBe(6);
    expect(ARGENTINA_PISA_SERIES.length).toBe(3);
    expect(PISA_LATAM_MATH_2022.length).toBe(6);

    const latestHdi = ARGENTINA_HDI_SERIES[ARGENTINA_HDI_SERIES.length - 1]!;
    expect(latestHdi.hdi).toBeGreaterThan(0.85);
    expect(latestHdi.hdi).toBeLessThan(1.0);

    const latestPisa = ARGENTINA_PISA_SERIES[ARGENTINA_PISA_SERIES.length - 1]!;
    expect(latestPisa.math).toBeGreaterThan(350);
    expect(latestPisa.reading).toBeGreaterThan(350);
    expect(latestPisa.science).toBeGreaterThan(350);
  });

  it('contains verified metadata and series for all primary development dimensions', () => {
    const requiredKeys = [
      'Esperanza de vida al nacer',
      'Mortalidad infantil',
      'IDH · salud',
      'Resultados PISA',
      'Años de escolaridad',
      'Población graduada universitaria',
      'Graduación STEM',
      'IDH · educación',
      'Índice de Gini',
      'Pobreza monetaria',
      'IDH general'
    ];

    for (const key of requiredKeys) {
      const item = DEVELOPMENT_INDICATORS_DATA[key];
      expect(item, `missing indicator: ${key}`).toBeDefined();
      expect(item!.title.length).toBeGreaterThan(3);
      expect(item!.unit.length).toBeGreaterThan(1);
      expect(item!.definition.length).toBeGreaterThan(10);
      expect(item!.source.length).toBeGreaterThan(5);
      expect(item!.sourceUrl).toMatch(/^https?:\/\//);
      expect(item!.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item!.timeSeries.length).toBeGreaterThanOrEqual(3);
      expect(item!.regionalComparison.length).toBeGreaterThanOrEqual(5);

      // Verify regional comparison contains Argentina
      const hasArgentina = item!.regionalComparison.some((r) => r.country === 'Argentina');
      expect(hasArgentina, `${key} regional comparison must include Argentina`).toBe(true);
    }
  });

  it('ensures slide 16 tables are registered with quality metadata', () => {
    const slideList: SlideData[] = buildSlides();
    const slide16 = slideList.find((s: SlideData) => s.id === '16');
    expect(slide16).toBeDefined();

    for (const table of slide16!.tables) {
      expect(TABLE_META[table.id]).toBeDefined();
      const enriched = withMeta(table);
      expect(enriched.quality).toBeDefined();
      expect(typeof enriched.source).toBe('string');
      expect((enriched.source ?? '').length).toBeGreaterThan(5);
    }
  });
});
