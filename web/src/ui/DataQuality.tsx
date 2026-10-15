import React from 'react';
import { QUALITY_LABEL } from '../data/series.js';
import type { Quality } from '../data/series.js';

/**
 * How real the data of a chart is, inside the chart: a badge with the quality, and over a placeholder chart a visible mark, so a made-up
 * series never looks like a measured one even when the side panel is hidden. The title carries the source and the retrieval date.
 * The parent must be `position: relative` (see `.tour-quality-frame`).
 */
export function DataQuality({ quality, source, retrievedAt }: { quality: Quality; source: string; retrievedAt: string | null }) {
  const label = QUALITY_LABEL[quality];
  const title = `${source}${retrievedAt ? `. Consultado el ${retrievedAt}` : ''}`;
  return (
    <>
      <span role="note" aria-label={label} title={title} className={`data-quality data-quality--${quality}`}>
        {label}
      </span>
      {quality === 'placeholder' && (
        <span data-testid="quality-watermark" aria-hidden="true" className="data-quality-watermark">
          Datos de prueba
        </span>
      )}
    </>
  );
}
