import React, { Component, Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useStore } from '../state/store';
import { useKeyboard } from '../state/useKeyboard';
import { useTicker } from '../state/useTicker';
import { Hud } from './Hud';
import { Spinner } from '../ui/Spinner';
import { ProvinceFilter } from './ProvinceFilter';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { StoryCaption } from '../story/StoryCaption';
import { StepRunner } from '../story/StepRunner';
import { showsStory } from '../story/visibility';
import { SceneHost } from './SceneHost';
import { SceneTransition } from '../motion/SceneTransition';
import { CapabilityProvider, QualityDebugLine } from '../runtime/CapabilityProvider';
import { documentTitle } from './title';
import { installPreloadErrorHandler, recoverChunkLoadError } from './prefetch';
import { useSlots } from '../dashboard/slots';

import { hasTourChart } from '../tour/chartSteps';

function lazySection<P extends object = Record<string, never>>(loader: () => Promise<{ default: ComponentType<P> }>) {
  return lazy(() =>
    loader().catch((err: unknown) => {
      if (recoverChunkLoadError(useStore.getState().section)) {
        return new Promise<{ default: ComponentType<P> }>(() => {});
      }
      throw err;
    })
  );
}

/** The charts of the Recorrido draw with ECharts, which must stay out of the initial load. */
const TourStep = lazySection(() => import('../tour/TourStep').then((m) => ({ default: m.TourStep })));

const Simulator = lazySection(() => import('../tour/Simulator').then((m) => ({ default: m.Simulator })));

const DataPage = lazySection(() => import('../datasets/DataPage').then((m) => ({ default: m.DataPage })));

class SectionErrorBoundary extends Component<{ resetKey: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="data-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', paddingTop: '2rem' }}>
          <p style={{ margin: 0 }}>Hay una versión más reciente disponible de esta sección.</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Actualizar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** `onHome` is the way back to the intro: the brand in the header calls it. */
export function App({ onHome }: { onHome?: () => void }) {
  useKeyboard();
  useTicker();

  const scene = useStore((s) => s.scene);
  const section = useStore((s) => s.section);
  const tourStep = useStore((s) => s.tourStep);
  const filtersRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('filters', el), []);

  useEffect(() => installPreloadErrorHandler(() => useStore.getState().section), []);

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
          <SectionErrorBoundary resetKey={`${section}:${scene}:${tourStep}`}>
            {section === 'data' ? (
              <Suspense fallback={<Spinner label="Cargando los datos..." />}>
                <DataPage />
              </Suspense>
            ) : section === 'simulator' ? (
              <Suspense fallback={<Spinner label="Cargando el simulador..." />}>
                <Simulator />
              </Suspense>
            ) : section === 'tour' && hasTourChart(tourStep) ? (
              <Suspense fallback={<Spinner label="Cargando el gráfico..." />}>
                <TourStep step={tourStep} />
              </Suspense>
            ) : (
              <SceneTransition sceneKey={scene}>
                <SceneHost scene={scene} />
              </SceneTransition>
            )}
          </SectionErrorBoundary>
        </main>
        
        <footer className="bottom-bar">
          {section !== 'tour' && section !== 'simulator' && section !== 'data' && (
            <div className="controls-wrap">
              <Hud />
              <ProvinceFilter />
            </div>
          )}
          <div className="filters-slot" ref={filtersRef} />
        </footer>

        {showsStory(section) && <StoryCaption />}
        {showsStory(section) && <StepRunner />}
      </div>
      </div>
      <SiteFooter />
    </CapabilityProvider>
  );
}
