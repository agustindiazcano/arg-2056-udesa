import { describe, it, expect } from 'vitest';
import {
  SCENES,
  nextScene,
  prevScene,
} from '../../src/types/scene.js';
import { parseYear, Year } from '../../src/types/year.js';
import { parseDayOfCampaign, DayOfCampaign } from '../../src/types/campaign.js';
import { SCENARIOS } from '../../src/types/scenario.js';
import { PROVINCES, isProvinceId } from '../../src/types/province.js';
import { KEY_MAP, resolveKey } from '../../src/types/keys.js';

describe('Types', () => {
  describe('scene.ts', () => {
    it('SCENES has 6 unique entries', () => {
      expect(SCENES).toHaveLength(6);
      expect(new Set(SCENES).size).toBe(6);
    });

    it('nextScene / prevScene clamp at both ends and visit each exactly once', () => {
      let current = SCENES[0]; // 'andes'
      const visited = new Set([current]);
      
      // walking forward
      for (let i = 0; i < SCENES.length - 1; i++) {
        current = nextScene(current);
        visited.add(current);
      }
      expect(visited.size).toBe(6);
      expect(current).toBe(SCENES[5]); // 'sandbox'
      expect(nextScene(current)).toBe(current); // clamp

      // walking backward
      for (let i = 0; i < SCENES.length - 1; i++) {
        current = prevScene(current);
      }
      expect(current).toBe(SCENES[0]); // 'andes'
      expect(prevScene(current)).toBe(current); // clamp
    });
  });

  describe('year.ts', () => {
    it('parseYear accepts 1810 and 2056', () => {
      expect(parseYear(1810)).toBe(1810);
      expect(parseYear(2056)).toBe(2056);
    });

    it('parseYear rejects 1809, 2057, 1900.5, NaN, "1900", null', () => {
      expect(() => parseYear(1809)).toThrow(RangeError);
      expect(() => parseYear(2057)).toThrow(RangeError);
      expect(() => parseYear(1900.5)).toThrow(RangeError);
      expect(() => parseYear(NaN)).toThrow(RangeError);
      expect(() => parseYear('1900')).toThrow(RangeError);
      expect(() => parseYear(null)).toThrow(RangeError);
    });
  });

  describe('campaign.ts', () => {
    it('parseDayOfCampaign accepts 0 and 365', () => {
      expect(parseDayOfCampaign(0)).toBe(0);
      expect(parseDayOfCampaign(365)).toBe(365);
    });

    it('parseDayOfCampaign rejects -1, 366, 1.5, NaN', () => {
      expect(() => parseDayOfCampaign(-1)).toThrow(RangeError);
      expect(() => parseDayOfCampaign(366)).toThrow(RangeError);
      expect(() => parseDayOfCampaign(1.5)).toThrow(RangeError);
      expect(() => parseDayOfCampaign(NaN)).toThrow(RangeError);
    });

    it('Year and DayOfCampaign are distinct types', () => {
      const year = parseYear(2000);
      const day = parseDayOfCampaign(10);
      
      // @ts-expect-error
      const _assignToYear: Year = day;
      
      // @ts-expect-error
      const _assignToDay: DayOfCampaign = year;
      
      expect(true).toBe(true);
    });
  });

  describe('province.ts', () => {
    it('PROVINCES has 24 entries, all ids unique, all match /^AR-[A-Z]$/', () => {
      expect(PROVINCES).toHaveLength(24);
      
      const ids = PROVINCES.map(p => p.id);
      expect(new Set(ids).size).toBe(24);
      
      for (const id of ids) {
        expect(id).toMatch(/^AR-[A-Z]$/);
        expect(isProvinceId(id)).toBe(true);
      }
      expect(isProvinceId('AR-1')).toBe(false);
      expect(isProvinceId('AR-a')).toBe(false);
    });
  });

  describe('keys.ts', () => {
    it('no two keys map to the same action except + and =', () => {
      const actionMap = new Map<string, string[]>();
      for (const [key, action] of Object.entries(KEY_MAP)) {
        const actionStr = JSON.stringify(action);
        if (!actionMap.has(actionStr)) actionMap.set(actionStr, []);
        actionMap.get(actionStr)!.push(key);
      }
      
      for (const [actionStr, keys] of actionMap.entries()) {
        if (actionStr.includes('speedUp')) {
          expect(keys.length).toBe(2);
          expect(keys).toContain('+');
          expect(keys).toContain('=');
        } else {
          expect(keys.length).toBe(1);
        }
      }
    });

    it('resolveKey is case-insensitive for letters', () => {
      expect(resolveKey('D')).toEqual(resolveKey('d'));
      expect(resolveKey('D')).toEqual({ type: 'toggle3D' });
    });

    it('unknown key returns undefined', () => {
      expect(resolveKey('Unknown')).toBeUndefined();
    });
  });
});
