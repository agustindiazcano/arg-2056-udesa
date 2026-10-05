import type { QualityTier } from '../../runtime/capabilities';

/** What the reader switches on or off by hand, on top of the quality tier. */
export interface GraphicsToggles {
  snow: boolean;
  shadows: boolean;
  trees: boolean;
  textures: boolean;
}

export const DEFAULT_TOGGLES: GraphicsToggles = { snow: true, shadows: true, trees: true, textures: true };

/** What the renderer builds the scene with: the tier and the switches, as numbers it can use. */
export interface Graphics extends GraphicsToggles {
  tier: QualityTier;
  /** the most flakes of snow, 0 when there is no snow */
  flakeMax: number;
  /** the side of the shadow map, 0 when there are no shadows */
  shadowMapSize: number;
  /** the share of the candidate places that grow a tree, 0 when there are no trees */
  treeDensity: number;
}

/**
 * The effective graphics: a low tier cannot afford snow, shadows or textures, so they are off there whatever the switches
 * say; any tier lets the reader turn an effect off. Trees stay on every tier, in smaller numbers on a low one.
 */
export function resolveGraphics(tier: QualityTier, toggles: GraphicsToggles): Graphics {
  const snow = toggles.snow && tier !== 'low';
  const shadows = toggles.shadows && tier !== 'low';
  const textures = toggles.textures && tier !== 'low';
  const trees = toggles.trees;
  return {
    tier,
    snow,
    shadows,
    trees,
    textures,
    flakeMax: snow ? (tier === 'high' ? 1400 : 700) : 0,
    shadowMapSize: shadows ? (tier === 'high' ? 2048 : 1024) : 0,
    treeDensity: trees ? (tier === 'low' ? 0.3 : 0.6) : 0
  };
}

/** The saved switches, read leniently: what is missing or not a boolean keeps its default, and nothing makes it throw. */
export function parseToggles(raw: string | null): GraphicsToggles {
  if (raw === null) return { ...DEFAULT_TOGGLES };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_TOGGLES };
  }
  if (typeof data !== 'object' || data === null) return { ...DEFAULT_TOGGLES };
  const o = data as Record<string, unknown>;
  const pick = (key: keyof GraphicsToggles) => (typeof o[key] === 'boolean' ? (o[key] as boolean) : DEFAULT_TOGGLES[key]);
  return { snow: pick('snow'), shadows: pick('shadows'), trees: pick('trees'), textures: pick('textures') };
}

export const TOGGLES_KEY = 'andes-graphics';

/** The switches from the browser storage (the defaults where there is none or it cannot be read). */
export function loadToggles(): GraphicsToggles {
  try {
    return parseToggles(window.localStorage.getItem(TOGGLES_KEY));
  } catch {
    return { ...DEFAULT_TOGGLES };
  }
}

/** Keeps the switches in the browser storage; a storage that fails is no reason to stop. */
export function saveToggles(toggles: GraphicsToggles): void {
  try {
    window.localStorage.setItem(TOGGLES_KEY, JSON.stringify(toggles));
  } catch {
    // private window or blocked storage: the choice lasts until the page is closed
  }
}
