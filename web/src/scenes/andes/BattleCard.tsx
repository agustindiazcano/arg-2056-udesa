import React from 'react';
import { battleCard } from './battleHover';
import type { AndesEvent } from './data';

/** The card is about this wide and tall (px): it is kept inside the map. */
const CARD = { width: 300, height: 230 };
/** How far it stays from the mouse and from the edges (px). */
const GAP = 16;

/**
 * The card that opens when the mouse is over the red balls of the royalists seen from far away: the name of the battle (or the combat), its date and a small
 * table of data: the forces of each side, the estimate, the altitude. It follows the mouse and stays inside the map; it lets the clicks through.
 */
export function BattleCard({ event, x, y, area }: { event: AndesEvent; x: number; y: number; area?: { width: number; height: number } }) {
  const card = battleCard(event);
  const width = area?.width ?? 1200;
  const height = area?.height ?? 800;
  const left = Math.max(GAP, Math.min(x + GAP, width - CARD.width - GAP));
  const top = Math.max(GAP, Math.min(y + GAP, height - CARD.height - GAP));
  return (
    <aside className="andes-battle-card" role="status" aria-label={`Datos de ${card.title}`} style={{ transform: `translate(${left}px, ${top}px)` }}>
      <p className="andes-battle-card-title">{card.title}</p>
      <p className="andes-battle-card-date">{card.date}</p>
      <table>
        <tbody>
          {card.rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {card.note && <p className="andes-battle-card-note">{card.note}</p>}
    </aside>
  );
}
