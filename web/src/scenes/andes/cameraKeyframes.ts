/** The camera of the Andes map as five numbers. */
export interface CameraView {
  lon: number;
  lat: number;
  zoom: number;
  /** degrees from looking straight down (0) toward the horizon */
  pitch: number;
  /** compass degrees the camera looks toward, -180 to 180 */
  bearing: number;
}

/** A camera saved by the reader to build the tour from: a name, the day of the campaign it was saved at, and the five numbers. */
export interface CameraKeyframe extends CameraView {
  name: string;
  day: number;
}

/** How the camera tuner talks to the map: read the camera, move it (`ms` of animation, none by default). */
export interface CameraApi {
  get: () => CameraView;
  set: (view: CameraView, ms?: number) => void;
}

const round = (n: number, decimals: number) => {
  const k = 10 ** decimals;
  return Math.round(n * k) / k;
};

/** The numbers worth typing: 5 decimals of a degree (about a meter), 2 of zoom, 1 of the angles. */
export function roundView(v: CameraView): CameraView {
  return { lon: round(v.lon, 5), lat: round(v.lat, 5), zoom: round(v.zoom, 2), pitch: round(v.pitch, 1), bearing: round(v.bearing, 1) };
}

const between = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** The view with every number where the map accepts it and the bearing turned into -180 to 180; a number that is not one keeps its value in `fallback` (0 without it). */
export function clampView(v: CameraView, fallback?: CameraView): CameraView {
  const pick = (n: number, key: keyof CameraView) => (Number.isFinite(n) ? n : (fallback?.[key] ?? 0));
  return {
    lon: between(pick(v.lon, 'lon'), -180, 180),
    lat: between(pick(v.lat, 'lat'), -85, 85),
    zoom: between(pick(v.zoom, 'zoom'), 0, 17.5),
    pitch: between(pick(v.pitch, 'pitch'), 0, 82),
    bearing: ((((pick(v.bearing, 'bearing') + 180) % 360) + 360) % 360) - 180
  };
}

/** The saved points as JSON text, to copy and hand over. */
export function formatKeyframes(frames: readonly CameraKeyframe[]): string {
  return JSON.stringify(frames, null, 2);
}

const isNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** The points of a JSON text; whatever is not a well formed point is left out, and text that is not a list gives an empty one (it never throws). */
export function parseKeyframes(text: string): CameraKeyframe[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: CameraKeyframe[] = [];
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    if (typeof o.name !== 'string' || ![o.day, o.lon, o.lat, o.zoom, o.pitch, o.bearing].every(isNumber)) continue;
    out.push({ name: o.name, day: o.day as number, lon: o.lon as number, lat: o.lat as number, zoom: o.zoom as number, pitch: o.pitch as number, bearing: o.bearing as number });
  }
  return out;
}
