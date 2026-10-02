import React, { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { TabBar } from './TabBar';
import { Hud } from './Hud';
import { ProvinceFilter } from './ProvinceFilter';
import { MockBadge } from './MockBadge';
import { SCENE_COMPONENTS } from '../scenes/registry';
import { loadForecast } from '../data/load';

export function App() {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);
  const CurrentScene = SCENE_COMPONENTS[scene];

  const [forecastSource, setForecastSource] = useState<string | null>(null);

  useEffect(() => {
    loadForecast('/data/forecast_output.json')
      .then(f => setForecastSource(f.source))
      .catch(e => console.error(e));
  }, []);

  return (
    <>
      <div id="stage">
        {/* Canvas will go here */}
      </div>
      
      <div id="overlay" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <TabBar />
          <Hud />
          <ProvinceFilter />
        </div>
        
        <div className="scene-container">
          <CurrentScene />
        </div>
        
        {forecastSource && <MockBadge source={forecastSource} />}
      </div>
    </>
  );
}
