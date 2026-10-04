import React, { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { Hud } from './Hud';
import { ProvinceFilter } from './ProvinceFilter';
import { Header } from './Header';
import { StoryCaption } from '../story/StoryCaption';
import { StepRunner } from '../story/StepRunner';
import { SceneHost } from './SceneHost';
import { loadForecast } from '../data/load';
import { versionedUrl } from '../data/version';
import { CapabilityProvider, QualityDebugLine } from '../runtime/CapabilityProvider';
import { documentTitle } from './title';

export function App() {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);

  const [forecastSource, setForecastSource] = useState<string | null>(null);

  useEffect(() => {
    document.title = documentTitle(scene);
  }, [scene]);

  useEffect(() => {
    versionedUrl('/data/forecast_output.json')
      .then(loadForecast)
      .then(f => setForecastSource(f.source))
      .catch(e => console.error(e));
  }, []);

  return (
    <CapabilityProvider>
      <div id="stage">
        {/* Canvas will go here */}
      </div>
      
      <div id="overlay" style={{ pointerEvents: 'none' }}>
        <div className="chrome">
          <a className="skip-link" href="#main">Saltar al contenido principal</a>
          <Header mockSource={forecastSource} />
          <div className="controls-wrap">
            <Hud />
            <ProvinceFilter />
          </div>
          <QualityDebugLine />
        </div>
        
        <main id="main" tabIndex={-1} className="scene-container" data-testid="scene">
          <SceneHost scene={scene} />
        </main>
        
        <StoryCaption />
        <StepRunner />
      </div>
    </CapabilityProvider>
  );
}
