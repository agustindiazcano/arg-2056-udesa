import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../charts/format';
import { useQualityOptional } from '../../runtime/CapabilityProvider';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import { BATTLE_NOTICE, BATTLE_UNITS } from './battleField';
import type { BattleUnit } from './battleField';
import { createDiorama } from './diorama/buildDiorama';
import type { Diorama } from './diorama/buildDiorama';
import { DEFAULT_VIEW, DIORAMA_VIEWS } from './diorama/views';
import type { DioramaViewId } from './diorama/views';

const BATTLE_DATE = '1817-02-12';
const number = new Intl.NumberFormat('es-AR');

function Flag({ royalist }: { royalist: boolean }) {
  return royalist ? (
    <span className="andes-flag andes-flag--royal andes-flag--inline" role="img" aria-label="Bandera realista (cruz de Borgoña)">
      <i />
    </span>
  ) : (
    <span className="andes-flag andes-flag--patriot andes-flag--inline" role="img" aria-label="Bandera del Ejército de los Andes">
      <i />
      <i />
    </span>
  );
}

function Side({ title, royalist, units }: { title: string; royalist: boolean; units: readonly BattleUnit[] }) {
  const men = units.reduce((sum, u) => sum + u.men, 0);
  return (
    <section className="andes-b3d-side" aria-label={title}>
      <h3>
        <Flag royalist={royalist} />
        {title}
      </h3>
      <ul>
        {units.map((u) => (
          <li key={u.id}>
            <strong>{u.name}</strong>
            <span>unos {number.format(u.men)}</span>
            <small>{u.note}</small>
          </li>
        ))}
      </ul>
      <p className="andes-b3d-total">
        {royalist ? `Suman unos ${number.format(men)} en las unidades que dan las fuentes (el total, de 2.080 a 2.500)` : `Suman unos ${number.format(men)} (el total, unos 3.500)`}
      </p>
    </section>
  );
}

/**
 * The battle of Chacabuco as a diorama, full screen: a made-up (procedural) field on a block of earth under the sky, painted with small repeating textures, with the units of
 * both sides as figures facing each other and San Martín and his officers watching through a telescope from a far hill. It does not use the map, so the big map is taken off the
 * screen while this is open. The positions are schematic (see `battleField.ts`). «Salir de la batalla» or Escape goes back to the map.
 */
export function BattleScene({ onClose }: { onClose: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dioramaRef = useRef<Diorama | null>(null);
  const quality = useQualityOptional();
  const reduced = useReducedMotion();
  const [problem, setProblem] = useState<string | null>(null);
  const [view, setView] = useState<DioramaViewId>(DEFAULT_VIEW.id);
  const [legendOpen, setLegendOpen] = useState(true);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const tier = quality?.tier ?? 'medium';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    try {
      const diorama = createDiorama(host, { quality: tier, reducedMotion: reduced });
      dioramaRef.current = diorama;
      return () => {
        diorama.dispose();
        dioramaRef.current = null;
      };
    } catch {
      setProblem('No se pudo crear la escena 3D en este dispositivo (hace falta WebGL). Las unidades se listan a la derecha.');
      return undefined;
    }
  }, [tier, reduced]);

  const go = (id: DioramaViewId) => {
    setView(id);
    dioramaRef.current?.go(id);
  };

  const patriots = BATTLE_UNITS.filter((u) => u.side === 'patriot');
  const royalists = BATTLE_UNITS.filter((u) => u.side === 'royalist');

  // in the body, so that no transform or filter of the scene changes what «the whole screen» is
  return createPortal(
    <div className="andes-b3d" role="dialog" aria-label="Batalla de Chacabuco, recreación en 3D">
      <div className="andes-b3d-canvas" ref={hostRef} />
      {problem && <p className="andes-b3d-problem">{problem}</p>}

      <header className="andes-b3d-head andes-glass">
        <div>
          <time dateTime={BATTLE_DATE}>{formatDate(BATTLE_DATE)}</time>
          <h2>Batalla de Chacabuco</h2>
        </div>
        <span className="andes-b3d-tag">Recreación</span>
        <button type="button" className="chip" onClick={onClose}>
          Salir de la batalla
        </button>
      </header>

      <div className="andes-b3d-views andes-glass" role="group" aria-label="Vistas de la batalla">
        {DIORAMA_VIEWS.map((v) => (
          <button key={v.id} type="button" className="chip" aria-pressed={view === v.id} onClick={() => go(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      <aside className="andes-b3d-legend andes-glass" aria-label="Fuerzas en la batalla">
        <button type="button" className="chip andes-b3d-legend-toggle" aria-expanded={legendOpen} onClick={() => setLegendOpen(!legendOpen)}>
          {legendOpen ? 'Ocultar fuerzas' : 'Mostrar fuerzas'}
        </button>
        {legendOpen && (
          <>
            <Side title="Ejército de los Andes" royalist={false} units={patriots} />
            <Side title="Fuerzas realistas" royalist units={royalists} />
          </>
        )}
      </aside>

      <p className="andes-b3d-notice andes-glass" role="note">
        {BATTLE_NOTICE}
      </p>
    </div>,
    document.body
  );
}
