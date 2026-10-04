/**
 * Import for the side effect in a jsdom test that reads numbers the app would otherwise count up: the user asks for
 * reduced motion, so the final text is there at once.
 */
window.matchMedia = ((query: string) => ({
  matches: query.includes('reduce'),
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined
})) as unknown as typeof window.matchMedia;

export {};
