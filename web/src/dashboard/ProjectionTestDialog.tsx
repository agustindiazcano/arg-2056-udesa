import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Three.js lives in its own chunk: it loads only when the test is opened.
const ProjectionScenes = lazy(() => import('../three/ProjectionScenes'));

/**
 * The projection test: the map of Argentina and a bar chart in 3D with a title projected over each and a scan plane
 * travelling through them. A modal dialog: the focus goes to the close button and stays in the dialog, and Escape closes
 * it without reaching the global keys.
 */
export function ProjectionTestDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // the keys are handled on the dialog itself (a native listener), so they never reach the global handler
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        // the only control is the close button: the focus stays on it
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    dialog.addEventListener('keydown', onKeyDown);
    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="projection-backdrop">
      <div role="dialog" aria-modal="true" aria-label="Test proyección" className="projection-dialog" ref={dialogRef}>
        <header className="projection-head">
          <div>
            <h2>Test proyección</h2>
            <p>Datos de prueba: no son datos del modelo.</p>
          </div>
          <button type="button" className="chip" ref={closeRef} onClick={onClose}>
            Cerrar
          </button>
        </header>
        <Suspense
          fallback={
            <p role="status" className="poster">
              Cargando la vista 3D...
            </p>
          }
        >
          <ProjectionScenes />
        </Suspense>
      </div>
    </div>,
    document.body
  );
}
