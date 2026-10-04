import { Mesh, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { Material, Object3D, Texture } from 'three';
import { tokens } from '../styles/tokens';

export interface StageOptions {
  pixelRatioCap: number;
  target: Vector3;
  /** distance of the camera to the target */
  radius: number;
  /** horizontal angle (radians) and vertical angle from the top (radians) */
  theta: number;
  phi: number;
  fov?: number;
}

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** draws one frame on the next animation frame (never more than one per frame) */
  requestRender: () => void;
  /** calls `onFrame(t)` with t from 0 to 1 over `durationMs` and renders each frame; returns a cancel function */
  animate: (durationMs: number, onFrame: (t: number) => void) => () => void;
  dispose: () => void;
}

const PHI_MIN = 0.3;
const PHI_MAX = 1.5;

/**
 * A scene on a canvas that fills `host`: it renders on demand, orbits with the pointer (drag) and zooms with the wheel,
 * resizes with the host and frees everything on `dispose` (geometries, materials, textures and the WebGL context).
 */
export function createStage(host: HTMLElement, o: StageOptions): Stage {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.pixelRatioCap));
  renderer.setClearColor(tokens.page, 0);
  const el = renderer.domElement;
  el.style.display = 'block';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.touchAction = 'none';
  host.appendChild(el);

  const scene = new Scene();
  const camera = new PerspectiveCamera(o.fov ?? 32, 1, 0.1, 300);
  let theta = o.theta;
  let phi = o.phi;
  let radius = o.radius;
  const minRadius = o.radius * 0.45;
  const maxRadius = o.radius * 1.8;

  const place = () => {
    camera.position.set(
      o.target.x + radius * Math.sin(phi) * Math.sin(theta),
      o.target.y + radius * Math.cos(phi),
      o.target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(o.target);
  };
  place();

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
    requestRender();
  };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(size);
  observer?.observe(host);
  size();

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const down = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    el.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    theta -= (e.clientX - lastX) * 0.008;
    phi = Math.min(PHI_MAX, Math.max(PHI_MIN, phi - (e.clientY - lastY) * 0.006));
    lastX = e.clientX;
    lastY = e.clientY;
    place();
    requestRender();
  };
  const up = (e: PointerEvent) => {
    dragging = false;
    el.releasePointerCapture?.(e.pointerId);
  };
  const wheel = (e: WheelEvent) => {
    e.preventDefault();
    radius = Math.min(maxRadius, Math.max(minRadius, radius * (1 + Math.sign(e.deltaY) * 0.08)));
    place();
    requestRender();
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', wheel, { passive: false });

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
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.removeEventListener('wheel', wheel);
    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh || 'geometry' in object) (object as Mesh).geometry?.dispose();
      const material = (object as Mesh).material as Material | Material[] | undefined;
      for (const m of Array.isArray(material) ? material : material ? [material] : []) {
        (m as Material & { map?: Texture | null }).map?.dispose();
        m.dispose();
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
    el.remove();
  };

  return { scene, camera, renderer, requestRender, animate, dispose };
}
