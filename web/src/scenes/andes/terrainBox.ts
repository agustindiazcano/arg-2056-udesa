/** [west, south, east, north] of the made-up terrain: every event with this margin (degrees) on each side. */
const MARGIN = 0.6;

export function terrainBox(points: ReadonlyArray<{ lon: number; lat: number }>): [number, number, number, number] {
  if (points.length === 0) return [-71.1, -34, -68.3, -32.2];
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const p of points) {
    west = Math.min(west, p.lon);
    east = Math.max(east, p.lon);
    south = Math.min(south, p.lat);
    north = Math.max(north, p.lat);
  }
  return [west - MARGIN, south - MARGIN, east + MARGIN, north + MARGIN];
}
