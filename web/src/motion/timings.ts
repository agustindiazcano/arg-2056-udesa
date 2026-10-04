/** Motion of design.md section 5. Every animation that uses these is skipped under prefers-reduced-motion. */

/** A scene change: 400 ms of fade and a 24 px rise, ease-out cubic. */
export const SCENE_TRANSITION = { duration: 0.4, y: 24, ease: 'power3.out' } as const;

/** Counters of the stat tiles. */
export const COUNTER = { duration: 0.6, ease: 'power3.out' } as const;

/** Series drawing in (ECharts `animationDuration`, in milliseconds). */
export const SERIES_DRAW_MS = 600;

/** The story text fading in when the step changes. */
export const STORY_STEP = { duration: 0.3, y: 12, ease: 'power3.out' } as const;
