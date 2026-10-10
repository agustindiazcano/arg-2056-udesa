import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import { splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';
import { ENEMY_ID, SKIRMISHES } from '../../src/scenes/andes/forces';
import { battleCard, eventOfRedBall } from '../../src/scenes/andes/battleHover';

const events = parseAndesEvents(JSON.parse(readFileSync(new URL('../../../data/mock/andes_events.json', import.meta.url), 'utf8')) as unknown);
const route = buildRoute(splitColumns(events).main);

describe('eventOfRedBall', () => {
  it('is the battle of Chacabuco for the royalist army and the combat of its place for the royalists of a skirmish', () => {
    expect(eventOfRedBall(ENEMY_ID, route.points)?.name).toBe('Batalla de Chacabuco');
    expect(eventOfRedBall(SKIRMISHES[0]!.id, route.points)?.name).toMatch(/Achupallas/);
    expect(eventOfRedBall(SKIRMISHES[1]!.id, route.points)?.name).toMatch(/Coimas/);
  });

  it('is nothing for a ball of a patriot force', () => {
    expect(eventOfRedBall('main', route.points)).toBeNull();
    expect(eventOfRedBall('las-heras', route.points)).toBeNull();
  });
});

describe('battleCard', () => {
  it('has the name of the battle, its date in words, the forces of both sides, the royalist estimate and the altitude', () => {
    const card = battleCard(eventOfRedBall(ENEMY_ID, route.points)!);
    expect(card.title).toBe('Batalla de Chacabuco');
    expect(card.date).toBe('12 de febrero de 1817');
    expect(card.rows.map(([label]) => label)).toEqual(['Ejército de los Andes', 'Fuerzas realistas', 'Estimación realista', 'Altitud']);
    expect(card.rows[0]![1]).toBe('3.500');
    expect(card.rows[1]![1]).toBe('sin dato');
  });

  it('names a combat without the word in brackets and gives the men of both sides', () => {
    const card = battleCard(eventOfRedBall(SKIRMISHES[1]!.id, route.points)!);
    expect(card.title).toBe('Combate de Las Coimas');
    expect(card.date).toBe('7 de febrero de 1817');
    expect(card.rows.find(([label]) => /realistas/.test(label))![1]).toBe('700');
  });
});
