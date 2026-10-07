import { create } from 'zustand';
import { YEAR_MIN } from '../types/year';
import { reduce, INITIAL_STEP_INDEX, State, Action } from './reducer';

export interface AppStore extends State {
  dispatch: (action: Action) => void;
  // It's helpful to expose a direct `tick` method for the ticker loop to avoid object allocation of an action if needed, or we can just use a normal tick function.
  // Actually, wait, tick needs to get state.
  tick: (dtSeconds: number) => void;
}

const initialState: State = {
  scene: 'andes',
  section: 'andes',
  yearFloat: YEAR_MIN, // the app opens in the Andes, which starts at 0 %
  scenario: 'expected',
  speed: 1,
  playing: false,
  mode: '3d',
  province: null,
  provinceFilterOpen: false,
  aiOverlay: 'off',
  stepIndex: INITIAL_STEP_INDEX,
  tourStep: 0
};

import { tick as tickReducer } from './reducer';

export const useStore = create<AppStore>((set) => ({
  ...initialState,
  dispatch: (action: Action) => set((state) => reduce(state, action)),
  tick: (dtSeconds: number) => set((state) => tickReducer(state, dtSeconds))
}));
