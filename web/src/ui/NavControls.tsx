import React from 'react';
import type { CameraPreset } from '../charts3d/camera';

interface NavControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** the 3D views add "Cenital" and "Perspectiva" */
  onPreset?: (preset: CameraPreset) => void;
}

/** The zoom and reset buttons in a corner of a map or a 3D view. Native buttons, Spanish names; the keyboard keeps its map. */
export function NavControls({ onZoomIn, onZoomOut, onReset, onPreset }: NavControlsProps) {
  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div className="nav-controls" role="group" aria-label="Navegación de la vista">
      <button type="button" className="nav-btn" aria-label="Acercar" onClick={act(onZoomIn)}>
        +
      </button>
      <button type="button" className="nav-btn" aria-label="Alejar" onClick={act(onZoomOut)}>
        −
      </button>
      <button type="button" className="nav-btn" aria-label="Restablecer vista" onClick={act(onReset)}>
        ⟲
      </button>
      {onPreset && (
        <>
          <button type="button" className="nav-btn nav-text" onClick={act(() => onPreset('top'))}>
            Cenital
          </button>
          <button type="button" className="nav-btn nav-text" onClick={act(() => onPreset('perspective'))}>
            Perspectiva
          </button>
        </>
      )}
    </div>
  );
}
