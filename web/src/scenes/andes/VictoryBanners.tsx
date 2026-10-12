import React, { useCallback, useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { VictoryBanner } from './effects';

interface VictoryBannersProps {
  /** the map the banners float over */
  map: MapLibreMap | null;
  items: readonly VictoryBanner[];
  /** false while something else names the places (the spotlight) */
  visible: boolean;
}

/**
 * A little banner over each place the main force has won or passed (a combat or the battle with a patriot outcome): the patriot flag and «Victoria patriota».
 * HTML over the map, following the place on every frame, and it lets the mouse through to the map.
 */
export function VictoryBanners({ map, items, visible }: VictoryBannersProps) {
  const refs = useRef(new Map<string, HTMLDivElement>());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const place = useCallback(() => {
    if (!map) return;
    for (const item of itemsRef.current) {
      const el = refs.current.get(item.id);
      if (!el) continue;
      const p = map.project([item.lon, item.lat]);
      el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
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
  }, [items, place]);

  return (
    <div className="andes-victories" hidden={!visible}>
      {items.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) refs.current.set(item.id, el);
            else refs.current.delete(item.id);
          }}
          className="andes-victory"
        >
          <div className="andes-victory-card">
            <span className="andes-flag andes-flag--patriot" role="img" aria-label="Bandera del Ejército de los Andes">
              <i />
              <i />
            </span>
            <span className="andes-victory-text">
              <strong>{item.text}</strong>
              <small>{item.name}</small>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
