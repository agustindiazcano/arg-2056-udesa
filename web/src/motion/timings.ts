/** Motion of design.md section 5. Every animation that uses these is skipped under prefers-reduced-motion. */

/** A scene change: 400 ms of fade and a 24 px rise, ease-out cubic. */
export const SCENE_TRANSITION = { duration: 0.4, y: 24, ease: 'power3.out' } as const;

/** Counters of the stat tiles. */
export const COUNTER = { duration: 0.6, ease: 'power3.out' } as const;

/** Series drawing in (ECharts `animationDuration`, in milliseconds). */
export const SERIES_DRAW_MS = 600;

/** The story text fading in when the step changes. */
export const STORY_STEP = { duration: 0.3, y: 12, ease: 'power3.out' } as const;

/** A chart of the Recorrido coming in (a new step, a new layout, 2D to 3D): a soft fade, a rise and a settle. */
export const REVEAL = { duration: 0.5, y: 18, scale: 0.985, ease: 'power3.out' } as const;

/** Seconds between one panel and the next when several come in together. */
export const REVEAL_STAGGER = 0.07;
