import React from 'react';
import type { ThumbSpec } from './types';

const W = 120;
const H = 64;
const PAD = 6;

function scale(values: number[], fallback: number[]): number[] {
  const v = values.some((x) => x > 0) ? values : fallback;
  const max = Math.max(...v.map((x) => Math.abs(x)), 1e-9);
  return v.map((x) => Math.max(0, x) / max);
}

/** A drawing of the kind of chart a view is. Decorative: the button carries the name. */
export function Thumb({ spec }: { spec: ThumbSpec }) {
  const { kind } = spec;
  const values = spec.values ?? [];
  let shapes: React.ReactNode;

  if (kind === 'bars') {
    const v = scale(values, [0.9, 0.7, 0.55, 0.45, 0.35, 0.3]);
    const bw = (W - 2 * PAD) / v.length;
    shapes = v.map((x, i) => (
      <rect
        key={i}
        className="thumb-fill"
        x={PAD + i * bw + 2}
        y={H - PAD - x * (H - 2 * PAD)}
        width={bw - 4}
        height={x * (H - 2 * PAD)}
        rx="1.5"
      />
    ));
  } else if (kind === 'line' || kind === 'fan') {
    const v = scale(values, [0.2, 0.3, 0.28, 0.5, 0.62, 0.8, 0.95]);
    const step = (W - 2 * PAD) / Math.max(v.length - 1, 1);
    const pts = v.map((x, i) => [PAD + i * step, H - PAD - x * (H - 2 * PAD)] as const);
    const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
    const band = [
      ...pts.map(([x, y]) => `${x},${Math.max(y - 8, PAD)}`),
      ...[...pts].reverse().map(([x, y]) => `${x},${Math.min(y + 8, H - PAD)}`)
    ].join(' ');
    shapes = (
      <>
        {kind === 'fan' && <polygon className="thumb-band" points={band} />}
        <polyline className="thumb-line" points={line} fill="none" />
      </>
    );
  } else if (kind === 'treemap') {
    shapes = (
      <>
        <rect className="thumb-fill" x={PAD} y={PAD} width="60" height="52" rx="1.5" />
        <rect className="thumb-fill thumb-dim" x="68" y={PAD} width="46" height="30" rx="1.5" />
        <rect className="thumb-fill" x="68" y="40" width="22" height="18" rx="1.5" />
        <rect className="thumb-fill thumb-dim" x="92" y="40" width="22" height="18" rx="1.5" />
      </>
    );
  } else if (kind === 'map') {
    shapes = (
      <>
        <polygon className="thumb-fill" points="50,6 74,10 80,22 70,30 76,44 62,58 54,58 52,40 40,30 42,16" />
        <polygon className="thumb-fill thumb-dim" points="80,22 98,20 102,32 86,34" />
      </>
    );
  } else {
    shapes = [0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <rect className="thumb-fill thumb-dim" x={PAD} y={8 + i * 11} width="30" height="6" rx="1" />
        <rect className="thumb-fill" x="44" y={8 + i * 11} width={70 - (i % 3) * 14} height="6" rx="1" />
      </g>
    ));
  }

  return (
    <svg className="thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {shapes}
    </svg>
  );
}
