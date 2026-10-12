import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  DataTexture,
  DirectionalLight,
  DodecahedronGeometry,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  ShaderMaterial,
  SphereGeometry,
  Vector3
} from 'three';
import type { Material, Object3D, Sprite, Texture } from 'three';
import { createStage } from '../../../three/stage';
import type { Stage } from '../../../three/stage';
import { textSprite } from '../../../three/labels';
import { BATTLE_UNITS } from '../battleField';
import { createFigureColumn } from '../figures3d';
import { FIGURE_PARTS } from '../figureParts';
import { ENEMY_PALETTE } from '../forces';
import { buildPath } from '../pathAlong';
import { FIELD, LOOKOUT, WORLD_UNIT_M, heightAt, heightGrid, latticeHash, slopeAt, toWorld, valueNoise } from './field';
import { TEXTURE_SIZE, splatWeights, tileTexture } from './textures';
import { unitSlots } from './unitSlots';
import { DEFAULT_VIEW, DIORAMA_VIEWS, TARGET_BOX, VERTICAL_EXAGGERATION, groundUnits } from './views';
import type { DioramaViewId } from './views';

export type DioramaQuality = 'low' | 'medium' | 'high';

export interface Diorama {
  /** the camera flies to one of the views */
  go: (id: DioramaViewId) => void;
  dispose: () => void;
}

const GRID = { low: { cols: 96, rows: 84 }, medium: { cols: 144, rows: 126 }, high: { cols: 192, rows: 168 } } as const;
const SHRUBS = { low: 90, medium: 220, high: 380 } as const;
/** The soldiers are drawn this much bigger than their real proportion to the field, as the figures of a diorama are, so they can be seen from the camera. */
const FIGURE_SCALE = 1.7;
const SHADOW_MAP = { low: 0, medium: 1024, high: 2048 } as const;
/** The soil under the field, seen on the sides of the block. */
const SOIL = 0x5d4630;
const SKY_TOP = '#4f8fd0';
const SKY_HORIZON = '#dbe7f2';

/** A repeating small texture, filtered so that it softens up close and fades out far away. */
function repeatingTexture(data: Uint8Array): DataTexture {
  const texture = new DataTexture(data, TEXTURE_SIZE, TEXTURE_SIZE, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** The ground, as one mesh: the heights of the procedural field, with a weight per vertex for the three small textures that paint it. */
function buildTerrain(quality: DioramaQuality, textures: { grass: Texture; dirt: Texture; rock: Texture }): Mesh {
  const { cols, rows } = GRID[quality];
  const heights = heightGrid(cols, rows);
  const positions = new Float32Array((cols + 1) * (rows + 1) * 3);
  const weights = new Float32Array((cols + 1) * (rows + 1) * 3);
  for (let j = 0; j <= rows; j += 1) {
    const northM = FIELD.halfNorthM - (2 * FIELD.halfNorthM * j) / rows;
    for (let i = 0; i <= cols; i += 1) {
      const eastM = -FIELD.halfEastM + (2 * FIELD.halfEastM * i) / cols;
      const k = j * (cols + 1) + i;
      const w = toWorld(eastM, northM);
      positions[k * 3] = w.x;
      positions[k * 3 + 1] = groundUnits(heights[k]!);
      positions[k * 3 + 2] = w.z;
      // the slope as the eye sees it, with the exaggerated heights
      const slope = Math.atan(Math.tan(slopeAt(eastM, northM)) * VERTICAL_EXAGGERATION);
      const [g, d, r] = splatWeights(heights[k]!, slope, valueNoise(eastM / 500, northM / 500, 9));
      weights[k * 3] = g;
      weights[k * 3 + 1] = d;
      weights[k * 3 + 2] = r;
    }
  }
  const index = new Uint32Array(cols * rows * 6);
  let n = 0;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = j * (cols + 1) + i;
      const b = a + 1;
      const c = a + (cols + 1);
      const d = c + 1;
      // counter-clockwise seen from above (the grid goes from the north-west corner, z grows to the south)
      index.set([a, c, b, b, c, d], n);
      n += 6;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aWeights', new BufferAttribute(weights, 3));
  geometry.setIndex(new BufferAttribute(index, 1));
  geometry.computeVertexNormals();

  const material = new MeshStandardMaterial({ roughness: 1, metalness: 0 });
  // the small textures repeat at two scales and are blended by the weights of the vertex: the technique of a game terrain
  material.onBeforeCompile = (shader) => {
    shader.uniforms.tGrass = { value: textures.grass };
    shader.uniforms.tDirt = { value: textures.dirt };
    shader.uniforms.tRock = { value: textures.rock };
    shader.uniforms.uTile = { value: 0.5 };
    shader.vertexShader = `attribute vec3 aWeights;\nvarying vec3 vWeights;\nvarying vec2 vTerrainUv;\n${shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvWeights = aWeights;\nvTerrainUv = position.xz;'
    )}`;
    shader.fragmentShader = `uniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform sampler2D tRock;\nuniform float uTile;\nvarying vec3 vWeights;\nvarying vec2 vTerrainUv;\n${shader.fragmentShader.replace(
      '#include <map_fragment>',
      `vec2 uvA = vTerrainUv * uTile;
       vec2 uvB = vTerrainUv * uTile * 3.7 + vec2(0.31, 0.57);
       vec3 grass = texture2D(tGrass, uvA).rgb * (0.6 + 1.4 * texture2D(tGrass, uvB).rgb) * 1.2;
       vec3 dirt = texture2D(tDirt, uvA).rgb * (0.6 + 1.4 * texture2D(tDirt, uvB).rgb) * 1.2;
       vec3 rock = texture2D(tRock, uvA).rgb * (0.6 + 1.4 * texture2D(tRock, uvB).rgb) * 1.2;
       diffuseColor.rgb *= grass * vWeights.x + dirt * vWeights.y + rock * vWeights.z;`
    )}`;
  };
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

/** The four sides and the bottom of the block of earth, so the field reads as a diorama on a stage. */
function buildBlock(quality: DioramaQuality): Mesh {
  const { cols, rows } = GRID[quality];
  const heights = heightGrid(cols, rows);
  const bottom = -0.8;
  const pos: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  const at = (i: number, j: number) => {
    const eastM = -FIELD.halfEastM + (2 * FIELD.halfEastM * i) / cols;
    const northM = FIELD.halfNorthM - (2 * FIELD.halfNorthM * j) / rows;
    const w = toWorld(eastM, northM);
    return { x: w.x, y: groundUnits(heights[j * (cols + 1) + i]!), z: w.z };
  };
  for (let i = 0; i < cols; i += 1) {
    for (const j of [0, rows]) {
      const p = at(i, j);
      const q = at(i + 1, j);
      quad([p.x, bottom, p.z], [q.x, bottom, q.z], [q.x, q.y, q.z], [p.x, p.y, p.z]);
    }
  }
  for (let j = 0; j < rows; j += 1) {
    for (const i of [0, cols]) {
      const p = at(i, j);
      const q = at(i, j + 1);
      quad([p.x, bottom, p.z], [q.x, bottom, q.z], [q.x, q.y, q.z], [p.x, p.y, p.z]);
    }
  }
  const hx = FIELD.halfEastM / WORLD_UNIT_M;
  const hz = FIELD.halfNorthM / WORLD_UNIT_M;
  quad([-hx, bottom, -hz], [hx, bottom, -hz], [hx, bottom, hz], [-hx, bottom, hz]);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: SOIL, roughness: 1, side: DoubleSide }));
  mesh.receiveShadow = true;
  return mesh;
}

/** The sky: a big sphere with a gradient from the pale haze of the horizon to the blue overhead (and the haze below, under the block). */
function buildSky(): Mesh {
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new Color(SKY_TOP) }, horizon: { value: new Color(SKY_HORIZON) } },
    vertexShader: 'varying vec3 vDir;\nvoid main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform vec3 top;\nuniform vec3 horizon;\nvarying vec3 vDir;\nvoid main() { float t = clamp(vDir.y * 1.6, 0.0, 1.0); vec3 c = mix(horizon, top, pow(t, 0.7)); gl_FragColor = vec4(c, 1.0); }'
  });
  const sky = new Mesh(new SphereGeometry(240, 32, 16), material);
  sky.renderOrder = -1;
  return sky;
}

/** Bushes of the dry valley and a few stones, spread over the field where the ground is gentle (deterministic). */
function buildScatter(quality: DioramaQuality): Group {
  const group = new Group();
  const shrubCount = SHRUBS[quality];
  const shrubs = new InstancedMesh(new ConeGeometry(0.11, 0.36, 5), new MeshStandardMaterial({ color: 0x55672f, roughness: 1 }), shrubCount);
  const stones = new InstancedMesh(new DodecahedronGeometry(0.14, 0), new MeshStandardMaterial({ color: 0x8b867b, roughness: 1 }), Math.round(shrubCount / 4));
  const m = new Matrix4();
  const q = new Quaternion();
  const p = new Vector3();
  const s = new Vector3();
  let nShrub = 0;
  let nStone = 0;
  for (let i = 0; i < shrubCount * 6 && (nShrub < shrubCount || nStone < stones.count); i += 1) {
    const eastM = (latticeHash(i, 1, 77) * 2 - 1) * (FIELD.halfEastM - 150);
    const northM = (latticeHash(i, 2, 77) * 2 - 1) * (FIELD.halfNorthM - 150);
    const slope = slopeAt(eastM, northM);
    const w = toWorld(eastM, northM);
    const y = groundUnits(heightAt(eastM, northM));
    const size = 0.7 + latticeHash(i, 3, 77) * 0.7;
    if (slope < 0.25 && nShrub < shrubCount && valueNoise(eastM / 450, northM / 450, 5) > 0.42) {
      shrubs.setMatrixAt(nShrub++, m.compose(p.set(w.x, y + 0.2 * size, w.z), q.identity(), s.set(size, size, size)));
    } else if (slope >= 0.18 && nStone < stones.count) {
      stones.setMatrixAt(nStone++, m.compose(p.set(w.x, y + 0.04, w.z), q.identity(), s.set(size, size * 0.7, size)));
    }
  }
  shrubs.count = nShrub;
  stones.count = nStone;
  shrubs.castShadow = true;
  shrubs.receiveShadow = true;
  stones.castShadow = true;
  group.add(shrubs, stones);
  return group;
}

/** A figure standing still: the boxes of `FIGURE_PARTS`, each with its own color, at rest (no stride). */
function buildStandingFigure(kind: 'foot' | 'foot_afro', coat?: string): Group {
  const group = new Group();
  for (const part of FIGURE_PARTS[kind]) {
    const swings = part.leg ?? part.arm;
    let y = part.at[1];
    let z = part.at[2];
    if (swings) {
      const oy = part.pivot ? part.at[1] - part.pivot[1] : -part.size[1] / 2;
      const oz = part.pivot ? part.at[2] - part.pivot[2] : 0;
      y = (part.pivot ? part.pivot[1] : part.at[1]) + oy;
      z = (part.pivot ? part.pivot[2] : part.at[2]) + oz;
    }
    const mesh = new Mesh(new BoxGeometry(part.size[0], part.size[1], part.size[2]), new MeshStandardMaterial({ color: coat && part.color === '#2f4a80' ? coat : part.color, roughness: 0.9 }));
    mesh.position.set(swings ? (part.pivot ? part.pivot[0] : part.at[0]) : part.at[0], y, z);
    if (!swings && part.tilt) mesh.rotation.x = part.tilt;
    mesh.castShadow = true;
    group.add(mesh);
  }
  return group;
}

/**
 * San Martín and three officers on the far hill, seen from behind, watching the field: San Martín in front with a telescope (a bicorn hat and gold shoulders to tell him
 * apart), an officer pointing, the flag of the Army of the Andes on a pole. They are bigger than the soldiers so that they read from the camera. A schematic picture: there is no
 * historical claim in how they stand.
 */
function buildLookout(): Group {
  const group = new Group();
  const scale = 1.5;
  const brass = new MeshStandardMaterial({ color: 0x9c7a35, roughness: 0.5, metalness: 0.4 });
  const dark = new MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 });
  const gold = new MeshStandardMaterial({ color: 0xe8b923, roughness: 0.5, metalness: 0.4 });

  const general = buildStandingFigure('foot');
  const hat = new Mesh(new BoxGeometry(0.075, 0.02, 0.045), dark);
  hat.position.set(0, 0.172, 0);
  const left = new Mesh(new BoxGeometry(0.02, 0.012, 0.03), gold);
  left.position.set(-0.05, 0.125, 0);
  const right = left.clone();
  right.position.x = 0.05;
  // the telescope: a brass tube held at the eye, pointing out over the field (+z is south), a little downward
  const tube = new Mesh(new BoxGeometry(0.02, 0.02, 0.15), brass);
  tube.position.set(0.03, 0.135, 0.1);
  tube.rotation.x = 0.12;
  const lens = new Mesh(new BoxGeometry(0.032, 0.032, 0.03), dark);
  lens.position.set(0.03, 0.131, 0.18);
  lens.rotation.x = 0.12;
  general.add(hat, left, right, tube, lens);
  general.position.set(0, 0, 0);
  group.add(general);

  const officers: Array<{ x: number; z: number; turn: number; afro: boolean }> = [
    { x: -0.17, z: -0.06, turn: 0.15, afro: false },
    { x: 0.18, z: -0.05, turn: -0.1, afro: false },
    { x: 0.34, z: 0.02, turn: -0.25, afro: true }
  ];
  for (const o of officers) {
    const fig = buildStandingFigure(o.afro ? 'foot_afro' : 'foot');
    fig.position.set(o.x, 0, o.z);
    fig.rotation.y = o.turn;
    group.add(fig);
  }

  // the flag: celeste below and white above, as on the bubbles of the map
  const pole = new Mesh(new BoxGeometry(0.012, 0.4, 0.012), new MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 }));
  pole.position.set(-0.36, 0.2, 0.0);
  const white = new Mesh(new BoxGeometry(0.003, 0.05, 0.16), new MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.9 }));
  white.position.set(-0.36, 0.36, -0.08);
  const celeste = new Mesh(new BoxGeometry(0.003, 0.05, 0.16), new MeshStandardMaterial({ color: 0x75aadb, roughness: 0.9 }));
  celeste.position.set(-0.36, 0.31, -0.08);
  group.add(pole, white, celeste);

  group.scale.setScalar(scale);
  group.rotation.y = 0;
  return group;
}

/**
 * The diorama of the battle: a procedural field on a block of earth under a sky, painted with small repeating textures, with the units of both sides as figures facing each
 * other and San Martín watching from a hill far behind. It does not use the map or its API. `host` gets the canvas.
 */
export function createDiorama(host: HTMLElement, o: { quality: DioramaQuality; reducedMotion: boolean }): Diorama {
  const stage: Stage = createStage(host, {
    pixelRatioCap: o.quality === 'high' ? 2 : 1.5,
    target: new Vector3(DEFAULT_VIEW.pose.x, DEFAULT_VIEW.pose.y, DEFAULT_VIEW.pose.z),
    radius: DEFAULT_VIEW.pose.radius,
    theta: DEFAULT_VIEW.pose.theta,
    phi: DEFAULT_VIEW.pose.phi,
    fov: 38,
    box: TARGET_BOX,
    shadows: SHADOW_MAP[o.quality] > 0,
    zoomMin: 0.1,
    phiMax: 1.5,
    animateReset: !o.reducedMotion
  });
  const { scene } = stage;
  const horizon = new Color(SKY_HORIZON);
  scene.fog = new Fog(horizon, 70, 230);
  stage.camera.far = 320;
  stage.camera.updateProjectionMatrix();

  // light: a warm sun low in the south-west (behind the royalists' hills, so the patriots' faces catch it) and the sky above
  scene.add(new HemisphereLight(0xcfe3f3, 0x9a8760, 1.25));
  const sun = new DirectionalLight(0xfff0d2, 2.6);
  sun.position.set(-26, 38, -14);
  sun.target.position.set(0, 0, 0);
  if (SHADOW_MAP[o.quality] > 0) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(SHADOW_MAP[o.quality], SHADOW_MAP[o.quality]);
    const cam = sun.shadow.camera;
    cam.left = -34;
    cam.right = 34;
    cam.top = 30;
    cam.bottom = -30;
    cam.near = 1;
    cam.far = 120;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }
  scene.add(sun, sun.target);

  const textures = { grass: repeatingTexture(tileTexture('grass')), dirt: repeatingTexture(tileTexture('dirt')), rock: repeatingTexture(tileTexture('rock')) };
  scene.add(buildSky(), buildTerrain(o.quality, textures), buildBlock(o.quality), buildScatter(o.quality));

  // the armies
  const labels: Sprite[] = [];
  const groundWorld = (x: number, z: number) => groundUnits(heightAt(x * WORLD_UNIT_M, -z * WORLD_UNIT_M));
  for (const u of BATTLE_UNITS) {
    const slots = unitSlots(u);
    const w = toWorld(u.eastM, u.northM);
    const y = groundWorld(w.x, w.z);
    const path = buildPath(new Float32Array([w.x, y, w.z, w.x, y, w.z + 1]));
    const column = createFigureColumn(slots.length, path, groundWorld, FIGURE_SCALE, u.side === 'royalist' ? ENEMY_PALETTE : undefined, slots);
    column.mesh.castShadow = true;
    column.mesh.receiveShadow = true;
    // the patriots face south, toward the royalists; the royalists face north
    column.update(0, 0, 0, { dx: 0, north: u.side === 'royalist' });
    scene.add(column.mesh);
    const label = textSprite(`${u.name}\nunos ${new Intl.NumberFormat('es-AR').format(u.men)}`, '#ffffff', 0.3, true);
    label.position.set(w.x, y + 0.95, w.z);
    labels.push(label);
    scene.add(label);
  }

  // San Martín and his officers, on the far hill
  const lookout = buildLookout();
  const l = toWorld(LOOKOUT.eastM, LOOKOUT.northM);
  lookout.position.set(l.x, groundWorld(l.x, l.z), l.z);
  scene.add(lookout);

  stage.requestRender();

  const go = (id: DioramaViewId) => {
    const view = DIORAMA_VIEWS.find((v) => v.id === id);
    if (view) stage.nav.flyTo({ ...view.pose });
  };

  const disposeObject = (obj: Object3D) => {
    obj.traverse((child) => {
      const mesh = child as Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as Material | Material[] | undefined;
      for (const m of Array.isArray(material) ? material : material ? [material] : []) {
        const map = (m as { map?: Texture | null }).map;
        map?.dispose();
        m.dispose();
      }
    });
  };

  return {
    go,
    dispose: () => {
      for (const t of Object.values(textures)) t.dispose();
      disposeObject(scene);
      stage.dispose();
    }
  };
}
