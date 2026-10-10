import React, { useCallback, useState } from 'react';
import { sourceLine } from '../ui/SceneShell';
import { SlotPortal } from './SlotPortal';
import { useSlots } from './slots';
import { useDashPrefs } from './prefs';
import { ViewCarousel } from './ViewCarousel';
import { ViewerBar } from './ViewerBar';
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
  notes,
  stage,
  sideHidden = false
}: DashScene) {
  const [choice, setChoice] = useState<string[]>([]);
  const narrativeRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('narrative', el), []);
  const minimapRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('minimap', el), []);
  const layout = useDashPrefs((s) => s.layout);
  const selected = choice.filter((id) => views.some((v) => v.id === id));
  const base = selected.length > 0 ? selected : views[0] ? [views[0].id] : [];
  // the layout is how many views fit at once; a smaller layout keeps the most recently chosen ones
  const shownIds = base.slice(-layout);
  const shown = shownIds.map((id) => views.find((v) => v.id === id)!);

  const select = (id: string) => {
    if (layout === 1) setChoice([id]);
    else if (shownIds.includes(id)) {
      if (shownIds.length > 1) setChoice(shownIds.filter((x) => x !== id));
    } else setChoice([...shownIds, id].slice(-layout));
  };
  const source = sourceLine(sources, retrievedAt, dateLabel);

  if (stage) {
    return (
      <div className={`dash dash--stage${sideHidden ? ' dash--side-hidden' : ''}`}>
        <div className="dash-stage">{stage}</div>
        <section aria-label="Indicadores" className="dash-tiles dash-tiles--strip">
          <h2 className="visually-hidden">Indicadores</h2>
          {tiles}
        </section>
        <aside className="dash-side">
          <div className="dash-minimap" data-slot="minimap" ref={minimapRef} />
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
        <ViewCarousel views={views} selected={shownIds} onSelect={select} />
        <ViewerBar />
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
