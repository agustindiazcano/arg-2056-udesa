import geometry from './latamGeometry.json';
import { MALVINAS_FEATURE } from '../geo/malvinas.js';

// Match the projection used by scripts/build_ai_evidence.mjs for the other regions.
const malvinasPath = MALVINAS_FEATURE.geometry.coordinates.map((polygon) =>
  polygon.map((ring) => `M${ring.map(([lon, lat]) => `${((lon! + 120) * 4).toFixed(1)},${((34 - lat!) * 4).toFixed(1)}`).join('L')}Z`).join('')
).join('');

export const latamGeometry = geometry.map((region) =>
  region.id === 'FLK' ? { ...region, path: malvinasPath } : region
);
