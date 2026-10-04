import { create } from 'zustand';

export type SlotName = 'filters' | 'narrative';

interface SlotsState {
  filters: HTMLElement | null;
  narrative: HTMLElement | null;
  set: (slot: SlotName, element: HTMLElement | null) => void;
}

/** The places of the page that other components render into: the filters in the bottom bar, the story in the right panel. */
export const useSlots = create<SlotsState>((set) => ({
  filters: null,
  narrative: null,
  set: (slot, element) => set({ [slot]: element } as Partial<SlotsState>)
}));
