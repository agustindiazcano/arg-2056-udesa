import React, { useState } from 'react';
import { REFERENCES } from '../datasets/references.js';
import type { Reference } from '../datasets/types.js';

const BY_ID = new Map<string, { ref: Reference; num: number }>();
const BY_URL = new Map<string, { ref: Reference; num: number }>();

REFERENCES.forEach((ref, idx) => {
  const entry = { ref, num: idx + 1 };
  BY_ID.set(ref.id, entry);
  BY_URL.set(ref.url, entry);
});

/**
 * Returns the 1-based canonical reference number from `REFERENCES` by id or URL.
 */
export function refNumber(idOrUrl: string): number {
  return BY_ID.get(idOrUrl)?.num ?? BY_URL.get(idOrUrl)?.num ?? 1;
}

/**
 * Extracts a concise institution/author label from a full reference description
 * (e.g. "FMI, World Economic Outlook..." -> "FMI").
 */
export function shortRefLabel(label: string): string {
  const commaIdx = label.indexOf(',');
  const head = (commaIdx >= 0 ? label.slice(0, commaIdx) : label).trim();
  // Remove long parenthetical explanations if present (except 4-digit years like "(2024)")
  return head.replace(/\s*\((?!\d{4}\))[^)]+\)\s*$/, '').trim();
}

export interface RefLinkProps {
  /** Reference ID from REFERENCES (e.g. 'F1', 'W5', 'E7') */
  id?: string;
  /** Direct URL when passing a SourceLink object */
  url?: string;
  /** Direct label when passing a SourceLink object */
  label?: string;
  /** If true, renders the full label next to [N] (used in the Referencias catalog tab) */
  fullLabel?: boolean;
}

/**
 * Numbered reference badge/link (`[1] FMI`).
 * - Never uses native browser `title` tooltips.
 * - On hover/focus: renders a custom styled tooltip showing the full description and URL text.
 * - On click: opens the reference URL in a new tab.
 */
export function RefLink({ id, url, label, fullLabel = false }: RefLinkProps) {
  const [hover, setHover] = useState(false);

  const entry = (id ? BY_ID.get(id) : undefined) ?? (url ? BY_URL.get(url) : undefined);
  const num = entry?.num ?? 1;
  const resolvedUrl = entry?.ref.url ?? url ?? '#';
  const fullText = label ?? entry?.ref.label ?? id ?? '';
  const shortText = shortRefLabel(fullText);

  return (
    <span
      className="ref-chip-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`ref-chip-link ${fullLabel ? 'ref-chip-link--full' : ''}`}
        aria-label={`[${num}] ${fullText}`}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <span className="ref-chip-num">[{num}]</span>
        <span className="ref-chip-text">{fullLabel ? fullText : shortText}</span>
      </a>
      {hover && (
        <span role="tooltip" className="ref-hover-tooltip">
          <strong className="ref-hover-title">
            [{num}] {fullText}
          </strong>
          <span className="ref-hover-url">{resolvedUrl}</span>
        </span>
      )}
    </span>
  );
}

/**
 * Renders a list of compact numbered reference badges (`[1] FMI`, `[2] Banco Mundial`).
 */
export function RefList({ ids }: { ids: readonly string[] }) {
  if (ids.length === 0) return null;
  return (
    <span className="ref-chip-list" aria-label="Referencias numeradas">
      {ids.map((id) => (
        <RefLink key={id} id={id} />
      ))}
    </span>
  );
}
