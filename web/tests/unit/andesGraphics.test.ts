import { describe, expect, it } from 'vitest';
import { DEFAULT_TOGGLES, parseToggles, resolveGraphics } from '../../src/scenes/andes/graphics';

describe('resolveGraphics', () => {
  it('honors every switch on a high tier', () => {
    const g = resolveGraphics('high', DEFAULT_TOGGLES);
    expect(g).toMatchObject({ tier: 'high', snow: true, shadows: true, trees: true, textures: true });
    expect(g.flakeMax).toBeGreaterThan(0);
    expect(g.shadowMapSize).toBe(2048);
    expect(g.treeDensity).toBeGreaterThan(0);
  });

  it('turns off what a low tier cannot afford, even when it is asked for: snow, shadows and textures', () => {
    const g = resolveGraphics('low', DEFAULT_TOGGLES);
    expect(g).toMatchObject({ tier: 'low', snow: false, shadows: false, textures: false });
    expect(g.flakeMax).toBe(0);
    expect(g.shadowMapSize).toBe(0);
  });

  it('keeps some trees on a low tier, fewer than on a high one', () => {
    const low = resolveGraphics('low', DEFAULT_TOGGLES).treeDensity;
    const high = resolveGraphics('high', DEFAULT_TOGGLES).treeDensity;
    expect(low).toBeGreaterThan(0);
    expect(low).toBeLessThan(high);
  });

  it('lets the user switch each effect off on any tier', () => {
    const g = resolveGraphics('high', { snow: false, shadows: false, trees: false, textures: false });
    expect(g).toMatchObject({ snow: false, shadows: false, trees: false, textures: false });
    expect(g.flakeMax).toBe(0);
    expect(g.shadowMapSize).toBe(0);
    expect(g.treeDensity).toBe(0);
  });

  it('has fewer flakes and a smaller shadow map on a medium tier than on a high one', () => {
    const m = resolveGraphics('medium', DEFAULT_TOGGLES);
    const h = resolveGraphics('high', DEFAULT_TOGGLES);
    expect(m.flakeMax).toBeLessThan(h.flakeMax);
    expect(m.shadowMapSize).toBeLessThan(h.shadowMapSize);
    expect(m.shadowMapSize).toBeGreaterThan(0);
  });
});

describe('parseToggles', () => {
  it('reads what was saved', () => {
    const t = { snow: false, shadows: true, trees: false, textures: true };
    expect(parseToggles(JSON.stringify(t))).toEqual(t);
  });

  it('falls back to everything on when there is nothing saved, or it is not readable', () => {
    expect(parseToggles(null)).toEqual(DEFAULT_TOGGLES);
    expect(parseToggles('not json')).toEqual(DEFAULT_TOGGLES);
    expect(parseToggles('42')).toEqual(DEFAULT_TOGGLES);
    expect(parseToggles('null')).toEqual(DEFAULT_TOGGLES);
  });

  it('keeps the valid fields of a partial or wrong save and defaults the rest', () => {
    expect(parseToggles('{"snow":false}')).toEqual({ ...DEFAULT_TOGGLES, snow: false });
    expect(parseToggles('{"snow":"no","trees":false}')).toEqual({ ...DEFAULT_TOGGLES, trees: false });
  });

  it('has everything on by default', () => {
    expect(Object.values(DEFAULT_TOGGLES).every((v) => v === true)).toBe(true);
  });
});
