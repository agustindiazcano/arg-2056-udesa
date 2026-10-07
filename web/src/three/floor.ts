import { BoxGeometry, BufferGeometry, CanvasTexture, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { tokens } from '../styles/tokens';

/** Pixels of the texture for each unit of the scene (the texture is capped, so a very wide floor gets a softer grid). */
const PIXELS_PER_UNIT = 56;
const MAX_TEXTURE = 2048;
/** The slab under the bars: thin and solid, so that from the side the floor is one clean line. Its top is the foot of the bars. */
const SLAB_THICKNESS = 0.06;
const SLAB_COLOR = '#26303f';
/** The sheet with the grid lies a hair above the slab. */
const SHEET_Y = 0.002;

/** The positions of the grid lines along an axis `width` long: one at every `step` from the middle outwards; `major` of them is a stronger line (every `major`-th). */
export function floorGridLines(width: number, step: number, major: number): Array<{ at: number; major: boolean }> {
  const half = width / 2;
  const lines: Array<{ at: number; major: boolean }> = [];
  for (let i = Math.ceil(-half / step); i <= Math.floor(half / step); i += 1) lines.push({ at: i * step, major: i % major === 0 });
  return lines;
}

/** A hairline grid that fades toward the edges over a faint blue glow, drawn once on a canvas: the floor has no thickness and no lit surface. */
function floorTexture(width: number, depth: number): CanvasTexture {
  const scale = Math.min(PIXELS_PER_UNIT, MAX_TEXTURE / Math.max(width, depth));
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(depth * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // a faint glow of the accent in the middle
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
    glow.addColorStop(0, 'rgba(57, 135, 229, 0.10)');
    glow.addColorStop(1, 'rgba(57, 135, 229, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // the grid: fine lines every unit, stronger every fifth
    for (const { at, major } of floorGridLines(width, 1, 5)) {
      const x = w / 2 + at * scale;
      ctx.fillStyle = major ? 'rgba(195, 194, 183, 0.34)' : 'rgba(195, 194, 183, 0.15)';
      ctx.fillRect(Math.round(x) - 0.5, 0, major ? 1.5 : 1, h);
    }
    for (const { at, major } of floorGridLines(depth, 1, 5)) {
      const y = h / 2 + at * scale;
      ctx.fillStyle = major ? 'rgba(195, 194, 183, 0.34)' : 'rgba(195, 194, 183, 0.15)';
      ctx.fillRect(0, Math.round(y) - 0.5, w, major ? 1.5 : 1);
    }
    // everything fades to nothing at the edges, in an ellipse that follows the shape of the floor
    ctx.globalCompositeOperation = 'destination-in';
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(w / 2, h / 2);
    const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    fade.addColorStop(0, 'rgba(0, 0, 0, 1)');
    fade.addColorStop(0.62, 'rgba(0, 0, 0, 0.9)');
    fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fade;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8; // the lines stay sharp when the floor is seen from a low angle
  return texture;
}

/** The four sides of the floor as line segments (x, y, z pairs), a little above the slab. */
function outline(width: number, depth: number): number[] {
  const x = width / 2;
  const z = depth / 2;
  return [-x, 0, -z, x, 0, -z, x, 0, -z, x, 0, z, x, 0, z, -x, 0, z, -x, 0, z, -x, 0, -z];
}

/**
 * The floor of a 3D chart (`width` along x, `depth` along z): a thin solid slab with a crisp edge line, which from the side is
 * a clean line, and over it a see-through sheet with a hairline grid that fades out.
 */
export function createFloor(width: number, depth: number): Group {
  const group = new Group();

  const slab = new Mesh(new BoxGeometry(width, SLAB_THICKNESS, depth), new MeshBasicMaterial({ color: SLAB_COLOR, toneMapped: false }));
  slab.position.y = -SLAB_THICKNESS / 2;
  group.add(slab);

  const edgeGeometry = new BufferGeometry();
  edgeGeometry.setAttribute('position', new Float32BufferAttribute(outline(width, depth), 3));
  const edge = new LineSegments(edgeGeometry, new LineBasicMaterial({ color: tokens.ink2, transparent: true, opacity: 0.7, toneMapped: false }));
  edge.position.y = 0.004;
  group.add(edge);

  const sheetMaterial = new MeshBasicMaterial({ map: floorTexture(width, depth), transparent: true, depthWrite: false, toneMapped: false, color: tokens.ink });
  const sheet = new Mesh(new PlaneGeometry(width, depth), sheetMaterial);
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.y = SHEET_Y;
  group.add(sheet);
  return group;
}
