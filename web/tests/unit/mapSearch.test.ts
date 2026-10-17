import { describe, it, expect } from 'vitest';
import { searchGeo } from '../../src/ui/mapSearchLogic.js';

describe('searchGeo (C5: map-search)', () => {
  it('returns empty array on empty or whitespace query', () => {
    expect(searchGeo('')).toEqual([]);
    expect(searchGeo('   ')).toEqual([]);
  });

  it('normalizes accents and case insensitive search', () => {
    const withAccent = searchGeo('Córdoba');
    const withoutAccent = searchGeo('cordoba');
    expect(withAccent.length).toBeGreaterThan(0);
    expect(withoutAccent.length).toBeGreaterThan(0);
    expect(withAccent[0]?.name).toBe('Córdoba');
    expect(withoutAccent[0]?.name).toBe('Córdoba');
  });

  it('finds provinces and ranks exact/prefix province match first', () => {
    const results = searchGeo('Salta');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('provincia');
    expect(results[0]?.name).toBe('Salta');
    expect(results[0]?.provinceId).toBe('AR-A');
  });

  it('finds departments across provinces (e.g. Los Andes)', () => {
    const results = searchGeo('Los Andes');
    expect(results.length).toBeGreaterThan(0);
    const losAndes = results.find((r) => r.name === 'Los Andes');
    expect(losAndes).toBeDefined();
    expect(losAndes?.type).toBe('departamento');
    expect(losAndes?.provinceId).toBe('AR-A');
    expect(losAndes?.provinceName).toBe('Salta');
  });

  it('finds departments with special characters like Güemes', () => {
    const withDiaeresis = searchGeo('Güemes');
    const plain = searchGeo('guemes');
    expect(withDiaeresis.length).toBeGreaterThan(0);
    expect(plain.length).toBeGreaterThan(0);
    expect(withDiaeresis[0]?.name).toContain('Guemes');
  });

  it('limits results to maxResults', () => {
    const results = searchGeo('San', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
