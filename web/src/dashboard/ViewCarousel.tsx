import React, { useState } from 'react';
import { Thumb } from './Thumb';
import type { DashView } from './types';

export const VISIBLE_VIEWS = 4;

interface Props {
  views: DashView[];
  selected: string[];
  onSelect: (id: string) => void;
}

/** The views of the scene as thumbnails with their names; the arrows page through them four at a time. */
export function ViewCarousel({ views, selected, onSelect }: Props) {
  const [start, setStart] = useState(0);
  const last = Math.max(views.length - VISIBLE_VIEWS, 0);
  const first = Math.min(start, last);
  const shown = views.slice(first, first + VISIBLE_VIEWS);

  return (
    <div role="group" aria-label="Vistas" className="carousel">
      <button
        type="button"
        className="carousel-arrow"
        aria-label="Vistas anteriores"
        disabled={first === 0}
        onClick={() => setStart(Math.max(first - VISIBLE_VIEWS, 0))}
      >
        ‹
      </button>
      <div className="carousel-items">
        {shown.map((v) => (
          <button
            key={v.id}
            type="button"
            className="carousel-item"
            aria-pressed={selected.includes(v.id)}
            onClick={() => onSelect(v.id)}
          >
            <Thumb spec={v.thumb} />
            <span className="carousel-name">{v.name}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="carousel-arrow"
        aria-label="Vistas siguientes"
        disabled={first >= last}
        onClick={() => setStart(Math.min(first + VISIBLE_VIEWS, last))}
      >
        ›
      </button>
    </div>
  );
}
