import React from 'react';
import { isMock } from '../data/load';

export function MockBadge({ source }: { source: string }) {
  if (!isMock({ source })) return null;

  return <div>MOCK DATA</div>;
}
