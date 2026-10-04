import { describe, expect, it, vi } from 'vitest';
import { resetMap, zoomMap } from '../../src/charts/mapNav';

const chart = (zoom: number | undefined) => ({
  getOption: vi.fn(() => ({ geo: [{ zoom }] })),
  getWidth: () => 800,
  getHeight: () => 400,
  dispatchAction: vi.fn(),
  setOption: vi.fn()
});

describe('zoomMap', () => {
  it('zooms in about the centre of the chart by the button factor', () => {
    const c = chart(1);
    zoomMap(c as never, 'in');
    expect(c.dispatchAction).toHaveBeenCalledWith({ type: 'geoRoam', componentType: 'geo', zoom: 1.25, originX: 400, originY: 200 });
  });

  it('zooms out by the inverse', () => {
    const c = chart(4);
    zoomMap(c as never, 'out');
    expect((c.dispatchAction.mock.calls[0]![0] as { zoom: number }).zoom).toBeCloseTo(0.8, 10);
  });

  it('does nothing at the limits', () => {
    const top = chart(8);
    zoomMap(top as never, 'in');
    expect(top.dispatchAction).not.toHaveBeenCalled();
    const bottom = chart(1);
    zoomMap(bottom as never, 'out');
    expect(bottom.dispatchAction).not.toHaveBeenCalled();
  });

  it('treats a chart with no option yet as zoom 1', () => {
    const c = { ...chart(1), getOption: vi.fn(() => undefined) };
    expect(() => zoomMap(c as never, 'in')).not.toThrow();
    expect(c.dispatchAction).toHaveBeenCalledTimes(1);
  });

  it('treats a map nobody zoomed yet as zoom 1', () => {
    const c = chart(undefined);
    zoomMap(c as never, 'in');
    expect(c.dispatchAction).toHaveBeenCalledTimes(1);
  });
});

describe('resetMap', () => {
  it('shows the whole territory again', () => {
    const c = chart(3);
    resetMap(c as never);
    expect(c.setOption).toHaveBeenCalledWith({ geo: { zoom: 1, center: null } });
  });
});
