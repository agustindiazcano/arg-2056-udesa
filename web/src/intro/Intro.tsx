import React, { useEffect, useMemo, useRef, useState } from 'react';
import data from './provinces.json';
import { boxStyle, lightStep, pathBox, type Box } from './layout';
import { visibleSections } from '../content/sectionLabels';
import type { Section } from '../types/scene';
import './intro.css';
import { INSTITUTIONS } from '../ui/institutions';
import { withMalvinas, type IntroShape } from './malvinasPath';

const LAYERS = 3; // 2 sides and the top: fewer composited layers per province
// speed of the lights (0.8): the prototype waits (350 to 1050 ms) / speed between changes
const LIGHT_SPEED = 0.8;
const APPEAR_MS = 2300; // the provinces appear upright and centered, then the view tilts

interface Props {
  /** The section to open: the Enter key opens the Andes. */
  onStart: (section: Section) => void;
}

// the 24 provinces of the sheet and, after them, the illustrative Malvinas
const provinces = withMalvinas(data.provinces);

const SAN_JUAN_ID = provinces.find((p) => p.name.toLowerCase().includes('san juan'))?.id ?? 9;
const MENDOZA_ID = provinces.find((p) => p.name.toLowerCase().includes('mendoza'))?.id ?? 10;

/** The ways in: straight to a section (the Data Dashboard only when it is switched on: it is deprecated). */
const ALL_SHORTCUTS: ReadonlyArray<{ section: Section; label: string }> = [
  { section: 'andes', label: 'Cruce de los Andes' },
  { section: 'tour', label: 'Hacia el 2056' },
  { section: 'dashboard', label: 'Data Dashboard' }
];

function viewBox(b: Box): string {
  return [b.x, b.y, b.w, b.h].map((v) => v.toFixed(1)).join(' ');
}

/** Intro screen: Argentina as a tilted, slowly turning map whose provinces light up at random, and the buttons that open a section. */
export function Intro({ onStart }: Props) {
  const shortcuts = useMemo(() => {
    const shown = new Set(visibleSections(ALL_SHORTCUTS.map((s) => s.section)));
    return ALL_SHORTCUTS.filter((s) => shown.has(s.section));
  }, []);
  const reduced = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [tilted, setTilted] = useState(reduced);
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set());
  const [hoveredShortcut, setHoveredShortcut] = useState<Section | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<IntroShape | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const litRef = useRef(lit);
  litRef.current = lit;

  const isLit = (id: number): boolean => {
    if (hoveredShortcut === 'tour') return true;
    if (hoveredShortcut === 'andes') return id === SAN_JUAN_ID || id === MENDOZA_ID;
    if (hoveredProvince?.id === id) return true;
    return lit.has(id);
  };

  const isGold = (_id: number): boolean => {
    return hoveredShortcut === 'tour';
  };

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
    <div className="intro" data-tilted={tilted} onMouseMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}>
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
            {shapes.map((s, index) => {
              const province = provinces[index]!;
              const litUp = isLit(s.id);
              const gold = isGold(s.id);
              const isHovered = hoveredProvince?.id === s.id;
              return (
                <div
                  key={s.id}
                  className={`intro-prov${litUp ? ' lit' : ''}${gold ? ' gold' : ''}${isHovered ? ' hovered' : ''}`}
                  style={{ ...s.top, '--d': `${s.delay}ms` } as React.CSSProperties}
                  data-province-id={s.id}
                  data-province-name={province.name}
                  onMouseEnter={(e) => {
                    setHoveredProvince(province);
                    if (e.clientX || e.clientY) setPointer({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredProvince((cur) => (cur?.id === s.id ? null : cur))}
                >
                  {Array.from({ length: LAYERS }, (_, i) => (
                    <svg
                      key={i}
                      className={`intro-layer ${i === LAYERS - 1 ? 'top' : 'side'}`}
                      style={{ '--i': i, '--t': (i / (LAYERS - 1)).toFixed(3) } as React.CSSProperties}
                      viewBox={s.topView}
                      onMouseEnter={i === LAYERS - 1 ? (e) => {
                        setHoveredProvince(province);
                        if (e.clientX || e.clientY) setPointer({ x: e.clientX, y: e.clientY });
                      } : undefined}
                      onMouseLeave={i === LAYERS - 1 ? () => setHoveredProvince((cur) => (cur?.id === s.id ? null : cur)) : undefined}
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
              );
            })}
          </div>
        </div>
      </div>

      <main className="intro-copy">
        <h1 className="intro-title">
          <span className="a">Argentina</span> <span className="n">2056</span>
        </h1>
        <div className="intro-text">
          <p className="intro-sub">Del Cruce de los Andes a la Cuarta Revolución Industrial: el desafío estratégico de 1817 como faro para el presente. Un análisis de los recursos de Argentina en 2026 y una proyección de su desarrollo hacia 2056 frente al impacto de la Inteligencia Artificial en la economía.</p>
          <p className="intro-sub">Es una ventana al inicio de la lucha por nuestra libertad política y, a la vez, una hoja de ruta desde la actualidad hacia el desarrollo económico de las próximas tres décadas, explorada a través de datos, escenarios interactivos y modelos de incertidumbre.</p>
        </div>
        <div role="group" aria-label="Ir directo a" className="intro-shortcuts">
          {shortcuts.map(({ section, label }) => (
            <button
              key={section}
              type="button"
              className="intro-start"
              onClick={() => onStart(section)}
              onMouseEnter={() => setHoveredShortcut(section)}
              onMouseLeave={() => setHoveredShortcut(null)}
              onFocus={() => setHoveredShortcut(section)}
              onBlur={() => setHoveredShortcut(null)}
            >
              {label}
            </button>
          ))}
        </div>
      </main>
      </div>
      <div className="intro-vignette" aria-hidden="true" />

      {hoveredProvince && (
        <div
          className="intro-tooltip"
          style={pointer ? { left: `${pointer.x}px`, top: `${pointer.y}px` } : undefined}
          role="tooltip"
          aria-hidden="true"
        >
          {hoveredProvince.name}
        </div>
      )}

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
