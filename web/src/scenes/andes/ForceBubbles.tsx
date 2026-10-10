import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { forceColor } from './columns';
import { ENEMY_ID, FORCE_FACTS, joinedLabel } from './forces';
import type { Bubble } from './forces';
import { popPosition } from './popPosition';

interface ForceBubblesProps {
  /** the map the bubbles float over */
  map: MapLibreMap | null;
  items: readonly Bubble[];
  /** false while something else names the forces (the spotlight) */
  visible: boolean;
}

/** The space the details keep free of the edges of the map: the top has the title, the buttons and the indicators over it. */
const MARGINS = { top: 118, right: 16, bottom: 16, left: 16 };

/**
 * A little bubble over each force with its name (Fuerza principal, Columna de Uspallata...), and a flag over it. Hover it, focus it or click it and its details
 * open in a card kept inside the map, toward its center (a far force is near the top, in the sky, where a card would be cut): commanders, men and
 * infantry, units and what it was for. Forces that march together share one bubble. The bubbles are HTML over the map (so no 3D model hides them) and follow
 * their force on every frame of the map.
 */
export function ForceBubbles({ map, items, visible }: ForceBubblesProps) {
  const bubbleRefs = useRef(new Map<string, HTMLDivElement>());
  const popRefs = useRef(new Map<string, HTMLDivElement>());
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const hoverTimer = useRef(0);
  const active = open ?? hover;
  const activeRef = useRef(active);
  activeRef.current = active;

  const place = useCallback(() => {
    if (!map) return;
    const canvas = map.getCanvas();
    const area = { width: canvas.clientWidth, height: canvas.clientHeight };
    // the cards stay to the right of the panel of the left (the dates, the events, the data of a force), whatever its height
    const panel = document.querySelector('.andes-list');
    const margins = panel ? { ...MARGINS, left: Math.max(MARGINS.left, panel.getBoundingClientRect().right - canvas.getBoundingClientRect().left + 12) } : MARGINS;
    for (const item of itemsRef.current) {
      const p = map.project([item.lon, item.lat]);
      const el = bubbleRefs.current.get(item.id);
      if (el) el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
      const pop = popRefs.current.get(item.id);
      if (pop && activeRef.current === item.id) {
        const at = popPosition({ x: p.x, y: p.y }, { width: pop.offsetWidth, height: pop.offsetHeight }, area, margins);
        pop.style.transform = `translate(${at.x}px, ${at.y}px)`;
      }
    }
  }, [map]);

  useEffect(() => {
    if (!map) return undefined;
    map.on('render', place);
    place();
    return () => {
      map.off('render', place);
    };
  }, [map, place]);

  useEffect(() => {
    place();
  }, [items, active, place]);

  const enter = (id: string) => {
    window.clearTimeout(hoverTimer.current);
    setHover(id);
  };
  const leave = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHover(null), 160);
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  return (
    <div className="andes-bubbles" hidden={!visible}>
      {items.map((item) => {
        const lines = joinedLabel(item.ids).split('\n');
        const name = lines[0] ?? '';
        const facts = item.ids.map((id) => FORCE_FACTS[id]).filter(Boolean);
        const isOpen = open === item.id;
        const showPop = active === item.id;
        return (
          <React.Fragment key={item.id}>
            <div
              ref={(el) => {
                if (el) bubbleRefs.current.set(item.id, el);
                else bubbleRefs.current.delete(item.id);
              }}
              className="andes-bubble"
            >
              <div className="andes-bubble-card" onMouseEnter={() => enter(item.id)} onMouseLeave={leave}>
                {item.id === ENEMY_ID ? (
                  <span className="andes-flag andes-flag--royal" role="img" aria-label="Bandera realista (cruz de Borgoña)">
                    <i />
                  </span>
                ) : (
                  <span className="andes-flag andes-flag--patriot" role="img" aria-label="Bandera del Ejército de los Andes">
                    <i />
                    <i />
                  </span>
                )}
                <button
                  type="button"
                  className="andes-bubble-name"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  onFocus={() => enter(item.id)}
                  onBlur={leave}
                >
                  <span className="andes-bubble-dots" aria-hidden="true">
                    {item.ids.map((id) => (
                      <span key={id} className="andes-force-dot" style={{ background: forceColor(id) }} />
                    ))}
                  </span>
                  {name}
                </button>
              </div>
            </div>
            <div
              ref={(el) => {
                if (el) popRefs.current.set(item.id, el);
                else popRefs.current.delete(item.id);
              }}
              className="andes-bubble-pop"
              hidden={!showPop}
              onMouseEnter={() => enter(item.id)}
              onMouseLeave={leave}
            >
              <header className="andes-bubble-head">
                <p className="andes-bubble-title">{name}</p>
                <button
                  type="button"
                  className="andes-bubble-close"
                  aria-label={`Cerrar los datos de ${name}`}
                  onClick={() => {
                    window.clearTimeout(hoverTimer.current);
                    setOpen(null);
                    setHover(null);
                  }}
                >
                  ×
                </button>
              </header>
              <p className="andes-bubble-section">Mando</p>
              <p>{lines[1]}</p>
              <p className="andes-bubble-section">Fuerzas</p>
              <p>{lines[2]}</p>
              <p className="andes-bubble-section">Unidades</p>
              <p>{lines[3]}</p>
              {facts.length === 1 && facts[0] && <p className="andes-bubble-goal">{facts[0].goal}</p>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
