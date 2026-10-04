import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { Hud } from './Hud';
import { ProvinceFilter } from './ProvinceFilter';
import { Header } from './Header';
import { StoryCaption } from '../story/StoryCaption';
import { StepRunner } from '../story/StepRunner';
import { SceneHost } from './SceneHost';
import { SceneTransition } from '../motion/SceneTransition';
import { loadForecast } from '../data/load';
import { versionedUrl } from '../data/version';
import { CapabilityProvider, QualityDebugLine } from '../runtime/CapabilityProvider';
import { documentTitle } from './title';
import { describeError } from './describeError';
import { useSlots } from '../dashboard/slots';

export function App() {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);
  const filtersRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('filters', el), []);

  const [forecastSource, setForecastSource] = useState<string | null>(null);

  useEffect(() => {
    document.title = documentTitle(scene);
  }, [scene]);

  useEffect(() => {
    versionedUrl('/data/forecast_output.json')
      .then(loadForecast)
      .then(f => setForecastSource(f.source))
      .catch((e: unknown) => console.error('No se pudo cargar el pronóstico:', describeError(e)));
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
          <QualityDebugLine />
        </div>
        
        <main id="main" tabIndex={-1} className="scene-container" data-testid="scene">
          <SceneTransition sceneKey={scene}>
            <SceneHost scene={scene} />
          </SceneTransition>
        </main>
        
        <footer className="bottom-bar">
          <div className="controls-wrap">
            <Hud />
            <ProvinceFilter />
          </div>
          <div className="filters-slot" ref={filtersRef} />
        </footer>

        <StoryCaption />
        <StepRunner />
      </div>
    </CapabilityProvider>
  );
}
