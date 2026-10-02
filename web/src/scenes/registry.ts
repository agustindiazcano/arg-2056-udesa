import { ComponentType } from 'react';
import type { Scene } from '../types/scene';

import AndesScene from './andes/index';
import EconomyScene from './economy/index';
import ResourcesScene from './resources/index';
import ForecastScene from './forecast/index';
import AiRevolutionScene from './ai-revolution/index';
import SandboxScene from './sandbox/index';

export const SCENE_COMPONENTS: Record<Scene, ComponentType> = {
  'andes': AndesScene,
  'economy': EconomyScene,
  'resources': ResourcesScene,
  'forecast': ForecastScene,
  'ai-revolution': AiRevolutionScene,
  'sandbox': SandboxScene,
};

export const SCENE_LABELS: Record<Scene, string> = {
  'andes': 'Andes',
  'economy': 'Economy',
  'resources': 'Resources',
  'forecast': 'Forecast 2056',
  'ai-revolution': 'AI Revolution',
  'sandbox': 'Sandbox',
};
