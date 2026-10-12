import { MercatorCoordinate } from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import { BufferAttribute, BufferGeometry, Matrix4, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { CLOUD_COUNT, cloudPuffs, cloudScale, combatPuffs, puffSizePx } from './effects';
import type { CombatSite } from './effects';
import { metersPerPixel } from './mapGeo';

/** The local frame of the effects is centered here: the middle of the crossing (a frame of meters keeps the numbers small for the 32-bit matrices). */
const ORIGIN: [number, number] = [-69.8, -32];
const MAX_CLOUD_PUFFS = CLOUD_COUNT * 4;
const MAX_SMOKE = 60 * 4;
const MAX_FLASH = 24 * 4;
const MAX_PUFFS = MAX_CLOUD_PUFFS + MAX_SMOKE + MAX_FLASH;
/** the smoke and the flashes are never narrower than this many pixels on the screen, so they read from far away */
const MIN_PX = 10;
/** a cloud is never narrower than this on the screen when the map is far, or it would be a speck: it is a soft smudge of vapor */
const CLOUD_MIN_PX = 70;
/** the biggest point a graphics card is sure to draw */
const MAX_PX = 256;

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec4 aColor;
  uniform float uRatio;
  varying vec4 vColor;
  void main() {
    vColor = aColor;
    gl_PointSize = min(aSize * uRatio, ${MAX_PX.toFixed(1)});
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** A soft round puff: full in the middle and fading to nothing at the edge, so it reads as vapor and not as a ball. */
const FRAGMENT = /* glsl */ `
  varying vec4 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    float soft = 1.0 - smoothstep(0.0, 1.0, d);
    gl_FragColor = vec4(vColor.rgb, vColor.a * soft * soft);
  }
`;

export interface EffectsState {
  /** the combats being fought */
  sites: readonly CombatSite[];
  /** clouds over the cordillera (off on a weak device) */
  clouds: boolean;
  /** with reduced motion the effects stand still */
  still: boolean;
}

/**
 * The clouds, and the smoke and flashes of a combat, as a MapLibre custom layer drawn by Three.js: soft translucent puffs (points with a shader that fades them out at
 * the edge) in a frame of meters around the crossing. Where each one is comes from `effects.ts` (a function of the clock); this class only draws them and asks for the
 * next frame while something moves.
 */
export class EffectsLayer implements CustomLayerInterface {
  readonly id = 'andes-effects';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  private state: EffectsState = { sites: [], clouds: false, still: false };
  private map: MapLibreMap | null = null;
  private renderer: WebGLRenderer | null = null;
  private points: Points | null = null;
  private material: ShaderMaterial | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera();
  private readonly model = new Matrix4();
  private readonly projection = new Matrix4();

  setState(state: EffectsState): void {
    this.state = state;
    this.map?.triggerRepaint();
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(MAX_PUFFS * 3), 3));
    geometry.setAttribute('aSize', new BufferAttribute(new Float32Array(MAX_PUFFS), 1));
    geometry.setAttribute('aColor', new BufferAttribute(new Float32Array(MAX_PUFFS * 4), 4));
    geometry.setDrawRange(0, 0);
    this.material = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: { uRatio: { value: map.getPixelRatio() } }, transparent: true, depthWrite: false });
    this.points = new Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  onRemove(): void {
    this.points?.geometry.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
    this.points = null;
    this.material = null;
    this.map = null;
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput): void {
    const map = this.map;
    const renderer = this.renderer;
    const points = this.points;
    if (!map || !renderer || !points || !this.material) return;
    const zoom = map.getZoom();
    const cloudsFactor = this.state.clouds ? cloudScale(zoom) : 0;
    if (cloudsFactor === 0 && this.state.sites.length === 0) {
      points.geometry.setDrawRange(0, 0);
      return;
    }
    const now = this.state.still ? 0 : performance.now();
    const originMc = MercatorCoordinate.fromLngLat(ORIGIN, 0);
    const scale = originMc.meterInMercatorCoordinateUnits();
    const mpp = metersPerPixel(zoom, map.getCenter().lat);
    const position = points.geometry.getAttribute('position') as BufferAttribute;
    const size = points.geometry.getAttribute('aSize') as BufferAttribute;
    const color = points.geometry.getAttribute('aColor') as BufferAttribute;
    let n = 0;
    const put = (x: number, y: number, z: number, px: number, r: number, g: number, b: number, a: number) => {
      if (n >= MAX_PUFFS) return;
      position.setXYZ(n, x, y, z);
      size.setX(n, px);
      color.setXYZW(n, r, g, b, a);
      n += 1;
    };

    // the clouds: big, white and faint; several puffs together make one cloud
    if (cloudsFactor > 0) {
      for (const p of cloudPuffs(now)) {
        const mc = MercatorCoordinate.fromLngLat([p.lon, p.lat], 0);
        put((mc.x - originMc.x) / scale, p.altitudeM, (mc.y - originMc.y) / scale, puffSizePx(p.radiusM, mpp, CLOUD_MIN_PX) * cloudsFactor, 1, 1, 1, 0.32 * cloudsFactor);
      }
    }

    // the smoke (grey) and the flashes (orange) of every combat being fought
    for (const site of this.state.sites) {
      const mc = MercatorCoordinate.fromLngLat([site.lon, site.lat], 0);
      const ground = map.queryTerrainElevation([site.lon, site.lat]) ?? 0;
      const cx = (mc.x - originMc.x) / scale;
      const cz = (mc.y - originMc.y) / scale;
      for (const p of combatPuffs(site, now)) {
        if (p.kind === 'flash' && this.state.still) continue;
        const px = puffSizePx(p.radiusM * (p.kind === 'smoke' ? 1 + p.scale : 1), mpp, p.kind === 'smoke' ? MIN_PX : MIN_PX * 0.6);
        const x = cx + p.eastM;
        const y = ground + p.heightM;
        const z = cz - p.northM;
        if (p.kind === 'smoke') put(x, y, z, px, 0.72, 0.7, 0.66, 0.5 * p.scale);
        else put(x, y, z, px, 1, 0.72, 0.28, 0.95 * p.scale);
      }
    }
    points.geometry.setDrawRange(0, n);
    position.needsUpdate = true;
    size.needsUpdate = true;
    color.needsUpdate = true;

    this.model.makeTranslation(originMc.x, originMc.y, 0).multiply(new Matrix4().makeScale(scale, -scale, scale)).multiply(new Matrix4().makeRotationX(Math.PI / 2));
    this.projection.fromArray(args.defaultProjectionData.mainMatrix as unknown as number[]);
    this.camera.projectionMatrix.copy(this.projection).multiply(this.model);
    renderer.resetState();
    renderer.render(this.scene, this.camera);
    // the wind and the fire keep moving: ask for the next frame
    if (!this.state.still) map.triggerRepaint();
  }
}
