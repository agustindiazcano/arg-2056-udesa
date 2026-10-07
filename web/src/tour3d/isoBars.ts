import type { BarsLayout } from '../charts3d/types';

/** Where the back of a box sits relative to its front, on the screen (an oblique view from the front, a little above and to the left). */
const SKEW_X = 0.45;
const SKEW_Y = 0.3;
/** The plate runs this far in front of the bars and this deep behind them. */
const PLATE_FRONT = 0.35;
const PLATE_DEPTH = 1.6;
const SIDE_PAD = 1.3;
const NAME_ROOM = 1.9;
const VALUE_ROOM = 0.9;

export interface IsoBar {
  index: number;
  front: string;
  top: string;
  side: string;
  /** screen y of the top front edge (svg y grows downward) */
  topY: number;
  /** where the value goes, over the bar */
  labelX: number;
  labelY: number;
  /** where the name hangs, under the plate */
  nameX: number;
  nameY: number;
  highlight: boolean;
}

export interface IsoBarsDrawing {
  viewBox: { x: number; y: number; width: number; height: number };
  plate: string;
  ticks: Array<{ value: number; x1: number; x2: number; y: number }>;
  bars: IsoBar[];
}

const num = (n: number) => Math.round(n * 100) / 100;
const poly = (points: Array<[number, number]>) => `M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join('L')}Z`;

/** A bar chart as an oblique drawing: each bar a front, a roof and a right wall, on a plate with guide lines. Pure. */
export function isoBars(layout: BarsLayout): IsoBarsDrawing {
  const half = layout.width / 2 + SIDE_PAD;
  const skewX = PLATE_DEPTH * SKEW_X;
  const skewY = PLATE_DEPTH * SKEW_Y;
  const maxH = Math.max(0, ...layout.ticks.map((t) => t.height), ...layout.items.map((i) => i.height));

  const plate = poly([
    [-half, PLATE_FRONT],
    [half, PLATE_FRONT],
    [half + skewX, -skewY],
    [-half + skewX, -skewY]
  ]);
  const ticks = layout.ticks.map((t) => ({ value: t.value, x1: -half + skewX, x2: half + skewX, y: -t.height - skewY }));

  const bars = layout.items.map((item, index) => {
    const dx = item.depth * SKEW_X;
    const dy = item.depth * SKEW_Y;
    const l = item.x - item.width / 2;
    const r = item.x + item.width / 2;
    const h = item.height;
    return {
      index,
      front: poly([[l, 0], [r, 0], [r, -h], [l, -h]]),
      top: poly([[l, -h], [r, -h], [r + dx, -h - dy], [l + dx, -h - dy]]),
      side: poly([[r, 0], [r + dx, -dy], [r + dx, -h - dy], [r, -h]]),
      topY: -h,
      labelX: item.x + dx / 2,
      labelY: -h - dy - 0.25,
      nameX: item.x,
      nameY: PLATE_FRONT + 0.45,
      highlight: item.highlight
    };
  });

  const minX = -half - 1.2;
  const maxX = half + skewX + 0.4;
  const minY = -maxH - skewY - VALUE_ROOM;
  const maxY = PLATE_FRONT + NAME_ROOM;
  return { viewBox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }, plate, ticks, bars };
}
