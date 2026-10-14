import React, { useId, useState } from 'react';

export interface ChartTab {
  id: string;
  label: string;
  /** called only while the tab is open, so a closed tab costs nothing */
  render: () => React.ReactNode;
}

/** Tabs over charts (ARIA tabs pattern: arrows, Home and End move; one tab is in the tab order). Works uncontrolled or with `value`. */
export function TabbedChart({
  label,
  tabs,
  value,
  onChange
}: {
  label: string;
  tabs: ReadonlyArray<ChartTab>;
  value?: string;
  onChange?: (id: string) => void;
}) {
  const base = useId();
  const [inner, setInner] = useState(tabs[0]?.id ?? '');
  const current = tabs.find((t) => t.id === (value ?? inner)) ?? tabs[0];
  if (!current) return null;
  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = `${base}-panel`;
  const open = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? last : -1;
    if (next < 0) return;
    event.preventDefault();
    const target = tabs[next]!;
    open(target.id);
    document.getElementById(tabId(target.id))?.focus();
  };
  return (
    <div className="tabbed-chart">
      <div role="tablist" aria-label={label} className="tabbed-chart-tabs">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            className="chip"
            aria-selected={tab.id === current.id}
            aria-controls={tab.id === current.id ? panelId : undefined}
            tabIndex={tab.id === current.id ? 0 : -1}
            onClick={() => open(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(current.id)} className="tabbed-chart-panel">
        {current.render()}
      </div>
    </div>
  );
}
