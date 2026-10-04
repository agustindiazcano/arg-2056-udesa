import React from 'react';

/** A one-line note under a scene header saying what a global filter does not reach. */
export function ScopeNote({ children }: { children: React.ReactNode }) {
  return <p className="scope-note">{children}</p>;
}
