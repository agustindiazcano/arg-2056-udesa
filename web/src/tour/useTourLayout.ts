import { create } from 'zustand';

export type TourCount = 1 | 2 | 3 | 4;

interface TourLayout {
  /** how many charts of the Recorrido are on screen at once (in the grid layouts) */
  count: TourCount;
  /** the "1/3" layout: one big chart on the right and three small ones on the left, a click on a small one makes it the big one */
  focus: boolean;
  setCount: (count: TourCount) => void;
  setFocus: () => void;
}

/** What the visitor chose for the charts of the Recorrido; it stays when the step changes. */
export const useTourLayout = create<TourLayout>((set) => ({
  count: 1,
  focus: false,
  setCount: (count) => set({ count, focus: false }),
  setFocus: () => set({ focus: true })
}));
