import React, { useEffect, useRef, useState } from 'react';
import type { AnimationClip } from 'three';
import {
  loadUniformAssets,
  UNIFORM_MODELS,
  type CharacterPlacement,
  type UniformModelId
} from './uniformModels';

export const MIN_ZOOM_SCALE = 0.55;
export const MAX_ZOOM_SCALE = 2.6;

export interface CharacterStage3DProps {
  placements: readonly CharacterPlacement[];
  animationMode?: 'walk' | 'idle';
  cameraPosition?: readonly [number, number, number];
  cameraLookAt?: readonly [number, number, number];
  cameraFov?: number;
  zoomScale?: number;
  onZoomScaleChange?: (nextScale: number) => void;
  autoRotate?: boolean;
  interactiveOrbit?: boolean;
  interactiveZoom?: boolean;
  showPedestals?: boolean;
  marchBob?: boolean;
  className?: string;
}

function selectClip(
  clips: AnimationClip[],
  modelId: UniformModelId,
  mode: 'walk' | 'idle'
): AnimationClip | undefined {
  if (clips.length === 0) return undefined;
  const info = UNIFORM_MODELS.find((m) => m.id === modelId);
  const preferredName =
    mode === 'walk' ? info?.preferredWalkClip ?? 'Walking' : info?.preferredIdleClip ?? 'Idle_11';
  return (
    clips.find((c) => c.name === preferredName) ??
    clips.find((c) =>
      mode === 'walk'
        ? c.name.toLowerCase().includes('walk')
        : c.name.toLowerCase().includes('idle')
    ) ??
    clips[0]
  );
}

export const CharacterStage3D: React.FC<CharacterStage3DProps> = ({
  placements,
  animationMode = 'walk',
  cameraPosition = [0, 1.55, 4.35],
  cameraLookAt = [0, 0.92, 0],
  cameraFov = 34,
  zoomScale = 1,
  onZoomScaleChange,
  autoRotate = false,
  interactiveOrbit = false,
  interactiveZoom = false,
  showPedestals = false,
  marchBob = false,
  className
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const yawOffsetRef = useRef(0);
  const zoomScaleRef = useRef(zoomScale);
  zoomScaleRef.current = zoomScale;
  const dragRef = useRef<{ active: boolean; lastX: number }>({ active: false, lastX: 0 });
  const renderRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    zoomScaleRef.current = zoomScale;
    renderRef.current();
  }, [zoomScale]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof window === 'undefined' || !('WebGLRenderingContext' in window)) return;

    let cancelled = false;
    let rafId = 0;
    let cleanupFn: (() => void) | null = null;

    void Promise.all([import('./stageThreeRuntime'), loadUniformAssets()])
      .then(([THREE, assets]) => {
        if (cancelled || !hostRef.current) return;

        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          });
        } catch {
          return;
        }

        const width = Math.max(host.clientWidth, 240);
        const height = Math.max(host.clientHeight, 200);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        const canvas = renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(cameraFov, width / height, 0.1, 60);

        const updateCameraFromZoom = () => {
          const zFactor = Math.min(Math.max(zoomScaleRef.current, MIN_ZOOM_SCALE), MAX_ZOOM_SCALE);
          const dx = cameraPosition[0] - cameraLookAt[0];
          const dy = cameraPosition[1] - cameraLookAt[1];
          const dz = cameraPosition[2] - cameraLookAt[2];
          camera.position.set(
            cameraLookAt[0] + dx * zFactor,
            cameraLookAt[1] + dy * (0.75 + 0.25 * zFactor),
            cameraLookAt[2] + dz * zFactor
          );
          camera.lookAt(cameraLookAt[0], cameraLookAt[1], cameraLookAt[2]);
        };
        updateCameraFromZoom();

        const ambient = new THREE.AmbientLight(0xffffff, 1.35);
        const hemi = new THREE.HemisphereLight(0xd8ecff, 0x2a3242, 1.15);
        const keyLight = new THREE.DirectionalLight(0xfff4dc, 2.1);
        keyLight.position.set(3.5, 5.5, 4.5);
        const rimLight = new THREE.DirectionalLight(0x74acdf, 1.1);
        rimLight.position.set(-3.5, 3.0, -3.5);
        scene.add(ambient, hemi, keyLight, rimLight);

        const stageGroup = new THREE.Group();
        scene.add(stageGroup);

        const mixers: InstanceType<typeof THREE.AnimationMixer>[] = [];
        const characterNodes: Array<{
          group: InstanceType<typeof THREE.Group>;
          baseZ: number;
          phase: number;
        }> = [];
        const disposableGeometries: Array<{ dispose: () => void }> = [];
        const disposableMaterials: Array<{ dispose: () => void }> = [];

        const prefersReducedMotion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        for (const placement of placements) {
          const holder = new THREE.Group();
          holder.position.set(placement.x, 0, placement.z);
          holder.rotation.y = placement.rotationY;
          holder.scale.setScalar(placement.scale);

          if (showPedestals) {
            const discGeo = new THREE.CircleGeometry(0.48, 32);
            const discMat = new THREE.MeshBasicMaterial({
              color: placement.model === 'san-martin' ? 0xf6b40e : 0x74acdf,
              transparent: true,
              opacity: 0.16
            });
            const disc = new THREE.Mesh(discGeo, discMat);
            disc.rotation.x = -Math.PI / 2;
            disc.position.y = 0.005;
            holder.add(disc);

            const ringGeo = new THREE.RingGeometry(0.45, 0.49, 36);
            const ringMat = new THREE.MeshBasicMaterial({
              color: placement.model === 'san-martin' ? 0xf6b40e : 0x74acdf,
              transparent: true,
              opacity: 0.55
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.008;
            holder.add(ring);

            disposableGeometries.push(discGeo, ringGeo);
            disposableMaterials.push(discMat, ringMat);
          }

          const { scene: charScene, animations } = assets.cloneCharacter(
            placement.model,
            placement.hasMusketOnBack
          );
          holder.add(charScene);
          stageGroup.add(holder);

          const clip = selectClip(animations, placement.model, animationMode);
          if (clip) {
            const mixer = new THREE.AnimationMixer(charScene);
            const action = mixer.clipAction(clip);
            action.play();
            mixer.update(placement.phaseOffset);
            mixers.push(mixer);
          }

          characterNodes.push({
            group: holder,
            baseZ: placement.z,
            phase: placement.phaseOffset
          });
        }

        const clock = new THREE.Clock();
        setLoaded(true);

        const renderFrame = () => {
          if (cancelled || !host.isConnected) return;
          updateCameraFromZoom();
          stageGroup.rotation.y = yawOffsetRef.current;
          renderer.render(scene, camera);
        };
        renderRef.current = renderFrame;

        if (prefersReducedMotion) {
          renderFrame();
        } else {
          let lastTime = 0;
          const tick = (now: number) => {
            if (cancelled || !host.isConnected) return;
            rafId = window.requestAnimationFrame(tick);
            if (now - lastTime < 32) return;
            const dt = lastTime > 0 ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
            lastTime = now;

            updateCameraFromZoom();

            for (const mixer of mixers) {
              mixer.update(dt);
            }
            if (autoRotate && !dragRef.current.active) {
              yawOffsetRef.current += dt * 0.28;
            }
            if (marchBob) {
              const elapsed = clock.elapsedTime;
              for (const node of characterNodes) {
                node.group.position.z = node.baseZ + Math.sin(elapsed * 1.4 + node.phase) * 0.06;
              }
            }

            stageGroup.rotation.y = yawOffsetRef.current;
            renderer.render(scene, camera);
          };

          rafId = window.requestAnimationFrame(tick);
        }

        const onResize = () => {
          if (!host) return;
          const w = Math.max(host.clientWidth, 240);
          const h = Math.max(host.clientHeight, 200);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
          renderFrame();
        };

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(onResize);
          resizeObserver.observe(host);
        } else {
          window.addEventListener('resize', onResize);
        }

        cleanupFn = () => {
          renderRef.current = () => undefined;
          if (resizeObserver) {
            resizeObserver.disconnect();
          } else {
            window.removeEventListener('resize', onResize);
          }
          for (const mixer of mixers) {
            mixer.stopAllAction();
          }
          for (const g of disposableGeometries) g.dispose();
          for (const m of disposableMaterials) m.dispose();
          renderer.dispose();
          if (canvas.parentNode === host) {
            host.removeChild(canvas);
          }
        };
      })
      .catch(() => {
        // Ignore asset fetch errors in offline/test environments
      });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      cleanupFn?.();
    };
  }, [
    placements,
    animationMode,
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2],
    cameraLookAt[0],
    cameraLookAt[1],
    cameraLookAt[2],
    cameraFov,
    autoRotate,
    showPedestals,
    marchBob
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveOrbit) return;
    dragRef.current = { active: true, lastX: e.clientX };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveOrbit || !dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    dragRef.current.lastX = e.clientX;
    yawOffsetRef.current += dx * 0.01;
    renderRef.current();
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!interactiveZoom) return;
    e.preventDefault();
    const step = e.deltaY > 0 ? 0.16 : -0.16;
    const next = Math.min(
      Math.max(Number((zoomScaleRef.current + step).toFixed(2)), MIN_ZOOM_SCALE),
      MAX_ZOOM_SCALE
    );
    zoomScaleRef.current = next;
    renderRef.current();
    onZoomScaleChange?.(next);
  };

  return (
    <div
      ref={hostRef}
      className={className}
      data-stage-loaded={loaded ? 'true' : 'false'}
      data-zoom-scale={zoomScale.toFixed(2)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};

export default CharacterStage3D;
