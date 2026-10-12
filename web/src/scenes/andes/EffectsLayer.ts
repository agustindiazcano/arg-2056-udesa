import { MercatorCoordinate } from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import { InstancedMesh, Matrix4, MeshBasicMaterial, PerspectiveCamera, Quaternion, Scene, SphereGeometry, Vector3, WebGLRenderer } from 'three';
import { CLOUD_COUNT, cloudPuffs, cloudScale, combatPuffs } from './effects';
import type { CombatSite } from './effects';
import { metersPerPixel } from './mapGeo';

/** The local frame of the effects is centered here: the middle of the crossing (a frame of meters keeps the numbers small for the 32-bit matrices). */
const ORIGIN: [number, number] = [-69.8, -32];
const MAX_CLOUD_PUFFS = CLOUD_COUNT * 4;
const MAX_SMOKE = 60 * 4;
const MAX_FLASH = 24 * 4;
/** the smoke and flashes are never smaller than this many pixels across, so they read from far away */
const MIN_PX = 5;

export interface EffectsState {
  /** the combats being fought */
  sites: readonly CombatSite[];
  /** clouds over the cordillera (off on a weak device) */
  clouds: boolean;
  /** with reduced motion the effects stand still */
  still: boolean;
}

/**
 * The clouds, and the smoke and flashes of a combat, as a MapLibre custom layer drawn by Three.js: translucent spheres in a frame of meters around the crossing.
 * Where each one is comes from `effects.ts` (a function of the clock); this class only draws them and asks for the next frame while something moves.
 */
export class EffectsLayer implements CustomLayerInterface {
  readonly id = 'andes-effects';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  private state: EffectsState = { sites: [], clouds: false, still: false };
  private map: MapLibreMap | null = null;
  private renderer: WebGLRenderer | null = null;
  private clouds: InstancedMesh | null = null;
  private smoke: InstancedMesh | null = null;
  private flashes: InstancedMesh | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera();
  private readonly model = new Matrix4();
  private readonly projection = new Matrix4();
  private readonly at = new Vector3();
  private readonly one = new Vector3();
  private readonly instance = new Matrix4();
  private readonly noTurn = new Quaternion();

  setState(state: EffectsState): void {
    this.state = state;
    this.map?.triggerRepaint();
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    const make = (max: number, color: number, opacity: number) => {
      const mesh = new InstancedMesh(new SphereGeometry(1, 14, 10), new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }), max);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.scene.add(mesh);
      return mesh;
    };
    this.clouds = make(MAX_CLOUD_PUFFS, 0xffffff, 0.5);
    this.smoke = make(MAX_SMOKE, 0xb9b4aa, 0.42);
    this.flashes = make(MAX_FLASH, 0xffb347, 0.95);
  }

  onRemove(): void {
    for (const mesh of [this.clouds, this.smoke, this.flashes]) {
      mesh?.geometry.dispose();
      (mesh?.material as MeshBasicMaterial | undefined)?.dispose();
    }
    this.renderer?.dispose();
    this.renderer = null;
    this.clouds = this.smoke = this.flashes = null;
    this.map = null;
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput): void {
    const map = this.map;
    const renderer = this.renderer;
    const { clouds, smoke, flashes } = this;
    if (!map || !renderer || !clouds || !smoke || !flashes) return;
    const zoom = map.getZoom();
    const cloudsFactor = this.state.clouds ? cloudScale(zoom) : 0;
    if (cloudsFactor === 0 && this.state.sites.length === 0) {
      clouds.count = smoke.count = flashes.count = 0;
      return;
    }
    const now = this.state.still ? 0 : performance.now();
    const originMc = MercatorCoordinate.fromLngLat(ORIGIN, 0);
    const scale = originMc.meterInMercatorCoordinateUnits();
    const mpp = metersPerPixel(zoom, map.getCenter().lat);

    // the clouds
    let n = 0;
    if (cloudsFactor > 0) {
      for (const p of cloudPuffs(now)) {
        if (n >= MAX_CLOUD_PUFFS) break;
        const mc = MercatorCoordinate.fromLngLat([p.lon, p.lat], 0);
        this.at.set((mc.x - originMc.x) / scale, p.altitudeM, (mc.y - originMc.y) / scale);
        clouds.setMatrixAt(n++, this.instance.compose(this.at, this.noTurn, this.one.setScalar(p.radiusM * cloudsFactor)));
      }
    }
    clouds.count = n;
    clouds.instanceMatrix.needsUpdate = true;

    // the smoke and the flashes of every combat being fought
    let s = 0;
    let f = 0;
    for (const site of this.state.sites) {
      const mc = MercatorCoordinate.fromLngLat([site.lon, site.lat], 0);
      const ground = map.queryTerrainElevation([site.lon, site.lat]) ?? 0;
      const cx = (mc.x - originMc.x) / scale;
      const cz = (mc.y - originMc.y) / scale;
      for (const p of combatPuffs(site, now)) {
        const radius = Math.max(p.radiusM, (MIN_PX / 2) * mpp) * p.scale;
        this.at.set(cx + p.eastM, ground + p.heightM, cz - p.northM);
        const matrix = this.instance.compose(this.at, this.noTurn, this.one.setScalar(radius));
        if (p.kind === 'smoke') {
          if (s < MAX_SMOKE) smoke.setMatrixAt(s++, matrix);
        } else if (f < MAX_FLASH && !this.state.still) flashes.setMatrixAt(f++, matrix);
      }
    }
    smoke.count = s;
    flashes.count = f;
    smoke.instanceMatrix.needsUpdate = true;
    flashes.instanceMatrix.needsUpdate = true;

    this.model.makeTranslation(originMc.x, originMc.y, 0).multiply(new Matrix4().makeScale(scale, -scale, scale)).multiply(new Matrix4().makeRotationX(Math.PI / 2));
    this.projection.fromArray(args.defaultProjectionData.mainMatrix as unknown as number[]);
    this.camera.projectionMatrix.copy(this.projection).multiply(this.model);
    renderer.resetState();
    renderer.render(this.scene, this.camera);
    // the wind and the fire keep moving: ask for the next frame
    if (!this.state.still) map.triggerRepaint();
  }
}

