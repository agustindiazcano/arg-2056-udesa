import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { ERAS } from '../../src/content/eras.js';

function mockRange(): { min: number; max: number } {
  const records = JSON.parse(readFileSync(join(process.cwd(), '..', 'data', 'mock', 'economy_series.json'), 'utf8')) as Array<{
    year: number;
  }>;
  const years = records.map((r) => r.year);
  return { min: Math.min(...years), max: Math.max(...years) };
}

describe('placeholder era list', () => {
  it('has exactly three demonstration entries with placeholder labels and no source', () => {
    expect(ERAS.map((e) => e.label)).toEqual(['Era A (provisoria)', 'Era B (provisoria)', 'Era C (provisoria)']);
    expect(ERAS.map((e) => e.id)).toEqual(['era-a', 'era-b', 'era-c']);
    for (const era of ERAS) {
      expect(era.source_id).toBeNull();
      expect(era.placeholder).toBe(true);
    }
  });

  it('has ranges sorted and non-overlapping, inside the data range of the mock', () => {
    const { min, max } = mockRange();
    for (const era of ERAS) {
      expect(era.startYear).toBeLessThanOrEqual(era.endYear);
      expect(era.startYear).toBeGreaterThanOrEqual(min);
      expect(era.endYear).toBeLessThanOrEqual(max);
    }
    for (let i = 1; i < ERAS.length; i++) {
      expect(ERAS[i]!.startYear).toBeGreaterThan(ERAS[i - 1]!.endYear);
    }
  });

  it('is consecutive: each era starts the year after the previous one ends', () => {
    for (let i = 1; i < ERAS.length; i++) {
      expect(ERAS[i]!.startYear).toBe(ERAS[i - 1]!.endYear + 1);
    }
  });

  it('names no real historical period', () => {
    for (const era of ERAS) expect(era.label).toMatch(/\(provisoria\)$/);
  });
});
