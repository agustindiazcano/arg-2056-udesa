/** The steps of the Recorrido that show a chart instead of a scene: step 1 (the GDP) and steps 3 to 13. Kept apart from the charts so that the app shell does not load them. */
export const CHART_STEPS: ReadonlySet<number> = new Set([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

export const hasTourChart = (step: number): boolean => CHART_STEPS.has(step);
