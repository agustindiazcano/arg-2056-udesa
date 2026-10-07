/** The steps of the Recorrido that show a chart instead of a scene: steps 0, 1 and 2 (the GDP since 1900, the GDP and the map of production by province) and steps 3 to 13. Kept apart from the charts so that the app shell does not load them. */
export const CHART_STEPS: ReadonlySet<number> = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

export const hasTourChart = (step: number): boolean => CHART_STEPS.has(step);
