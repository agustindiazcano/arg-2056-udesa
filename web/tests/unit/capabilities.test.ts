import { describe, it, expect } from 'vitest';
import {
  QUALITY_PRESETS,
  debugEnabled,
  nextTier,
  parseQualityOverride,
  qualityTier,
  readCapabilities
} from '../../src/runtime/capabilities';
import type { Capabilities, CapabilityEnv } from '../../src/runtime/capabilities';

const caps = (over: Partial<Capabilities> = {}): Capabilities => ({
  webgl2: true,
  cores: 8,
  memoryGb: 8,
  coarsePointer: false,
  reducedMotion: false,
  saveData: false,
  ...over
});

/** A media query matcher that answers true only for the listed queries. */
const media = (...matching: string[]) => (query: string) => ({ matches: matching.includes(query) });

describe('readCapabilities', () => {
  it('reads every feature when the browser exposes them all', () => {
    const env: CapabilityEnv = {
      navigator: { hardwareConcurrency: 8, deviceMemory: 4, connection: { saveData: true } },
      matchMedia: media('(pointer: coarse)', '(prefers-reduced-motion: reduce)'),
      createCanvas: () => ({ getContext: (type: string) => (type === 'webgl2' ? {} : null) })
    };
    expect(readCapabilities(env)).toEqual({
      webgl2: true,
      cores: 8,
      memoryGb: 4,
      coarsePointer: true,
      reducedMotion: true,
      saveData: true
    });
  });

  it('gives null or false for everything when the browser exposes nothing', () => {
    expect(readCapabilities({})).toEqual({
      webgl2: false,
      cores: null,
      memoryGb: null,
      coarsePointer: false,
      reducedMotion: false,
      saveData: false
    });
  });

  it('does not throw when getContext throws, and reports no WebGL2', () => {
    const env: CapabilityEnv = {
      createCanvas: () => ({
        getContext: () => {
          throw new Error('blocked');
        }
      })
    };
    expect(readCapabilities(env).webgl2).toBe(false);
  });

  it('does not throw when createCanvas throws, and reports no WebGL2', () => {
    const env: CapabilityEnv = {
      createCanvas: () => {
        throw new Error('no canvas');
      }
    };
    expect(readCapabilities(env).webgl2).toBe(false);
  });

  it('releases the probe context so it does not count against the browser limit of live contexts', () => {
    let lost = 0;
    const context = { getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext: () => (lost += 1) } : null) };
    expect(readCapabilities({ createCanvas: () => ({ getContext: () => context }) }).webgl2).toBe(true);
    expect(lost).toBe(1);
  });

  it('still reports WebGL2 when the probe context cannot be released', () => {
    const context = {
      getExtension: () => {
        throw new Error('no extension');
      }
    };
    expect(readCapabilities({ createCanvas: () => ({ getContext: () => context }) }).webgl2).toBe(true);
  });

  it('reports no WebGL2 when getContext returns null', () => {
    expect(readCapabilities({ createCanvas: () => ({ getContext: () => null }) }).webgl2).toBe(false);
  });

  it('gives memoryGb null when deviceMemory is undefined, and keeps the cores', () => {
    const env: CapabilityEnv = { navigator: { hardwareConcurrency: 4 } };
    expect(readCapabilities(env)).toMatchObject({ memoryGb: null, cores: 4 });
  });

  it('ignores values that are not positive finite numbers', () => {
    const env: CapabilityEnv = { navigator: { hardwareConcurrency: 0, deviceMemory: Number.NaN } };
    expect(readCapabilities(env)).toMatchObject({ memoryGb: null, cores: null });
  });

  it('saveData is false unless the connection says true', () => {
    expect(readCapabilities({ navigator: { connection: { saveData: false } } }).saveData).toBe(false);
    expect(readCapabilities({ navigator: { connection: {} } }).saveData).toBe(false);
  });

  it('does not throw when matchMedia throws, and reports false for both queries', () => {
    const env: CapabilityEnv = {
      matchMedia: () => {
        throw new Error('no matchMedia');
      }
    };
    expect(readCapabilities(env)).toMatchObject({ coarsePointer: false, reducedMotion: false });
  });

  it('asks matchMedia for exactly the two queries', () => {
    const asked: string[] = [];
    readCapabilities({
      matchMedia: (query) => {
        asked.push(query);
        return { matches: false };
      }
    });
    expect(asked.sort()).toEqual(['(pointer: coarse)', '(prefers-reduced-motion: reduce)']);
  });
});

describe('qualityTier', () => {
  it('is high for a capable device', () => {
    expect(qualityTier(caps())).toBe('high');
  });

  it('is high when memory and cores are unknown and nothing else limits the device', () => {
    expect(qualityTier(caps({ cores: null, memoryGb: null }))).toBe('high');
  });

  describe('low', () => {
    it('without WebGL2', () => {
      expect(qualityTier(caps({ webgl2: false }))).toBe('low');
    });
    it('with saveData', () => {
      expect(qualityTier(caps({ saveData: true }))).toBe('low');
    });
    it('with memory of at most 2 GB (2 is low, 2.5 is not)', () => {
      expect(qualityTier(caps({ memoryGb: 2 }))).toBe('low');
      expect(qualityTier(caps({ memoryGb: 0.5 }))).toBe('low');
      expect(qualityTier(caps({ memoryGb: 2.5 }))).toBe('medium');
    });
    it('with at most 2 cores (2 is low, 3 is not)', () => {
      expect(qualityTier(caps({ cores: 2 }))).toBe('low');
      expect(qualityTier(caps({ cores: 1 }))).toBe('low');
      expect(qualityTier(caps({ cores: 3 }))).toBe('medium');
    });
    it('wins over the medium rules', () => {
      expect(qualityTier(caps({ webgl2: false, coarsePointer: true, memoryGb: 4 }))).toBe('low');
    });
  });

  describe('medium', () => {
    it('with a coarse pointer', () => {
      expect(qualityTier(caps({ coarsePointer: true }))).toBe('medium');
    });
    it('with memory of at most 4 GB (4 is medium, 8 is high)', () => {
      expect(qualityTier(caps({ memoryGb: 4 }))).toBe('medium');
      expect(qualityTier(caps({ memoryGb: 8 }))).toBe('high');
    });
    it('with at most 4 cores (4 is medium, 5 is high)', () => {
      expect(qualityTier(caps({ cores: 4 }))).toBe('medium');
      expect(qualityTier(caps({ cores: 5 }))).toBe('high');
    });
  });

  it('reduced motion alone does not change the tier', () => {
    expect(qualityTier(caps({ reducedMotion: true }))).toBe('high');
  });
});

describe('nextTier', () => {
  const frames = (value: number, count = 120) => Array.from({ length: count }, () => value);

  it('does not downgrade when the median is exactly 24 ms', () => {
    expect(nextTier('high', frames(24))).toBe('high');
  });

  it('downgrades one tier when the median is 24.1 ms: high to medium, medium to low', () => {
    expect(nextTier('high', frames(24.1))).toBe('medium');
    expect(nextTier('medium', frames(24.1))).toBe('low');
  });

  it('keeps low as low', () => {
    expect(nextTier('low', frames(100))).toBe('low');
  });

  it('does not downgrade with fewer than 120 samples, however slow', () => {
    expect(nextTier('high', frames(100, 119))).toBe('high');
    expect(nextTier('high', [])).toBe('high');
  });

  it('never raises a tier, however fast the frames are', () => {
    expect(nextTier('low', frames(4))).toBe('low');
    expect(nextTier('medium', frames(4))).toBe('medium');
  });

  it('uses only the last 120 samples', () => {
    const slowThenFast = [...frames(100, 50), ...frames(10, 120)];
    expect(nextTier('high', slowThenFast)).toBe('high');
    const fastThenSlow = [...frames(10, 50), ...frames(30, 120)];
    expect(nextTier('high', fastThenSlow)).toBe('medium');
  });

  it('uses the median, so a few slow frames do not downgrade', () => {
    const spikes = [...frames(10, 100), ...frames(500, 20)];
    expect(nextTier('high', spikes)).toBe('high');
  });

  it('averages the two middle samples of an even window', () => {
    // 60 frames at 20 ms and 60 at 28 ms: the median is (20 + 28) / 2 = 24, which does not downgrade
    expect(nextTier('high', [...frames(20, 60), ...frames(28, 60)])).toBe('high');
    // 59 at 20 and 61 at 28: the two middle samples are 28 and 28
    expect(nextTier('high', [...frames(20, 59), ...frames(28, 61)])).toBe('medium');
  });
});

describe('QUALITY_PRESETS', () => {
  it('has exactly these values per tier', () => {
    expect(QUALITY_PRESETS).toEqual({
      high: { particleScale: 1, pixelRatioCap: 2, terrainDetail: 1 },
      medium: { particleScale: 0.5, pixelRatioCap: 1.5, terrainDetail: 0.75 },
      low: { particleScale: 0.2, pixelRatioCap: 1, terrainDetail: 0.5 }
    });
  });
});

describe('parseQualityOverride and debugEnabled', () => {
  it('reads ?quality=low|medium|high', () => {
    expect(parseQualityOverride('?quality=low')).toBe('low');
    expect(parseQualityOverride('?debug=1&quality=medium')).toBe('medium');
    expect(parseQualityOverride('quality=high')).toBe('high');
  });

  it('ignores a missing or invalid value', () => {
    expect(parseQualityOverride('')).toBeNull();
    expect(parseQualityOverride('?quality=ultra')).toBeNull();
    expect(parseQualityOverride('?quality=')).toBeNull();
    expect(parseQualityOverride('?Quality=low')).toBeNull();
  });

  it('debug is on only for ?debug=1', () => {
    expect(debugEnabled('?debug=1')).toBe(true);
    expect(debugEnabled('?quality=low&debug=1')).toBe(true);
    expect(debugEnabled('')).toBe(false);
    expect(debugEnabled('?debug=0')).toBe(false);
    expect(debugEnabled('?debug=true')).toBe(false);
  });
});
