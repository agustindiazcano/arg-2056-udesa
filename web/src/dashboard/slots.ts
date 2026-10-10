import { create } from 'zustand';

export type SlotName = 'filters' | 'narrative' | 'progress' | 'nav' | 'minimap';

interface SlotsState {
  filters: HTMLElement | null;
  narrative: HTMLElement | null;
  progress: HTMLElement | null;
  nav: HTMLElement | null;
  minimap: HTMLElement | null;
  set: (slot: SlotName, element: HTMLElement | null) => void;
}

/** The places of the page that other components render into: the filters and the progress in the bottom bar, the story in the right panel, the controls of a scene in the navbar. */
export const useSlots = create<SlotsState>((set) => ({
  filters: null,
  narrative: null,
  progress: null,
  nav: null,
  minimap: null,
  set: (slot, element) => set({ [slot]: element } as Partial<SlotsState>)
}));
