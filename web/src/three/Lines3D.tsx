import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  GridHelper,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Shape,
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

const WALL: Record<'highlight' | 'muted' | 'accent', { depth: number; color: string; opacity: number }> = {
  highlight: { depth: 0.3, color: tokens.ink, opacity: 0.95 },
  muted: { depth: 0.1, color: tokens.muted, opacity: 0.85 },
  accent: { depth: 0.22, color: tokens.blue, opacity: 0.95 }
};

/** A line chart in space: every series is a wall standing in its own lane, a band is a translucent wall behind them. */
export function Lines3D({ spec }: { spec: Lines3DSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;
  const { stageRef, poseRef, controls } = useCameraNav();
  const side = useSideView();

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
      pose: poseRef.current ?? undefined,
      animateReset: !reduced && quality?.tier !== 'low'
    });
    poseRef.current = stage.pose;
    stageRef.current = stage;
    const { scene } = stage;
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

    const walls: Mesh[] = [];
    const wall = (points: Array<{ x: number; y: number }>, depth: number, z: number, material: MeshStandardMaterial) => {
      const first = points[0]!;
      const last = points[points.length - 1]!;
      const shape = new Shape();
      shape.moveTo(first.x, 0);
      for (const p of points) shape.lineTo(p.x, p.y);
      shape.lineTo(last.x, 0);
      shape.closePath();
      const mesh = new Mesh(new ExtrudeGeometry(shape, { depth, bevelEnabled: false }), material);
      mesh.position.z = z - depth / 2;
      scene.add(mesh);
      walls.push(mesh);
      return mesh;
    };

    // the band, behind every lane
    const bandZ = -lanesDepth / 2 - LANE_GAP;
    for (const b of layout.bands) {
      const material = new MeshStandardMaterial({ color: new Color(tokens.blue), transparent: true, opacity: 0.28, roughness: 0.8 });
      const shape = new Shape();
      shape.moveTo(b.lower[0]!.x, b.lower[0]!.y);
      for (const p of b.upper) shape.lineTo(p.x, p.y);
      for (const p of [...b.lower].reverse()) shape.lineTo(p.x, p.y);
      shape.closePath();
      const mesh = new Mesh(new ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }), material);
      mesh.position.z = bandZ;
      scene.add(mesh);
      walls.push(mesh);
    }

    // the series
    spec.series.forEach((s, i) => {
      const look = WALL[s.tone];
      const color = new Color(s.color ?? look.color);
      const lane = layout.series[i]!;
      for (const segment of lane.segments) {
        if (segment.length < 2) continue;
        const material = new MeshStandardMaterial({ color, transparent: look.opacity < 1, opacity: look.opacity, roughness: 0.6 });
        wall(segment, look.depth, lane.z, material);
        const edge = new Line(
          new BufferGeometry().setFromPoints(segment.map((p) => new Vector3(p.x, p.y, lane.z + look.depth / 2 + 0.005))),
          new LineBasicMaterial({ color: new Color(s.color ?? look.color).lerp(new Color(tokens.ink), 0.45) })
        );
        scene.add(edge);
      }
      // the name at the end of the line
      const end = lane.segments.at(-1)?.at(-1);
      if (end) {
        const name = textSprite(s.name, s.tone === 'muted' ? tokens.ink2 : tokens.ink, 0.34, s.tone !== 'muted');
        name.position.set(end.x + 0.7, end.y + 0.25, lane.z);
        scene.add(name);
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
      for (const w of walls) w.scale.y = k;
    };
    let cancel = () => {};
    if (reduced) {
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
  }, [spec, quality?.tier, pixelRatioCap, reduced, side]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d" role="img" aria-label={spec.summary} data-chart3d="lines" />
      <NavControls {...controls} />
    </div>
  );
}
