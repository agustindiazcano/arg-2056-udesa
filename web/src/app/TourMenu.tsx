import React, { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { SECTION_LABELS } from '../content/sectionLabels';
import { menuItems } from '../tour/menuItems';

/** The little arrow that says the tab opens a menu. */
function Chevron() {
  return (
    <svg className="tour-menu-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}

/**
 * The «Hacia el 2056» tab with a dropdown of the slides of the Recorrido, slide 0 («Índice») included. It opens on hover and with the
 * Down arrow on the tab (focusing the tab does not open it: the Tab key must walk the controls of the page); a click on the tab opens the Recorrido and pins the menu open (touch screens have no hover) and a second click closes it.
 */
export function TourMenu() {
  const section = useStore((s) => s.section);
  const tourStep = useStore((s) => s.tourStep);
  const dispatch = useStore((s) => s.dispatch);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned;
  const items = useMemo(() => menuItems(), []);
  const close = () => {
    setHover(false);
    setPinned(false);
  };
  return (
    <div
      role="presentation"
      className="tour-menu"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={close}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        role="tab"
        className="tab"
        aria-selected={section === 'tour'}
        aria-haspopup="menu"
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setPinned(true);
          }
        }}
        onClick={() => {
          dispatch({ type: 'setSection', section: 'tour' });
          if (open) close();
          else setPinned(true);
        }}
      >
        {SECTION_LABELS.tour}
        <Chevron />
      </button>
      {open && (
        <ul role="menu" aria-label="Diapositivas" className="tour-menu-list">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="tour-menu-item"
                aria-current={section === 'tour' && tourStep === item.id ? 'step' : undefined}
                onClick={() => {
                  dispatch({ type: 'setSection', section: 'tour' });
                  dispatch({ type: 'tourSet', step: item.id });
                  close();
                }}
              >
                {`${item.number} · ${item.title}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
