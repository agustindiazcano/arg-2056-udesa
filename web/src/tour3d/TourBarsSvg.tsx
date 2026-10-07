import React, { useMemo, useRef } from 'react';
import { formatAxisNumber } from '../charts/format';
import { layoutBars } from '../charts3d/layout';
import type { Bars3DSpec } from '../charts3d/types';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { isoBars } from './isoBars';
import { shade } from './isoMap';
import { showTip } from './tip';

const MAX_HEIGHT = 4;
const BAR_WIDTH = 0.9;
const GAP = 0.45;
const DEPTH = 1.1;
/** Past this many bars the value over each one would not fit: the tooltip has it. */
const MAX_VALUE_LABELS = 12;
/** Past this many bars the names are tilted. */
const MAX_FLAT_NAMES = 8;

/** Bars on a plate, drawn in SVG (no WebGL), seen from the front and a little above. Hover lights a bar and names it; nothing moves the view. */
export function TourBarsSvg({ spec }: { spec: Bars3DSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const { layout, drawing } = useMemo(() => {
    const layout = layoutBars(spec.bars, { maxHeight: MAX_HEIGHT, barWidth: BAR_WIDTH, gap: GAP, depth: DEPTH });
    return { layout, drawing: isoBars(layout) };
  }, [spec.bars]);
  const { viewBox } = drawing;
  // the text keeps a readable size whatever the number of bars
  const font = viewBox.width / 55;
  const tilted = spec.bars.length > MAX_FLAT_NAMES;

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d chart3d-still" data-chart3d="bars">
        <svg
          className="iso"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={spec.summary}
        >
          <path d={drawing.plate} fill={tokens.baseline} fillOpacity={0.55} />
          {drawing.ticks.map((t) => (
            <g key={t.value}>
              <line x1={t.x1} x2={t.x2} y1={t.y} y2={t.y} stroke={tokens.grid} strokeWidth={0.03} />
              <text x={t.x1 - 0.2} y={t.y} fontSize={font * 0.9} fill={tokens.muted} textAnchor="end" dominantBaseline="middle">
                {formatAxisNumber(t.value)}
              </text>
            </g>
          ))}
          {drawing.bars.map((b) => {
            const item = layout.items[b.index]!;
            const base = (b.highlight ? SEQUENTIAL_BLUE[9] : SEQUENTIAL_BLUE[4]) ?? tokens.ink;
            const text = `${item.label}: ${item.display}`;
            return (
              <g
                key={b.index}
                data-bar={b.index}
                className="iso-part"
                onPointerMove={(e) => showTip(tipRef.current, hostRef.current, e, text)}
                onPointerLeave={(e) => showTip(tipRef.current, hostRef.current, e, null)}
              >
                <path d={b.side} fill={shade(base, 0.55)} />
                <path d={b.top} fill={shade(base, 1.15)} />
                <path d={b.front} fill={base} />
                {spec.bars.length <= MAX_VALUE_LABELS && (
                  <text x={b.labelX} y={b.labelY} fontSize={font} fill={b.highlight ? tokens.ink : tokens.ink2} fontWeight={b.highlight ? 700 : 400} textAnchor="middle">
                    {item.short}
                  </text>
                )}
                <text
                  x={b.nameX}
                  y={b.nameY}
                  fontSize={font}
                  fill={b.highlight ? tokens.ink : tokens.ink2}
                  fontWeight={b.highlight ? 700 : 400}
                  textAnchor={tilted ? 'end' : 'middle'}
                  dominantBaseline="hanging"
                  transform={tilted ? `rotate(-50 ${b.nameX} ${b.nameY})` : undefined}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
    </div>
  );
}
