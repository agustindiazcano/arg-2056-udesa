import { describe, expect, it } from 'vitest';
import { ANDES_TOUR, TOUR_HOLD_MS, tourDurationMs, tourPoseAt, tourSegmentsMs } from '../../src/scenes/andes/tour';
import type { TourStop } from '../../src/scenes/andes/tour';

const a: TourStop = { name: 'a', lon: -70, lat: -32, zoom: 6, pitch: 70, bearing: 350 };
const b: TourStop = { name: 'b', lon: -69, lat: -32.5, zoom: 8, pitch: 70, bearing: 10 };
const c: TourStop = { name: 'c', lon: -69, lat: -32.5, zoom: 8, pitch: 80, bearing: 10 };
const stops = [a, b, c];

describe('tourSegmentsMs', () => {
  it('gives each leg a time: longer for a longer move, never under half a second', () => {
    const [ab, bc] = tourSegmentsMs(stops);
    expect(ab).toBeGreaterThan(bc!);
    expect(bc).toBeGreaterThanOrEqual(500);
  });

  it('adds up to the duration of the tour', () => {
    expect(tourDurationMs(stops)).toBe(tourSegmentsMs(stops).reduce((x, y) => x + y, 0));
  });
});

describe('tourPoseAt', () => {
  it('starts at the first stop and ends at the last one, and clamps outside', () => {
    expect(tourPoseAt(stops, 0)).toMatchObject({ lon: -70, lat: -32, zoom: 6, pitch: 70 });
    expect(tourPoseAt(stops, -50)).toMatchObject({ lon: -70, zoom: 6 });
    const end = tourPoseAt(stops, tourDurationMs(stops));
    expect(end).toMatchObject({ lon: -69, lat: -32.5, zoom: 8, pitch: 80 });
    expect(tourPoseAt(stops, 1e9)).toEqual(end);
  });

  it('passes through the middle stop at the time its leg ends', () => {
    const [ab] = tourSegmentsMs(stops);
    expect(tourPoseAt(stops, ab!)).toMatchObject({ lon: -69, lat: -32.5, zoom: 8, pitch: 70 });
  });

  it('moves smoothly in between: the zoom goes up from the first stop to the second', () => {
    const [ab] = tourSegmentsMs(stops);
    const early = tourPoseAt(stops, ab! * 0.25).zoom;
    const late = tourPoseAt(stops, ab! * 0.75).zoom;
    expect(early).toBeGreaterThan(6);
    expect(late).toBeGreaterThan(early);
    expect(late).toBeLessThan(8.3);
  });

  it('turns the short way around: from 350 to 10 degrees it goes through north, not through south', () => {
    const [ab] = tourSegmentsMs(stops);
    const mid = tourPoseAt(stops, ab! * 0.5).bearing;
    expect(Math.abs(mid)).toBeLessThan(30);
  });

  it('only tilts on a leg that only changes the pitch', () => {
    const [ab, bc] = tourSegmentsMs(stops);
    const mid = tourPoseAt(stops, ab! + bc! * 0.5);
    expect(mid.pitch).toBeGreaterThan(70);
    expect(mid.pitch).toBeLessThan(80);
    expect(mid.lon).toBeCloseTo(-69, 3);
    expect(mid.zoom).toBeCloseTo(8, 2);
  });
});

describe('the tour of the Andes', () => {
  it('starts in a far aerial view of the region and goes on through the points the reader saved', () => {
    expect(ANDES_TOUR.length).toBeGreaterThanOrEqual(7);
    expect(ANDES_TOUR[0]!.zoom).toBeLessThan(5);
    expect(ANDES_TOUR[1]).toMatchObject({ zoom: 6.05, pitch: 71, bearing: -20.2 });
  });

  it('holds one second on the first view before it moves', () => {
    expect(TOUR_HOLD_MS).toBe(1000);
  });

  it('is a quick trip: a few seconds, not a few minutes', () => {
    const seconds = tourDurationMs(ANDES_TOUR) / 1000;
    expect(seconds).toBeGreaterThan(3);
    expect(seconds).toBeLessThan(9);
  });
});
