import React, { useEffect, useMemo, useRef, useState } from 'react';
import data from './provinces.json';
import { boxStyle, lightStep, pathBox, type Box } from './layout';
import type { Section } from '../types/scene';
import './intro.css';

const LAYERS = 3; // 2 sides and the top: fewer composited layers per province
// speed of the lights (0.8): the prototype waits (350 to 1050 ms) / speed between changes
const LIGHT_SPEED = 0.8;
const APPEAR_MS = 2300; // the provinces appear upright and centered, then the view tilts

interface Props {
  /** The section to open: Comenzar and the Enter key open the Andes. */
  onStart: (section: Section) => void;
}

const provinces = data.provinces;

/** The ways in under Comenzar: straight to a section. */
const SHORTCUTS: ReadonlyArray<{ section: Section; label: string }> = [
  { section: 'andes', label: 'Cruce de los Andes' },
  { section: 'tour', label: 'Recorrido al 2056' },
  { section: 'dashboard', label: 'Data Dashboard' }
];

/** The institutions behind the project; the logos live in public/images. */
const INSTITUTIONS: ReadonlyArray<{ name: string; src: string; href: string }> = [
  { name: 'Data Science Lab, Universidad de San Andrés', src: '/images/data-science-lab-udesa.png', href: 'https://www.udesa.edu.ar/data-science-lab' },
  { name: 'Contar con Datos', src: '/images/contar-con-datos-logo-udesa.webp', href: 'https://www.udesa.edu.ar/contar-con-datos' },
  {
    name: 'Secretaría de Innovación, Ciencia y Tecnología',
    src: '/images/secretaria-innovacion-ciencia-tecnologia-recortado.png',
    href: 'https://www.argentina.gob.ar/jefatura/innovacion-ciencia-y-tecnologia'
  }
];

function viewBox(b: Box): string {
  return [b.x, b.y, b.w, b.h].map((v) => v.toFixed(1)).join(' ');
}

/** Intro screen: Argentina as a tilted, slowly turning map whose provinces light up at random, and a Comenzar button. */
export function Intro({ onStart }: Props) {
  const reduced = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [tilted, setTilted] = useState(reduced);
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set());
  const litRef = useRef(lit);
  litRef.current = lit;

  const shapes = useMemo(
    () =>
      provinces.map((p) => {
        const top = pathBox(p.d, 3);
        const glow = pathBox(p.d, 28);
        return {
          id: p.id,
          top: boxStyle(top, data.w, data.h),
          topView: viewBox(top),
          glow: boxStyle(glow, data.w, data.h),
          glowView: viewBox(glow),
          delay: Math.floor(Math.random() * 900)
        };
      }),
    []
  );

  // flat first, then it tilts into 3D
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setTilted(true), APPEAR_MS);
    return () => clearTimeout(t);
  }, [reduced]);

  // once the map is tilted the provinces light up and go out at random; under reduced motion a fixed few stay lit
  useEffect(() => {
    if (reduced) {
      setLit(new Set([1, 5, 11, 16, 22]));
      return;
    }
    if (!tilted) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const step = lightStep(litRef.current, provinces.length, Math.random);
      if (step) {
        const next = new Set(litRef.current);
        if (step.on) next.add(step.id);
        else next.delete(step.id);
        setLit(next);
      }
      timer = setTimeout(tick, (350 + Math.random() * 700) / LIGHT_SPEED);
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [reduced, tilted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // on a focused button, Enter is that button's own click
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) onStart('andes');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="intro" data-tilted={tilted}>
      <svg className="intro-defs" aria-hidden="true" focusable="false">
        <defs>
          {provinces.map((p) => (
            <path key={p.id} id={`intro-pr${p.id}`} d={p.d} />
          ))}
        </defs>
      </svg>

      <div className="intro-frame">
      <div className="intro-stage" aria-hidden="true">
        <div className="intro-cam">
          <div className="intro-floor" />
          <div className="intro-map">
            {shapes.map((s) => (
              <div key={s.id} className={`intro-prov${lit.has(s.id) ? ' lit' : ''}`} style={{ ...s.top, '--d': `${s.delay}ms` } as React.CSSProperties}>
                {Array.from({ length: LAYERS }, (_, i) => (
                  <svg
                    key={i}
                    className={`intro-layer ${i === LAYERS - 1 ? 'top' : 'side'}`}
                    style={{ '--i': i, '--t': (i / (LAYERS - 1)).toFixed(3) } as React.CSSProperties}
                    viewBox={s.topView}
                  >
                    <use href={`#intro-pr${s.id}`} />
                  </svg>
                ))}
                <svg className="intro-layer glow" style={{ '--i': LAYERS - 1.15, ...s.glow } as React.CSSProperties} viewBox={s.glowView}>
                  {[1, 2, 3].map((k) => (
                    <use key={k} className={`g${k}`} href={`#intro-pr${s.id}`} />
                  ))}
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="intro-copy">
        <h1 className="intro-title">
          <span className="a">Argentina</span> <span className="n">2056</span>
        </h1>
        <p className="intro-sub">Del Cruce de los Andes a la Cuarta Revolución Industrial: El desafío estratégico de 1817 como faro para el presente. Un análisis de nuestros recursos en 2026 y una proyección de nuestro desarrollo a 30 años frente al impacto de la Inteligencia Artificial en la economía.</p>
        <button type="button" className="intro-start" onClick={() => onStart('andes')}>
          Comenzar
        </button>
        <div role="group" aria-label="Ir directo a" className="intro-shortcuts">
          {SHORTCUTS.map(({ section, label }) => (
            <button key={section} type="button" className="intro-shortcut" onClick={() => onStart(section)}>
              {label}
            </button>
          ))}
        </div>
      </main>
      </div>
      <div className="intro-vignette" aria-hidden="true" />

      <footer className="intro-footer">
        <ul className="intro-logos" aria-label="Instituciones">
          {INSTITUTIONS.map(({ name, src, href }) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <img src={src} alt={name} />
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
