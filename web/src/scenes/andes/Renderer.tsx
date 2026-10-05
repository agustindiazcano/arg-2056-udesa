import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  DirectionalLight,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Fog,
  LinearFilter,
  LinearMipmapLinearFilter,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  Raycaster,
  RepeatWrapping,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three';
import { QUALITY_PRESETS } from '../../runtime/capabilities';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, SKY_RAMP, TERRAIN_RAMP, tokens } from '../../styles/tokens';
import { PHI_MAX, copyCamera } from '../../charts3d/camera';
import type { CameraState } from '../../charts3d/camera';
import { createStage } from '../../three/stage';
import type { Stage } from '../../three/stage';
import { useCameraNav } from '../../three/useCameraNav';
import { sampleElevation } from '../../terrain/decode';
import type { Terrain } from '../../types/terrain';
import { NavControls } from '../../ui/NavControls';
import { NO_STEER, addSteer, battlePose, cinePose, clearEye, closePose, followPose, lookPoint, overviewPose, rigFor, steered } from './camera';
import type { CameraMode, Rig } from './camera';
import { figureCount, lodFor, startingMen } from './column';
import { createDetailTerrain } from './detail3d';
import { createFigureColumn } from './figures3d';
import type { Graphics } from './graphics';
import { labelOpacity, toScreen } from './labels';
import { arcAt, buildPath, sampleAlong, sampleAlongExtended } from './pathAlong';
import type { PathSample } from './pathAlong';
import { tileableNoise } from './relief';
import { buildPatch, createField } from './reliefField';
import { skyColorHex } from './sky';
import { snowAmount, snowCount, snowField, stepSnow } from './snow';
import { buildTerrainMesh, sceneScale, toScene } from './terrainMesh';
import { positionAt } from './timeline';
import type { Route } from './timeline';

/** scene units of the long side of the terrain, and how much the heights are stretched over the ground */
const LONG_SIDE = 20;
const EXAGGERATION = 6;
const LIFT = 0.05;
/** the feet rest a little above the sampled ground: the mesh is coarser than the samples */
const FIGURE_LIFT = 0.02;
/** the figures are drawn at this fraction of their modelled size, so the mountains tower over them */
const FIGURE_SCALE = 0.5;
/** the procedural relief: its seed (same seed, same mountains), height scale, and the chunks of ground around the army */
const RELIEF_SEED = 11;
const RELIEF_AMPLITUDE = 4;
const CHUNK_SIZE = 2;
const CHUNK_CELLS = 100;
const CHUNK_RADIUS = 2;
/** the fog close in: the detailed ground fades into the horizon before the chunks end */
const NEAR_FOG: [number, number] = [6, 36];
/** the camera never goes below the ground of the detailed terrain by less than this */
const CAMERA_CLEARANCE = 0.08;
/** how much of the turn toward the heading of the column the cinematic camera takes at each day tick */
const CINE_TURN = 0.2;
/** a rigged camera (see `rigFor`) looks at the column, this fraction of its length behind the head, a little above the ground */
const CINE_FOCUS = 0.35;
const CINE_LOOK = 0.1;
/** the light, relative to the army, when the shadows are on */
const SUN_OFFSET = new Vector3(-9, 5, 5);
const ROUTE_SAMPLES = 160;
const CLICK_SLOP = 4;
/** the closest zoom of this scene, as a fraction of the start radius: close enough to see the column of figures */
const ZOOM_MIN_ANDES = 0.04;
/** how low the camera may go, in radians from the top: past the horizon (1.57) it looks up, so the sky shows; far from the army it stays above it */
const PHI_MAX_ANDES = 1.95;
/** the snowstorm up close: the box of flakes around the camera (width and height, scene units), the wind, and the closer fog at full snow */
const SNOW_SIZE = 4;
const SNOW_HEIGHT = 2.5;
const SNOW_WIND = { x: -0.5, z: 0.2 };
const SNOW_FOG: [number, number] = [3, 16];
/** in the storm the haze turns grey-blue and the sun dims, as much as the snow is heavy */
const STORM_HAZE = new Color('#9fb0c4');
const STORM_HAZE_SHARE = 0.65;
const STORM_DIM = 0.45;
/** the far mountains: one coarse mesh of the whole ground (the relief and the snow caps of the same field as the chunks), a step of this many units, set a little under the chunks */
const FAR_STEP = 0.2;
const FAR_LOWER = 0.06;
/** the grain of the ground: a tiling texture of this many texels a side */
const GROUND_TEXTURE_SIZE = 128;
/** the sky dome around the origin: the camera stays within ~100 units of it and the far plane is 300 */
const SKY_RADIUS = 180;

/** The grain of the ground as a tiling texture: grey values around 0.87 that darken or leave the color of the terrain, never tint it. */
function makeGroundTexture(): DataTexture {
  const noise = tileableNoise(GROUND_TEXTURE_SIZE, 5);
  const data = new Uint8Array(GROUND_TEXTURE_SIZE * GROUND_TEXTURE_SIZE * 4);
  for (let i = 0; i < noise.length; i += 1) {
    const v = Math.round(255 * (0.74 + 0.26 * noise[i]!));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const texture = new DataTexture(data, GROUND_TEXTURE_SIZE, GROUND_TEXTURE_SIZE);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** The color of a terrain height from 0 to 1: the natural ramp, green in the valleys and snow on the peaks. */
function rampColor(t: number, out: Color, next: Color): Color {
  const n = TERRAIN_RAMP.length - 1;
  const x = Math.min(1, Math.max(0, t)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return out.set(TERRAIN_RAMP[i]!).lerp(next.set(TERRAIN_RAMP[i + 1]!), x - i);
}

export interface AndesRendererProps {
  terrain: Terrain;
  route: Route;
  /** the campaign day: the army marker and the travelled part of the route follow it */
  day: number;
  selectedId: string | null;
  /** how the camera behaves: free, following the army, cinematic behind the column, from above, or a far view of the map */
  camera: CameraMode;
  /** the effective graphics: the tier and what the reader switched on or off */
  graphics: Graphics;
  /** each increase flies the camera right next to the army, where the figures of the column show */
  closeUp: number;
  onSelect: (id: string | null) => void;
  /** what the canvas says to a screen reader */
  label: string;
}

/** The Andes in 3D: the terrain, the route, a marker per event and the army at its place of the day. The only file of the scene that touches WebGL. */
export function AndesRenderer({ terrain, route, day, selectedId, camera, graphics, closeUp, onSelect, label }: AndesRendererProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const tagsRef = useRef<HTMLDivElement>(null);
  const { tier, shadows, trees, textures, flakeMax, shadowMapSize, treeDensity } = graphics;
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
  const closeUpRef = useRef<() => void>(() => {});
  const setModeRef = useRef<(mode: CameraMode) => void>(() => {});
  const modeRef = useRef(camera);
  modeRef.current = camera;

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
      animateReset: !reduced && tier !== 'low',
      zoomMin: ZOOM_MIN_ANDES,
      phiMax: PHI_MAX_ANDES,
      shadows,
      beforeRender: () => beforeRender()
    });
    poseRef.current = stage.pose;
    stageRef.current = stage;
    const { scene } = stage;
    let beforeRender = () => {};

    // distance fades into the horizon color of the sky, so the edges of the terrain are not a cut
    const fog = new Fog(SKY_RAMP[0]!, start.radius * 1.1, start.radius * 3);
    scene.fog = fog;

    // the sky: a dome around the scene, a pale blue haze at the horizon to a deep blue overhead
    const dome = new SphereGeometry(SKY_RADIUS, 32, 16);
    const domeColors = new Float32Array(dome.attributes.position!.count * 3);
    const sky = new Color();
    for (let i = 0; i < dome.attributes.position!.count; i += 1) {
      sky.set(skyColorHex(dome.attributes.position!.getY(i) / SKY_RADIUS));
      domeColors[i * 3] = sky.r;
      domeColors[i * 3 + 1] = sky.g;
      domeColors[i * 3 + 2] = sky.b;
    }
    dome.setAttribute('color', new Float32BufferAttribute(domeColors, 3));
    const domeMesh = new Mesh(dome, new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false }));
    domeMesh.renderOrder = -2;
    scene.add(domeMesh);
    scene.add(new AmbientLight(tokens.ink, 0.55));
    const SUN_INTENSITY = 3.2;
    const sun = new DirectionalLight(tokens.ink, SUN_INTENSITY);
    sun.position.set(-9, 5, 5); // low: the relief throws shadows
    scene.add(sun.target);
    const shadowSize = shadowMapSize || 1024;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.left = -4;
    sun.shadow.camera.right = 4;
    sun.shadow.camera.top = 4;
    sun.shadow.camera.bottom = -4;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // the terrain, colored by height
    const mesh = buildTerrainMesh(terrain, scale, preset.terrainDetail);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3));
    const colors = new Float32Array(mesh.heightT.length * 3);
    const c = new Color();
    const c2 = new Color();
    mesh.heightT.forEach((t, i) => {
      rampColor(t, c, c2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.setIndex(new BufferAttribute(mesh.indices, 1));
    geometry.computeVertexNormals();
    const baseMesh = new Mesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
    scene.add(baseMesh);

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
    const path = buildPath(Float32Array.from(samples));
    const sampleCount = samples.length / 3;

    // a marker per event, lit when selected
    const lit = new Color(SEQUENTIAL_BLUE[9]); // the blue of the interface marks what is selected on the terrain
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

    // up close the marker gives way to a column of figures on terrain in detail: procedural relief, trees and shadows
    const field = createField({ terrain, scale, path, seed: RELIEF_SEED, amplitude: RELIEF_AMPLITUDE });
    const groundTexture = textures ? makeGroundTexture() : null;
    const detail = createDetailTerrain(field, {
      size: CHUNK_SIZE,
      cells: Math.max(16, Math.round(CHUNK_CELLS * preset.terrainDetail)),
      radius: CHUNK_RADIUS,
      treeDensity: trees ? treeDensity : 0,
      seed: RELIEF_SEED,
      treeColor: '#2f5a34',
      texture: groundTexture
    });
    detail.group.visible = false;
    scene.add(detail.group);
    // the far mountains: the whole ground from the same field as the chunks, coarse, so the peaks and the snow show to the horizon
    const farData = buildPatch(
      field,
      -scale.width / 2,
      -scale.depth / 2,
      scale.width,
      scale.depth,
      Math.max(24, Math.round((scale.width / FAR_STEP) * preset.terrainDetail)),
      Math.max(24, Math.round((scale.depth / FAR_STEP) * preset.terrainDetail)),
      RELIEF_SEED
    );
    const farGeometry = new BufferGeometry();
    farGeometry.setAttribute('position', new BufferAttribute(farData.positions, 3));
    farGeometry.setAttribute('normal', new BufferAttribute(farData.normals, 3));
    farGeometry.setAttribute('color', new Float32BufferAttribute(farData.colors, 3));
    farGeometry.setAttribute('uv', new BufferAttribute(farData.uvs, 2));
    farGeometry.setIndex(new BufferAttribute(farData.indices, 1));
    const farMaterial = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      map: groundTexture,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2
    });
    const farMesh = new Mesh(farGeometry, farMaterial);
    farMesh.position.y = -FAR_LOWER;
    farMesh.visible = false;
    scene.add(farMesh);
    const { count } = figureCount(startingMen(route.points), preset.particleScale);
    const column = createFigureColumn(count, path, (x, z) => field.height(x, z) + FIGURE_LIFT, FIGURE_SCALE);
    column.mesh.castShadow = true;
    column.mesh.visible = false;
    scene.add(column.mesh);
    // a light snowstorm up close, heavier the higher the army is: flakes that fall around the camera
    const flakes = snowField(Math.max(1, flakeMax), RELIEF_SEED, army.position, SNOW_SIZE, SNOW_HEIGHT);
    const flakePositions = new BufferAttribute(flakes.positions, 3);
    flakePositions.setUsage(DynamicDrawUsage);
    const snowGeometry = new BufferGeometry();
    snowGeometry.setAttribute('position', flakePositions);
    // a soft round flake (a points sprite is a square without a map)
    const flakeCanvas = document.createElement('canvas');
    flakeCanvas.width = 32;
    flakeCanvas.height = 32;
    const flakeContext = flakeCanvas.getContext('2d');
    if (flakeContext) {
      const glow = flakeContext.createRadialGradient(16, 16, 0, 16, 16, 16);
      glow.addColorStop(0, 'rgba(255,255,255,1)');
      glow.addColorStop(0.5, 'rgba(255,255,255,0.7)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      flakeContext.fillStyle = glow;
      flakeContext.fillRect(0, 0, 32, 32);
    }
    const flakeTexture = new CanvasTexture(flakeCanvas);
    const snow = new Points(
      snowGeometry,
      new PointsMaterial({ color: '#ffffff', map: flakeTexture, size: 0.03, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false, fog: false })
    );
    snow.frustumCulled = false;
    snow.visible = false;
    scene.add(snow);
    let snowLevel = 0;
    let stopSnow: (() => void) | null = null;
    // up close the markers of the events are as big as a mountain next to the figures: only the chosen one stays, and small
    const applyMarkers = () => {
      for (const m of markers) {
        const chosen = m.id === selectedRef.current;
        m.mesh.visible = lod !== 'figures' || chosen;
        m.mesh.scale.setScalar(chosen ? (lod === 'figures' ? 0.5 : 1.4) : 1);
      }
    };
    const fogFar: [number, number] = [start.radius * 1.1, start.radius * 3];
    const head: PathSample = { x: 0, y: 0, z: 0, heading: 0 };
    let leaderArc = 0;
    let lod: 'marker' | 'figures' = 'marker';
    // the snow shows only up close and where the army is high; it falls on its own loop, still under reduced motion
    const syncSnow = () => {
      const near = lod === 'figures';
      const on = near && flakeMax > 0 && snowLevel > 0;
      const heavy = near ? snowLevel : 0;
      fog.near = near ? NEAR_FOG[0] + (SNOW_FOG[0] - NEAR_FOG[0]) * heavy : fogFar[0];
      fog.far = near ? NEAR_FOG[1] + (SNOW_FOG[1] - NEAR_FOG[1]) * heavy : fogFar[1];
      fog.color.set(SKY_RAMP[0]!).lerp(STORM_HAZE, STORM_HAZE_SHARE * heavy);
      sun.intensity = SUN_INTENSITY * (1 - STORM_DIM * heavy);
      snow.visible = on;
      snowGeometry.setDrawRange(0, snowCount(snowLevel, flakeMax));
      if (on && !stopSnow) {
        stepSnow(flakes, 0, SNOW_WIND, stage.camera.position, SNOW_SIZE, SNOW_HEIGHT);
        flakePositions.needsUpdate = true;
        if (!reduced) {
          let last = 0;
          stopSnow = stage.loop((ms) => {
            const dt = last === 0 ? 0 : Math.min(0.1, (ms - last) / 1000);
            last = ms;
            stepSnow(flakes, dt, SNOW_WIND, stage.camera.position, SNOW_SIZE, SNOW_HEIGHT);
            flakePositions.needsUpdate = true;
          });
        }
      } else if (!on && stopSnow) {
        stopSnow();
        stopSnow = null;
      }
      stage.requestRender();
    };
    const lightOnArmy = () => {
      sun.target.position.copy(army.position);
      sun.position.copy(army.position).add(SUN_OFFSET);
    };
    const enterLod = (next: 'marker' | 'figures') => {
      lod = next;
      const near = lod === 'figures';
      army.visible = !near;
      applyMarkers();
      column.mesh.visible = near;
      baseMesh.visible = !near;
      farMesh.visible = near;
      detail.group.visible = near;
      sun.castShadow = near && shadows;
      syncSnow();
      if (near) {
        detail.ensureAround(army.position.x, army.position.z);
        lightOnArmy();
      } else {
        sun.target.position.set(0, 0, 0);
        sun.position.set(-9, 5, 5);
      }
    };
    // the names of the places float over their markers: they fade with the distance and hide with the marker
    const tagEls = tagsRef.current ? (Array.from(tagsRef.current.children) as HTMLElement[]) : [];
    const tagPoint = new Vector3();
    const updateTags = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      markers.forEach((m, i) => {
        const el = tagEls[i];
        if (!el) return;
        tagPoint.copy(m.mesh.position);
        tagPoint.y += 0.35 * m.mesh.scale.y;
        const distance = stage.camera.position.distanceTo(tagPoint);
        tagPoint.project(stage.camera);
        const at = toScreen(tagPoint, w, h);
        const opacity = at.visible && m.mesh.visible ? labelOpacity(distance) : 0;
        el.style.opacity = opacity.toFixed(2);
        if (opacity > 0) el.style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px) translate(-50%, -100%)`;
      });
    };
    beforeRender = () => {
      updateTags();
      const next = lodFor(stage.camera.position.distanceTo(army.position), lod);
      if (next !== lod) enterLod(next);
      if (lod !== 'figures') {
        // far from the army the camera stays above the horizon: below it only the sky would show
        if (stage.pose.phi > PHI_MAX) stage.nav.setPose({ ...stage.pose, phi: PHI_MAX });
        return;
      }
      // never under the ground of the detailed terrain
      const cam = stage.camera.position;
      const floor = field.height(cam.x, cam.z) + CAMERA_CLEARANCE;
      const lifted = cam.y < floor;
      if (lifted) cam.y = floor;
      // past the horizon the view keeps tilting up, so the sky shows even when the ground holds the camera back
      if (lifted || stage.pose.phi > Math.PI / 2) {
        const at = lookPoint(cam, stage.pose, stage.pose.phi);
        stage.camera.lookAt(at.x, at.y, at.z);
      }
    };
    // a rigged camera (cinematic, aerial): behind the army and above the ground; `k` is how much of the turn toward its heading is taken
    const eye: PathSample = { x: 0, y: 0, z: 0, heading: 0 };
    let cineBase: CameraState | null = null;
    let left: CameraState | null = null;
    let steer = NO_STEER;
    const rigAt = (rig: Rig, k: number, current: CameraState) => {
      const back = rig.behindColumn ? column.length + rig.back : rig.back;
      sampleAlongExtended(path, leaderArc - column.length * CINE_FOCUS, head);
      sampleAlong(path, leaderArc - back, eye); // on the route: never off its start
      const look = { x: head.x, y: field.height(head.x, head.z) + CINE_LOOK, z: head.z };
      const from = { x: eye.x, y: field.height(eye.x, eye.z) + rig.height, z: eye.z };
      from.y = clearEye(from, look, field.height, CAMERA_CLEARANCE); // a hill between the camera and the column lifts it
      return cinePose(look, from, current, k);
    };

    const setDay = (d: number) => {
      const p = positionAt(route, d);
      if (!p) return;
      const at = toScene(scale, p.lon, p.lat, ground(p.lon, p.lat, p.altitudeM));
      army.position.set(at.x, at.y + LIFT + 0.2, at.z);
      const level = snowAmount(p.altitudeM);
      if (level !== snowLevel) {
        snowLevel = level;
        syncSnow();
      }
      const along = (d - route.firstDay) / Math.max(1, route.lastDay - route.firstDay);
      leaderArc = arcAt(path, Math.min(1, Math.max(0, along)) * (sampleCount - 1));
      column.update(leaderArc);
      if (lod === 'figures') {
        detail.ensureAround(army.position.x, army.position.z);
        lightOnArmy();
      }
      const rig = rigFor(modeRef.current);
      if (rig) {
        // a rigged camera is written every day tick; what the user did to the camera in between stays on top of it
        if (cineBase && left) steer = addSteer(steer, left, stage.pose);
        cineBase = rigAt(rig, CINE_TURN, cineBase ?? stage.pose);
        stage.nav.setPose(steered(cineBase, steer, PHI_MAX_ANDES));
        left = copyCamera(stage.pose);
      } else if (modeRef.current === 'follow') stage.nav.setTarget(at.x, at.y, at.z);
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
      applyMarkers();
      const point = route.points.find((p) => p.id === id);
      if (fly && point) stage.nav.flyTo(battlePose(scale, terrain, point));
      stage.requestRender();
    };
    setSelectedRef.current = setSelected;
    setSelected(selectedRef.current, false);

    // a camera mode: it flies to its place (the army, behind it, above it, or the far view of the whole map) and, if it is rigged or following, keeps it as the days go by
    closeUpRef.current = () => stage.nav.flyTo(closePose(scale, army.position, stage.pose));
    setModeRef.current = (mode) => {
      cineBase = null;
      left = null;
      steer = NO_STEER;
      const rig = rigFor(mode);
      if (rig) stage.nav.flyTo(rigAt(rig, 1, stage.pose));
      else if (mode === 'follow') stage.nav.flyTo(followPose(scale, army.position, stage.pose));
      else if (mode === 'map') stage.nav.flyTo(overviewPose(scale));
    };
    if (modeRef.current !== 'free') setModeRef.current(modeRef.current);

    // pointer: a click (4 px or less) on a marker selects it; moving over one names it
    const canvas = stage.renderer.domElement;
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const pick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, stage.camera);
      return raycaster.intersectObjects(markers.filter((m) => m.mesh.visible).map((m) => m.mesh), false)[0]?.object ?? null;
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
      closeUpRef.current = () => {};
      setModeRef.current = () => {};
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      stageRef.current = null;
      markerGeometry.dispose();
      snowGeometry.dispose();
      flakeTexture.dispose();
      farGeometry.dispose();
      farMaterial.dispose();
      groundTexture?.dispose();
      detail.dispose();
      stage.dispose();
    };
  }, [terrain, route, preset.terrainDetail, preset.pixelRatioCap, tier, shadows, trees, textures, flakeMax, shadowMapSize, treeDensity, reduced, poseRef, stageRef]);

  useEffect(() => setDayRef.current(day), [day]);
  useEffect(() => setSelectedRef.current(selectedId, true), [selectedId]);
  useEffect(() => {
    if (closeUp > 0) closeUpRef.current();
  }, [closeUp]);
  useEffect(() => setModeRef.current(camera), [camera]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d" role="img" aria-label={label} data-chart3d="andes">
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
      <div ref={tagsRef} className="andes-tags" aria-hidden="true">
        {route.points.map((p) => (
          <span key={p.id} className="andes-tag">
            {p.name}
          </span>
        ))}
      </div>
      <NavControls {...controls} />
    </div>
  );
}

export default AndesRenderer;
