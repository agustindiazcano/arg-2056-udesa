import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3
} from 'three';
import type { Texture } from 'three';
import { buildChunk, treePlacements } from './reliefField';
import type { Field } from './reliefField';

/** Height and radius (scene units) of a tree of size 1: several times a soldier, who is about 0.07 tall on the screen. */
export const TREE_HEIGHT = 0.22;
const TREE_RADIUS = 0.07;
const TRUNK_COLOR = '#5a4030';

const paint = (geometry: BufferGeometry, hex: string): BufferGeometry => {
  const n = geometry.getAttribute('position').count;
  const c = new Color(hex);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
};

/** A pine: a brown trunk and two green cones, one above the other, as one geometry with a color per vertex, standing on y = 0 and `TREE_HEIGHT` tall. */
export function createTreeGeometry(crown = '#2f5a34'): BufferGeometry {
  const h = TREE_HEIGHT;
  const trunk = new CylinderGeometry(0.012, 0.016, h * 0.3, 6);
  trunk.translate(0, h * 0.15, 0);
  const lower = new ConeGeometry(TREE_RADIUS, h * 0.5, 8);
  lower.translate(0, h * 0.2 + h * 0.25, 0);
  const upper = new ConeGeometry(TREE_RADIUS * 0.7, h * 0.55, 8);
  upper.translate(0, h * 0.45 + h * 0.275, 0);
  const light = new Color(crown).lerp(new Color('#ffffff'), 0.12).getHexString();
  const parts = [paint(trunk, TRUNK_COLOR), paint(lower, crown), paint(upper, `#${light}`)].map((g) => g.toNonIndexed());
  const merged = new BufferGeometry();
  for (const name of ['position', 'normal', 'color']) {
    const total = parts.reduce((n, g) => n + g.getAttribute(name).array.length, 0);
    const data = new Float32Array(total);
    let at = 0;
    for (const g of parts) {
      const array = g.getAttribute(name).array as Float32Array;
      data.set(array, at);
      at += array.length;
    }
    merged.setAttribute(name, new BufferAttribute(data, 3));
  }
  return merged;
}

interface Chunk {
  mesh: Mesh;
  trees: InstancedMesh | null;
}

export interface DetailTerrain {
  group: Group;
  /** builds the chunks around a point of the ground (the ones that are missing) and drops the far ones */
  ensureAround: (x: number, z: number) => void;
  /** frees the shared geometry and materials */
  dispose: () => void;
}

/**
 * The terrain in detail around the army: a grid of chunks of procedural relief (`reliefField`) with trees, built where the camera is
 * near and dropped when it goes away. Chunks are deterministic, so one that comes back looks the same. `texture`, when there is one, is
 * the grain of the ground (it tiles, and the chunks give it world-space coordinates).
 */
export function createDetailTerrain(
  field: Field,
  o: { size: number; cells: number; radius: number; treeDensity: number; seed: number; treeColor: string; texture?: Texture | null }
): DetailTerrain {
  const group = new Group();
  const chunks = new Map<string, Chunk>();
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, map: o.texture ?? null });
  const treeGeometry = createTreeGeometry(o.treeColor);
  const treeMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const keepAlive = new Mesh(treeGeometry, treeMaterial);
  keepAlive.visible = false;
  group.add(keepAlive);
  const m = new Matrix4();
  const q = new Quaternion();
  const p = new Vector3();
  const s = new Vector3();

  const build = (cx: number, cz: number): Chunk => {
    const data = buildChunk(field, cx, cz, o.size, o.cells, o.seed);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new BufferAttribute(data.normals, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(data.colors, 3));
    geometry.setAttribute('uv', new BufferAttribute(data.uvs, 2));
    geometry.setIndex(new BufferAttribute(data.indices, 1));
    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    const spots = treePlacements(field, cx, cz, o.size, o.treeDensity, o.seed);
    let trees: InstancedMesh | null = null;
    if (spots.length > 0) {
      trees = new InstancedMesh(treeGeometry, treeMaterial, spots.length / 4);
      for (let i = 0; i < spots.length; i += 4) {
        const k = spots[i + 3]!;
        trees.setMatrixAt(i / 4, m.compose(p.set(spots[i]!, spots[i + 1]!, spots[i + 2]!), q.identity(), s.set(k, k, k)));
      }
      trees.castShadow = true;
      trees.frustumCulled = false;
      group.add(trees);
    }
    return { mesh, trees };
  };

  const drop = (c: Chunk) => {
    group.remove(c.mesh);
    c.mesh.geometry.dispose();
    if (c.trees) {
      group.remove(c.trees);
      c.trees.dispose();
    }
  };

  const ensureAround = (x: number, z: number) => {
    const cx = Math.floor(x / o.size);
    const cz = Math.floor(z / o.size);
    const wanted = new Set<string>();
    for (let dz = -o.radius; dz <= o.radius; dz += 1) {
      for (let dx = -o.radius; dx <= o.radius; dx += 1) {
        const key = `${cx + dx},${cz + dz}`;
        wanted.add(key);
        if (!chunks.has(key)) chunks.set(key, build(cx + dx, cz + dz));
      }
    }
    for (const [key, c] of chunks) {
      if (!wanted.has(key)) {
        drop(c);
        chunks.delete(key);
      }
    }
  };
  const dispose = () => {
    for (const c of chunks.values()) drop(c);
    chunks.clear();
    material.dispose();
    treeMaterial.dispose();
    treeGeometry.dispose();
  };
  return { group, ensureAround, dispose };
}
