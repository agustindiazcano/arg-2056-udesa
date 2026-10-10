import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MercatorCoordinate, Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { CustomLayerInterface, CustomRenderMethodInput, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import { AmbientLight, Color, DirectionalLight, InstancedMesh, Matrix4, MeshStandardMaterial, PerspectiveCamera, Quaternion, Scene, SphereGeometry, Vector3, WebGLRenderer } from 'three';
import { QUALITY_PRESETS } from '../../runtime/capabilities';
import { NavControls } from '../../ui/NavControls';
import { figureCount, startingMen } from './column';
import type { CameraApi, CameraView } from './cameraKeyframes';
import { columnColor, positionOfColumn } from './columns';
import { ForceBubbles } from './ForceBubbles';
import { RegionMinimap } from './RegionMinimap';
import { BATTLE_COLOR, battleFeature } from './regionMap';
import { SlotPortal } from '../../dashboard/SlotPortal';
import type { Column } from './columns';
import type { CameraMode } from './camera';
import { createFigureColumn } from './figures3d';
import type { FigureColumn } from './figures3d';
import type { Graphics } from './graphics';
import { FIGURE_MIN_ZOOM, cameraFor, coordAtKm, figuresVisible, gaitAmount, gaitPhaseAt, metersPerPixel, metersPerUnit, mixHex, timeScaleForZoom, WASD_SHIFT_FACTOR, WASD_SPEED_PX, wasdDelta } from './mapGeo';
import { arcAt, buildPath } from './pathAlong';
import { distanceKm } from './timeline';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import { ANDES_FINAL_VIEW, ANDES_TOUR, SPOT_VIEW, TOUR_HOLD_MS, tourDurationMs, tourPoseAt } from './tour';
import {
  FORCES,
  FORCE_FACTS,
  MAIN_FORCE_ID,
  SPOTLIGHT_FINAL_MS,
  ballCount,
  ballPositions,
  ballSpacingKm,
  beamGeometry,
  bubblesFor,
  ENEMY_ID,
  enemyBalls,
  figureMen,
  forceMen,
  isSmallForce,
  placeLabel,
  spotlightDimAt,
  spotlightStateAt
} from './forces';
import type { ForceInfo } from './forces';
import type { Path } from './pathAlong';
import { positionAt } from './timeline';
import type { Route } from './timeline';
import 'maplibre-gl/dist/maplibre-gl.css';
import './mapLibre.css';

// the worker is a file of the build (the CSP only lets scripts come from this origin)
setWorkerUrl(workerUrl);

const MAPTILER_KEY: string = import.meta.env.VITE_MAPTILER_KEY ?? '';
const STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
const DEM_URL = `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`;
/** The relief is drawn as it is (a mountain of 6,900 m looks like one at a glance); a little over 1 helps at the low pitch of the far views. */
const EXAGGERATION = 1.2;
/** How tall a figure stands on the screen, in pixels, while the column is a miniature. */
const FIGURE_PX = 22;
/** The column spans at most this many units behind the leader (`column.ts` MAX_LENGTH is 6); the window of the local path covers it with margin. */
const WINDOW_BACK_UNITS = 7;
const WINDOW_FORWARD_UNITS = 3;
const PATH_STEP_UNITS = 0.04;
const REBUILD_EVERY_MS = 120;

export interface MapLibreRendererProps {
  route: Route;
  /** the other columns of the crossing: drawn on the map, a ball each that moves with the clock (the camera only follows the main one) */
  columns: readonly Column[];
  day: number;
  selectedId: string | null;
  camera: CameraMode;
  graphics: Graphics;
  closeUp: number;
  onSelect: (id: string | null) => void;
  /** the clock keeps this share of its pace: smaller the closer the camera is (called when it changes, and with 1 when the map goes away) */
  onTimeScale?: (scale: number) => void;
  /** the map has its first image: the loading screen can leave */
  onReady?: () => void;
  /** filled with a way to read and move the camera by numbers (the camera tuner uses it) */
  cameraApi?: { current: CameraApi | null };
  /** the camera while it moves (about every 120 ms) and when it stops; only given while something shows the numbers */
  onView?: (view: CameraView) => void;
  /** 0: no tour; a number that grows each time the tour must play (the first one starts after the loading screen) */
  tourPlay?: number;
  /** the reader chose a force in a button: the map goes to it (`n` grows on every click, so the same force can be asked twice) */
  focusForce?: { id: string; n: number } | null;
  /** a force was chosen on the map (its name): the scene can mark its button */
  onFocusForce?: (id: string) => void;
  /** the tour finished or the reader took the camera: the scene can set `tourPlay` back to 0 */
  onTourEnd?: () => void;
  label: string;
}

/** The sky by day and in the dark of the spotlight (the map and the sky dim while the lights go on). */
const SKY_DAY = { 'sky-color': '#5b9bd5', 'horizon-color': '#cfe3f3', 'fog-color': '#dbe7f2' };
const SKY_DARK = { 'sky-color': '#0b1830', 'horizon-color': '#1c2f4d', 'fog-color': '#16253d' };
/** How wide each light is on the ground, in pixels of the screen. */
const SPOT_RADIUS_PX = 96;
/** How strong the light is (0 to 1): soft, so the dark map still reads under it. */
const SPOT_LIGHT = 0.55;
/** How the camera frames a force the reader chose: close enough to see its balls and its name, at an angle. */
const FORCE_VIEW = { zoom: 9.6, pitch: 62 };


/** One of the blue balls of the far view: where it is, which force it belongs to and whether it is a small one. */
interface Ball {
  id: string;
  lon: number;
  lat: number;
  small: boolean;
  /** the color of the sphere, when it is not the blue of the patriot forces */
  color?: number;
}

/** The blue balls of the far view: one for about every 500 men of each force, a smaller one for a force under a hundred, in a short line behind its head. */
function forceBalls(main: Route, mainKm: number, columns: readonly Column[], day: number, zoom: number, latitude: number): Ball[] {
  const spacing = ballSpacingKm(zoom, latitude);
  const balls: Ball[] = [];
  const add = (id: string, route: Route, km: number) => {
    const men = forceMen(route.points);
    for (const [lon, lat] of ballPositions(route, km, ballCount(men), spacing)) balls.push({ id, lon, lat, small: isSmallForce(men) });
  };
  add(MAIN_FORCE_ID, main, mainKm);
  for (const c of columns) add(c.id, c.route, positionOfColumn(c, day)?.distanceKm ?? 0);
  // the royalist army at Chacabuco: red balls in a row across its place
  for (const [lon, lat] of enemyBalls(spacing)) balls.push({ id: ENEMY_ID, lon, lat, small: false, color: 0xe53935 });
  return balls;
}

/** The ball is this many pixels across on the screen, whatever the zoom: a small force has a smaller one. */
const BALL_PX = 8;
const SMALL_BALL_PX = 4.5;
/** The local frame of the balls is centered here: the middle of the crossing. */
const BALLS_ORIGIN: [number, number] = [-69.8, -32];
const MAX_BALLS = 64;
/** How much bigger the spheres are while the spotlight is on. */
const SPOT_BALL_FACTOR = 2.6;

/**
 * The balls of the far view as real spheres: a MapLibre custom layer drawn by Three.js (lit, with a little glow of their own so they read on the dark
 * map of the spotlight), standing on the terrain and the same size on the screen at every zoom. A frame of meters around `BALLS_ORIGIN` keeps the
 * numbers small for the 32-bit matrices.
 */
class BallsLayer implements CustomLayerInterface {
  readonly id = 'force-balls-3d';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  private balls: Ball[] = [];
  private map: MapLibreMap | null = null;
  private renderer: WebGLRenderer | null = null;
  private mesh: InstancedMesh | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera();
  private readonly model = new Matrix4();
  private readonly projection = new Matrix4();
  private readonly at = new Vector3();
  private readonly one = new Vector3();
  private readonly instance = new Matrix4();
  private readonly color = new Color();
  private readonly noTurn = new Quaternion();

  private emphasized = false;

  setBalls(balls: Ball[]): void {
    this.balls = balls;
    this.map?.triggerRepaint();
  }

  /** Bigger spheres while the spotlight goes over the forces, so they can be seen from far above. */
  setEmphasis(on: boolean): void {
    this.emphasized = on;
    this.map?.triggerRepaint();
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    this.scene.add(new AmbientLight(0xffffff, 1.5));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(-0.5, 1, 0.6);
    this.scene.add(sun);
    this.mesh = new InstancedMesh(
      new SphereGeometry(1, 28, 18),
      new MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 }),
      MAX_BALLS
    );
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  onRemove(): void {
    this.mesh?.geometry.dispose();
    this.renderer?.dispose();
    this.renderer = null;
    this.mesh = null;
    this.map = null;
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput): void {
    const map = this.map;
    const renderer = this.renderer;
    const mesh = this.mesh;
    if (!map || !renderer || !mesh || this.balls.length === 0) return;
    const originMc = MercatorCoordinate.fromLngLat(BALLS_ORIGIN, 0);
    const scale = originMc.meterInMercatorCoordinateUnits();
    const mpp = metersPerPixel(map.getZoom(), map.getCenter().lat);
    const n = Math.min(MAX_BALLS, this.balls.length);
    for (let i = 0; i < n; i += 1) {
      const b = this.balls[i]!;
      const mc = MercatorCoordinate.fromLngLat([b.lon, b.lat], 0);
      const radius = ((b.small ? SMALL_BALL_PX : BALL_PX) * (this.emphasized ? SPOT_BALL_FACTOR : 1) / 2) * mpp;
      const ground = map.queryTerrainElevation([b.lon, b.lat]) ?? 0;
      this.at.set((mc.x - originMc.x) / scale, ground + radius, (mc.y - originMc.y) / scale);
      this.instance.compose(this.at, this.noTurn, this.one.setScalar(radius));
      mesh.setMatrixAt(i, this.instance);
      mesh.setColorAt(i, this.color.set(b.color ?? (b.small ? 0x6aa5ff : 0x2f7bff)));
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    const k = scale;
    this.model.makeTranslation(originMc.x, originMc.y, 0).multiply(new Matrix4().makeScale(k, -k, k)).multiply(new Matrix4().makeRotationX(Math.PI / 2));
    this.projection.fromArray(args.defaultProjectionData.mainMatrix as unknown as number[]);
    this.camera.projectionMatrix.copy(this.projection).multiply(this.model);
    renderer.resetState();
    renderer.render(this.scene, this.camera);
  }
}

function columnsGeoJson(columns: readonly Column[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: columns.map((c): GeoJSON.Feature => ({
      type: 'Feature',
      properties: { id: c.id, color: columnColor(c.id) },
      geometry: { type: 'LineString', coordinates: c.route.points.map((p) => [p.lon, p.lat]) }
    }))
  };
}

function routeGeoJson(route: Route, uptoKm: number): { all: GeoJSON.FeatureCollection; done: GeoJSON.FeatureCollection; places: GeoJSON.FeatureCollection } {
  const line = (coords: number[][]): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: coords.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] : []
  });
  const all = route.points.map((p) => [p.lon, p.lat]);
  const done: number[][] = [];
  for (const p of route.points) {
    if (p.distanceKm <= uptoKm) done.push([p.lon, p.lat]);
  }
  const here = coordAtKm(route, uptoKm);
  if (done.length > 0) done.push([here.lon, here.lat]);
  return {
    all: line(all),
    done: line(done),
    places: {
      type: 'FeatureCollection',
      features: route.points.map((p) => ({
        type: 'Feature',
        properties: { id: p.id, name: p.name, reached: p.distanceKm <= uptoKm ? 1 : 0 },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
      }))
    }
  };
}

/**
 * The column of figures as a MapLibre custom layer drawn by Three.js, standing on the real terrain of the map. Its local frame has the
 * units of the figures (`figureParts`): x east, y up, z south. A unit is `metersPerUnit(zoom)` meters, so the column stays a readable miniature
 * at every zoom and becomes life-size at the closest one. The path the figures follow is the route sampled around the army, with the
 * height of the map's own terrain.
 */
class ArmyLayer implements CustomLayerInterface {
  readonly id: string;
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  /** called when a frame wants the next one (the figures move with the days) */
  active = false;
  /** the km along the route where the leader of the column is; when it changes the army is walking */
  private kmValue = 0;
  private lastMovedMs = 0;
  get km(): number {
    return this.kmValue;
  }
  set km(value: number) {
    if (value !== this.kmValue) this.lastMovedMs = performance.now();
    this.kmValue = value;
  }
  private map: MapLibreMap | null = null;
  private renderer: WebGLRenderer | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera();
  private column: FigureColumn | null = null;
  private path: Path | null = null;
  private pathKm0 = 0;
  private pathStepKm = 0;
  private builtUnit = 0;
  private builtAt = 0;
  private origin = { x: 0, y: 0, scale: 1 };
  private readonly model = new Matrix4();
  private readonly projection = new Matrix4();

  constructor(
    private readonly route: Route,
    private readonly count: number,
    id = 'army-figures'
  ) {
    this.id = id;
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    this.scene.add(new AmbientLight(0xffffff, 1.4));
    const sun = new DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(-0.6, 1, 0.4);
    this.scene.add(sun);
  }

  onRemove(): void {
    this.column?.mesh.geometry.dispose();
    this.renderer?.dispose();
    this.renderer = null;
    this.map = null;
  }

  /** Rebuilds the path around the army at this unit size and puts the column on it. */
  private rebuild(unitMeters: number): void {
    const map = this.map;
    if (!map) return;
    const here = coordAtKm(this.route, this.km);
    const originMc = MercatorCoordinate.fromLngLat([here.lon, here.lat], 0);
    const scale = originMc.meterInMercatorCoordinateUnits();
    this.origin = { x: originMc.x, y: originMc.y, scale };
    const stepKm = (PATH_STEP_UNITS * unitMeters) / 1000;
    const km0 = this.km - WINDOW_BACK_UNITS * (unitMeters / 1000);
    const n = Math.ceil(((WINDOW_BACK_UNITS + WINDOW_FORWARD_UNITS) * (unitMeters / 1000)) / stepKm) + 1;
    const points = new Float32Array(n * 3);
    let lastHeight = 0;
    for (let i = 0; i < n; i += 1) {
      const c = coordAtKm(this.route, km0 + i * stepKm);
      const mc = MercatorCoordinate.fromLngLat([c.lon, c.lat], 0);
      const height = map.queryTerrainElevation([c.lon, c.lat]) ?? lastHeight;
      lastHeight = height;
      points[i * 3] = (mc.x - originMc.x) / scale / unitMeters;
      points[i * 3 + 1] = height / unitMeters;
      points[i * 3 + 2] = (mc.y - originMc.y) / scale / unitMeters;
    }
    this.path = buildPath(points);
    this.pathKm0 = km0;
    this.pathStepKm = stepKm;
    this.builtUnit = unitMeters;
    this.builtAt = performance.now();
    if (this.column) {
      this.scene.remove(this.column.mesh);
      this.column.mesh.geometry.dispose();
    }
    this.column = createFigureColumn(this.count, this.path, () => null);
    this.column.mesh.frustumCulled = false;
    this.scene.add(this.column.mesh);
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput): void {
    const map = this.map;
    const renderer = this.renderer;
    if (!map || !renderer || !this.active || this.count === 0) return;
    const zoom = map.getZoom();
    const unitMeters = metersPerUnit(zoom, map.getCenter().lat, FIGURE_PX);
    const km = this.km;
    const stale =
      !this.path ||
      Math.abs(unitMeters / this.builtUnit - 1) > 0.08 ||
      km > this.pathKm0 + (WINDOW_BACK_UNITS + WINDOW_FORWARD_UNITS * 0.5) * (this.builtUnit / 1000) ||
      km < this.pathKm0 + WINDOW_BACK_UNITS * 0.9 * (this.builtUnit / 1000);
    if (stale && (!this.path || performance.now() - this.builtAt > REBUILD_EVERY_MS)) this.rebuild(unitMeters);
    if (!this.path || !this.column) return;

    // the leader's place on the path: the path is sampled at a fixed step of km
    const index = (km - this.pathKm0) / this.pathStepKm;
    const now = performance.now();
    const amount = gaitAmount(now, this.lastMovedMs);
    this.column.update(arcAt(this.path, index), gaitPhaseAt(now), amount);
    if (amount > 0) map.triggerRepaint(); // the legs keep moving while the army does

    const s = this.origin.scale * this.builtUnit;
    this.model
      .makeTranslation(this.origin.x, this.origin.y, 0)
      .multiply(new Matrix4().makeScale(s, -s, s))
      .multiply(new Matrix4().makeRotationX(Math.PI / 2));
    this.projection.fromArray(args.defaultProjectionData.mainMatrix as unknown as number[]);
    this.camera.projectionMatrix.copy(this.projection).multiply(this.model);
    renderer.resetState();
    renderer.render(this.scene, this.camera);
  }
}

/** Real map of the crossing: MapTiler satellite imagery draped on the MapTiler terrain (real relief), the route and its places, and the army as miniatures on it. */
export function MapLibreRenderer({ route, columns, day, selectedId, camera, graphics, closeUp, onSelect, onTimeScale, onReady, cameraApi, onView, tourPlay = 0, onTourEnd, focusForce = null, onFocusForce, label }: MapLibreRendererProps) {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const layerRef = useRef<ArmyLayer | null>(null);
  const otherArmiesRef = useRef<Array<{ id: string; layer: ArmyLayer }>>([]);
  const ballsRef = useRef<BallsLayer | null>(null);
  const readyRef = useRef(false);
  const dayRef = useRef(day);
  const cameraRef = useRef(camera);
  const onSelectRef = useRef(onSelect);
  const onTimeScaleRef = useRef(onTimeScale);
  const onReadyRef = useRef(onReady);
  const onViewRef = useRef(onView);
  const onTourEndRef = useRef(onTourEnd);
  const onFocusForceRef = useRef(onFocusForce);
  const routeRef = useRef(route);
  const flyToForceRef = useRef<(id: string) => void>(() => undefined);
  const tookOverRef = useRef(false);
  const stopTourRef = useRef<() => void>(() => undefined);
  const beamRef = useRef<SVGSVGElement>(null);
  const [mainMap, setMainMap] = useState<MapLibreMap | null>(null);
  const [bubblesOn, setBubblesOn] = useState(true);
  const cardRef = useRef<HTMLElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<{ force: ForceInfo; place: string } | null>(null);
  const spotStopRef = useRef<() => void>(() => undefined);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  /** the reader takes the camera, or something else moves it: the tour and the spotlight stop */
  const stopAnimations = () => {
    stopTourRef.current();
    spotStopRef.current();
  };
  const lastScaleRef = useRef(1);
  const [missingKey] = useState(MAPTILER_KEY === '');
  const position = positionAt(route, day);
  const km = position?.distanceKm ?? 0;
  const kmRef = useRef(km);
  dayRef.current = day;
  cameraRef.current = camera;
  onSelectRef.current = onSelect;
  onTimeScaleRef.current = onTimeScale;
  onReadyRef.current = onReady;
  onViewRef.current = onView;
  onTourEndRef.current = onTourEnd;
  onFocusForceRef.current = onFocusForce;
  routeRef.current = route;
  /** Takes the camera to a force: where it is on the clock's day, seen from a little above and at an angle. */
  flyToForceRef.current = (id: string) => {
    const map = mapRef.current;
    if (!map) return;
    let at: [number, number] | null = null;
    if (id === MAIN_FORCE_ID) {
      const c = coordAtKm(routeRef.current, kmRef.current);
      at = [c.lon, c.lat];
    } else {
      const column = columnsRef.current.find((q) => q.id === id);
      const where = column ? positionOfColumn(column, dayRef.current) : null;
      if (where) at = [where.lon, where.lat];
    }
    if (!at) return;
    tookOverRef.current = true;
    stopAnimations();
    map.flyTo({ center: at, zoom: FORCE_VIEW.zoom, pitch: FORCE_VIEW.pitch, bearing: map.getBearing(), duration: 1800, essential: true });
  };
  kmRef.current = km;
  const bubbles = useMemo(() => bubblesFor(route, km, columns, day), [route, km, columns, day]);

  const syncArmy = () => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !readyRef.current) return;
    const k = kmRef.current;
    layer.km = k;
    const g = routeGeoJson(route, k);
    (map.getSource('route-done') as GeoJSONSource | undefined)?.setData(g.done);
    (map.getSource('places') as GeoJSONSource | undefined)?.setData(g.places);
    const zoom = map.getZoom();
    const wantFigures = figuresVisible(zoom, layer.active);
    layer.active = wantFigures;
    // the other forces show their figures too, up close and only when the camera is near them
    const centre = map.getCenter();
    const withFigures = new Set<string>(wantFigures ? [MAIN_FORCE_ID] : []);
    for (const { id, layer: other } of otherArmiesRef.current) {
      const column = columnsRef.current.find((q) => q.id === id);
      const at = column ? positionOfColumn(column, dayRef.current) : null;
      if (!column || !at) continue;
      other.km = at.distanceKm;
      const near = distanceKm(centre.lng, centre.lat, at.lon, at.lat) < 60;
      other.active = figuresVisible(zoom, other.active) && near;
      if (other.active) withFigures.add(id);
    }
    // a force that shows its figures has no balls
    const balls = forceBalls(route, k, columnsRef.current, dayRef.current, zoom, centre.lat);
    ballsRef.current?.setBalls(balls.filter((ball) => !withFigures.has(ball.id)));
    map.triggerRepaint();
  };
  const syncArmyRef = useRef(syncArmy);
  syncArmyRef.current = syncArmy;

  const aim = (mode: CameraMode, duration: number) => {
    const map = mapRef.current;
    if (!map) return;
    const target = cameraFor(mode, coordAtKm(route, kmRef.current));
    if (target) map.easeTo({ ...target, duration, essential: true });
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const overview = ANDES_TOUR[0]!;
    const map = new MapLibreMap({
      container: host,
      style: missingKey ? { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#1b2733' } }] } : STYLE_URL,
      center: [overview.lon, overview.lat],
      zoom: overview.zoom,
      pitch: overview.pitch,
      bearing: overview.bearing,
      maxPitch: 82,
      maxZoom: 17.5,
      attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true }
    });
    mapRef.current = map;
    setMainMap(map);
    if (import.meta.env.DEV) (window as unknown as { __andesMap?: MapLibreMap }).__andesMap = map; // for looking at the map from the console while developing
    const layer = new ArmyLayer(route, figureCount(startingMen(route.points), QUALITY_PRESETS[graphics.tier].particleScale).count);
    layerRef.current = layer;
    const particleScale = QUALITY_PRESETS[graphics.tier].particleScale;
    otherArmiesRef.current = columns.map((c) => ({
      id: c.id,
      layer: new ArmyLayer(c.route, figureCount(figureMen(c.id, forceMen(c.route.points)), particleScale).count, `army-figures-${c.id}`)
    }));

    map.on('load', () => {
      if (!missingKey) {
        map.addSource('terrain-dem', { type: 'raster-dem', url: DEM_URL, tileSize: 256 });
        map.setTerrain({ source: 'terrain-dem', exaggeration: EXAGGERATION });
        map.addLayer({
          id: 'hillshade',
          type: 'hillshade',
          source: 'terrain-dem',
          paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#0b1220', 'hillshade-highlight-color': '#ffffff', 'hillshade-accent-color': '#0b1220' }
        });
        map.setSky({
          'sky-color': '#5b9bd5',
          'horizon-color': '#cfe3f3',
          'fog-color': '#dbe7f2',
          'sky-horizon-blend': 0.6,
          'horizon-fog-blend': 0.8,
          'fog-ground-blend': 0.2
        });
      }
      const g = routeGeoJson(route, kmRef.current);
      map.addSource('route-all', { type: 'geojson', data: routeGeoJson(route, 0).all });
      map.addSource('route-done', { type: 'geojson', data: g.done });
      map.addSource('places', { type: 'geojson', data: g.places });
      map.addSource('columns-lines', { type: 'geojson', data: columnsGeoJson(columns) });
      map.addLayer({ id: 'columns-casing', type: 'line', source: 'columns-lines', paint: { 'line-color': '#0b1220', 'line-width': 5, 'line-opacity': 0.5 }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
      map.addLayer({ id: 'columns-line', type: 'line', source: 'columns-lines', paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-dasharray': [2, 1.5] }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
      map.addLayer({ id: 'route-casing', type: 'line', source: 'route-all', paint: { 'line-color': '#0b1220', 'line-width': 7, 'line-opacity': 0.55 }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route-all', paint: { 'line-color': '#2f7bff', 'line-width': 3.5, 'line-dasharray': [1.5, 1.5] }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
      map.addLayer({ id: 'route-walked', type: 'line', source: 'route-done', paint: { 'line-color': '#8fbaff', 'line-width': 4.5 }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
      map.addLayer({
        id: 'places-dot',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'id'], selectedId ?? ''], 9, 6],
          'circle-color': ['case', ['==', ['get', 'reached'], 1], '#f6b40e', '#ffffff'],
          'circle-stroke-color': '#0b1220',
          'circle-stroke-width': 2
        }
      });
      map.addLayer({
        id: 'places-label',
        type: 'symbol',
        source: 'places',
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 14, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-allow-overlap': true, 'text-ignore-placement': true },
        paint: { 'text-color': '#ffffff', 'text-halo-color': '#0b1220', 'text-halo-width': 2.2 }
      });
      map.addLayer(layer);
      for (const { layer: other } of otherArmiesRef.current) map.addLayer(other);
      const balls = new BallsLayer();
      ballsRef.current = balls;
      map.addLayer(balls);
      // the names of the places are the most important text of the map: they go over everything else, the names of the groups and the 3D models included
      // the battle of Chacabuco: a red dot with a halo, over the dot of its place
      map.addSource('battle', { type: 'geojson', data: battleFeature(route) });
      map.addLayer({ id: 'battle-halo', type: 'circle', source: 'battle', paint: { 'circle-radius': 17, 'circle-color': BATTLE_COLOR, 'circle-opacity': 0.3 } });
      map.addLayer({ id: 'battle-dot', type: 'circle', source: 'battle', paint: { 'circle-radius': 8, 'circle-color': BATTLE_COLOR, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2.5 } });
      map.moveLayer('places-dot');
      map.moveLayer('battle-halo');
      map.moveLayer('battle-dot');
      map.moveLayer('places-label');
      readyRef.current = true;
      syncArmyRef.current();
      aim(cameraRef.current, 0);
    });

    map.on('click', 'places-dot', (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === 'string') onSelectRef.current(id);
    });
    map.on('mouseenter', 'places-dot', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'places-dot', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('error', (e) => console.warn('[andes map]', e.error?.message ?? e));
    const scaleClock = () => {
      const scale = timeScaleForZoom(map.getZoom());
      if (Math.abs(scale - lastScaleRef.current) < 0.005) return;
      lastScaleRef.current = scale;
      onTimeScaleRef.current?.(scale);
    };
    map.on('zoom', () => {
      syncArmyRef.current();
      scaleClock();
    });
    // ready on the first image of the map (not when every tile and the terrain are done): the loading screen should not wait for the last tile
    map.once('load', () => onReadyRef.current?.());
    scaleClock();
    const takeOver = () => {
      tookOverRef.current = true;
      stopAnimations();
    };
    for (const type of ['mousedown', 'touchstart', 'wheel'] as const) map.on(type, takeOver);
    const readView = (): CameraView => {
      const c = map.getCenter();
      return { lon: c.lng, lat: c.lat, zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
    };
    if (cameraApi) {
      cameraApi.current = {
        get: readView,
        set: (v, ms = 0) => {
          takeOver();
          const target = { center: [v.lon, v.lat] as [number, number], zoom: v.zoom, pitch: v.pitch, bearing: v.bearing };
          if (ms > 0) map.easeTo({ ...target, duration: ms, essential: true });
          else map.jumpTo(target);
        }
      };
    }
    let lastView = 0;
    const publishView = (force: boolean) => {
      const now = performance.now();
      if (!onViewRef.current || (!force && now - lastView < 120)) return;
      lastView = now;
      onViewRef.current(readView());
    };
    map.on('moveend', () => publishView(true));
    const publish = () => {
      publishView(false);
      host.dataset.zoom = map.getZoom().toFixed(2);
      host.dataset.pitch = map.getPitch().toFixed(1);
      host.dataset.bearing = map.getBearing().toFixed(1);
    };
    map.on('move', publish);
    publish();

    return () => {
      readyRef.current = false;
      lastScaleRef.current = 1;
      onTimeScaleRef.current?.(1);
      if (cameraApi) cameraApi.current = null;
      setMainMap(null);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // the map is built once per route; the other props reach it through the effects below
  }, [route, missingKey]);

  // the clock moves the army; a following or cinematic camera goes with it
  useEffect(() => {
    syncArmyRef.current();
    const mode = cameraRef.current;
    const map = mapRef.current;
    if (!map || !readyRef.current || mode === 'free' || mode === 'map' || mode === 'aerial') return;
    const target = cameraFor(mode, coordAtKm(route, km));
    // jumpTo does not stop a gesture of the reader: in `follow` they keep the angle they chose, only the center goes with the army
    if (target) map.jumpTo({ center: target.center, ...(target.bearing !== undefined ? { bearing: target.bearing } : {}) });
  }, [km, day, route]);

  useEffect(() => {
    aim(camera, 1800);
    if (camera !== 'free') {
      tookOverRef.current = true;
      stopAnimations();
    }
  }, [camera]);

  // following the army the reader orbits it: dragging turns (sideways) and tilts (up and down) the camera around the army, and the wheel zooms on it
  useEffect(() => {
    const map = mapRef.current;
    if (!map || camera !== 'follow') return undefined;
    const canvas = map.getCanvas();
    map.dragPan.disable();
    map.scrollZoom.enable({ around: 'center' });
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button === 0) last = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!last || (e.buttons & 1) === 0) {
        last = null;
        return;
      }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      map.jumpTo({ bearing: map.getBearing() - dx * 0.35, pitch: Math.min(82, Math.max(5, map.getPitch() - dy * 0.35)) });
    };
    const up = () => {
      last = null;
    };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      map.dragPan.enable();
      map.scrollZoom.enable();
    };
  }, [camera]);

  useEffect(() => {
    if (closeUp === 0) return;
    tookOverRef.current = true;
    stopAnimations();
    const map = mapRef.current;
    if (map) map.flyTo({ center: [coordAtKm(route, kmRef.current).lon, coordAtKm(route, kmRef.current).lat], zoom: Math.max(FIGURE_MIN_ZOOM + 3, 15.2), pitch: 70, duration: 2200, essential: true });
  }, [closeUp, route]);

  // the spotlight: when the tour ends, one light at a time from above, on the main force, on the artillery and logistics and then on each of the others,
  // with its name; the map goes dark while the lights are on; the camera goes to each force, and at the end it goes back to the main one and zooms onto it
  const startSpotlight = () => {
    const map = mapRef.current;
    const svg = beamRef.current;
    if (!map || !svg) return;
    const where = (id: string): [number, number] | null => {
      if (id === MAIN_FORCE_ID) {
        const c = coordAtKm(route, kmRef.current);
        return [c.lon, c.lat];
      }
      const column = columnsRef.current.find((q) => q.id === id);
      const at = column ? positionOfColumn(column, dayRef.current) : null;
      return at ? [at.lon, at.lat] : null;
    };
    const polygon = svg.querySelector('polygon');
    const glow = svg.querySelector('ellipse');
    const drawBeam = (at: [number, number] | null, o: number) => {
      svg.style.opacity = at ? String(o * SPOT_LIGHT) : '0';
      if (!at || !polygon || !glow) return;
      const p = map.project(at);
      const g = beamGeometry({ x: p.x, y: p.y }, SPOT_RADIUS_PX);
      polygon.setAttribute('points', g.polygon.map(([x, y]) => `${x},${y}`).join(' '));
      glow.setAttribute('cx', String(g.ellipse.cx));
      glow.setAttribute('cy', String(g.ellipse.cy));
      glow.setAttribute('rx', String(g.ellipse.rx));
      glow.setAttribute('ry', String(g.ellipse.ry));
    };
    // the map goes dark while the lights are on: the imagery loses brightness and the sky darkens (the light is not dimmed: it is over the map)
    const rasterIds = (map.getStyle()?.layers ?? []).filter((l) => l.type === 'raster').map((l) => l.id);
    let dimShown = -1;
    const setDim = (d: number) => {
      if (Math.abs(d - dimShown) < 0.01) return;
      dimShown = d;
      for (const id of rasterIds) map.setPaintProperty(id, 'raster-brightness-max', 1 - 0.62 * d);
      if (map.getTerrain()) {
        map.setSky({
          'sky-color': mixHex(SKY_DAY['sky-color'], SKY_DARK['sky-color'], d),
          'horizon-color': mixHex(SKY_DAY['horizon-color'], SKY_DARK['horizon-color'], d),
          'fog-color': mixHex(SKY_DAY['fog-color'], SKY_DARK['fog-color'], d),
          'sky-horizon-blend': 0.6,
          'horizon-fog-blend': 0.8,
          'fog-ground-blend': 0.2
        });
      }
    };
    // the bubbles stay out of the way while the spotlight names a force (the names of the places stay)
    const showOtherNames = (visible: boolean) => setBubblesOn(visible);
    // the card with the force, its place, its commanders and its numbers, to the right of the light on a rounded box, so no other text gets in the way
    const drawCard = (at: [number, number] | null, o: number) => {
      const el = cardRef.current;
      const big = bigRef.current;
      if (big) {
        big.style.opacity = at ? String(o) : '0';
        if (at) {
          const p = map.project(at);
          big.style.transform = `translate(${p.x - big.offsetWidth / 2}px, ${p.y + SPOT_RADIUS_PX * 0.5 + 14}px)`;
        }
      }
      if (!el) return;
      el.style.opacity = at ? String(o) : '0';
      if (!at) return;
      const p = map.project(at);
      const box = map.getContainer().getBoundingClientRect();
      const height = el.offsetHeight;
      const left = Math.min(box.width - el.offsetWidth - 12, p.x + SPOT_RADIUS_PX * 1.3 + 12);
      const top = Math.min(box.height - height - 12, Math.max(12, p.y - height / 2));
      el.style.transform = `translate(${Math.max(12, left)}px, ${top}px)`;
    };
    showOtherNames(false);
    ballsRef.current?.setEmphasis(true);
    let raf = 0;
    let shown = -2;
    let finalStarted = false;
    let current: [number, number] | null = null;
    const t0 = performance.now();
    spotStopRef.current = () => {
      window.cancelAnimationFrame(raf);
      spotStopRef.current = () => undefined;
      drawBeam(null, 0);
      drawCard(null, 0);
      setCard(null);
      setDim(0);
      showOtherNames(true);
      ballsRef.current?.setEmphasis(false);
    };
    const frame = (now: number) => {
      const state = spotlightStateAt(now - t0);
      setDim(spotlightDimAt(now - t0));
      if (state.done) {
        spotStopRef.current();
        return;
      }
      if (state.final) {
        if (!finalStarted) {
          finalStarted = true;
          current = null;
          drawBeam(null, 0);
          drawCard(null, 0);
          setCard(null);
          showOtherNames(true);
          ballsRef.current?.setEmphasis(false);
          map.flyTo({
            center: [ANDES_FINAL_VIEW.lon, ANDES_FINAL_VIEW.lat],
            zoom: ANDES_FINAL_VIEW.zoom,
            pitch: ANDES_FINAL_VIEW.pitch,
            bearing: ANDES_FINAL_VIEW.bearing,
            duration: SPOTLIGHT_FINAL_MS - 200,
            curve: 1.4,
            essential: true
          });
        }
      } else {
        if (state.step !== shown) {
          shown = state.step;
          drawCard(null, 0);
          const force = FORCES[state.step]!;
          current = where(force.id);
          if (current) {
            map.easeTo({ center: current, zoom: SPOT_VIEW.zoom, pitch: SPOT_VIEW.pitch, bearing: SPOT_VIEW.bearing, duration: state.step === 0 ? 500 : 1300, essential: true });
            const column = columnsRef.current.find((q) => q.id === force.id);
            setCard({ force, place: placeLabel(column ? column.route : route, dayRef.current) });
          }
        }
        drawBeam(current, state.o);
        drawCard(current, state.o);
      }
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);
  };
  const startSpotlightRef = useRef(startSpotlight);
  startSpotlightRef.current = startSpotlight;

  // W, A, S and D move the view over the map (Shift faster); the keys are taken before the app's own shortcut for D (the 2D and 3D switch)
  useEffect(() => {
    const held = new Set<string>();
    let raf = 0;
    let last = 0;
    const typing = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(el?.isContentEditable);
    };
    const frame = (now: number) => {
      const map = mapRef.current;
      if (held.size === 0 || !map) {
        raf = 0;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const speed = WASD_SPEED_PX * dt * (held.has('shift') ? WASD_SHIFT_FACTOR : 1);
      const [dx, dy] = wasdDelta(held, speed);
      if (dx !== 0 || dy !== 0) map.panBy([dx, dy], { duration: 0 });
      raf = window.requestAnimationFrame(frame);
    };
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        held.add('shift');
        return;
      }
      if (!['w', 'a', 's', 'd'].includes(key)) return;
      e.preventDefault();
      e.stopPropagation();
      tookOverRef.current = true;
      stopAnimations();
      held.add(key);
      if (raf === 0) {
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      }
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.key.toLowerCase());
    };
    const clear = () => held.clear();
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      window.removeEventListener('blur', clear);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  // a force chosen in a button: the map goes to it
  useEffect(() => {
    if (focusForce) flyToForceRef.current(focusForce.id);
  }, [focusForce]);

  // the camera tour: it waits a second on the first view and then goes through the stops; the reader (mouse, wheel, a camera button, an event) stops it
  useEffect(() => {
    if (!tourPlay) return undefined;
    const map = mapRef.current;
    if (!map) return undefined;
    const again = tourPlay > 1;
    if (again) tookOverRef.current = false;
    if (tookOverRef.current) {
      onTourEndRef.current?.();
      return undefined;
    }
    let cancelled = false;
    let raf = 0;
    let timer = 0;
    const pose = (v: CameraView) => map.jumpTo({ center: [v.lon, v.lat], zoom: v.zoom, pitch: v.pitch, bearing: v.bearing });
    const finish = () => {
      stopTourRef.current = () => undefined;
      onTourEndRef.current?.();
    };
    stopTourRef.current = () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
      finish();
    };
    if (reduced) {
      pose(tourPoseAt(ANDES_TOUR, tourDurationMs(ANDES_TOUR)));
      finish();
      return undefined;
    }
    const first = ANDES_TOUR[0]!;
    if (again) map.easeTo({ center: [first.lon, first.lat], zoom: first.zoom, pitch: first.pitch, bearing: first.bearing, duration: 1200, essential: true });
    const run = () => {
      const start = performance.now();
      const total = tourDurationMs(ANDES_TOUR);
      const frame = (now: number) => {
        if (cancelled) return;
        const ms = now - start;
        pose(tourPoseAt(ANDES_TOUR, ms));
        if (ms >= total) {
          finish();
          startSpotlightRef.current();
          return;
        }
        raf = window.requestAnimationFrame(frame);
      };
      raf = window.requestAnimationFrame(frame);
    };
    timer = window.setTimeout(run, again ? 1400 : TOUR_HOLD_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
      stopTourRef.current = () => undefined;
    };
  }, [tourPlay, reduced]);

  // the chosen event: the camera flies to it and its dot grows
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setPaintProperty('places-dot', 'circle-radius', ['case', ['==', ['get', 'id'], selectedId ?? ''], 9, 6]);
    const p = route.points.find((q) => q.id === selectedId);
    if (p) {
      tookOverRef.current = true;
      stopAnimations();
    }
    if (p) map.flyTo({ center: [p.lon, p.lat], zoom: 12.5, pitch: 65, duration: 2000, essential: true });
  }, [selectedId, route]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d andes-maplibre" role="img" aria-label={label} data-chart3d="andes" />
      <svg ref={beamRef} className="andes-spot" aria-hidden="true" focusable="false" width="100%" height="100%" style={{ opacity: 0 }}>
        <defs>
          <linearGradient id="andes-spot-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6d0" stopOpacity="0" />
            <stop offset="0.45" stopColor="#fff2bf" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffeeb0" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="andes-spot-pool">
            <stop offset="0" stopColor="#fffbe6" stopOpacity="0.7" />
            <stop offset="0.55" stopColor="#ffeeb0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffe9a0" stopOpacity="0" />
          </radialGradient>
          <filter id="andes-spot-blur" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="andes-spot-soft" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <polygon points="0,0 0,0 0,0 0,0" fill="url(#andes-spot-fade)" filter="url(#andes-spot-blur)" />
        <ellipse cx="0" cy="0" rx="0" ry="0" fill="url(#andes-spot-pool)" filter="url(#andes-spot-soft)" />
      </svg>
      {card && (
        <div ref={bigRef} className="andes-spot-big" aria-hidden="true" style={{ opacity: 0 }}>
          {card.place}
        </div>
      )}
      {card && (
        <aside ref={cardRef} className="andes-spot-card" aria-hidden="true" style={{ opacity: 0 }}>
          <h3>{card.force.title}</h3>
          <p className="andes-spot-detail">{card.force.detail}</p>
          <p className="andes-spot-place">
            <span>Lugar</span> {card.place}
          </p>
          <p className="andes-spot-section">Mando</p>
          <ul>
            {FORCE_FACTS[card.force.id]?.commanders.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="andes-spot-section">Fuerzas</p>
          <dl>
            <div>
              <dt>Unidades</dt>
              <dd>{FORCE_FACTS[card.force.id]?.battalions}</dd>
            </div>
            {FORCE_FACTS[card.force.id]?.units.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="andes-spot-goal">{FORCE_FACTS[card.force.id]?.goal}</p>
        </aside>
      )}
      {missingKey && (
        <p role="status" className="notice andes-notice">
          Falta la clave de MapTiler (VITE_MAPTILER_KEY): sin ella no hay mapa satelital ni relieve.
        </p>
      )}
      <ForceBubbles map={mainMap} items={bubbles} visible={bubblesOn} />
      <SlotPortal slot="minimap">
      <RegionMinimap
        main={mainMap}
        route={route}
        km={km}
        columns={columns}
        day={day}
        styleUrl={missingKey ? null : STYLE_URL}
        onGo={(lng, lat) => {
          tookOverRef.current = true;
          stopAnimations();
          mapRef.current?.easeTo({ center: [lng, lat], duration: 900, essential: true });
        }}
      />
      </SlotPortal>
      <NavControls
        onZoomIn={() => mapRef.current?.zoomIn({ duration: 400 })}
        onZoomOut={() => mapRef.current?.zoomOut({ duration: 400 })}
        onReset={() => mapRef.current?.easeTo({ ...cameraFor('map', coordAtKm(route, 0))!, duration: 1200 })}
      />
    </div>
  );
}

export default MapLibreRenderer;
