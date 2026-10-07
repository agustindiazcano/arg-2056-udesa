import React, { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  NormalBlending,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Plane,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3
} from 'three';
import { formatAxisNumber } from '../charts/format';
import { layoutLines } from '../charts3d/linesLayout';
import type { Lines3DSpec } from '../charts3d/types';
import { NavControls } from '../ui/NavControls';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { textSprite } from './labels';
import { fitRadius, openingAngles } from '../charts3d/camera';
import { FOLLOW_TOTAL_MS, followFrame, lerp } from '../charts3d/followAnim';
import { createStage } from './stage';
import { useSideView } from './useSideView';
import { useCameraNav } from './useCameraNav';

const WIDTH = 11;
const MAX_HEIGHT = 4.2;
const LANE_GAP = 1.35;
const GROW_MS = 600;
/** How far below the axis the x labels hang, so that a camera level with the chart still sees them. */
const X_LABEL_DROP = 0.55;
/** The side view looks a little below the middle of the chart, so that the chart sits high (the controls and the bar are under it), and fills the view. */
const SIDE_TARGET_Y = 1.1;
const SIDE_MARGIN = 1.02;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** How each tone looks, as in the 2D chart: a glowing line (radius), a soft fade under it (fill) and a halo (glow). */
const LOOK: Record<'highlight' | 'muted' | 'accent', { color: string; radius: number; fill: number; glow: number }> = {
  highlight: { color: tokens.ink, radius: 0.055, fill: 0.34, glow: 0.16 },
  accent: { color: tokens.blue, radius: 0.05, fill: 0.4, glow: 0.2 },
  muted: { color: tokens.muted, radius: 0.035, fill: 0, glow: 0 }
};
/** Length of a dash and of the gap after it, for a dashed line (a projection). */
const DASH = 0.28;
const GAP = 0.2;

/** Cuts a polyline into the pieces of a dashed line. */
function dashPieces(points: Vector3[]): Vector3[][] {
  const pieces: Vector3[][] = [];
  let current: Vector3[] = [points[0]!];
  let drawing = true;
  let left = DASH;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const length = a.distanceTo(b);
    let at = 0;
    while (length - at > left) {
      at += left;
      const p = a.clone().lerp(b, at / length);
      if (drawing) {
        current.push(p);
        pieces.push(current);
        current = [];
      } else current = [p];
      drawing = !drawing;
      left = drawing ? DASH : GAP;
    }
    left -= length - at;
    if (drawing) current.push(b.clone());
  }
  if (drawing && current.length > 1) pieces.push(current);
  return pieces;
}

/** A line chart in space: every series is a wall standing in its own lane, a band is a translucent wall behind them. */
export function Lines3D({ spec }: { spec: Lines3DSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;
  const { stageRef, poseRef, controls } = useCameraNav();
  const side = useSideView();
  const follow = spec.follow === true;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const layout = layoutLines(spec, { width: WIDTH, maxHeight: MAX_HEIGHT, laneGap: LANE_GAP });
    const lanesDepth = Math.max(spec.series.length - 1, 0) * LANE_GAP;
    // from the side the chart fills the view: the plate with the height numbers on its left, the names at the end of the lines, the x labels below
    const aspect = host.clientHeight > 0 ? host.clientWidth / host.clientHeight : 0;
    const sideFit = { width: WIDTH + 3 + 1.6, height: MAX_HEIGHT + X_LABEL_DROP + 0.8 };
    const stage = createStage(host, {
      pixelRatioCap,
      target: side ? new Vector3(0.4, SIDE_TARGET_Y, 0) : new Vector3(0, MAX_HEIGHT * 0.4, 0),
      radius: side ? fitRadius(sideFit, 32, aspect, SIDE_MARGIN) : WIDTH * 1.25 + lanesDepth * 0.5 + 5,
      ...openingAngles(side, { theta: 0.3, phi: 1.0 }),
      box: { minX: -(WIDTH + 3) / 2, maxX: (WIDTH + 3) / 2, minY: 0, maxY: MAX_HEIGHT, minZ: -(lanesDepth + 3.4) / 2, maxZ: (lanesDepth + 3.4) / 2 },
      // a followed line starts from the default camera: the pose of an earlier run (the camera of the follow itself) must not carry over
      pose: follow ? undefined : (poseRef.current ?? undefined),
      animateReset: !reduced && quality?.tier !== 'low',
      wheelZoom: side ? 'modifier' : 'always',
      ...(follow ? { zoomMin: 0.12 } : {})
    });
    poseRef.current = stage.pose;
    stageRef.current = stage;
    const { scene } = stage;
    // a followed line is drawn only up to a moving plane: what is behind it is not there yet
    const reveal = new Plane(new Vector3(-1, 0, 0), -WIDTH / 2 - 0.2);
    const clip = follow ? [reveal] : undefined;
    if (follow) stage.renderer.localClippingEnabled = true;
    const hiddenUntilDone: Array<{ visible: boolean }> = [];
    scene.add(new AmbientLight(tokens.ink, 1.15));
    const sun = new DirectionalLight(tokens.ink, 2.2);
    sun.position.set(-5, 9, 7);
    scene.add(sun);

    // plate and grid, the height axis on the back, the x labels on the front
    const plateWidth = WIDTH + 3;
    const plateDepth = lanesDepth + 3.4;
    const plateColor = new Color(tokens.baseline).lerp(new Color(SEQUENTIAL_BLUE[0]), 0.7);
    const plate = new Mesh(new BoxGeometry(plateWidth, 0.12, plateDepth), new MeshStandardMaterial({ color: plateColor, roughness: 0.9 }));
    plate.position.y = -0.06;
    scene.add(plate);
    const gridSize = Math.max(plateWidth, plateDepth);
    const grid = new GridHelper(gridSize, 14, tokens.muted, tokens.grid);
    grid.scale.set(plateWidth / gridSize, 1, plateDepth / gridSize);
    grid.position.y = 0.01;
    scene.add(grid);

    const back = -plateDepth / 2 + 0.1;
    const lineGeometry = new BufferGeometry();
    const positions: number[] = [];
    for (const t of layout.ticks) positions.push(-plateWidth / 2 + 0.2, t.height, back, plateWidth / 2 - 0.2, t.height, back);
    // vertical lines on the back wall, one under every labelled x
    const top = Math.max(0, ...layout.ticks.map((t) => t.height));
    for (const t of layout.xTicks) positions.push(t.x, 0, back, t.x, top, back);
    lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    scene.add(new LineSegments(lineGeometry, new LineBasicMaterial({ color: tokens.grid })));
    for (const t of layout.ticks) {
      const label = textSprite(formatAxisNumber(t.value), tokens.muted, 0.3);
      label.position.set(-plateWidth / 2 - 0.35, t.height, back);
      scene.add(label);
    }
    for (const t of layout.xTicks) {
      const label = textSprite(t.label, tokens.muted, 0.3);
      label.position.set(t.x, -X_LABEL_DROP, plateDepth / 2 + 0.2);
      scene.add(label);
    }

    // everything that grows from the floor lives in one group, so that the growth is one scale
    const grow = new Group();
    scene.add(grow);

    // the band, behind every lane
    const bandZ = -lanesDepth / 2 - LANE_GAP;
    for (const b of layout.bands) {
      const material = new MeshBasicMaterial({ color: new Color(tokens.blue), transparent: true, opacity: 0.2, depthWrite: false, clippingPlanes: clip });
      const shape = new Shape();
      shape.moveTo(b.lower[0]!.x, b.lower[0]!.y);
      for (const p of b.upper) shape.lineTo(p.x, p.y);
      for (const p of [...b.lower].reverse()) shape.lineTo(p.x, p.y);
      shape.closePath();
      const mesh = new Mesh(new ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }), material);
      mesh.position.z = bandZ;
      grow.add(mesh);
    }

    /** A soft fade under the line: opaque at the line, clear at the floor. */
    const fillUnder = (points: Vector3[], z: number, color: Color, alpha: number) => {
      const positions: number[] = [];
      const colors: number[] = [];
      const index: number[] = [];
      points.forEach((p, i) => {
        positions.push(p.x, p.y, 0, p.x, 0, 0);
        colors.push(color.r, color.g, color.b, alpha, color.r, color.g, color.b, 0);
        if (i > 0) {
          const k = (i - 1) * 2;
          index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        }
      });
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 4));
      geometry.setIndex(index);
      const mesh = new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide, clippingPlanes: clip }));
      mesh.position.z = z;
      grow.add(mesh);
    };

    /** A round line along the points (lit by nothing: it glows), or its halo when `additive`. */
    const tube = (points: Vector3[], z: number, radius: number, color: Color, opacity: number, additive: boolean) => {
      if (points.length < 2) return;
      const curve = new CatmullRomCurve3(points, false, 'centripetal');
      const geometry = new TubeGeometry(curve, Math.max(points.length * 2, 6), radius, 6, false);
      const material = new MeshBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
        blending: additive ? AdditiveBlending : NormalBlending,
        clippingPlanes: clip,
        // cut by the reveal plane, a tube must look filled, not hollow
        side: clip ? DoubleSide : FrontSide
      });
      const mesh = new Mesh(geometry, material);
      mesh.position.z = z;
      grow.add(mesh);
    };

    // the series
    spec.series.forEach((s, i) => {
      const look = LOOK[s.tone];
      const color = new Color(s.color ?? look.color);
      const lane = layout.series[i]!;
      for (const segment of lane.segments) {
        if (segment.length < 2) continue;
        const curve = new CatmullRomCurve3(
          segment.map((p) => new Vector3(p.x, p.y, 0)),
          false,
          'centripetal'
        );
        const points = curve.getPoints(segment.length * 4);
        if (look.fill > 0) fillUnder(points, lane.z, color, look.fill);
        const pieces = s.dashed ? dashPieces(points) : [points];
        for (const piece of pieces) {
          if (look.glow > 0) tube(piece, lane.z, look.radius * 3.2, color, look.glow, true);
          tube(piece, lane.z, look.radius, color, 1, false);
        }
      }
      // the name at the end of the line, and a dot there
      const end = lane.segments.at(-1)?.at(-1);
      if (end) {
        if (s.tone !== 'muted') {
          const dot = new Mesh(new SphereGeometry(look.radius * 2.2, 16, 12), new MeshBasicMaterial({ color, clippingPlanes: clip }));
          dot.position.set(end.x, end.y, lane.z);
          grow.add(dot);
        }
        const name = textSprite(s.name, s.tone === 'muted' ? tokens.ink2 : tokens.ink, 0.34, s.tone !== 'muted');
        name.position.set(end.x + 0.7, end.y + 0.25, lane.z);
        scene.add(name);
        if (follow) hiddenUntilDone.push(name);
      }
    });

    // the playhead
    if (layout.markerX !== null) {
      const marker = new Mesh(
        new BoxGeometry(0.03, MAX_HEIGHT, lanesDepth + 1.2),
        new MeshStandardMaterial({ color: new Color(tokens.ink), transparent: true, opacity: 0.16 })
      );
      marker.position.set(layout.markerX, MAX_HEIGHT / 2, 0);
      scene.add(marker);
    }

    const setGrowth = (t: number) => {
      const k = Math.max(easeOutCubic(t), 0.001);
      grow.scale.y = k;
    };
    let cancel = () => {};
    if (follow) {
      // the line draws itself from the first year to the last and the camera follows its head; then it pulls back to the whole chart
      setGrowth(1);
      const base = { ...stage.pose };
      const points = (layout.series[0]?.segments ?? []).flat();
      const heightAt = (x: number): number => {
        const next = points.findIndex((p) => p.x >= x);
        if (next <= 0) return points[0]?.y ?? 0;
        if (next < 0) return points.at(-1)?.y ?? 0;
        const a = points[next - 1]!;
        const b = points[next]!;
        return lerp(a.y, b.y, (x - a.x) / Math.max(b.x - a.x, 1e-6));
      };
      // The camera follows the head until the visitor takes it (a drag, the wheel, the buttons, a double click): from then on
      // the line keeps drawing and the camera is theirs. The stage animation is not used: any camera move cancels it.
      let lastSet = { ...base };
      let handedOver = false;
      const frame = (elapsed: number) => {
        const f = followFrame(elapsed);
        const head = lerp(-WIDTH / 2, WIDTH / 2, f.reveal);
        reveal.constant = f.reveal >= 1 ? WIDTH : head;
        for (const item of hiddenUntilDone) item.visible = f.reveal >= 1;
        if (!handedOver) {
          const p = stage.pose;
          handedOver = ['x', 'y', 'z', 'theta', 'phi', 'radius'].some((k) => Math.abs((p as never)[k] - (lastSet as never)[k]) > 1e-4);
        }
        if (!handedOver) {
          stage.nav.setPose({
            ...base,
            x: lerp(Math.min(head + WIDTH * 0.05, WIDTH / 2), base.x, f.out),
            y: lerp(heightAt(head) * 0.8 + 0.3, base.y, f.out),
            radius: lerp(base.radius * 0.42, base.radius, f.out)
          });
          lastSet = { ...stage.pose };
        }
        stage.requestRender();
      };
      if (reduced) {
        frame(FOLLOW_TOTAL_MS);
      } else {
        frame(0);
        const startedAt = performance.now();
        let raf = 0;
        const step = (now: number) => {
          const elapsed = Math.min(FOLLOW_TOTAL_MS, now - startedAt);
          frame(elapsed);
          if (elapsed < FOLLOW_TOTAL_MS) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        cancel = () => cancelAnimationFrame(raf);
      }
    } else if (reduced) {
      setGrowth(1);
      stage.requestRender();
    } else {
      setGrowth(0);
      cancel = stage.animate(GROW_MS, setGrowth);
    }

    return () => {
      cancel();
      stageRef.current = null;
      stage.dispose();
    };
  }, [spec, quality?.tier, pixelRatioCap, reduced, side, follow]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d" role="img" aria-label={spec.summary} data-chart3d="lines" />
      <NavControls {...controls} />
    </div>
  );
}
