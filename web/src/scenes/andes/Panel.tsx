import React from 'react';
import { battleFacts, forceText, rangeText } from './data';
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

/** What is known about the selected event: date and its precision, place, altitude, forces by side, estimate range, note. */
export function EventPanel({ event, onClose }: { event: AndesEvent; onClose: () => void }) {
  const range = rangeText(event.estimate_range);
  return (
    <section className="andes-panel" aria-label={`Evento: ${event.name}`}>
      <header className="andes-panel-head">
        <h2 className="panel-title">{event.name}</h2>
        <button type="button" className="chip" onClick={onClose}>
          Cerrar
        </button>
      </header>
      <dl className="andes-facts">
        {battleFacts(event).map((f) => (
          <React.Fragment key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </React.Fragment>
        ))}
      </dl>
      {event.forces.length > 0 && (
        <>
          <h3 className="andes-sub">Fuerzas</h3>
          <ul className="andes-forces">
            {event.forces.map((f) => (
              <li key={f.side}>{forceText(f)}</li>
            ))}
          </ul>
        </>
      )}
      {range && <p className="andes-note">Estimación: {range} hombres.</p>}
      {event.note && <p className="andes-note">{event.note}</p>}
      <p className="andes-source">
        Fuente: {event.source}, consultado el {event.retrieved_at}.
      </p>
    </section>
  );
}
