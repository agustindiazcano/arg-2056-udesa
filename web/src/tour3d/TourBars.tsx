import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial
} from 'three';
import { formatAxisNumber } from '../charts/format';
import { layoutBars } from '../charts3d/layout';
import type { Bars3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { fitLabel, textSprite } from '../three/labels';
import { fixedView } from './fixedView';
import { createPicker, showTip } from './pick';
import { createTourScene } from './tourScene';

const MAX_HEIGHT = 4;
const BAR_WIDTH = 0.9;
const GAP = 0.45;
const DEPTH = 1.1;
const GROW_MS = 600;
const LABEL_DROP = 0.5;
const PHI = 1.2;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Bars on a dark plate seen from a fixed camera: only hover (the bar lights up, a tooltip names it); nothing moves the view. */
export function TourBars({ spec }: { spec: Bars3DSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const layout = layoutBars(spec.bars, { maxHeight: MAX_HEIGHT, barWidth: BAR_WIDTH, gap: GAP, depth: DEPTH });
    const plateWidth = layout.width + 3.2;
    const plateDepth = DEPTH + 3;
    const viewFor = (aspect: number) =>
      fixedView({ width: plateWidth + 0.4, height: MAX_HEIGHT + LABEL_DROP + 1 }, aspect, { phi: PHI, margin: 1.0, target: [0.2, 1.5, 0] });
    const tour = createTourScene(host, { pixelRatioCap, view: viewFor(host.clientHeight > 0 ? host.clientWidth / host.clientHeight : 1.8), viewFor });
    const { scene } = tour;

    scene.add(new AmbientLight(tokens.ink, 1.1));
    const sun = new DirectionalLight(tokens.ink, 2.2);
    sun.position.set(-4, 9, 7);
    scene.add(sun);

    const plateColor = new Color(tokens.baseline).lerp(new Color(SEQUENTIAL_BLUE[0]), 0.7);
    const plate = new Mesh(new BoxGeometry(plateWidth, 0.12, plateDepth), new MeshStandardMaterial({ color: plateColor, roughness: 0.9 }));
    plate.position.y = -0.06;
    scene.add(plate);
    const grid = new GridHelper(Math.max(plateWidth, plateDepth), 14, tokens.muted, tokens.grid);
    grid.scale.set(plateWidth / Math.max(plateWidth, plateDepth), 1, plateDepth / Math.max(plateWidth, plateDepth));
    grid.position.y = 0.01;
    scene.add(grid);

    const back = -DEPTH / 2 - 0.15;
    const positions: number[] = [];
    for (const t of layout.ticks) positions.push(-plateWidth / 2 + 0.2, t.height, back, plateWidth / 2 - 0.2, t.height, back);
    const lines = new BufferGeometry();
    lines.setAttribute('position', new Float32BufferAttribute(positions, 3));
    scene.add(new LineSegments(lines, new LineBasicMaterial({ color: tokens.grid })));
    for (const t of layout.ticks) {
      const label = textSprite(formatAxisNumber(t.value), tokens.muted, 0.28);
      label.position.set(-plateWidth / 2 - 0.35, t.height, back);
      scene.add(label);
    }

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
      const name = fitLabel(item.label, item.width + GAP, item.highlight ? tokens.ink : tokens.ink2, 0.32, item.highlight);
      name.position.set(item.x, -LABEL_DROP - (name.scale.y - 0.32) / 2, item.depth / 2 + 0.6);
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
      tour.requestRender();
    } else {
      setGrowth(0);
      cancel = tour.animate(GROW_MS, setGrowth);
    }

    const canvas = tour.renderer.domElement;
    const pick = createPicker(
      canvas,
      tour.camera,
      bars.map((b) => b.mesh)
    );
    const tip = tipRef.current;
    let hovered = -1;
    const paint = (index: number, on: boolean) => {
      const b = bars[index];
      if (!b) return;
      if (on) {
        b.material.emissive.set(lit);
        b.material.emissiveIntensity = 0.35;
      } else {
        b.material.emissive.set(b.item.highlight ? lit : new Color(tokens.page));
        b.material.emissiveIntensity = b.item.highlight ? 0.45 : 0;
      }
    };
    const onMove = (e: PointerEvent) => {
      const hit = pick(e);
      const index = hit ? bars.findIndex((b) => b.mesh === hit) : -1;
      if (index !== hovered) {
        paint(hovered, false);
        paint(index, true);
        hovered = index;
        tour.requestRender();
      }
      showTip(tip, host, e, index >= 0 ? `${bars[index]!.item.label}: ${bars[index]!.item.display}` : null);
    };
    const onLeave = () => {
      if (tip) tip.hidden = true;
      if (hovered >= 0) {
        paint(hovered, false);
        hovered = -1;
        tour.requestRender();
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancel();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      tour.dispose();
    };
  }, [spec, pixelRatioCap, reduced]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d chart3d-still" role="img" aria-label={spec.summary} data-chart3d="bars">
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
    </div>
  );
}
