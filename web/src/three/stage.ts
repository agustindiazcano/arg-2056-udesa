import { Mesh, PCFSoftShadowMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { Material, Object3D, Texture } from 'three';
import {
  BUTTON_ZOOM,
  WHEEL_ZOOM,
  blendCamera,
  cameraLimits,
  clampTarget,
  copyCamera,
  orbit,
  pan,
  presetCamera,
  resetCamera,
  zoomAt,
  zoomBy
} from '../charts3d/camera';
import type { CameraPreset, CameraState, TargetBox } from '../charts3d/camera';
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
  /** where the camera target may move; default: around the start target, half the start radius to each side */
  box?: TargetBox;
  /** the pose to keep: a view rebuilt for new data passes the pose of the old one. Changed in place. */
  pose?: CameraState;
  /** the renderer draws shadows (PCF soft); the scene's lights decide who casts and receives them */
  shadows?: boolean;
  /** called right before each render, with the camera in its final place: a scene switches its level of detail here */
  beforeRender?: () => void;
  /** the closest zoom as a fraction of the start radius (default 0.25) */
  zoomMin?: number;
  /** the highest polar angle of the camera, in radians from the top (default just under the horizon, 1.55); more lets it look up */
  phiMax?: number;
  /** the reset glides back over a short time; false (reduced motion, low quality) jumps */
  animateReset?: boolean;
  /** `modifier`: the wheel zooms only with Ctrl or Cmd held (a pinch on a trackpad does), so that over the chart a page that scrolls keeps scrolling */
  wheelZoom?: 'always' | 'modifier';
}

/** What the `+`, `-` and reset buttons call. */
export interface StageNav {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  preset: (preset: CameraPreset) => void;
  /** the camera goes to this pose (eased over 600 ms, or at once when the reset does not glide) */
  flyTo: (pose: CameraState) => void;
  /** moves the camera target at once (the angles and the distance stay), kept inside the box: for a camera that follows something */
  setTarget: (x: number, y: number, z: number) => void;
  /** puts the camera at this pose at once, kept inside the limits (target box, polar angle, zoom range): for a camera that is driven every day tick */
  setPose: (pose: CameraState) => void;
}

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** draws one frame on the next animation frame (never more than one per frame) */
  requestRender: () => void;
  /** calls `onFrame(t)` with t from 0 to 1 over `durationMs` and renders each frame; returns a cancel function */
  animate: (durationMs: number, onFrame: (t: number) => void) => () => void;
  /** calls `onFrame(elapsedMs)` and renders on every animation frame until the returned cancel is called (or on dispose) */
  loop: (onFrame: (elapsedMs: number) => void) => () => void;
  /** the live camera pose: keep it to hand to the next stage of the same view */
  pose: CameraState;
  nav: StageNav;
  dispose: () => void;
}

const RESET_MS = 350;
const FLY_MS = 600;

/**
 * A scene on a canvas that fills `host`: it renders on demand and the camera is free: drag turns it, right-drag or
 * Shift-drag or two fingers move it, the wheel and a pinch zoom toward the pointer, a double click restores the start
 * pose. The math is in `charts3d/camera`. It resizes with the host and frees everything on `dispose` (geometries, materials, textures and the WebGL context).
 */
export function createStage(host: HTMLElement, o: StageOptions): Stage {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  if (o.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
  }
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
  el.style.touchAction = 'none';
  host.appendChild(el);

  const scene = new Scene();
  const camera = new PerspectiveCamera(o.fov ?? 32, 1, 0.1, 300);
  const startPose: CameraState = { x: o.target.x, y: o.target.y, z: o.target.z, theta: o.theta, phi: o.phi, radius: o.radius };
  const half = o.radius * 0.5;
  const limits = cameraLimits(
    startPose,
    o.box ?? { minX: o.target.x - half, maxX: o.target.x + half, minY: 0, maxY: o.target.y + half, minZ: o.target.z - half, maxZ: o.target.z + half },
    o.zoomMin,
    o.phiMax
  );
  const pose = o.pose ?? copyCamera(startPose);
  const fov = o.fov ?? 32;
  const look = new Vector3();

  const place = () => {
    const sinP = Math.sin(pose.phi);
    camera.position.set(pose.x + pose.radius * sinP * Math.sin(pose.theta), pose.y + pose.radius * Math.cos(pose.phi), pose.z + pose.radius * sinP * Math.cos(pose.theta));
    camera.lookAt(look.set(pose.x, pose.y, pose.z));
  };
  place();

  let queued = 0;
  const render = () => {
    queued = 0;
    o.beforeRender?.();
    renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (queued === 0) queued = requestAnimationFrame(render);
  };
  /** the pose in a data attribute (end of a gesture only): the e2e tests read it */
  const publish = () => {
    el.dataset.camera = [pose.theta, pose.phi, pose.radius, pose.x, pose.y, pose.z].map((n) => n.toFixed(3)).join(',');
  };
  const changed = () => {
    place();
    requestRender();
  };
  publish();

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

  // pointers down (at most two matter): one turns, one with Shift or the right button moves, two zoom and move
  const ids: number[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  let panning = false;
  let lastDist = 0;
  const viewHeight = () => Math.max(1, el.clientHeight || host.clientHeight);
  const ndc = (clientX: number, clientY: number, out: { x: number; y: number }) => {
    const r = el.getBoundingClientRect();
    out.x = r.width > 0 ? ((clientX - r.left) / r.width) * 2 - 1 : 0;
    out.y = r.height > 0 ? -(((clientY - r.top) / r.height) * 2 - 1) : 0;
  };
  const cursor = { x: 0, y: 0 };
  const aspect = () => (el.clientHeight > 0 ? el.clientWidth / el.clientHeight : 1);

  const down = (e: PointerEvent) => {
    if (ids.length >= 2) return;
    cancelGlide();
    ids.push(e.pointerId);
    xs.push(e.clientX);
    ys.push(e.clientY);
    panning = e.button === 2 || e.shiftKey;
    if (ids.length === 2) lastDist = Math.hypot(xs[0]! - xs[1]!, ys[0]! - ys[1]!);
    el.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const i = ids.indexOf(e.pointerId);
    if (i < 0) return;
    // nothing is pressed: the release was lost (a context menu, a drag that ended outside the window), so this is a hover; it never navigates
    if (e.buttons === 0) {
      ids.length = xs.length = ys.length = 0;
      lastDist = 0;
      return;
    }
    if (ids.length === 1) {
      const dx = e.clientX - xs[0]!;
      const dy = e.clientY - ys[0]!;
      if (panning) pan(pose, dx, dy, viewHeight(), fov, limits);
      else orbit(pose, dx, dy, limits);
    } else {
      const oldMidX = (xs[0]! + xs[1]!) / 2;
      const oldMidY = (ys[0]! + ys[1]!) / 2;
      xs[i] = e.clientX;
      ys[i] = e.clientY;
      const dist = Math.hypot(xs[0]! - xs[1]!, ys[0]! - ys[1]!);
      const midX = (xs[0]! + xs[1]!) / 2;
      const midY = (ys[0]! + ys[1]!) / 2;
      pan(pose, midX - oldMidX, midY - oldMidY, viewHeight(), fov, limits);
      if (dist > 0 && lastDist > 0) {
        ndc(midX, midY, cursor);
        zoomAt(pose, lastDist / dist, cursor.x, cursor.y, aspect(), fov, limits);
      }
      lastDist = dist;
      changed();
      return;
    }
    xs[i] = e.clientX;
    ys[i] = e.clientY;
    changed();
  };
  const up = (e: PointerEvent) => {
    const i = ids.indexOf(e.pointerId);
    if (i < 0) return;
    ids.splice(i, 1);
    xs.splice(i, 1);
    ys.splice(i, 1);
    el.releasePointerCapture?.(e.pointerId);
    lastDist = 0;
    publish();
  };
  const wheel = (e: WheelEvent) => {
    if (o.wheelZoom === 'modifier' && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    cancelGlide();
    ndc(e.clientX, e.clientY, cursor);
    zoomAt(pose, 1 + Math.sign(e.deltaY) * WHEEL_ZOOM, cursor.x, cursor.y, aspect(), fov, limits);
    changed();
    publish();
  };
  const noMenu = (e: Event) => e.preventDefault();
  const dbl = () => nav.reset();

  // reset and presets glide to the pose (or jump)
  const from = copyCamera(pose);
  const to = copyCamera(pose);
  let glide = () => {};
  const cancelGlide = () => glide();
  const glideTo = (apply: (target: CameraState) => void, ms = RESET_MS) => {
    cancelGlide();
    Object.assign(from, pose);
    Object.assign(to, pose);
    apply(to);
    if (o.animateReset === false) {
      Object.assign(pose, to);
      changed();
      publish();
      return;
    }
    glide = animate(ms, (t) => {
      blendCamera(pose, from, to, 1 - (1 - t) ** 3);
      place();
      if (t === 1) publish();
    });
  };
  const nav: StageNav = {
    zoomIn: () => glideTo((t) => zoomBy(t, BUTTON_ZOOM, limits)),
    zoomOut: () => glideTo((t) => zoomBy(t, 1 / BUTTON_ZOOM, limits)),
    reset: () => glideTo((t) => resetCamera(t, limits)),
    preset: (preset) => glideTo((t) => presetCamera(t, preset, limits)),
    flyTo: (target) => glideTo((t) => Object.assign(t, target), FLY_MS),
    setPose: (target) => {
      cancelGlide();
      Object.assign(pose, target);
      pose.radius = Math.min(limits.maxRadius, Math.max(limits.minRadius, pose.radius));
      pose.phi = Math.min(limits.maxPhi, Math.max(limits.minPhi, pose.phi));
      clampTarget(pose, limits.box);
      changed();
    },
    setTarget: (x, y, z) => {
      cancelGlide();
      pose.x = x;
      pose.y = y;
      pose.z = z;
      clampTarget(pose, limits.box);
      changed();
    }
  };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', wheel, { passive: false });
  el.addEventListener('contextmenu', noMenu);
  el.addEventListener('dblclick', dbl);

  const running = new Set<number>();
  const animate = (durationMs: number, onFrame: (t: number) => void) => {
    const start = performance.now();
    let id = 0;
    const step = (now: number) => {
      running.delete(id);
      const t = Math.min(1, (now - start) / durationMs);
      onFrame(t);
      o.beforeRender?.();
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

  const loops = new Set<() => void>();
  const loop = (onFrame: (elapsedMs: number) => void) => {
    const start = performance.now();
    let id = 0;
    let active = true;
    const step = (now: number) => {
      if (!active) return;
      onFrame(now - start);
      o.beforeRender?.();
      renderer.render(scene, camera);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    const cancel = () => {
      active = false;
      cancelAnimationFrame(id);
      loops.delete(cancel);
    };
    loops.add(cancel);
    return cancel;
  };

  const dispose = () => {
    if (queued !== 0) cancelAnimationFrame(queued);
    running.forEach((r) => cancelAnimationFrame(r));
    running.clear();
    [...loops].forEach((cancel) => cancel());
    observer?.disconnect();
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.removeEventListener('wheel', wheel);
    el.removeEventListener('contextmenu', noMenu);
    el.removeEventListener('dblclick', dbl);
    cancelGlide();
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

  return { scene, camera, renderer, requestRender, animate, loop, pose, nav, dispose };
}
