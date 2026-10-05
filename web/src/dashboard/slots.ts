import { create } from 'zustand';

export type SlotName = 'filters' | 'narrative' | 'progress' | 'nav';

interface SlotsState {
  filters: HTMLElement | null;
  narrative: HTMLElement | null;
  progress: HTMLElement | null;
  nav: HTMLElement | null;
  set: (slot: SlotName, element: HTMLElement | null) => void;
}

/** The places of the page that other components render into: the filters and the progress in the bottom bar, the story in the right panel, the controls of a scene in the navbar. */
export const useSlots = create<SlotsState>((set) => ({
  filters: null,
  narrative: null,
  progress: null,
  nav: null,
  set: (slot, element) => set({ [slot]: element } as Partial<SlotsState>)
}));
