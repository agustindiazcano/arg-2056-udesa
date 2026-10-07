import type React from 'react';

/** Puts the tooltip next to the pointer (inside `host`), or hides it when `text` is null. */
export function showTip(tip: HTMLElement | null, host: HTMLElement | null, e: React.PointerEvent, text: string | null) {
  if (!tip) return;
  if (text === null || !host) {
    tip.hidden = true;
    return;
  }
  const rect = host.getBoundingClientRect();
  tip.textContent = text;
  tip.style.left = `${(e.clientX || 0) - rect.left + 12}px`;
  tip.style.top = `${(e.clientY || 0) - rect.top + 12}px`;
  tip.hidden = false;
}
