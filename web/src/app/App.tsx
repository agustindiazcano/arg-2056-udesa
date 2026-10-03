import React, { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { TabBar } from './TabBar';
import { Hud } from './Hud';
import { ProvinceFilter } from './ProvinceFilter';
import { MockBadge } from './MockBadge';
import { StoryCaption } from '../story/StoryCaption';
import { StepRunner } from '../story/StepRunner';
import { SceneHost } from './SceneHost';
import { loadForecast } from '../data/load';
import { CapabilityProvider, QualityDebugLine } from '../runtime/CapabilityProvider';

export function App() {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);

  const [forecastSource, setForecastSource] = useState<string | null>(null);

  useEffect(() => {
    loadForecast('/data/forecast_output.json')
      .then(f => setForecastSource(f.source))
      .catch(e => console.error(e));
  }, []);

  return (
    <CapabilityProvider>
      <div id="stage">
        {/* Canvas will go here */}
      </div>
      
      <div id="overlay" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <TabBar />
          <Hud />
          <ProvinceFilter />
          <QualityDebugLine />
        </div>
        
        <div className="scene-container" data-testid="scene">
          <SceneHost scene={scene} />
        </div>
        
        {forecastSource && <MockBadge source={forecastSource} />}

        <StoryCaption />
        <StepRunner />
      </div>
    </CapabilityProvider>
  );
}
