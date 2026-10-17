import { describe, it, expect } from 'vitest';
import { provinceSectorBreakdown } from '../../src/tour/provinceSectorBreakdown.js';
import type { ProvinceId } from '../../src/types/province.js';

describe('provinceSectorBreakdown', () => {
  describe('when no province is selected (national view)', () => {
    it('returns national sector exports for total view', () => {
      const res = provinceSectorBreakdown('total', null);
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Exportaciones de 2025 por sector');
      expect(res?.unit).toBe('miles de millones de USD');
      expect(res?.parts.map((p) => p.label)).toEqual(['Minería', 'Hidrocarburos', 'Agro']);
    });

    it('returns mineral breakdown for mineria view', () => {
      const res = provinceSectorBreakdown('mineria', null);
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Minería: exportaciones de 2024 por mineral');
      expect(res?.unit).toBe('miles de millones de USD');
      expect(res?.parts.map((p) => p.label)).toContain('Litio');
      expect(res?.parts.map((p) => p.label)).toContain('Oro');
    });

    it('returns oil by province for hidrocarburos view', () => {
      const res = provinceSectorBreakdown('hidrocarburos', null);
      expect(res).not.toBeNull();
      expect(res?.title).toContain('Hidrocarburos');
      expect(res?.parts.length).toBeGreaterThan(0);
    });

    it('returns crop production for agro view', () => {
      const res = provinceSectorBreakdown('agro', null);
      expect(res).not.toBeNull();
      expect(res?.title).toContain('Agro');
      expect(res?.parts.length).toBeGreaterThan(0);
    });
  });

  describe('when a province is selected with sector filter', () => {
    it('shows mineral composition (not macro-sectors) when view is mineria for Salta', () => {
      const res = provinceSectorBreakdown('mineria', 'AR-A');
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Salta: minería');
      expect(res?.unit).toBe('millones de USD');
      // Must NOT contain macro-sectors Minería, Agro, Hidrocarburos
      const labels = res?.parts.map((p) => p.label) ?? [];
      expect(labels).not.toContain('Agro');
      expect(labels).not.toContain('Hidrocarburos');
      expect(labels).toContain('Litio');
      expect(labels).toContain('Oro');
      // Sum must equal Salta mining total (1800)
      const sum = res?.parts.reduce((acc, p) => acc + p.value, 0);
      expect(sum).toBe(1800);
    });

    it('shows minerals for San Juan with exact total', () => {
      const res = provinceSectorBreakdown('mineria', 'AR-J');
      expect(res).not.toBeNull();
      expect(res?.title).toBe('San Juan: minería');
      const labels = res?.parts.map((p) => p.label) ?? [];
      expect(labels).toContain('Oro');
      expect(labels).toContain('Plata');
      const sum = res?.parts.reduce((acc, p) => acc + p.value, 0);
      expect(sum).toBe(2600);
    });

    it('shows minerals for Catamarca with exact total', () => {
      const res = provinceSectorBreakdown('mineria', 'AR-K');
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Catamarca: minería');
      const labels = res?.parts.map((p) => p.label) ?? [];
      expect(labels).toContain('Litio');
      const sum = res?.parts.reduce((acc, p) => acc + p.value, 0);
      expect(sum).toBe(3200);
    });

    it('shows hydrocarbons breakdown for Salta when view is hidrocarburos', () => {
      const res = provinceSectorBreakdown('hidrocarburos', 'AR-A');
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Salta: hidrocarburos');
      const labels = res?.parts.map((p) => p.label) ?? [];
      expect(labels).not.toContain('Minería');
      expect(labels).toContain('Gas natural');
      expect(labels).toContain('Petróleo');
      const sum = res?.parts.reduce((acc, p) => acc + p.value, 0);
      expect(sum).toBe(900);
    });

    it('shows agro breakdown for Salta when view is agro', () => {
      const res = provinceSectorBreakdown('agro', 'AR-A');
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Salta: agro');
      const labels = res?.parts.map((p) => p.label) ?? [];
      expect(labels).not.toContain('Minería');
      expect(labels).not.toContain('Hidrocarburos');
      expect(labels).toContain('Granos y oleaginosas');
      const sum = res?.parts.reduce((acc, p) => acc + p.value, 0);
      expect(sum).toBe(1500);
    });

    it('shows multi-sector breakdown when view is total', () => {
      const res = provinceSectorBreakdown('total', 'AR-A');
      expect(res).not.toBeNull();
      expect(res?.title).toBe('Salta: qué produce');
      const labels = res?.parts.map((p) => p.label) ?? [];
      expect(labels).toContain('Minería');
      expect(labels).toContain('Agro');
      expect(labels).toContain('Hidrocarburos');
    });

    it('returns null when province has production below threshold in selected sector', () => {
      // CABA (AR-C) has 20 in mining (< PRODUCER_MIN 100)
      const resMining = provinceSectorBreakdown('mineria', 'AR-C');
      expect(resMining).toBeNull();

      // CABA (AR-C) has 5 in hydrocarbons (< PRODUCER_MIN 100)
      const resHc = provinceSectorBreakdown('hidrocarburos', 'AR-C');
      expect(resHc).toBeNull();
    });

    it('returns null for invalid province ID', () => {
      const res = provinceSectorBreakdown('mineria', 'INVALID' as ProvinceId);
      expect(res).toBeNull();
    });
  });
});
