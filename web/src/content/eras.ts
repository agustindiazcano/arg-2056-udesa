export interface Era {
  id: string;
  startYear: number;
  endYear: number;
  label: string;
  source_id: string | null;
  placeholder: boolean;
}

/**
 * PLACEHOLDER structure for the era bands of the economy timeline. These three entries name no real historical
 * period and make no claim: the human supplies the real periodization and its sources before the release, and the
 * release gate (scripts/check_no_mock.py --content) fails while any entry has `placeholder: true`.
 */
export const ERAS: readonly Era[] = [
  { id: 'era-a', startYear: 1880, endYear: 1929, label: 'Era A (provisoria)', source_id: null, placeholder: true },
  { id: 'era-b', startYear: 1930, endYear: 1979, label: 'Era B (provisoria)', source_id: null, placeholder: true },
  { id: 'era-c', startYear: 1980, endYear: 2025, label: 'Era C (provisoria)', source_id: null, placeholder: true }
];
