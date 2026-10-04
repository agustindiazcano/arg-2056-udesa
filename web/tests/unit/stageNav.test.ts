// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class FakeRenderer {
    domElement = document.createElement('canvas');
    setPixelRatio() {}
    setClearColor() {}
    setSize() {}
    render() {}
    dispose() {}
    forceContextLoss() {}
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

import { Vector3 } from 'three';
import type { Stage } from '../../src/three/stage';
import { createStage } from '../../src/three/stage';

const options = { pixelRatioCap: 1, target: new Vector3(0, 0.5, 0), radius: 10, theta: 0.4, phi: 1, animateReset: false };
let host: HTMLDivElement;
let stage: Stage;

const canvas = () => stage.renderer.domElement;
const fire = (type: string, init: Record<string, unknown> = {}) => {
  const e = type === 'wheel' ? new WheelEvent(type, { bubbles: true, cancelable: true, ...init }) : new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  Object.assign(e, { pointerId: init.pointerId ?? 1 });
  canvas().dispatchEvent(e);
  return e;
};

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  stage = createStage(host, { ...options, target: new Vector3(0, 0.5, 0) });
});
afterEach(() => {
  stage.dispose();
  host.remove();
  vi.unstubAllGlobals();
});

describe('stage navigation', () => {
  it('turns with a left drag, with no azimuth limit', () => {
    fire('pointerdown', { clientX: 100, clientY: 100, button: 0 });
    fire('pointermove', { clientX: 600, clientY: 100 });
    fire('pointerup', { clientX: 600, clientY: 100 });
    const turned = 0.4 - 500 * 0.008; // -3.6 rad: past -pi, so it wraps instead of stopping
    expect(Math.cos(stage.pose.theta)).toBeCloseTo(Math.cos(turned), 8);
    expect(Math.sin(stage.pose.theta)).toBeCloseTo(Math.sin(turned), 8);
    expect(stage.pose.phi).toBeCloseTo(1, 10);
  });

  it('moves the target with a right drag and with a Shift drag, and does not turn', () => {
    fire('pointerdown', { clientX: 100, clientY: 100, button: 2 });
    fire('pointermove', { clientX: 140, clientY: 100 });
    fire('pointerup', { clientX: 140, clientY: 100 });
    expect(stage.pose.x !== 0 || stage.pose.z !== 0).toBe(true);
    expect(stage.pose.theta).toBeCloseTo(0.4, 10);
    const after = { x: stage.pose.x, z: stage.pose.z };
    fire('pointerdown', { clientX: 100, clientY: 100, button: 0, shiftKey: true });
    fire('pointermove', { clientX: 100, clientY: 130 });
    fire('pointerup', { clientX: 100, clientY: 130 });
    expect(stage.pose.theta).toBeCloseTo(0.4, 10);
    expect(stage.pose.y).not.toBe(0.5);
    expect(after).not.toEqual({ x: 0, z: 0 });
  });

  it('zooms with the wheel within the range and stops the page from scrolling', () => {
    const e = fire('wheel', { deltaY: -100 });
    expect(e.defaultPrevented).toBe(true);
    expect(stage.pose.radius).toBeCloseTo(10 * 0.92, 10);
    for (let i = 0; i < 200; i++) fire('wheel', { deltaY: -100 });
    expect(stage.pose.radius).toBeCloseTo(2.5, 10);
    for (let i = 0; i < 200; i++) fire('wheel', { deltaY: 100 });
    expect(stage.pose.radius).toBeCloseTo(30, 10);
  });

  it('zooms with the buttons and a +  then - returns to the same distance', () => {
    stage.nav.zoomIn();
    expect(stage.pose.radius).toBeCloseTo(8, 10);
    stage.nav.zoomOut();
    expect(stage.pose.radius).toBeCloseTo(10, 10);
  });

  it('restores the start pose with reset and with a double click', () => {
    fire('wheel', { deltaY: -100 });
    fire('pointerdown', { clientX: 0, clientY: 0, button: 0 });
    fire('pointermove', { clientX: 50, clientY: 40 });
    fire('pointerup', { clientX: 50, clientY: 40 });
    stage.nav.reset();
    expect([stage.pose.x, stage.pose.y, stage.pose.z, stage.pose.theta, stage.pose.phi, stage.pose.radius]).toEqual([0, 0.5, 0, 0.4, 1, 10]);
    fire('wheel', { deltaY: 100 });
    fire('dblclick');
    expect(stage.pose.radius).toBe(10);
  });

  it('keeps the pose it is given: a view rebuilt for new data starts where the old one was', () => {
    fire('wheel', { deltaY: -100 });
    const pose = stage.pose;
    stage.dispose();
    stage = createStage(host, { ...options, target: new Vector3(0, 0.5, 0), pose });
    expect(stage.pose).toBe(pose);
    expect(stage.camera.position.length()).toBeGreaterThan(0);
    expect(stage.pose.radius).toBeCloseTo(9.2, 10);
    // and its reset still goes to the real start, not to the kept pose
    stage.nav.reset();
    expect(stage.pose.radius).toBe(10);
  });

  it('flies to a given pose (and jumps there when the reset does not glide)', () => {
    stage.nav.flyTo({ x: 1, y: 2, z: 3, theta: 0.1, phi: 0.7, radius: 4 });
    expect([stage.pose.x, stage.pose.y, stage.pose.z, stage.pose.theta, stage.pose.phi, stage.pose.radius]).toEqual([1, 2, 3, 0.1, 0.7, 4]);
  });

  it('moves the target at once with setTarget, keeping the angles and the distance', () => {
    stage.nav.setTarget(1, 2, 3);
    expect([stage.pose.x, stage.pose.y, stage.pose.z]).toEqual([1, 2, 3]);
    expect([stage.pose.theta, stage.pose.phi, stage.pose.radius]).toEqual([0.4, 1, 10]);
  });

  it('keeps the target inside the box when it is moved', () => {
    stage.nav.setTarget(1e6, 1e6, -1e6);
    expect(stage.pose.x).toBeLessThanOrEqual(5);
    expect(stage.pose.y).toBeLessThanOrEqual(10.5);
    expect(stage.pose.z).toBeGreaterThanOrEqual(-5);
  });

  it('publishes the camera in a data attribute at the end of a gesture', () => {
    fire('wheel', { deltaY: -100 });
    const [, , radius] = canvas().dataset.camera!.split(',');
    expect(Number(radius)).toBeCloseTo(9.2, 3);
  });

  it('removes every listener it added on dispose', () => {
    const other = createStage(host, { ...options, target: new Vector3(0, 0.5, 0) });
    const oel = other.renderer.domElement;
    const a = vi.spyOn(oel, 'addEventListener');
    const r = vi.spyOn(oel, 'removeEventListener');
    other.dispose();
    expect(r.mock.calls.map((c) => c[0]).sort()).toEqual(
      ['contextmenu', 'dblclick', 'pointercancel', 'pointerdown', 'pointermove', 'pointerup', 'wheel']
    );
    expect(a.mock.calls.length).toBe(0);
  });
});
