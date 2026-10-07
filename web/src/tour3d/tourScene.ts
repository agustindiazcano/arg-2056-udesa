import { Mesh, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { Material, Object3D } from 'three';
import { tokens } from '../styles/tokens';
import { FOV } from './fixedView';
import type { FixedView } from './fixedView';

export interface TourScene {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** draws one frame on the next animation frame (never more than one per frame) */
  requestRender: () => void;
  /** calls `onFrame(t)` from 0 to 1 over `durationMs`, rendering each frame; returns a cancel function */
  animate: (durationMs: number, onFrame: (t: number) => void) => () => void;
  /** a new view (the screen changed shape, for example) */
  setView: (view: FixedView) => void;
  dispose: () => void;
}

/**
 * A still picture of a scene on a canvas that fills `host`: the camera never moves by itself or by the visitor, so the
 * canvas listens to nothing (the wheel scrolls the page and a touch scrolls it too). The caller adds hover and click.
 */
export function createTourScene(host: HTMLElement, o: { pixelRatioCap: number; view: FixedView; viewFor?: (aspect: number) => FixedView }): TourScene {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.pixelRatioCap));
  renderer.setClearColor(tokens.page, 0);
  const el = renderer.domElement;
  // laid over the host: a canvas in the flow takes its height from its own pixel ratio, and a host that takes its height from the canvas grows with every resize
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  el.style.position = 'absolute';
  el.style.inset = '0';
  el.style.display = 'block';
  el.style.width = '100%';
  el.style.height = '100%';
  host.appendChild(el);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 300);
  const setView = (view: FixedView) => {
    camera.position.set(...view.position);
    camera.lookAt(...view.target);
  };
  setView(o.view);

  let queued = 0;
  const render = () => {
    queued = 0;
    renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (queued === 0) queued = requestAnimationFrame(render);
  };

  const size = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (o.viewFor) setView(o.viewFor(w / h));
    requestRender();
  };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(size);
  observer?.observe(host);
  size();

  const running = new Set<number>();
  const animate = (durationMs: number, onFrame: (t: number) => void) => {
    const start = performance.now();
    let id = 0;
    const step = (now: number) => {
      running.delete(id);
      const t = Math.min(1, (now - start) / durationMs);
      onFrame(t);
      renderer.render(scene, camera);
      if (t < 1) {
        id = requestAnimationFrame(step);
        running.add(id);
      }
    };
    id = requestAnimationFrame(step);
    running.add(id);
    return () => {
      running.forEach((r) => cancelAnimationFrame(r));
      running.clear();
    };
  };

  const dispose = () => {
    if (queued !== 0) cancelAnimationFrame(queued);
    running.forEach((r) => cancelAnimationFrame(r));
    running.clear();
    observer?.disconnect();
    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh || 'geometry' in object) (object as Mesh).geometry?.dispose();
      const material = (object as Mesh).material as Material | Material[] | undefined;
      for (const m of Array.isArray(material) ? material : material ? [material] : []) {
        (m as Material & { map?: { dispose: () => void } | null }).map?.dispose();
        m.dispose();
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
    el.remove();
  };

  return { scene, camera, renderer, requestRender, animate, setView, dispose };
}
