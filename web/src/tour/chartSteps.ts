/** The steps of the Recorrido that show a chart instead of a scene: steps 0, 1 and 2 (the GDP since 1900, the GDP and the map of production by province) steps 3 to 13 except 6 (the investor slide, removed on 2026-10-14) and 11 (merged into the Exports slide, step 4), step 14 (productivity), and draft steps 16 and 17. Kept apart from the charts so that the app shell does not load them. */
/** The first slide: the title "Argentina 2056" and the index of the others (it has no data, so it is not in the Data page). */
export const INDEX_STEP = 20;

/**
 * The steps of the Recorrido in the order they are shown. A step is named by its id (what the code, the tests and `docs/data-requests.md`
 * call it); the number on the button and in the Data page is its position here (0, 1, 2...). Human order of 2026-10-15: Productividad
 * (id 14) goes right after the GDP slide (id 1). New interactive draft slides use ids 16 (development) and 17 (forecast uncertainty). Ids 6, 11 and 15 do not exist; 20 is the index.
 */
export const TOUR_ORDER: readonly number[] = [INDEX_STEP, 0, 8, 5, 12, 14, 3, 16, 17];

export const CHART_STEPS: ReadonlySet<number> = new Set(TOUR_ORDER);

/** The number shown for a step: its position in the order the slides are shown. */
export const stepNumber = (step: number): number => TOUR_ORDER.indexOf(step);

export const hasTourChart = (step: number): boolean => CHART_STEPS.has(step);
