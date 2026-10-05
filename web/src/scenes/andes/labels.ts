/** Camera distance (scene units) up to which a floating place name is fully visible, and from which it is gone. */
export const LABEL_NEAR = 12;
export const LABEL_FAR = 45;

/** How visible the name of a place is from this distance: 1 near, 0 far, smooth between. */
export function labelOpacity(distance: number): number {
  const t = Math.min(1, Math.max(0, (distance - LABEL_NEAR) / (LABEL_FAR - LABEL_NEAR)));
  return 1 - t * t * (3 - 2 * t);
}

/**
 * A point in the normalized device coordinates of the camera (x and y from -1 to 1, z from -1 near to 1 far) as a place on a screen of
 * `width` by `height` pixels, and whether it is in front of the camera and within view (a little margin, so a label at the edge does not pop).
 */
export function toScreen(ndc: { x: number; y: number; z: number }, width: number, height: number): { x: number; y: number; visible: boolean } {
  return {
    x: (ndc.x * 0.5 + 0.5) * width,
    y: (-ndc.y * 0.5 + 0.5) * height,
    visible: ndc.z > -1 && ndc.z < 1 && Math.abs(ndc.x) <= 1.05 && Math.abs(ndc.y) <= 1.05
  };
}
