import React from 'react';
import { formatDate } from '../charts/format.js';

interface SceneShellProps {
  title: string;
  subtitle?: string;
  /** Source names of the data on screen; the line is left out when there are none. */
  sources: readonly string[];
  /** ISO date the data was retrieved. */
  retrievedAt?: string;
  /** What the date is: "consultado el" (default) for retrieved data, "generado el" for model output. */
  dateLabel?: string;
  children?: React.ReactNode;
}

/** The frame every scene shares: the headline, the one-line subtitle, the content and the auditable source line. */
export function SceneShell({ title, subtitle, sources, retrievedAt, dateLabel = 'consultado el', children }: SceneShellProps) {
  const source =
    sources.length === 0
      ? null
      : `Fuente: ${sources.join(', ')}${retrievedAt ? `, ${dateLabel} ${formatDate(retrievedAt)}` : ''}`;
  return (
    <div className="scene">
      <header className="scene-head">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
      {source && <footer className="scene-source">{source}</footer>}
    </div>
  );
}
