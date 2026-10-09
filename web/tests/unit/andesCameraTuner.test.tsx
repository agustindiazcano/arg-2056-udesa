// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CameraTuner } from '../../src/scenes/andes/CameraTuner';
import type { CameraApi } from '../../src/scenes/andes/cameraKeyframes';
import { clampView, formatKeyframes, parseKeyframes, roundView } from '../../src/scenes/andes/cameraKeyframes';

const view = { lon: -69.8012345, lat: -32.4012345, zoom: 9.123456, pitch: 61.2345, bearing: -33.3333 };

describe('roundView', () => {
  it('keeps what is worth a number to type: 5 decimals of a degree, 2 of zoom, 1 of the angles', () => {
    expect(roundView(view)).toEqual({ lon: -69.80123, lat: -32.40123, zoom: 9.12, pitch: 61.2, bearing: -33.3 });
  });
});

describe('clampView', () => {
  it('keeps every number where the map accepts it and turns the bearing into -180 to 180', () => {
    expect(clampView({ lon: 400, lat: 120, zoom: 40, pitch: 99, bearing: 270 })).toEqual({ lon: 180, lat: 85, zoom: 17.5, pitch: 82, bearing: -90 });
    expect(clampView({ lon: -400, lat: -120, zoom: -3, pitch: -4, bearing: -190 })).toEqual({ lon: -180, lat: -85, zoom: 0, pitch: 0, bearing: 170 });
  });

  it('turns a number that is not one into the value it had', () => {
    expect(clampView({ ...view, zoom: Number.NaN }, view).zoom).toBe(view.zoom);
  });
});

describe('formatKeyframes and parseKeyframes', () => {
  const frames = [{ name: 'Aérea', day: 0, ...roundView(view) }];

  it('writes JSON that reads back the same', () => {
    expect(parseKeyframes(formatKeyframes(frames))).toEqual(frames);
  });

  it('reads nothing from what is not a list of points, and never throws', () => {
    expect(parseKeyframes('')).toEqual([]);
    expect(parseKeyframes('{"a":1}')).toEqual([]);
    expect(parseKeyframes('not json')).toEqual([]);
    expect(parseKeyframes(JSON.stringify([{ name: 1 }, { name: 'ok', day: 1, lon: 1, lat: 2, zoom: 3, pitch: 4, bearing: 5 }]))).toHaveLength(1);
  });
});

describe('CameraTuner', () => {
  let current = { ...roundView(view) };
  const api: CameraApi = {
    get: () => ({ ...current }),
    set: vi.fn((v) => {
      current = { ...v };
    })
  };

  beforeEach(() => {
    window.localStorage.clear();
    current = { ...roundView(view) };
    vi.mocked(api.set).mockClear();
  });
  afterEach(() => cleanup());

  const renderTuner = (onGo = vi.fn()) => {
    render(<CameraTuner api={{ current: api }} view={current} day={3} onGo={onGo} />);
    return onGo;
  };

  it('shows the five numbers of the camera', () => {
    renderTuner();
    expect((screen.getByLabelText('Zoom') as HTMLInputElement).value).toBe('9.12');
    expect((screen.getByLabelText('Inclinación') as HTMLInputElement).value).toBe('61.2');
    expect((screen.getByLabelText('Giro') as HTMLInputElement).value).toBe('-33.3');
    expect((screen.getByLabelText('Longitud') as HTMLInputElement).value).toBe('-69.80123');
    expect((screen.getByLabelText('Latitud') as HTMLInputElement).value).toBe('-32.40123');
  });

  it('moves the camera to the typed numbers (clamped) and frees the camera mode', () => {
    const onGo = renderTuner();
    fireEvent.change(screen.getByLabelText('Zoom'), { target: { value: '12.5' } });
    fireEvent.change(screen.getByLabelText('Inclinación'), { target: { value: '95' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ir a estos valores' }));
    expect(api.set).toHaveBeenCalledWith({ lon: -69.80123, lat: -32.40123, zoom: 12.5, pitch: 82, bearing: -33.3 }, 600);
    expect(onGo).toHaveBeenCalled();
  });

  it('saves the current camera as a named point with the day of the campaign, lists it and keeps it for the next visit', () => {
    renderTuner();
    fireEvent.change(screen.getByLabelText('Nombre del punto'), { target: { value: 'Vista aérea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar punto' }));
    const list = screen.getByRole('list', { name: 'Puntos guardados' });
    expect(within(list).getByText('Vista aérea')).toBeTruthy();
    expect(within(list).getByText(/zoom 9\.12/)).toBeTruthy();
    expect(parseKeyframes(window.localStorage.getItem('andes-camera-keyframes') ?? '')[0]).toMatchObject({ name: 'Vista aérea', day: 3, zoom: 9.12 });
    cleanup();
    renderTuner();
    expect(within(screen.getByRole('list', { name: 'Puntos guardados' })).getByText('Vista aérea')).toBeTruthy();
  });

  it('goes to a saved point and deletes it', () => {
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar punto' }));
    fireEvent.click(screen.getByRole('button', { name: /^Ir a Punto 1/ }));
    expect(api.set).toHaveBeenCalledWith(expect.objectContaining({ zoom: 9.12 }), 1200);
    fireEvent.click(screen.getByRole('button', { name: /^Borrar Punto 1/ }));
    expect(screen.queryByRole('list', { name: 'Puntos guardados' })).toBeNull();
  });

  it('copies the points as JSON', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar punto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copiar JSON' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(parseKeyframes(String((writeText.mock.calls[0] as unknown[])[0]))).toHaveLength(1);
  });
});
