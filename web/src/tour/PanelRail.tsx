import React from 'react';

export type PanelIcon = 'line' | 'bars' | 'map' | 'table' | 'treemap' | 'grid';

export interface PanelItem<K extends string> {
  key: K;
  title: string;
  icon: PanelIcon;
}

const PATHS: Record<PanelIcon, string> = {
  line: 'M2 13 L6 8 L9 10 L14 3',
  bars: 'M3 14 V8 M8 14 V3 M13 14 V10',
  map: 'M2 4 L6 2 L10 4 L14 2 V12 L10 14 L6 12 L2 14 Z',
  table: 'M2 3 H14 V13 H2 Z M2 7 H14 M7 3 V13',
  treemap: 'M2 2 H9 V9 H2 Z M9 2 H14 V6 H9 M9 9 H14 V14 H2 V9',
  grid: 'M2 2 H7 V7 H2 Z M9 2 H14 V7 H9 Z M2 9 H7 V14 H2 Z M9 9 H14 V14 H9 Z'
};

/** The attributes of a panel of a slide: on a short screen the panels that are not the chosen one are hidden. */
export function panelAttrs(compact: boolean, active: string, key: string): { 'data-panel': string; 'data-hidden'?: 'true' } {
  return compact && active !== key ? { 'data-panel': key, 'data-hidden': 'true' } : { 'data-panel': key };
}

/**
 * On a short laptop screen the panels of a slide do not fit together: this is a row of small buttons (a drawing and a title) that picks
 * the one shown big. It renders nothing on a tall screen.
 */
export function PanelRail<K extends string>({ compact, items, active, onPick }: { compact: boolean; items: ReadonlyArray<PanelItem<K>>; active: K; onPick: (key: K) => void }) {
  if (!compact) return null;
  return (
    <div role="group" aria-label="Gráficos de esta diapositiva" className="panel-rail">
      {items.map((item) => (
        <button key={item.key} type="button" className="panel-rail-btn" aria-pressed={item.key === active} onClick={() => onPick(item.key)}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path d={PATHS[item.icon]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{item.title}</span>
        </button>
      ))}
    </div>
  );
}
