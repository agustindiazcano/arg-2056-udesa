/** The scene (a rectangle of `width` by `depth` scene units centred on the origin) fitted into a square of `size` pixels, with a margin. */
export interface MinimapFrame {
  size: number;
  width: number;
  depth: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function minimapFrame(width: number, depth: number, size: number, pad = 6): MinimapFrame {
  const long = Math.max(width, depth, 1e-9);
  const scale = (size - 2 * pad) / long;
  return { size, width, depth, scale, offsetX: (size - width * scale) / 2, offsetY: (size - depth * scale) / 2 };
}

/** A place of the scene on the map, in pixels: east to the right, north up (the smaller z, the higher). */
export function toMinimap(frame: MinimapFrame, x: number, z: number): { x: number; y: number } {
  return { x: frame.offsetX + (x + frame.width / 2) * frame.scale, y: frame.offsetY + (z + frame.depth / 2) * frame.scale };
}

/**
 * The triangle of what the camera looks at: its point at the camera, and two corners `length` pixels away, `spread` radians to each
 * side of the way to the target (the first corner is to the left of that way, the second to the right).
 */
export function viewCone(
  frame: MinimapFrame,
  camera: { x: number; z: number },
  target: { x: number; z: number },
  length: number,
  spread: number
): [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] {
  const apex = toMinimap(frame, camera.x, camera.z);
  const a = Math.atan2(target.x - camera.x, target.z - camera.z);
  const corner = (angle: number) => ({ x: apex.x + length * Math.sin(angle), y: apex.y + length * Math.cos(angle) });
  return [apex, corner(a + spread), corner(a - spread)];
}
