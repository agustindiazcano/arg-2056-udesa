import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CharacterStage3D,
  MAX_ZOOM_SCALE,
  MIN_ZOOM_SCALE
} from '../scenes/andes/CharacterStage3D';
import {
  UNIFORM_MODELS,
  type CharacterPlacement,
  type UniformModelId
} from '../scenes/andes/uniformModels';
import './uniformsModal.css';

export interface UniformsModalProps {
  onClose: () => void;
}

type FocusSelection = 'all' | UniformModelId;

const ALL_SHOWCASE_PLACEMENTS: readonly CharacterPlacement[] = [
  {
    id: 'showcase-blue',
    model: 'soldier-blue',
    role: 'infantry-blue',
    x: -1.45,
    z: -0.15,
    rotationY: 0.28,
    scale: 1,
    hasMusketOnBack: true,
    phaseOffset: 0.35
  },
  {
    id: 'showcase-san-martin',
    model: 'san-martin',
    role: 'leader',
    x: 0,
    z: 0.25,
    rotationY: 0,
    scale: 1.06,
    hasMusketOnBack: false,
    phaseOffset: 0
  },
  {
    id: 'showcase-red',
    model: 'soldier-red',
    role: 'infantry-red',
    x: 1.45,
    z: -0.15,
    rotationY: -0.28,
    scale: 1,
    hasMusketOnBack: true,
    phaseOffset: 0.7
  }
];

export const UniformsModal: React.FC<UniformsModalProps> = ({ onClose }) => {
  const [focus, setFocus] = useState<FocusSelection>('all');
  const [animMode, setAnimMode] = useState<'walk' | 'idle'>('walk');
  const [zoomScale, setZoomScale] = useState<number>(1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const placements = useMemo<readonly CharacterPlacement[]>(() => {
    if (focus === 'all') return ALL_SHOWCASE_PLACEMENTS;
    const info = UNIFORM_MODELS.find((m) => m.id === focus) ?? UNIFORM_MODELS[0]!;
    return [
      {
        id: `single-${info.id}`,
        model: info.id,
        role:
          info.id === 'san-martin'
            ? 'leader'
            : info.id === 'soldier-blue'
              ? 'infantry-blue'
              : 'infantry-red',
        x: 0,
        z: 0,
        rotationY: 0.2,
        scale: 1.12,
        hasMusketOnBack: info.hasMusketOnBack,
        phaseOffset: 0
      }
    ];
  }, [focus]);

  const cameraPosition = useMemo<readonly [number, number, number]>(
    () => (focus === 'all' ? [0, 1.45, 4.35] : [0, 1.32, 2.85]),
    [focus]
  );

  const adjustZoom = (delta: number) => {
    setZoomScale((cur) =>
      Math.min(Math.max(Number((cur + delta).toFixed(2)), MIN_ZOOM_SCALE), MAX_ZOOM_SCALE)
    );
  };

  const modalContent = (
    <div className="uniforms-modal-backdrop">
      <div
        className="uniforms-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Uniformes del Ejército de los Andes"
      >
        <div className="uniforms-modal-header">
          <div className="uniforms-modal-title-group">
            <p className="uniforms-modal-kicker">Campaña Libertadora · 1817</p>
            <h2 className="uniforms-modal-title">Uniformes del Ejército de los Andes</h2>
            <p className="uniforms-modal-subtitle">
              Modelos 3D históricos con el fusil de chispa terciado a la espalda en los soldados de línea.
            </p>
          </div>
          <button type="button" className="chip" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="uniforms-modal-toolbar">
          <div className="uniforms-modal-tabs" role="group" aria-label="Seleccionar modelo 3D">
            <button
              type="button"
              className="chip"
              aria-pressed={focus === 'all'}
              onClick={() => setFocus('all')}
            >
              Todos (3)
            </button>
            {UNIFORM_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="chip"
                aria-pressed={focus === m.id}
                onClick={() => setFocus(m.id)}
              >
                {m.title}
              </button>
            ))}
          </div>

          <div className="uniforms-modal-tabs" role="group" aria-label="Zoom y animación">
            <button
              type="button"
              className="chip"
              aria-label="Alejar zoom"
              onClick={() => adjustZoom(0.25)}
            >
              Alejar zoom −
            </button>
            <button
              type="button"
              className="chip"
              aria-label="Acercar zoom"
              onClick={() => adjustZoom(-0.25)}
            >
              Acercar zoom +
            </button>
            {zoomScale !== 1 && (
              <button
                type="button"
                className="chip"
                onClick={() => setZoomScale(1)}
              >
                Restablecer zoom
              </button>
            )}
            <button
              type="button"
              className="chip"
              aria-pressed={animMode === 'walk'}
              onClick={() => setAnimMode('walk')}
            >
              En marcha
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={animMode === 'idle'}
              onClick={() => setAnimMode('idle')}
            >
              En firme
            </button>
          </div>
        </div>

        <div className="uniforms-stage-wrap" data-testid="uniforms-3d-stage">
          <CharacterStage3D
            placements={placements}
            animationMode={animMode}
            cameraPosition={cameraPosition}
            cameraLookAt={[0, 0.92, 0]}
            cameraFov={34}
            zoomScale={zoomScale}
            onZoomScaleChange={setZoomScale}
            autoRotate
            interactiveOrbit
            interactiveZoom
            showPedestals
            className="uniforms-stage-canvas"
          />
          <span className="uniforms-stage-hint">
            Arrastrá para rotar · Rueda o botones para acercar y alejar zoom
          </span>
        </div>

        <div className="uniforms-cards">
          {UNIFORM_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`uniforms-card${focus === model.id ? ' uniforms-card--active' : ''}`}
              onClick={() => setFocus(focus === model.id ? 'all' : model.id)}
            >
              <span className="uniforms-card-unit">{model.unit}</span>
              <h3 className="uniforms-card-title">{model.title}</h3>
              <p className="uniforms-card-desc">{model.description}</p>
              <span className="uniforms-card-weapon">{model.weaponLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
