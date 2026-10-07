import React, { useMemo, useRef } from 'react';
import { projectFeatures, provinceStyle } from '../charts3d/mapGeometry';
import type { Map3DSpec } from '../charts3d/types';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { isoMap } from './isoMap';
import { showTip } from './tip';

/**
 * The provinces in relief, drawn in SVG (no WebGL): extruded by their value, seen from the south. Hover names the province,
 * a click selects it (it rises and gets an outline). Nothing moves the view.
 */
export function TourMapSvg({ spec }: { spec: Map3DSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const { geo, values, metric, selectedId } = spec;

  const drawing = useMemo(
    () => isoMap(projectFeatures(geo), { styleOf: (id) => provinceStyle(values.values[id]?.plotted, values.domain, metric), selectedId }),
    [geo, values, metric, selectedId]
  );
  const { viewBox } = drawing;

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d chart3d-still" data-chart3d="map">
        <svg
          className="iso"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={spec.summary}
        >
          {drawing.provinces.map((p) => {
            const value = values.values[p.id];
            const text = `${p.name}: ${value ? spec.formatValue(value.plotted) : 'sin datos'}`;
            return (
              <g
                key={p.id}
                data-province={p.id}
                className="iso-part"
                onPointerMove={(e) => showTip(tipRef.current, hostRef.current, e, text)}
                onPointerLeave={(e) => showTip(tipRef.current, hostRef.current, e, null)}
                onClick={() => spec.onSelect(p.id === selectedId ? null : p.id)}
              >
                <path d={p.sides} fill={p.sideColor} />
                <path
                  d={p.top}
                  fill={p.color}
                  fillRule="evenodd"
                  stroke={p.selected ? SEQUENTIAL_BLUE[9] : tokens.page}
                  strokeWidth={p.selected ? 0.07 : 0.025}
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
    </div>
  );
}
