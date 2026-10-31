import { describe, expect, it } from 'vitest';
import { MALVINAS_FEATURE } from '../../src/geo/malvinas.js';
import { latamGeometry } from '../../src/tour/latamGeometry.js';

describe('Malvinas on the Latin America map', () => {
  it('uses every detailed island outline in the same geographic projection', () => {
    const islands = latamGeometry.find((region) => region.id === 'FLK')!;
    expect(islands.name).toBe('Islas Malvinas');
    expect(islands.path.match(/M/g)).toHaveLength(MALVINAS_FEATURE.geometry.coordinates.length);
    const [lon, lat] = MALVINAS_FEATURE.geometry.coordinates[0]![0]![0]!;
    expect(islands.path).toContain(`M${((lon! + 120) * 4).toFixed(1)},${((34 - lat!) * 4).toFixed(1)}`);
  });
});
