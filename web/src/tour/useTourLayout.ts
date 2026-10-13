import { create } from 'zustand';

export type TourCount = 1 | 2 | 3 | 4;

interface TourLayout {
  /** how many charts of the Recorrido are on screen at once (in the grid layouts) */
  count: TourCount;
  /** the "1/3" layout: one big chart on the right and three small ones on the left, a click on a small one makes it the big one */
  focus: boolean;
  /** the side panel with the text and the references of each chart; open by default */
  sideOpen: boolean;
  toggleSide: () => void;
  setCount: (count: TourCount) => void;
  setFocus: () => void;
}

/** What the visitor chose for the charts of the Recorrido; it stays when the step changes. */
export const useTourLayout = create<TourLayout>((set) => ({
  count: 1,
  focus: false,
  sideOpen: true,
  toggleSide: () => set((s) => ({ sideOpen: !s.sideOpen })),
  setCount: (count) => set({ count, focus: false }),
  setFocus: () => set({ focus: true })
}));
