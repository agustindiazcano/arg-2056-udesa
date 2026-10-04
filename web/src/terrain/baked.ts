/** Ids of the terrains the build found in `public/terrain/` (a `<id>.json` next to the image): `vite.config.ts` fills it at build time. */
declare const __BAKED_TERRAINS__: readonly string[] | undefined;

export const BAKED_TERRAINS: readonly string[] = typeof __BAKED_TERRAINS__ === 'undefined' ? [] : __BAKED_TERRAINS__;

/**
 * Whether a terrain was baked into this build. A scene that asks for a file that is not there gets a 404 on every page load, and the
 * CSP test counts that as an error: the app knows at build time what it ships, so it does not ask.
 */
export function isBaked(id: string, baked: readonly string[] = BAKED_TERRAINS): boolean {
  return baked.includes(id);
}
