import React, { useEffect, useState } from 'react';
import { clampView, formatKeyframes, parseKeyframes, roundView } from './cameraKeyframes';
import type { CameraApi, CameraKeyframe, CameraView } from './cameraKeyframes';
import './cameraTuner.css';

const STORAGE_KEY = 'andes-camera-keyframes';

const FIELDS: ReadonlyArray<{ key: keyof CameraView; label: string; step: string }> = [
  { key: 'zoom', label: 'Zoom', step: '0.05' },
  { key: 'pitch', label: 'Inclinación', step: '1' },
  { key: 'bearing', label: 'Giro', step: '1' },
  { key: 'lon', label: 'Longitud', step: '0.001' },
  { key: 'lat', label: 'Latitud', step: '0.001' }
];

type Draft = Record<keyof CameraView, string>;

const toDraft = (v: CameraView): Draft => ({ lon: String(v.lon), lat: String(v.lat), zoom: String(v.zoom), pitch: String(v.pitch), bearing: String(v.bearing) });

function loadFrames(): CameraKeyframe[] {
  try {
    return parseKeyframes(window.localStorage.getItem(STORAGE_KEY) ?? '');
  } catch {
    return [];
  }
}

function saveFrames(frames: readonly CameraKeyframe[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, formatKeyframes(frames));
  } catch {
    // no storage (private window): the points live while the page does
  }
}

interface CameraTunerProps {
  api: { current: CameraApi | null };
  /** the camera as it is now (it follows the map while the reader moves it) */
  view: CameraView;
  /** the day of the campaign, saved with each point */
  day: number;
  /** called when the panel moves the camera, so the scene leaves its camera mode */
  onGo: () => void;
}

/**
 * A temporary tool to build the camera tour: the five numbers of the camera, live while the map is moved by hand; type numbers and go to them;
 * save the camera as a named point and copy all of them as JSON to hand over. Not a modal: the map stays usable under it.
 */
export function CameraTuner({ api, view, day, onGo }: CameraTunerProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(roundView(view)));
  const [dirty, setDirty] = useState(false);
  const [frames, setFrames] = useState<CameraKeyframe[]>(loadFrames);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [shown, setShown] = useState('');

  // the numbers follow the map unless the reader is typing
  useEffect(() => {
    if (!dirty) setDraft(toDraft(roundView(view)));
  }, [view, dirty]);

  const parsed = (): CameraView => {
    const typed: CameraView = { lon: Number(draft.lon), lat: Number(draft.lat), zoom: Number(draft.zoom), pitch: Number(draft.pitch), bearing: Number(draft.bearing) };
    return roundView(clampView(typed, view));
  };

  const go = (target: CameraView, ms?: number) => {
    onGo();
    api.current?.set(target, ms);
    setDirty(false);
  };

  const save = () => {
    const now = roundView(api.current?.get() ?? view);
    const label = name.trim() || `Punto ${frames.length + 1}`;
    const next = [...frames, { name: label, day: Math.round(day * 10) / 10, ...now }];
    setFrames(next);
    saveFrames(next);
    setName('');
    setNote('');
  };

  const remove = (index: number) => {
    const next = frames.filter((_, i) => i !== index);
    setFrames(next);
    saveFrames(next);
  };

  const copy = async () => {
    const text = formatKeyframes(frames);
    try {
      await navigator.clipboard.writeText(text);
      setNote('Copiado.');
      setShown('');
    } catch {
      setNote('No se pudo copiar solo: copialo de acá.');
      setShown(text);
    }
  };

  return (
    <section className="andes-camtool andes-glass" aria-label="Cámara en números">
      <h2 className="andes-camtool-title">Cámara en números</h2>
      <p className="andes-camtool-hint">Mové el mapa con el mouse y mirá los valores, o escribí números. Herramienta temporal para armar el tour.</p>
      <div className="andes-camtool-fields">
        {FIELDS.map(({ key, label, step }) => (
          <label key={key} htmlFor={`andes-cam-${key}`} className="andes-camtool-field">
            <span>{label}</span>
            <input
              id={`andes-cam-${key}`}
              type="number"
              step={step}
              value={draft[key]}
              onChange={(e) => {
                setDirty(true);
                setDraft({ ...draft, [key]: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') go(parsed(), 600);
              }}
            />
          </label>
        ))}
      </div>
      <div className="andes-camtool-row">
        <button type="button" className="chip" onClick={() => go(parsed(), 600)}>
          Ir a estos valores
        </button>
      </div>

      <div className="andes-camtool-row">
        <label htmlFor="andes-cam-name" className="andes-camtool-name">
          <span>Nombre del punto</span>
          <input id="andes-cam-name" type="text" value={name} placeholder={`Punto ${frames.length + 1}`} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="button" className="chip" onClick={save}>
          Guardar punto
        </button>
      </div>

      {frames.length > 0 && (
        <ul className="andes-camtool-list" aria-label="Puntos guardados">
          {frames.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <div className="andes-camtool-frame">
                <strong>{f.name}</strong>
                <span>
                  zoom {f.zoom} · inclinación {f.pitch}° · giro {f.bearing}° · día {f.day}
                </span>
              </div>
              <button type="button" className="chip" aria-label={`Ir a ${f.name}`} onClick={() => go(f, 1200)}>
                Ir
              </button>
              <button type="button" className="chip" aria-label={`Borrar ${f.name}`} onClick={() => remove(i)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="andes-camtool-row">
        <button type="button" className="chip" disabled={frames.length === 0} onClick={() => void copy()}>
          Copiar JSON
        </button>
        <span role="status" className="andes-camtool-note">
          {note}
        </span>
      </div>
      {shown && <textarea className="andes-camtool-json" readOnly value={shown} rows={6} aria-label="JSON de los puntos" onFocus={(e) => e.currentTarget.select()} />}
    </section>
  );
}
