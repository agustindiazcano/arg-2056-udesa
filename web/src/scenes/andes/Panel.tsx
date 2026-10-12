import React from 'react';
import type { AndesEvent } from './data';

/** The events of the campaign as buttons: choosing one selects it. */
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
      {events.map((e) => (
        <li key={e.id}>
          <button type="button" className="chip" aria-pressed={e.id === selectedId} onClick={(ev) => onSelect(e.id, ev.currentTarget)}>
            <span className="andes-day">Día {e.day_of_campaign}</span> {e.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
