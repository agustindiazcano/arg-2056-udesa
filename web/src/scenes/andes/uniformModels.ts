import type { AnimationClip, Mesh, MeshStandardMaterial, Object3D } from 'three';

export type UniformModelId = 'san-martin' | 'soldier-blue' | 'soldier-red';
export type AssetModelId = UniformModelId | 'musket';

export const MODEL_URLS: Record<AssetModelId, string> = {
  'san-martin': '/models/san-martin.glb',
  'soldier-blue': '/models/soldier-blue.glb',
  'soldier-red': '/models/soldier-red.glb',
  musket: '/models/musket.glb'
};

/**
 * Mount transform inside `mixamorig:Spine2` (where character root has 0.01 scale,
 * so 1 local unit = 1 cm and -Z is the back of the coat).
 * Slings the 1.9-unit flintlock musket diagonally across the soldier's back.
 */
export const MUSKET_BACK_MOUNT = {
  boneNames: ['mixamorig:Spine2', 'mixamorig:Spine1', 'mixamorig:Spine'] as const,
  position: [0, 2, -13.5] as const,
  rotation: [0.12, Math.PI, -Math.PI / 3] as const,
  scale: 62
} as const;

export interface UniformModelInfo {
  id: UniformModelId;
  title: string;
  unit: string;
  role: string;
  hasMusketOnBack: boolean;
  weaponLabel: string;
  description: string;
  preferredWalkClip: string;
  preferredIdleClip: string;
}

export const UNIFORM_MODELS: readonly UniformModelInfo[] = [
  {
    id: 'san-martin',
    title: 'Gral. José de San Martín',
    unit: 'Estado Mayor — Comandante en Jefe',
    role: 'Comandante del Ejército de los Andes',
    hasMusketOnBack: false,
    weaponLabel: 'Sable corvo de caballería y bicornio',
    description:
      'Casaca azul oscuro con bordados dorados en cuello y puños, banda celeste cruzada al pecho, bicornio con escarapela y botas altas de campaña.',
    preferredWalkClip: 'Walking',
    preferredIdleClip: 'Idle_11'
  },
  {
    id: 'soldier-blue',
    title: 'Soldado de Uniforme Azul',
    unit: 'Regimiento de Granaderos y Cazadores de los Andes',
    role: 'Infantería de línea y escolta',
    hasMusketOnBack: true,
    weaponLabel: 'Fusil de chispa en la espalda',
    description:
      'Casaca azul turquí con vivos y vueltas punzó, chacó alto con penacho rojo, correaje blanco cruzado y fusil de chispa terciado a la espalda para el cruce cordillerano.',
    preferredWalkClip: 'Walking',
    preferredIdleClip: 'Idle_11'
  },
  {
    id: 'soldier-red',
    title: 'Soldado de Uniforme Rojo',
    unit: 'Batallones N.º 7 y N.º 8 de Infantería de Línea',
    role: 'Vanguardia de infantería (Pardos y Morenos)',
    hasMusketOnBack: true,
    weaponLabel: 'Fusil de chispa en la espalda',
    description:
      'Chaqueta roja de paño con solapas oscuras y pantalón blanco de brin, morrión de cuero y fusil de chispa con bayoneta sujeto a la espalda durante el ascenso.',
    preferredWalkClip: 'Walking',
    preferredIdleClip: 'Idle_11'
  }
] as const;

export interface CharacterPlacement {
  id: string;
  model: UniformModelId;
  role: 'leader' | 'escort' | 'infantry-blue' | 'infantry-red';
  x: number;
  z: number;
  rotationY: number;
  scale: number;
  hasMusketOnBack: boolean;
  phaseOffset: number;
}

/**
 * AndesIntro march formation under the celeste sky, positioned right above the 1817 title:
 * San Martín walking in front + 5 soldiers behind him (3 blue uniforms, 2 red uniforms),
 * scaled up so all 6 models read clearly and prominently.
 */
export const ANDES_INTRO_MARCH_FORMATION: readonly CharacterPlacement[] = [
  {
    id: 'march-san-martin',
    model: 'san-martin',
    role: 'leader',
    x: 0,
    z: 0.95,
    rotationY: 0.16,
    scale: 1.38,
    hasMusketOnBack: false,
    phaseOffset: 0
  },
  {
    id: 'march-blue-1',
    model: 'soldier-blue',
    role: 'infantry-blue',
    x: -1.12,
    z: -0.05,
    rotationY: 0.16,
    scale: 1.24,
    hasMusketOnBack: true,
    phaseOffset: 0.35
  },
  {
    id: 'march-blue-2',
    model: 'soldier-blue',
    role: 'infantry-blue',
    x: 0.02,
    z: -0.2,
    rotationY: 0.16,
    scale: 1.24,
    hasMusketOnBack: true,
    phaseOffset: 0.7
  },
  {
    id: 'march-blue-3',
    model: 'soldier-blue',
    role: 'infantry-blue',
    x: 1.14,
    z: -0.05,
    rotationY: 0.16,
    scale: 1.24,
    hasMusketOnBack: true,
    phaseOffset: 1.05
  },
  {
    id: 'march-red-1',
    model: 'soldier-red',
    role: 'infantry-red',
    x: -0.66,
    z: -1.05,
    rotationY: 0.16,
    scale: 1.22,
    hasMusketOnBack: true,
    phaseOffset: 1.4
  },
  {
    id: 'march-red-2',
    model: 'soldier-red',
    role: 'infantry-red',
    x: 0.66,
    z: -1.05,
    rotationY: 0.16,
    scale: 1.22,
    hasMusketOnBack: true,
    phaseOffset: 1.75
  }
] as const;

/**
 * Intro hover escort when hovering "Cruce de los Andes":
 * San Martín flanked by 2 blue grenadiers escorting him on the right over the Argentina map.
 */
export const INTRO_HOVER_ESCORT_FORMATION: readonly CharacterPlacement[] = [
  {
    id: 'escort-san-martin',
    model: 'san-martin',
    role: 'leader',
    x: 0,
    z: 0.65,
    rotationY: -0.15,
    scale: 1.22,
    hasMusketOnBack: false,
    phaseOffset: 0
  },
  {
    id: 'escort-grenadier-left',
    model: 'soldier-blue',
    role: 'escort',
    x: -1.05,
    z: -0.35,
    rotationY: -0.08,
    scale: 1.12,
    hasMusketOnBack: true,
    phaseOffset: 0.45
  },
  {
    id: 'escort-grenadier-right',
    model: 'soldier-blue',
    role: 'escort',
    x: 1.05,
    z: -0.35,
    rotationY: -0.22,
    scale: 1.12,
    hasMusketOnBack: true,
    phaseOffset: 0.9
  }
] as const;

/**
 * Clones `musketTemplate` and attaches it onto the soldier's upper back (`mixamorig:Spine2`)
 * so that the rifle moves naturally with the torso during walking and idle animations.
 */
export function attachMusketToBack(characterRoot: Object3D, musketTemplate: Object3D): Object3D {
  const existing = characterRoot.getObjectByName('musket-on-back');
  if (existing) return existing;

  const mounted = musketTemplate.clone(true);
  mounted.name = 'musket-on-back';

  let targetBone: Object3D | undefined;
  for (const boneName of MUSKET_BACK_MOUNT.boneNames) {
    const found = characterRoot.getObjectByName(boneName);
    if (found) {
      targetBone = found;
      break;
    }
  }

  if (targetBone) {
    mounted.position.set(
      MUSKET_BACK_MOUNT.position[0],
      MUSKET_BACK_MOUNT.position[1],
      MUSKET_BACK_MOUNT.position[2]
    );
    mounted.rotation.set(
      MUSKET_BACK_MOUNT.rotation[0],
      MUSKET_BACK_MOUNT.rotation[1],
      MUSKET_BACK_MOUNT.rotation[2]
    );
    mounted.scale.setScalar(MUSKET_BACK_MOUNT.scale);
    targetBone.add(mounted);
  } else {
    mounted.position.set(0, 1.22, -0.14);
    mounted.rotation.set(
      MUSKET_BACK_MOUNT.rotation[0],
      MUSKET_BACK_MOUNT.rotation[1],
      MUSKET_BACK_MOUNT.rotation[2]
    );
    mounted.scale.setScalar(0.62);
    characterRoot.add(mounted);
  }

  return mounted;
}

export function prepareModelMaterials(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      const std = mat as MeshStandardMaterial | undefined;
      if (std && 'roughness' in std) {
        std.roughness = Math.min(Math.max(std.roughness ?? 0.75, 0.55), 0.9);
        std.metalness = Math.min(std.metalness ?? 0.1, 0.35);
        std.needsUpdate = true;
      }
    }
  });
}

export interface LoadedCharacterTemplate {
  scene: Object3D;
  animations: AnimationClip[];
}

export interface LoadedUniformAssets {
  characters: Record<UniformModelId, LoadedCharacterTemplate>;
  musket: Object3D;
  cloneCharacter: (id: UniformModelId, withMusketOnBack?: boolean) => LoadedCharacterTemplate;
}

let cachedAssetsPromise: Promise<LoadedUniformAssets> | null = null;

export function loadUniformAssets(): Promise<LoadedUniformAssets> {
  if (cachedAssetsPromise) return cachedAssetsPromise;

  cachedAssetsPromise = (async () => {
    const [{ GLTFLoader }, { clone: cloneSkeleton }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/utils/SkeletonUtils.js')
    ]);

    const loader = new GLTFLoader();
    const loadGltf = (url: string) =>
      new Promise<{ scene: Object3D; animations: AnimationClip[] }>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations ?? [] }),
          undefined,
          (err) => reject(err)
        );
      });

    const [sanMartin, soldierBlue, soldierRed, musketGltf] = await Promise.all([
      loadGltf(MODEL_URLS['san-martin']),
      loadGltf(MODEL_URLS['soldier-blue']),
      loadGltf(MODEL_URLS['soldier-red']),
      loadGltf(MODEL_URLS.musket)
    ]);

    prepareModelMaterials(sanMartin.scene);
    prepareModelMaterials(soldierBlue.scene);
    prepareModelMaterials(soldierRed.scene);
    prepareModelMaterials(musketGltf.scene);

    const characters: Record<UniformModelId, LoadedCharacterTemplate> = {
      'san-martin': sanMartin,
      'soldier-blue': soldierBlue,
      'soldier-red': soldierRed
    };

    const cloneCharacter = (
      id: UniformModelId,
      withMusketOnBack = id !== 'san-martin'
    ): LoadedCharacterTemplate => {
      const template = characters[id];
      const clonedScene = cloneSkeleton(template.scene);
      prepareModelMaterials(clonedScene);
      if (withMusketOnBack) {
        attachMusketToBack(clonedScene, musketGltf.scene);
      }
      return {
        scene: clonedScene,
        animations: template.animations
      };
    };

    return {
      characters,
      musket: musketGltf.scene,
      cloneCharacter
    };
  })().catch((err) => {
    cachedAssetsPromise = null;
    throw err;
  });

  return cachedAssetsPromise;
}
