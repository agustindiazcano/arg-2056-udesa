// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBaked } from '../../src/terrain/baked';
import { useAndesTerrain } from '../../src/scenes/andes/useAndesTerrain';

const POINTS = [
  { lon: -70.1, lat: -33 },
  { lon: -69.9, lat: -33.2 }
];

// stable arrays: the hook reloads when its inputs change identity
const NOTHING_BAKED: readonly string[] = [];
const ANDES_BAKED: readonly string[] = ['andes'];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isBaked', () => {
  it('is true only for a terrain that the build found in /terrain', () => {
    expect(isBaked('andes', ['andes', 'patagonia'])).toBe(true);
    expect(isBaked('andes', [])).toBe(false);
    expect(isBaked('andes', ['patagonia'])).toBe(false);
  });
});

describe('useAndesTerrain when the terrain is not baked', () => {
  it('does not ask the server for a file that is not there: it goes straight to the made-up terrain and says why', async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('should not be called')));
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() => useAndesTerrain(POINTS, NOTHING_BAKED));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(fetchSpy).not.toHaveBeenCalled();
    if (result.current.status !== 'ready') throw new Error('not ready');
    expect(result.current.synthetic).toBe(true);
    expect(result.current.problem).toContain('todavía no está generado');
  });

  it('still asks for the baked file when the build found it, and falls back with the plain reason when it fails', async () => {
    const fetchSpy = vi.fn((_url: string) => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}), blob: () => Promise.resolve(new Blob()) }));
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() => useAndesTerrain(POINTS, ANDES_BAKED));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]![0])).toBe('/terrain/andes.json');
    if (result.current.status !== 'ready') throw new Error('not ready');
    expect(result.current.synthetic).toBe(true);
    expect(result.current.problem).toContain('todavía no está generado');
  });
});
