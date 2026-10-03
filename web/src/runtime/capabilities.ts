/** What the device can do, read once at start. A feature the browser does not expose is `null` or `false`. */
export interface Capabilities {
  webgl2: boolean;
  cores: number | null;
  memoryGb: number | null;
  coarsePointer: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}

export type QualityTier = 'low' | 'medium' | 'high';

/** The parts of the browser the reader needs, injected so tests can pass any device. All optional. */
export interface CapabilityEnv {
  navigator?: {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  matchMedia?: (query: string) => { matches: boolean };
  createCanvas?: () => { getContext: (type: string) => unknown };
}

/** The real browser, as the reader's environment. Safe where there is no `window` (tests, tooling). */
export function browserEnv(): CapabilityEnv {
  if (typeof window === 'undefined') return {};
  return {
    // The Network Information API and deviceMemory are not in the DOM typings: the reader treats them as optional.
    navigator: typeof navigator === 'undefined' ? undefined : (navigator as CapabilityEnv['navigator']),
    matchMedia: typeof window.matchMedia === 'function' ? (query) => window.matchMedia(query) : undefined,
    createCanvas: typeof document === 'undefined' ? undefined : () => document.createElement('canvas')
  };
}

const positive = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

function matches(env: CapabilityEnv, query: string): boolean {
  try {
    return env.matchMedia?.(query).matches === true;
  } catch {
    return false;
  }
}

function hasWebGL2(env: CapabilityEnv): boolean {
  try {
    return env.createCanvas?.().getContext('webgl2') != null;
  } catch {
    return false;
  }
}

/** Reads the capabilities of `env`. Never throws: whatever fails or is missing becomes `null` or `false`. */
export function readCapabilities(env: CapabilityEnv): Capabilities {
  return {
    webgl2: hasWebGL2(env),
    cores: positive(env.navigator?.hardwareConcurrency),
    memoryGb: positive(env.navigator?.deviceMemory),
    coarsePointer: matches(env, '(pointer: coarse)'),
    reducedMotion: matches(env, '(prefers-reduced-motion: reduce)'),
    saveData: env.navigator?.connection?.saveData === true
  };
}

/**
 * Quality tier from the capabilities. First match wins:
 *
 * | tier   | when                                                                                     |
 * |--------|------------------------------------------------------------------------------------------|
 * | low    | no WebGL2, or saveData, or memory known and <= 2 GB, or cores known and <= 2             |
 * | medium | coarse pointer, or memory known and <= 4 GB, or cores known and <= 4                     |
 * | high   | everything else                                                                          |
 *
 * ASSUMPTION: these thresholds are not measured; the human tunes them on real devices (docs/performance.md).
 */
export function qualityTier(caps: Capabilities): QualityTier {
  const memory = caps.memoryGb;
  const cores = caps.cores;
  if (!caps.webgl2 || caps.saveData || (memory !== null && memory <= 2) || (cores !== null && cores <= 2)) return 'low';
  if (caps.coarsePointer || (memory !== null && memory <= 4) || (cores !== null && cores <= 4)) return 'medium';
  return 'high';
}

/** Number of frame times the automatic downgrade looks at. */
export const FRAME_WINDOW = 120;
/** ASSUMPTION: a median frame above 24 ms (about 40 fps) is too slow for the current tier; tune on real devices. */
export const SLOW_FRAME_MS = 24;

const LOWER: Record<QualityTier, QualityTier> = { high: 'medium', medium: 'low', low: 'low' };

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 === 1 ? sorted[Math.floor(mid)]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * The tier to use after watching the last frame times (ms): one tier lower when the median of the last 120 frames is
 * above 24 ms, the same tier otherwise or with fewer than 120 samples. It never raises a tier.
 */
export function nextTier(current: QualityTier, frameTimesMs: readonly number[]): QualityTier {
  if (frameTimesMs.length < FRAME_WINDOW) return current;
  return median(frameTimesMs.slice(-FRAME_WINDOW)) > SLOW_FRAME_MS ? LOWER[current] : current;
}

/** What each tier lets a heavy scene spend. ASSUMPTION: starting values for the Andes scene; tune on real devices. */
export interface QualityPreset {
  /** fraction of the full particle count */
  particleScale: number;
  /** upper bound of devicePixelRatio */
  pixelRatioCap: number;
  /** fraction of the full terrain resolution */
  terrainDetail: number;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  high: { particleScale: 1, pixelRatioCap: 2, terrainDetail: 1 },
  medium: { particleScale: 0.5, pixelRatioCap: 1.5, terrainDetail: 0.75 },
  low: { particleScale: 0.2, pixelRatioCap: 1, terrainDetail: 0.5 }
};

/** `?quality=low|medium|high` forces a tier, to test any device from any machine. Anything else is ignored. */
export function parseQualityOverride(search: string): QualityTier | null {
  const value = new URLSearchParams(search).get('quality');
  return value === 'low' || value === 'medium' || value === 'high' ? value : null;
}

/** `?debug=1` shows the debug line. */
export function debugEnabled(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}
