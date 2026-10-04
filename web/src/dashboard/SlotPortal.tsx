import React from 'react';
import { createPortal } from 'react-dom';
import { useSlots } from './slots';
import type { SlotName } from './slots';

/** Renders its children inside the slot element when the page has one, and in place when it does not. */
export function SlotPortal({ slot, children }: { slot: SlotName; children: React.ReactNode }) {
  const element = useSlots((s) => s[slot]);
  return element ? createPortal(children, element) : <>{children}</>;
}
