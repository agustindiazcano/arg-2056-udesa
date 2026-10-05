/** Pure helpers of the intro screen: the box of a province path and the random lighting of provinces. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Share of the provinces that stay lit on average. */
export const TARGET_SHARE = 0.3;

/** Bounding box of an SVG path made of absolute `M` and `L` points, grown by `pad` on every side. */
export function pathBox(d: string, pad: number): Box {
  const n = (d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    const x = n[i] as number;
    const y = n[i + 1] as number;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

/** CSS variables that place a layer over the map as percentages of the map size. */
export function boxStyle(box: Box, mapW: number, mapH: number): Record<string, string> {
  const pct = (v: number, total: number) => `${Number(((v / total) * 100).toFixed(3))}%`;
  return { '--x': pct(box.x, mapW), '--y': pct(box.y, mapH), '--w': pct(box.w, mapW), '--h': pct(box.h, mapH) };
}

/** One random change toward the target share of lit provinces; `null` when there is nothing to change. */
export function lightStep(lit: ReadonlySet<number>, total: number, random: () => number): { id: number; on: boolean } | null {
  if (total <= 0) return null;
  const target = Math.round(total * TARGET_SHARE);
  const pOn = Math.min(0.9, Math.max(0.1, 0.5 + (target - lit.size) * 0.12));
  if (random() < pOn) {
    const off: number[] = [];
    for (let i = 0; i < total; i++) if (!lit.has(i)) off.push(i);
    return off.length ? { id: off[Math.floor(random() * off.length)] as number, on: true } : null;
  }
  const on = [...lit];
  return on.length ? { id: on[Math.floor(random() * on.length)] as number, on: false } : null;
}
