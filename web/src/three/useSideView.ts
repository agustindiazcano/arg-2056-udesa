import { useStore } from '../state/store';

/** True in the Recorrido and in the Simulador: their 3D charts open straight from the side, as a flat chart would look. */
export function useSideView(): boolean {
  return useStore((s) => s.section === 'tour' || s.section === 'simulator');
}
