import { describe, expect, it } from 'vitest';
import { BATTLE_CENTER, BATTLE_NOTICE, BATTLE_UNITS, battleUnitsGeoJson, offsetLonLat, unitPolygon } from '../../src/scenes/andes/battleField';

describe('offsetLonLat', () => {
  it('moves a point east and north by meters', () => {
    const [lon, lat] = offsetLonLat({ lon: -70, lat: -33 }, 1000, 1000);
    expect(lon).toBeGreaterThan(-70);
    expect(lat).toBeGreaterThan(-33);
    expect((lat + 33) * 111_320).toBeCloseTo(1000, -1);
    expect((lon + 70) * 111_320 * Math.cos((33 * Math.PI) / 180)).toBeCloseTo(1000, -1);
  });
});

describe('unitPolygon', () => {
  it('is a closed rectangle around the center of the unit', () => {
    const ring = unitPolygon({ lon: -70.68, lat: -32.99 }, 0, 0, 200, 100);
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[4]);
    const lons = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    expect(Math.max(...lons) - Math.min(...lons)).toBeGreaterThan(Math.max(...lats) - Math.min(...lats));
  });
});

describe('BATTLE_UNITS', () => {
  const patriots = BATTLE_UNITS.filter((u) => u.side === 'patriot');
  const royalists = BATTLE_UNITS.filter((u) => u.side === 'royalist');

  it('has the two patriot divisions, Soler on the west (the right of an army that faces south) and O\'Higgins on the east', () => {
    const soler = patriots.find((u) => /Soler/.test(u.name))!;
    const ohiggins = patriots.find((u) => /O'Higgins/.test(u.name))!;
    expect(soler.eastM).toBeLessThan(ohiggins.eastM);
  });

  it('puts the royalists south of the patriots, who come down from the north', () => {
    const southmostPatriot = Math.min(...patriots.map((u) => u.northM));
    expect(Math.max(...royalists.map((u) => u.northM))).toBeLessThan(southmostPatriot);
  });

  it('gives each unit a name, a number of men that the sources give and a place on the hills of the royalists', () => {
    expect(royalists.map((u) => u.name)).toEqual(expect.arrayContaining([expect.stringMatching(/Talavera/), expect.stringMatching(/Chiloé/), expect.stringMatching(/Valdivia/)]));
    for (const u of BATTLE_UNITS) {
      expect(u.name.length).toBeGreaterThan(3);
      expect(u.men).toBeGreaterThan(0);
    }
    expect(patriots.reduce((sum, u) => sum + u.men, 0)).toBeGreaterThanOrEqual(3400);
  });
});

describe('battleUnitsGeoJson', () => {
  it('has a polygon (the block) and a point (the label) per unit, each with its side and men', () => {
    const data = battleUnitsGeoJson();
    const polygons = data.features.filter((f) => f.geometry.type === 'Polygon');
    const points = data.features.filter((f) => f.geometry.type === 'Point');
    expect(polygons).toHaveLength(BATTLE_UNITS.length);
    expect(points).toHaveLength(BATTLE_UNITS.length);
    for (const f of polygons) {
      expect(['patriot', 'royalist']).toContain(f.properties!.side);
      expect(f.properties!.height).toBeGreaterThan(0);
    }
    expect(points[0]!.properties!.label).toMatch(/\n/);
  });

  it('stays near the field of Chacabuco', () => {
    for (const f of battleUnitsGeoJson().features) {
      if (f.geometry.type !== 'Point') continue;
      const [lon, lat] = f.geometry.coordinates as [number, number];
      expect(Math.abs(lon - BATTLE_CENTER.lon)).toBeLessThan(0.05);
      expect(Math.abs(lat - BATTLE_CENTER.lat)).toBeLessThan(0.05);
    }
  });
});

describe('BATTLE_NOTICE', () => {
  it('says that it is a recreation and that the positions are approximate', () => {
    expect(BATTLE_NOTICE).toMatch(/recreación/i);
    expect(BATTLE_NOTICE).toMatch(/aproximad/i);
  });
});
