import { Raycaster, Vector2 } from 'three';
import type { Mesh, PerspectiveCamera } from 'three';

/** Which of `meshes` is under the pointer, if any. */
export function createPicker(canvas: HTMLCanvasElement, camera: PerspectiveCamera, meshes: Mesh[]) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  return (e: PointerEvent): Mesh | undefined => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(meshes, false)[0]?.object as Mesh | undefined;
  };
}

/** Puts a tooltip next to the pointer, or hides it. */
export function showTip(tip: HTMLElement | null, host: HTMLElement, e: PointerEvent, text: string | null) {
  if (!tip) return;
  if (text === null) {
    tip.hidden = true;
    return;
  }
  const rect = host.getBoundingClientRect();
  tip.textContent = text;
  tip.style.left = `${e.clientX - rect.left + 12}px`;
  tip.style.top = `${e.clientY - rect.top + 12}px`;
  tip.hidden = false;
}
