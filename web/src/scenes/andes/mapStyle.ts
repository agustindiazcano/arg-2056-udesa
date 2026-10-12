/** The MapTiler key and the services of the maps of the Andes (the big map, the minimap and the battle scene). The key is public in the bundle: restrict it by origin in MapTiler. */
export const MAPTILER_KEY: string = import.meta.env.VITE_MAPTILER_KEY ?? '';
export const STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
export const DEM_URL = `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`;
/** The relief is drawn as it is (a mountain of 6,900 m looks like one at a glance); a little over 1 helps at the low pitch of the far views. */
export const EXAGGERATION = 1.2;
