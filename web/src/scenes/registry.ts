import { ComponentType, lazy } from 'react';
import type { Scene } from '../types/scene';

// Every scene is its own chunk, loaded when it is first shown. Heavy libraries (ECharts) then load only with the
// first scene that needs them. The registry stays the single source of truth for scenes.
export const SCENE_COMPONENTS: Record<Scene, ComponentType> = {
  'andes': lazy(() => import('./andes/index')),
  'economy': lazy(() => import('./economy/index')),
  'resources': lazy(() => import('./resources/index')),
  'forecast': lazy(() => import('./forecast/index')),
  'ai-revolution': lazy(() => import('./ai-revolution/index')),
  'sandbox': lazy(() => import('./sandbox/index')),
};

export const SCENE_LABELS: Record<Scene, string> = {
  'andes': 'Andes',
  'economy': 'Economía',
  'resources': 'Recursos',
  'forecast': 'Pronóstico 2056',
  'ai-revolution': 'Revolución IA',
  'sandbox': 'Simulador',
};
