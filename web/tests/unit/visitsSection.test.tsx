// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within, configure } from '@testing-library/react';
import { VisitsSection } from '../../src/analytics/VisitsSection';
import { ReferencesPage } from '../../src/references/ReferencesPage';
import type { References } from '../../src/types/references';

configure({ asyncUtilTimeout: 4000 });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const ARCHIVE = {
  source: 'Vercel Web Analytics API',
  retrieved_at: '2026-10-10',
  note: 'Visitors are as Vercel counts them per day.',
  days: {
    '2026-10-01': { AR: { pageviews: 1200, visitors: 400 }, US: { pageviews: 30, visitors: 20 } },
    '2026-10-02': { AR: { pageviews: 5, visitors: 3 }, unknown: { pageviews: 1, visitors: 1 } }
  }
};

function stubFetch(response: { ok: boolean; status?: number; json?: unknown }) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: response.ok, status: response.status ?? 200, json: () => Promise.resolve(response.json) })));
}

describe('VisitsSection', () => {
  it('shows the totals and one row per country with its flag, visitors and page views', async () => {
    stubFetch({ ok: true, json: ARCHIVE });
    render(<VisitsSection />);
    const section = await screen.findByRole('region', { name: 'Visits' });
    expect(within(section).getByText('424 visitors and 1,236 page views')).toBeTruthy();
    expect(within(section).getByText(/from 2026-10-01 to 2026-10-02 \(2 days\)/)).toBeTruthy();

    const rows = within(within(section).getByRole('table', { name: 'Visits by country' })).getAllByRole('row');
    const cells = rows.map((r) => [...r.querySelectorAll('th, td')].map((c) => c.textContent));
    expect(cells).toEqual([
      ['Country', 'Visitors', 'Page views'],
      ['\u{1F1E6}\u{1F1F7} Argentina', '403', '1,205'],
      ['\u{1F1FA}\u{1F1F8} United States', '20', '30'],
      ['Unknown', '1', '1'],
      ['Total', '424', '1,236']
    ]);
  });

  it('hides the flag from screen readers, the country name carries the meaning', async () => {
    stubFetch({ ok: true, json: ARCHIVE });
    render(<VisitsSection />);
    const section = await screen.findByRole('region', { name: 'Visits' });
    const flag = within(section).getByText('\u{1F1E6}\u{1F1F7}');
    expect(flag.getAttribute('aria-hidden')).toBe('true');
  });

  it('explains how visitors are counted', async () => {
    stubFetch({ ok: true, json: ARCHIVE });
    render(<VisitsSection />);
    expect(await screen.findByText('Visitors are as Vercel counts them per day.')).toBeTruthy();
  });

  it('says so when nothing has been archived yet', async () => {
    stubFetch({ ok: true, json: { source: 's', retrieved_at: null, days: {} } });
    render(<VisitsSection />);
    expect(await screen.findByText('No visits have been archived yet.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('says the counts are not available when the file cannot be loaded or is invalid', async () => {
    stubFetch({ ok: false, status: 404 });
    render(<VisitsSection />);
    expect(await screen.findByText('Visit counts are not available.')).toBeTruthy();
    cleanup();
    stubFetch({ ok: true, json: { nope: true } });
    render(<VisitsSection />);
    expect(await screen.findByText('Visit counts are not available.')).toBeTruthy();
  });

  it('asks for the archive at /analytics/visits.json', async () => {
    stubFetch({ ok: true, json: ARCHIVE });
    render(<VisitsSection />);
    await screen.findByRole('region', { name: 'Visits' });
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toBe('/analytics/visits.json');
  });
});

describe('ReferencesPage with the visits', () => {
  const references: References = {
    sources: [],
    leads: [],
    attributions: [],
    stats: { published_files: 0, records_total: 0, records_without_url: 0, sources_used: 0, retrieved_min: null, retrieved_max: null },
    mock: false
  };

  it('shows what it is given inside main, before the link back to the app', () => {
    render(<ReferencesPage references={references} extra={<p>extra block</p>} />);
    const main = screen.getByRole('main');
    const extra = within(main).getByText('extra block');
    const back = within(main).getByRole('link', { name: 'Back to the app' });
    expect(extra.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
