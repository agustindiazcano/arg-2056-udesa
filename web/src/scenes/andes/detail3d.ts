import { BufferAttribute, BufferGeometry, ConeGeometry, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { buildChunk, treePlacements } from './reliefField';
import type { Field } from './reliefField';

/** Height and radius (scene units) of a tree of size 1, in proportion to the figures of the column. */
const TREE_HEIGHT = 0.06;
const TREE_RADIUS = 0.02;

interface Chunk {
  mesh: Mesh;
  trees: InstancedMesh | null;
}

export interface DetailTerrain {
  group: Group;
  /** builds the chunks around a point of the ground (the ones that are missing) and drops the far ones */
  ensureAround: (x: number, z: number) => void;
}

/**
 * The terrain in detail around the army: a grid of chunks of procedural relief (`reliefField`) with trees, built where the camera is
 * near and dropped when it goes away. Chunks are deterministic, so one that comes back looks the same.
 */
export function createDetailTerrain(field: Field, o: { size: number; cells: number; radius: number; treeDensity: number; seed: number; treeColor: string }): DetailTerrain {
  const group = new Group();
  const chunks = new Map<string, Chunk>();
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const treeGeometry = new ConeGeometry(TREE_RADIUS, TREE_HEIGHT, 7);
  treeGeometry.translate(0, TREE_HEIGHT / 2, 0);
  const treeMaterial = new MeshStandardMaterial({ color: o.treeColor, roughness: 0.9 });
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
  return { group, ensureAround };
}
