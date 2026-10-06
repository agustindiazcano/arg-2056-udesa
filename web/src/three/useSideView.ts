import { useStore } from '../state/store';

/** True in the Recorrido: its 3D charts open straight from the side. */
export function useSideView(): boolean {
  return useStore((s) => s.section === 'tour');
}
