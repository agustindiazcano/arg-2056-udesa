export const SCENARIOS = ['pessimistic', 'expected', 'optimistic'] as const;
export type Scenario = typeof SCENARIOS[number];
