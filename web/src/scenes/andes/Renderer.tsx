import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three';
import { useQualityOptional } from '../../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../../runtime/capabilities';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../../styles/tokens';
import { createStage } from '../../three/stage';
import type { Stage } from '../../three/stage';
import { useCameraNav } from '../../three/useCameraNav';
import { sampleElevation } from '../../terrain/decode';
import type { Terrain } from '../../types/terrain';
import { NavControls } from '../../ui/NavControls';
import { battlePose, overviewPose } from './camera';
import { buildTerrainMesh, sceneScale, toScene } from './terrainMesh';
import { positionAt } from './timeline';
import type { Route } from './timeline';

/** scene units of the long side of the terrain, and how much the heights are stretched over the ground */
const LONG_SIDE = 20;
const EXAGGERATION = 6;
const LIFT = 0.05;
const ROUTE_SAMPLES = 160;
const CLICK_SLOP = 4;

/** The color of a terrain height from 0 to 1: the sequential blue ramp, dark in the valleys and light on the peaks. */
function rampColor(t: number, out: Color): Color {
  const n = SEQUENTIAL_BLUE.length - 1;
  const x = Math.min(1, Math.max(0, t)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return out.set(SEQUENTIAL_BLUE[i]!).lerp(new Color(SEQUENTIAL_BLUE[i + 1]!), x - i);
}

export interface AndesRendererProps {
  terrain: Terrain;
  route: Route;
  /** the campaign day: the army marker and the travelled part of the route follow it */
  day: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** what the canvas says to a screen reader */
  label: string;
}

/** The Andes in 3D: the terrain, the route, a marker per event and the army at its place of the day. The only file of the scene that touches WebGL. */
export function AndesRenderer({ terrain, route, day, selectedId, onSelect, label }: AndesRendererProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const tier = quality?.tier ?? 'medium';
  const preset = QUALITY_PRESETS[tier];
  const { stageRef, poseRef, controls } = useCameraNav();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // what the effects below hand to each other: the day and the selection change without rebuilding the scene
  const setDayRef = useRef<(day: number) => void>(() => {});
  const setSelectedRef = useRef<(id: string | null, fly: boolean) => void>(() => {});
  const dayRef = useRef(day);
  dayRef.current = day;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scale = sceneScale(terrain, { longSide: LONG_SIDE, exaggeration: EXAGGERATION });
    const start = overviewPose(scale);
    const maxY = toScene(scale, 0, 0, terrain.meta.elevation_max_m).y;
    const stage: Stage = createStage(host, {
      pixelRatioCap: preset.pixelRatioCap,
      target: new Vector3(start.x, start.y, start.z),
      radius: start.radius,
      theta: start.theta,
      phi: start.phi,
      box: { minX: -scale.width / 2, maxX: scale.width / 2, minY: 0, maxY, minZ: -scale.depth / 2, maxZ: scale.depth / 2 },
      pose: poseRef.current ?? undefined,
      animateReset: !reduced && tier !== 'low'
    });
    poseRef.current = stage.pose;
    stageRef.current = stage;
    const { scene } = stage;

    scene.add(new AmbientLight(tokens.ink, 0.9));
    const sun = new DirectionalLight(tokens.ink, 2.6);
    sun.position.set(-8, 10, 6);
    scene.add(sun);

    // the terrain, colored by height
    const mesh = buildTerrainMesh(terrain, scale, preset.terrainDetail);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3));
    const colors = new Float32Array(mesh.heightT.length * 3);
    const c = new Color();
    mesh.heightT.forEach((t, i) => {
      rampColor(t, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.setIndex(new BufferAttribute(mesh.indices, 1));
    geometry.computeVertexNormals();
    scene.add(new Mesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })));

    // the route on the ground: all of it faint, the travelled part bright (the same line, a draw range)
    const ground = (lon: number, lat: number, fallback: number | null) =>
      sampleElevation(terrain, lon, lat) ?? fallback ?? terrain.meta.elevation_min_m;
    const samples: number[] = [];
    for (let i = 0; i <= ROUTE_SAMPLES; i += 1) {
      const p = positionAt(route, route.firstDay + ((route.lastDay - route.firstDay) * i) / ROUTE_SAMPLES);
      if (!p) break;
      const at = toScene(scale, p.lon, p.lat, ground(p.lon, p.lat, p.altitudeM));
      samples.push(at.x, at.y + LIFT, at.z);
    }
    const routeGeometry = new BufferGeometry();
    routeGeometry.setAttribute('position', new Float32BufferAttribute(samples, 3));
    scene.add(new Line(routeGeometry, new LineBasicMaterial({ color: tokens.muted })));
    const traveled = new Line(routeGeometry, new LineBasicMaterial({ color: tokens.ink }));
    scene.add(traveled);

    // a marker per event, lit when selected
    const lit = new Color(SEQUENTIAL_BLUE[9]);
    const markerGeometry = new SphereGeometry(0.14, 16, 12);
    const markers = route.points.map((p) => {
      const material = new MeshStandardMaterial({ color: tokens.ink2, emissive: new Color(tokens.page), roughness: 0.5 });
      const m = new Mesh(markerGeometry, material);
      const at = toScene(scale, p.lon, p.lat, ground(p.lon, p.lat, p.elevation_m));
      m.position.set(at.x, at.y + LIFT + 0.14, at.z);
      m.userData = { id: p.id, name: p.name };
      scene.add(m);
      return { id: p.id, mesh: m, material };
    });

    // the army: a bright sphere at the place of the day
    const army = new Mesh(
      new SphereGeometry(0.2, 20, 16),
      new MeshStandardMaterial({ color: tokens.ink, emissive: lit, emissiveIntensity: 0.8, roughness: 0.4 })
    );
    scene.add(army);
    const setDay = (d: number) => {
      const p = positionAt(route, d);
      if (!p) return;
      const at = toScene(scale, p.lon, p.lat, ground(p.lon, p.lat, p.altitudeM));
      army.position.set(at.x, at.y + LIFT + 0.2, at.z);
      traveled.geometry.setDrawRange(0, Math.max(2, Math.round(((d - route.firstDay) / Math.max(1, route.lastDay - route.firstDay)) * ROUTE_SAMPLES) + 1));
      stage.requestRender();
    };
    setDayRef.current = setDay;
    setDay(dayRef.current);

    const setSelected = (id: string | null, fly: boolean) => {
      for (const m of markers) {
        const on = m.id === id;
        m.material.color.set(on ? lit : tokens.ink2);
        m.material.emissive.set(on ? lit : tokens.page);
        m.material.emissiveIntensity = on ? 0.6 : 0;
        m.mesh.scale.setScalar(on ? 1.4 : 1);
      }
      const point = route.points.find((p) => p.id === id);
      if (fly && point) stage.nav.flyTo(battlePose(scale, terrain, point));
      stage.requestRender();
    };
    setSelectedRef.current = setSelected;
    setSelected(selectedRef.current, false);

    // pointer: a click (4 px or less) on a marker selects it; moving over one names it
    const canvas = stage.renderer.domElement;
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const pick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, stage.camera);
      return raycaster.intersectObjects(markers.map((m) => m.mesh), false)[0]?.object ?? null;
    };
    const tip = tipRef.current;
    const onMove = (e: PointerEvent) => {
      if (e.buttons !== 0 || !tip) return;
      const hit = pick(e);
      if (hit) {
        tip.textContent = hit.userData.name as string;
        const rect = host.getBoundingClientRect();
        tip.style.left = `${e.clientX - rect.left + 12}px`;
        tip.style.top = `${e.clientY - rect.top + 12}px`;
        tip.hidden = false;
      } else tip.hidden = true;
    };
    const onLeave = () => {
      if (tip) tip.hidden = true;
    };
    let downX = 0;
    let downY = 0;
    let downOn = false;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downOn = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!downOn || Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_SLOP) return;
      downOn = false;
      const hit = pick(e);
      if (hit) onSelectRef.current(hit.userData.id as string);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      setDayRef.current = () => {};
      setSelectedRef.current = () => {};
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      stageRef.current = null;
      markerGeometry.dispose();
      stage.dispose();
    };
  }, [terrain, route, preset.terrainDetail, preset.pixelRatioCap, tier, reduced, poseRef, stageRef]);

  useEffect(() => setDayRef.current(day), [day]);
  useEffect(() => setSelectedRef.current(selectedId, true), [selectedId]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d" role="img" aria-label={label} data-chart3d="andes">
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
      <NavControls {...controls} />
    </div>
  );
}

export default AndesRenderer;
