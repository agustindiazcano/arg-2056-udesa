import React from 'react';
import { useStore } from '../state/store';

export function Hud() {
  const store = useStore();

  return (
    <div id="hud">
      <div>Scene: {store.scene}</div>
      <div data-testid="hud-year" data-value={store.yearFloat}>Year: {Math.floor(store.yearFloat)}</div>
      <div>Scenario: {store.scenario}</div>
      <div>Speed: {store.speed}x</div>
      <div>Mode: {store.mode}</div>
      <div>Province: {store.province || 'All'}</div>
      <div>AI Overlay: {store.aiOverlay}</div>

      <button aria-label="Play or Pause" onClick={() => store.dispatch({ type: 'togglePlay' })}>
        {store.playing ? 'Pause' : 'Play'}
      </button>
      
      <button aria-label="Toggle 2D/3D Mode" onClick={() => store.dispatch({ type: 'toggle3D' })}>
        Toggle 3D
      </button>

      <button aria-label="Filter by Province" onClick={() => store.dispatch({ type: 'openProvinceFilter' })}>
        Filter Province
      </button>

      <button aria-label="Toggle AI Overlay" onClick={() => store.dispatch({ type: 'setAiOverlay', aiOverlay: store.aiOverlay === 'off' ? 'on' : 'off' })}>
        Toggle AI
      </button>
      <a href="references.html">Sources and methods</a>
    </div>
  );
}
