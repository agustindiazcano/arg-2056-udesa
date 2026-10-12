import { MEN_PER_FIGURE } from '../column';
import type { Slot } from '../column';
import type { BattleUnit } from '../battleField';

/** A repeatable number in [0, 1) from two integers. */
function unit(n: number, salt: number): number {
  let x = (Math.imul(n + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0;
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

/**
 * The figures of a unit of the battle: one for every 50 men (at least one), all on foot for an infantry unit (a share of them in the red coat of the pardos y morenos
 * battalions) and all riders for the cavalry. No mules and no leader on a white horse (that one is San Martín's, up on the hill). The same every time. Their places are
 * decided by the line they form to fight (`battleSlots`).
 */
export function unitSlots(u: Pick<BattleUnit, 'arm' | 'men' | 'afroShare'>): Slot[] {
  const count = Math.max(1, Math.round(u.men / MEN_PER_FIGURE));
  const out: Slot[] = [];
  for (let i = 0; i < count; i += 1) {
    const kind: Slot['kind'] = u.arm === 'cavalry' ? (unit(i, 7) < 0.3 ? 'rider_black' : 'rider') : unit(i, 5) < u.afroShare ? 'foot_afro' : 'foot';
    out.push({ kind, along: 0, lateral: 0, scale: 1 + (unit(i, 3) - 0.5) * 0.12, tint: (unit(i, 4) - 0.5) * 0.08 });
  }
  return out;
}
