import type { StepsByScene } from '../../story/types';
import { parseYear } from '../../types/year';

/**
 * PLACEHOLDER story steps. Titles and texts carry no story and no claim, and the focus values only exercise the
 * mechanism. The human writes the real steps with sources before the release; the release gate
 * (scripts/check_no_mock.py --content) fails while any step has `placeholder: true`.
 * Keep every step a literal object so the gate can print the scene and the id.
 */
const TEXT = 'Placeholder text. Replace before release.';

export const STEPS: StepsByScene = {
  andes: [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-3', title: 'Step 3 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true }
  ],
  economy: [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: { year: parseYear(1880) }, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2 (placeholder)', text: TEXT, focus: { year: parseYear(1950) }, source_ids: [], placeholder: true },
    { id: 'step-3', title: 'Step 3 (placeholder)', text: TEXT, focus: { year: parseYear(2025) }, source_ids: [], placeholder: true }
  ],
  resources: [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-3', title: 'Step 3 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true }
  ],
  forecast: [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: { scenario: 'pessimistic' }, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2 (placeholder)', text: TEXT, focus: { scenario: 'expected' }, source_ids: [], placeholder: true },
    {
      id: 'step-3',
      title: 'Step 3 (placeholder)',
      text: TEXT,
      focus: { scenario: 'optimistic', play: { fromYear: parseYear(2026), toYear: parseYear(2056) } },
      source_ids: [],
      placeholder: true
    }
  ],
  'ai-revolution': [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2 (placeholder)', text: TEXT, focus: { aiOverlay: true }, source_ids: [], placeholder: true },
    { id: 'step-3', title: 'Step 3 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true }
  ],
  sandbox: [
    { id: 'step-1', title: 'Step 1 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-2', title: 'Step 2 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true },
    { id: 'step-3', title: 'Step 3 (placeholder)', text: TEXT, focus: {}, source_ids: [], placeholder: true }
  ]
};
