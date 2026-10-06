import React, { Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { Hud } from './Hud';
import { ProvinceFilter } from './ProvinceFilter';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { StoryCaption } from '../story/StoryCaption';
import { StepRunner } from '../story/StepRunner';
import { SceneHost } from './SceneHost';
import { SceneTransition } from '../motion/SceneTransition';
import { CapabilityProvider, QualityDebugLine } from '../runtime/CapabilityProvider';
import { documentTitle } from './title';
import { useSlots } from '../dashboard/slots';

import { hasTourChart } from '../tour/chartSteps';

/** The charts of the Recorrido draw with ECharts, which must stay out of the initial load. */
const TourStep = lazy(() => import('../tour/TourStep').then((m) => ({ default: m.TourStep })));

/** `onHome` is the way back to the intro: the brand in the header calls it. */
export function App({ onHome }: { onHome?: () => void }) {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);
  const section = useStore((s) => s.section);
  const tourStep = useStore((s) => s.tourStep);
  const filtersRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('filters', el), []);

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

  return (
    <CapabilityProvider>
      <div className="app-screen">
      <div id="stage">
        {/* Canvas will go here */}
      </div>
      
      <div id="overlay" ref={overlayRef} data-scene={scene} data-section={section} style={{ pointerEvents: 'none' }}>
        <div className="chrome">
          <a className="skip-link" href="#main">Saltar al contenido principal</a>
          <Header onHome={onHome} />
          <QualityDebugLine />
        </div>
        
        <main id="main" tabIndex={-1} className="scene-container" data-testid="scene">
          {section === 'tour' && hasTourChart(tourStep) ? (
            <Suspense fallback={null}>
              <TourStep step={tourStep} />
            </Suspense>
          ) : (
            <SceneTransition sceneKey={scene}>
              <SceneHost scene={scene} />
            </SceneTransition>
          )}
        </main>
        
        <footer className="bottom-bar">
          {section !== 'tour' && (
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
      </div>
      <SiteFooter />
    </CapabilityProvider>
  );
}
