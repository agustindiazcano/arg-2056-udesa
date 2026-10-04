import { create } from 'zustand';

export type Layout = 1 | 2 | 4;

interface DashPrefs {
  /** how many views the viewer shows at once */
  layout: Layout;
  /** Explorar: the narrative is hidden and the viewer is for free exploration; Recorrido shows the story */
  explore: boolean;
  setLayout: (layout: Layout) => void;
  setExplore: (explore: boolean) => void;
}

/** What the visitor chose for the dashboard as a whole; it stays when the scene changes. */
export const useDashPrefs = create<DashPrefs>((set) => ({
  layout: 1,
  explore: false,
  setLayout: (layout) => set({ layout }),
  setExplore: (explore) => set({ explore })
}));
