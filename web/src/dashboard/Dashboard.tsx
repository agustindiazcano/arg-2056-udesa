import React, { useCallback, useState } from 'react';
import { sourceLine } from '../ui/SceneShell';
import { SlotPortal } from './SlotPortal';
import { useSlots } from './slots';
import { ViewCarousel } from './ViewCarousel';
import { Viewer } from './Viewer';
import type { DashScene } from './types';
import './dashboard.css';

/**
 * The one-screen layout of every scene: the title and the names on the left, the carousel of views and the viewer in the
 * middle, the indicators and the story on the right. Nothing scrolls; the scene filters go to the bottom bar.
 */
export function Dashboard({
  title,
  subtitle,
  legend,
  sources,
  retrievedAt,
  dateLabel,
  views,
  rail,
  tiles,
  side,
  filters,
  notes
}: DashScene) {
  const [choice, setChoice] = useState<string[]>([]);
  const narrativeRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('narrative', el), []);
  const selected = choice.filter((id) => views.some((v) => v.id === id));
  const shownIds = selected.length > 0 ? selected : views[0] ? [views[0].id] : [];
  const shown = views.filter((v) => shownIds.includes(v.id));
  const source = sourceLine(sources, retrievedAt, dateLabel);

  return (
    <div className="dash">
      <aside className="dash-rail">
        <header className="scene-head">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        {legend && legend.length > 0 && (
          <ul className="legend">
            {legend.map((item) => (
              <li key={item.label} className={`legend-item legend-item--${item.tone}`}>
                {item.label}
              </li>
            ))}
          </ul>
        )}
        {notes}
        {rail && <div className="dash-names">{rail}</div>}
        {source && <p className="scene-source">{source}</p>}
      </aside>

      <div className="dash-main">
        <ViewCarousel views={views} selected={shownIds} onSelect={(id) => setChoice([id])} />
        <Viewer views={shown} />
      </div>

      <aside className="dash-side">
        <section aria-label="Indicadores" className="dash-tiles">
          <h2 className="panel-title">Indicadores</h2>
          {tiles}
        </section>
        <div className="dash-narrative" data-slot="narrative" ref={narrativeRef} />
        {side}
      </aside>

      {filters && (
        <SlotPortal slot="filters">
          <div className="dash-filters">{filters}</div>
        </SlotPortal>
      )}
    </div>
  );
}
