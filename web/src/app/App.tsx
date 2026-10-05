import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { Hud } from './Hud';
import { TourBar } from './TourBar';
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

/** `onHome` is the way back to the intro: the brand in the header calls it. */
export function App({ onHome }: { onHome?: () => void }) {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);
  const section = useStore((s) => s.section);
  const filtersRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('filters', el), []);

  const [forecastSource, setForecastSource] = useState<string | null>(null);

  // the real height of the header and of the bottom bar, for a scene that floats its panels over a full-screen canvas (the Andes)
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const overlay = overlayRef.current;
    const chrome = overlay?.querySelector('.chrome');
    const bar = overlay?.querySelector('.bottom-bar');
    if (!overlay || !chrome || !bar || typeof ResizeObserver === 'undefined') return;
    const apply = () => {
      overlay.style.setProperty('--chrome-h', `${Math.round(chrome.getBoundingClientRect().bottom)}px`);
      overlay.style.setProperty('--bar-h', `${Math.round(window.innerHeight - bar.getBoundingClientRect().top)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(chrome);
    observer.observe(bar);
    window.addEventListener('resize', apply);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

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
      
      <div id="overlay" ref={overlayRef} data-scene={scene} data-section={section} style={{ pointerEvents: 'none' }}>
        <div className="chrome">
          <a className="skip-link" href="#main">Saltar al contenido principal</a>
          <Header mockSource={forecastSource} onHome={onHome} />
          <QualityDebugLine />
        </div>
        
        <main id="main" tabIndex={-1} className="scene-container" data-testid="scene">
          <SceneTransition sceneKey={scene}>
            <SceneHost scene={scene} />
          </SceneTransition>
        </main>
        
        <footer className="bottom-bar">
          {section === 'tour' ? (
            <TourBar />
          ) : (
            <div className="controls-wrap">
              <Hud />
              <ProvinceFilter />
            </div>
          )}
          <div className="filters-slot" ref={filtersRef} />
        </footer>

        <StoryCaption />
        <StepRunner />
      </div>
    </CapabilityProvider>
  );
}
