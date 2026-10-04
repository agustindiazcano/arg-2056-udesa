import React from 'react';
import { TabBar } from './TabBar';
import { MockBadge } from './MockBadge';

/** The brand, the six scenes, the badge that says the data are illustrative and the link to the sources. */
export function Header({ mockSource }: { mockSource: string | null }) {
  return (
    <header className="app-header">
      <span className="brand">Argentina 2056</span>
      <TabBar />
      <div className="header-end">
        {mockSource !== null && <MockBadge source={mockSource} />}
        <a href="references.html">Fuentes y métodos</a>
      </div>
    </header>
  );
}
