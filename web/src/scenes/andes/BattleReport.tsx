import React from 'react';
import { rangeText } from './data';
import type { AndesEvent, AndesSideReport } from './data';

const number = new Intl.NumberFormat('es-AR');
const count = (n: number | null) => (n === null ? 'sin dato' : number.format(n));

/** The rows of the table of a side: its men (the figure of the event, or the estimate for the royalists at Chacabuco), its units and what it lost. */
export function sideRows(event: AndesEvent, side: AndesSideReport, royalist: boolean): Array<[string, string]> {
  const force = event.forces.find((f) => f.side.startsWith(side.side));
  const range = royalist ? rangeText(event.estimate_range) : null;
  const men = force?.men != null ? count(force.men) : range ? `${range}` : 'sin dato';
  return [
    ['Fuerzas en combate', men],
    ['Unidades', side.units],
    ['Muertos', count(side.killed)],
    ['Heridos', count(side.wounded)],
    ['Prisioneros', count(side.prisoners)]
  ];
}

/** The flag of a side, the same as over the bubbles of the map: the patriot one (white over sky blue) or the royalist one (white with a red saltire). */
function Flag({ royalist }: { royalist: boolean }) {
  return royalist ? (
    <span className="andes-flag andes-flag--royal andes-flag--inline" role="img" aria-label="Bandera realista (cruz de Borgoña)">
      <i />
    </span>
  ) : (
    <span className="andes-flag andes-flag--patriot andes-flag--inline" role="img" aria-label="Bandera del Ejército de los Andes">
      <i />
      <i />
    </span>
  );
}

/**
 * The report of a battle or a combat, at the bottom of the map when it is chosen: the flag of each side, the forces in combat, the units, who won, and what each side
 * lost (dead, wounded, prisoners). What the sources do not give says «sin dato» and is never written as zero.
 */
export function BattleReport({ event }: { event: AndesEvent }) {
  const outcome = event.outcome;
  if (!outcome) return null;
  return (
    <section className="andes-report andes-glass" aria-label={`Resultado: ${event.name}`}>
      <p className="andes-report-result">{outcome.result}</p>
      <div className="andes-report-sides">
        {outcome.sides.map((side, i) => (
          <div key={side.side} className="andes-report-side">
            <h3>
              <Flag royalist={i === 1} />
              {side.side}
            </h3>
            <table>
              <tbody>
                {sideRows(event, side, i === 1).map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {side.note && <p className="andes-report-note">{side.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
