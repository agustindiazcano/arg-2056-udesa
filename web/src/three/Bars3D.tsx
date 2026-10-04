import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Vector2,
  Vector3
} from 'three';
import { formatAxisNumber } from '../charts/format';
import { layoutBars } from '../charts3d/layout';
import type { ProjectionRequest } from '../charts3d/projection';
import type { Bars3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { textSprite } from './labels';
import { addProjection } from './projection';
import { createStage } from './stage';

const MAX_HEIGHT = 4;
const BAR_WIDTH = 0.9;
const GAP = 0.45;
const DEPTH = 1.1;
const GROW_MS = 600;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The reference look: bars standing on a dark plate with a grid, the highlighted one lit, the value over each bar. */
export function Bars3D({ spec, projection }: { spec: Bars3DSpec; projection?: ProjectionRequest }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const layout = layoutBars(spec.bars, { maxHeight: MAX_HEIGHT, barWidth: BAR_WIDTH, gap: GAP, depth: DEPTH });
    const stage = createStage(host, {
      pixelRatioCap,
      target: new Vector3(0, MAX_HEIGHT * 0.34 + (projection ? 0.9 : 0), 0),
      radius: Math.max(13, layout.width * 1.05 + 8) * (projection ? 1.2 : 1),
      theta: 0.22,
      phi: 1.15
    });
    const { scene } = stage;

    scene.add(new AmbientLight(tokens.ink, 1.1));
    const sun = new DirectionalLight(tokens.ink, 2.2);
    sun.position.set(-4, 9, 7);
    scene.add(sun);

    // the plate and its grid
    const plateWidth = layout.width + 3.2;
    const plateDepth = DEPTH + 3;
    const plateColor = new Color(tokens.baseline).lerp(new Color(SEQUENTIAL_BLUE[0]), 0.7);
    const plate = new Mesh(new BoxGeometry(plateWidth, 0.12, plateDepth), new MeshStandardMaterial({ color: plateColor, roughness: 0.9 }));
    plate.position.y = -0.06;
    scene.add(plate);
    const grid = new GridHelper(Math.max(plateWidth, plateDepth), 14, tokens.muted, tokens.grid);
    grid.scale.set(plateWidth / Math.max(plateWidth, plateDepth), 1, plateDepth / Math.max(plateWidth, plateDepth));
    grid.position.y = 0.01;
    scene.add(grid);

    // the height axis: faint lines on the back and the values at the left
    const lineGeometry = new BufferGeometry();
    const back = -DEPTH / 2 - 0.15;
    const positions: number[] = [];
    for (const t of layout.ticks) positions.push(-plateWidth / 2 + 0.2, t.height, back, plateWidth / 2 - 0.2, t.height, back);
    lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    scene.add(new LineSegments(lineGeometry, new LineBasicMaterial({ color: tokens.grid })));
    for (const t of layout.ticks) {
      const label = textSprite(formatAxisNumber(t.value), tokens.muted, 0.28);
      label.position.set(-plateWidth / 2 - 0.35, t.height, back);
      scene.add(label);
    }

    // the bars, their values and their names
    const normal = new Color(SEQUENTIAL_BLUE[4]);
    const lit = new Color(SEQUENTIAL_BLUE[9]);
    const bars = layout.items.map((item) => {
      const material = new MeshStandardMaterial({
        color: item.highlight ? lit : normal,
        emissive: item.highlight ? lit : new Color(tokens.page),
        emissiveIntensity: item.highlight ? 0.45 : 0,
        roughness: 0.55
      });
      const mesh = new Mesh(new BoxGeometry(item.width, 1, item.depth), material);
      mesh.position.set(item.x, 0, 0);
      scene.add(mesh);
      const value = textSprite(item.short, item.highlight ? tokens.ink : tokens.ink2, 0.36, item.highlight);
      scene.add(value);
      const name = textSprite(item.label, item.highlight ? tokens.ink : tokens.ink2, 0.32, item.highlight);
      name.position.set(item.x, 0.12, item.depth / 2 + 0.6);
      scene.add(name);
      return { item, mesh, material, value };
    });

    const setGrowth = (t: number) => {
      const k = easeOutCubic(t);
      for (const b of bars) {
        const h = Math.max(b.item.height * k, 0.001);
        b.mesh.scale.y = h;
        b.mesh.position.y = h / 2;
        b.value.position.set(b.item.x, h + 0.38, 0);
      }
    };

    let cancel = () => {};
    if (reduced) {
      setGrowth(1);
      stage.requestRender();
    } else {
      setGrowth(0);
      cancel = stage.animate(GROW_MS, setGrowth);
    }

    // an optional projected title over the chart (the projection test)
    const stopProjection = projection
      ? addProjection(stage, {
          title: projection.title,
          bounds: { width: plateWidth, depth: plateDepth, height: MAX_HEIGHT },
          reduced,
          animated: quality?.tier !== 'low'
        })
      : () => {};

    // hover: the bar under the pointer lights up and a tooltip names it
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const tip = tipRef.current;
    let hovered = -1;
    const onMove = (e: PointerEvent) => {
      if (e.buttons !== 0) return;
      const rect = stage.renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, stage.camera);
      const hit = raycaster.intersectObjects(bars.map((b) => b.mesh), false)[0];
      const index = hit ? bars.findIndex((b) => b.mesh === hit.object) : -1;
      if (index !== hovered) {
        if (hovered >= 0) {
          const prev = bars[hovered]!;
          prev.material.emissive.set(prev.item.highlight ? lit : new Color(tokens.page));
          prev.material.emissiveIntensity = prev.item.highlight ? 0.45 : 0;
        }
        if (index >= 0) {
          bars[index]!.material.emissive.set(lit);
          bars[index]!.material.emissiveIntensity = 0.35;
        }
        hovered = index;
        stage.requestRender();
      }
      if (tip) {
        if (index >= 0) {
          tip.textContent = `${bars[index]!.item.label}: ${bars[index]!.item.display}`;
          tip.style.left = `${e.clientX - host.getBoundingClientRect().left + 12}px`;
          tip.style.top = `${e.clientY - host.getBoundingClientRect().top + 12}px`;
          tip.hidden = false;
        } else tip.hidden = true;
      }
    };
    const onLeave = () => {
      if (tip) tip.hidden = true;
    };
    const canvas = stage.renderer.domElement;
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancel();
      stopProjection();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      stage.dispose();
    };
  }, [spec, projection?.title, quality?.tier, pixelRatioCap, reduced]);

  return (
    <div ref={hostRef} className="chart3d" role="img" aria-label={spec.summary} data-chart3d={spec.kind}>
      <div ref={tipRef} className="chart3d-tip" hidden />
    </div>
  );
}
