import React from 'react';
import type { AndesEvent } from './data';

/** The name as the list shows it: without the clarification in parentheses («Curimón (reunión con ...)» is «Curimón»). */
export function listName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

/** The flag of the Army of the Andes: white on the top half, sky blue on the bottom half. */
function PatriotFlag() {
  return (
    <svg className="andes-event-flag" viewBox="0 0 24 16" role="img" aria-label="Bandera del Ejército de los Andes">
      <rect width="24" height="8" fill="#ffffff" />
      <rect y="8" width="24" height="8" fill="#75aadb" />
    </svg>
  );
}

/** The Spanish imperial flag: white with a red saltire (an X). */
function RoyalistFlag() {
  return (
    <svg className="andes-event-flag" viewBox="0 0 24 16" role="img" aria-label="Bandera imperial española">
      <rect width="24" height="16" fill="#ffffff" />
      <path d="M2 0L24 14M22 0L0 14" stroke="#c8102e" strokeWidth="2.4" />
    </svg>
  );
}

/** The events of the campaign as buttons: choosing one selects it. The combats are red, with the two flags. */
export function EventList({
  events,
  selectedId,
  onSelect
}: {
  events: readonly AndesEvent[];
  selectedId: string | null;
  onSelect: (id: string, opener: HTMLElement) => void;
}) {
  return (
    <ul className="andes-events" aria-label="Eventos de la campaña">
      {events.map((e) => {
        const combat = e.outcome !== undefined;
        return (
          <li key={e.id}>
            <button
              type="button"
              className={combat ? 'chip andes-event--combat' : 'chip'}
              aria-pressed={e.id === selectedId}
              onClick={(ev) => onSelect(e.id, ev.currentTarget)}
            >
              <span className="andes-day">Día {e.day_of_campaign}</span> {listName(e.name)}
              {combat ? (
                <span className="andes-versus">
                  <PatriotFlag /> vs <RoyalistFlag />
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
