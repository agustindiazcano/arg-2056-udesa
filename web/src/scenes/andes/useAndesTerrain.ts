import { useEffect, useState } from 'react';
import { BAKED_TERRAINS, isBaked } from '../../terrain/baked';
import { loadTerrain } from '../../terrain/load';
import { syntheticTerrain } from '../../terrain/synthetic';
import type { Terrain } from '../../types/terrain';
import { terrainBox } from './terrainBox';

/** The id of the region in `terrain/config.json` that bakes the Andes. */
export const ANDES_TERRAIN_ID = 'andes';

const NOT_BAKED = 'el relieve real todavía no está generado';

export type AndesTerrainState =
  | { status: 'loading' }
  | { status: 'ready'; terrain: Terrain; synthetic: boolean; problem: string | null };

/**
 * The terrain of the scene: the baked DEM when it is in `/terrain`, otherwise a made-up one (said so on the screen) with
 * the reason. The scene works either way: a missing file is not a blank screen. `points` and `baked` must be stable arrays
 * (memoized by the caller, or module constants): a new one loads the terrain again.
 */
export function useAndesTerrain(points: ReadonlyArray<{ lon: number; lat: number }> | null, baked: readonly string[] = BAKED_TERRAINS): AndesTerrainState {
  const [state, setState] = useState<AndesTerrainState>({ status: 'loading' });

  useEffect(() => {
    if (!points) return;
    // not baked into this build: nothing to ask the server for (it would answer 404 on every load)
    if (!isBaked(ANDES_TERRAIN_ID, baked)) {
      setState({ status: 'ready', terrain: syntheticTerrain(terrainBox(points), 160, 120), synthetic: true, problem: NOT_BAKED });
      return;
    }
    let active = true;
    loadTerrain('/terrain', ANDES_TERRAIN_ID)
      .then((terrain) => active && setState({ status: 'ready', terrain, synthetic: false, problem: null }))
      .catch((err: unknown) => {
        if (!active) return;
        // the usual reason is that nobody baked the DEM yet (the server answers the page instead of the file)
        const problem = err instanceof Error && /HTTP [45]\d\d|metadata/.test(err.message) ? NOT_BAKED : 'no se pudo cargar el relieve real';
        setState({ status: 'ready', terrain: syntheticTerrain(terrainBox(points), 160, 120), synthetic: true, problem });
      });
    return () => {
      active = false;
    };
  }, [points, baked]);

  return state;
}
