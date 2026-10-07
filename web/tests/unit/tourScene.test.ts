// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

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

import { fixedView } from '../../src/tour3d/fixedView';
import { createTourScene } from '../../src/tour3d/tourScene';

describe('fixedView', () => {
  it('looks at the target from the front and above, at a distance that fits the extent', () => {
    const view = fixedView({ width: 10, height: 4 }, 2, { phi: Math.PI / 3, margin: 1, target: [0, 1, 0] });
    expect(view.target).toEqual([0, 1, 0]);
    expect(view.position[0]).toBeCloseTo(0, 9);
    expect(view.position[1]).toBeGreaterThan(1);
    expect(view.position[2]).toBeGreaterThan(0);
    const radius = Math.hypot(view.position[0], view.position[1] - 1, view.position[2]);
    expect(radius).toBeCloseTo(10 / 2 / 2 / Math.tan((32 * Math.PI) / 360), 6);
  });

  it('a narrower screen needs a longer distance', () => {
    const wide = fixedView({ width: 10, height: 4 }, 2, { phi: 1 });
    const narrow = fixedView({ width: 10, height: 4 }, 0.8, { phi: 1 });
    expect(narrow.position[2]).toBeGreaterThan(wide.position[2]);
  });
});

describe('createTourScene', () => {
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    hosts.splice(0).forEach((h) => h.remove());
  });

  it('is a still picture: no wheel, drag, pinch or double click moves the camera', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    const added: string[] = [];
    const scene = createTourScene(host, { pixelRatioCap: 1, view: fixedView({ width: 4, height: 4 }, 1, { phi: 1 }) });
    const canvas = scene.renderer.domElement;
    const original = canvas.addEventListener.bind(canvas);
    canvas.addEventListener = ((type: string, ...rest: unknown[]) => {
      added.push(type);
      return (original as (...a: unknown[]) => void)(type, ...rest);
    }) as typeof canvas.addEventListener;
    const before = scene.camera.position.clone();
    for (const type of ['wheel', 'pointerdown', 'pointermove', 'pointerup', 'dblclick']) canvas.dispatchEvent(new Event(type, { bubbles: true }));
    expect(scene.camera.position.equals(before)).toBe(true);
    expect(added).toEqual([]);
    expect(canvas.style.touchAction).not.toBe('none'); // a touch scrolls the page over it
    scene.dispose();
  });
});
