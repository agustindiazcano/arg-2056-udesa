import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
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
import { DEFAULT_BARS_VIEW, barsFocus, followFrame } from '../charts3d/followAnim';
import { layoutBars, niceCeil } from '../charts3d/layout';
import type { ProjectionRequest } from '../charts3d/projection';
import type { Bars3DSpec, Tick } from '../charts3d/types';
import { NavControls } from '../ui/NavControls';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { fitLabel } from './labels';
import { textSprite } from './labels';
import { addProjection } from './projection';
import { fitRadius, openingAngles } from '../charts3d/camera';
import { createStage } from './stage';
import { useSideView } from './useSideView';
import { useCameraNav } from './useCameraNav';

const MAX_HEIGHT = 4;
const BAR_WIDTH = 0.9;
const GAP = 0.45;
const DEPTH = 1.1;
const GROW_MS = 600;
/** How far below the axis the labels of the bars hang, so that a camera level with the chart still sees them. */
const X_LABEL_DROP = 0.5;
/** The side view looks a little below the middle of the chart, so that the chart sits high (the controls and the bar are under it), and fills the view. */
const SIDE_TARGET_Y = 1.2;
const SIDE_MARGIN = 1.02;

/** A step of the shared clock bigger than this (a drag on the timeline, a restart) is not the time going by: the camera goes back to the bar. */
const CLOCK_JUMP_MS = 300;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The reference look: bars standing on a dark plate with a grid, the highlighted one lit, the value over each bar. */
export function Bars3D({ spec, projection, free = false }: { spec: Bars3DSpec; projection?: ProjectionRequest; free?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;
  const { stageRef, poseRef, controls } = useCameraNav();
  // in the Recorrido it opens from the side with the wheel left to the page; `free` gives it the camera of the dashboard
  const side = useSideView() && !free;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const layout = layoutBars(spec.bars, { maxHeight: MAX_HEIGHT, barWidth: BAR_WIDTH, gap: GAP, depth: DEPTH });
    const plateWidthBox = layout.width + 3.2;
    const plateDepthBox = DEPTH + 3;
    const stage = createStage(host, {
      pixelRatioCap,
      target: side ? new Vector3(0.4, SIDE_TARGET_Y, 0) : new Vector3(0, MAX_HEIGHT * 0.34 + (projection ? 0.9 : 0), 0),
      radius: side
        ? fitRadius({ width: plateWidthBox + 1.6, height: MAX_HEIGHT + X_LABEL_DROP + 0.9 }, 32, host.clientHeight > 0 ? host.clientWidth / host.clientHeight : 0, SIDE_MARGIN)
        : Math.max(13, layout.width * 1.05 + 8) * (projection ? 1.2 : 1),
      // a bar chart that follows the clock opens almost from the side, a little above (the example of the Recorrido); the others as before
      ...(spec.timeline ? { theta: DEFAULT_BARS_VIEW.theta, phi: DEFAULT_BARS_VIEW.phi, fov: DEFAULT_BARS_VIEW.fov } : openingAngles(side, { theta: 0.22, phi: 1.15 })),
      box: { minX: -plateWidthBox / 2, maxX: plateWidthBox / 2, minY: 0, maxY: MAX_HEIGHT, minZ: -plateDepthBox / 2, maxZ: plateDepthBox / 2 },
      pose: poseRef.current ?? undefined,
      animateReset: !reduced && quality?.tier !== 'low',
      wheelZoom: side || spec.timeline ? 'modifier' : 'always'
    });
    poseRef.current = stage.pose;
    stageRef.current = stage;
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

    // the height axis: faint lines on the back and the values at the left (they are drawn again when the scale of a timeline changes)
    const back = -DEPTH / 2 - 0.15;
    const axis = new Group();
    scene.add(axis);
    const drawAxis = (ticks: Tick[]) => {
      for (const child of [...axis.children]) {
        axis.remove(child);
        (child as Mesh).geometry?.dispose();
        const material = (child as Mesh).material as { map?: { dispose: () => void } | null; dispose: () => void };
        material.map?.dispose();
        material.dispose();
      }
      const lineGeometry = new BufferGeometry();
      const positions: number[] = [];
      for (const t of ticks) positions.push(-plateWidth / 2 + 0.2, t.height, back, plateWidth / 2 - 0.2, t.height, back);
      lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      axis.add(new LineSegments(lineGeometry, new LineBasicMaterial({ color: tokens.grid })));
      for (const t of ticks) {
        const label = textSprite(formatAxisNumber(t.value), tokens.muted, 0.28);
        label.position.set(-plateWidth / 2 - 0.35, t.height, back);
        axis.add(label);
      }
    };
    drawAxis(layout.ticks);

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
      value.visible = !spec.timeline; // the values change with the clock: the axis and the tooltip carry them
      scene.add(value);
      const name = fitLabel(item.label, item.width + GAP, item.highlight ? tokens.ink : tokens.ink2, 0.32, item.highlight);
      name.position.set(item.x, -X_LABEL_DROP - (name.scale.y - 0.32) / 2, item.depth / 2 + 0.6);
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
    const timeline = spec.timeline;
    if (timeline) {
      // the bars follow the clock of the page: their heights are the values of the year it says, the camera stays close to one bar
      const focus = bars[timeline.focus];
      const base = { ...stage.pose };
      let lastSet = { ...base };
      let handedOver = false;
      let lastElapsed = timeline.clock.current;
      let top = -1;
      cancel = stage.loop(() => {
        const elapsed = timeline.clock.current;
        if (Math.abs(elapsed - lastElapsed) > CLOCK_JUMP_MS) handedOver = false;
        lastElapsed = elapsed;
        const values = timeline.valuesAt(timeline.yearAt(elapsed));
        const nextTop = niceCeil(Math.max(...values));
        if (nextTop !== top) {
          top = nextTop;
          drawAxis([0, 1, 2, 3, 4].map((i) => ({ value: (top * i) / 4, height: (MAX_HEIGHT * i) / 4 })));
        }
        bars.forEach((b, i) => {
          const h = Math.max(((values[i] ?? 0) / top) * MAX_HEIGHT, 0.03);
          b.mesh.scale.y = h;
          b.mesh.position.y = h / 2;
        });
        if (!focus) return;
        if (!handedOver) {
          const p = stage.pose;
          handedOver = ['x', 'y', 'z', 'theta', 'phi', 'radius'].some((k) => Math.abs((p as never)[k] - (lastSet as never)[k]) > 1e-4);
        }
        if (!handedOver) {
          stage.nav.setPose(barsFocus(base, { x: focus.item.x, top: focus.mesh.scale.y }, followFrame(elapsed).out, DEFAULT_BARS_VIEW));
          lastSet = { ...stage.pose };
        }
      });
    } else if (reduced) {
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
      stageRef.current = null;
      stage.dispose();
    };
  }, [spec, projection?.title, quality?.tier, pixelRatioCap, reduced, side]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d" role="img" aria-label={spec.summary} data-chart3d={spec.kind}>
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
      <NavControls {...controls} />
    </div>
  );
}
