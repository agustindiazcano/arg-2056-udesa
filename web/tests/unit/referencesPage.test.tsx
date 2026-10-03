// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within, configure } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReferencesApp, ReferencesPage } from '../../src/references/ReferencesPage.js';
import { formatCitation } from '../../src/references/citation.js';
import type { ReferenceSource, References } from '../../src/types/references.js';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

function src(id: string, over: Partial<ReferenceSource> = {}): ReferenceSource {
  return {
    id,
    url: `https://example.com/${id.replace(':', '-')}`,
    title: `Title ${id}`,
    authors_or_publisher: 'Publisher',
    publisher_type: 'official',
    publication_date: '2020-05-01',
    retrieved_at: '2026-01-10',
    language: null,
    license_or_terms: null,
    derived_from: null,
    used_by: ['projects.json'],
    record_count: 1,
    ...over
  };
}

function refs(over: Partial<References> = {}): References {
  return {
    sources: [
      src('s:1', { title: 'Original title', authors_or_publisher: 'Secretaría de Minería', language: 'es', license_or_terms: 'CC BY 4.0', used_by: ['economy.json', 'projects.json'] }),
      src('s:2', { title: 'Derived table', derived_from: 's:1', publication_date: null }),
      src('s:3', { title: 'Outlook', publisher_type: 'international', authors_or_publisher: 'IMF', derived_from: 's:99' }),
      src('s:4', { title: 'Market note', publisher_type: 'consultancy', authors_or_publisher: 'A Consultancy' })
    ],
    leads: [
      { id: 's:7', url: 'https://example.com/lead-1', title: 'Lead one', authors_or_publisher: 'Someone' },
      { id: 's:8', url: 'https://example.com/lead-2', title: 'Lead two', authors_or_publisher: 'Someone else' }
    ],
    attributions: [
      { label: 'Terrain', text: 'Terrain data by Example DEM', source_url: 'https://dem.example/terrain' },
      { label: 'Province boundaries', text: 'Boundaries by Example Institute', source_url: null }
    ],
    stats: {
      published_files: 3,
      records_total: 10,
      records_without_url: 2,
      sources_used: 4,
      retrieved_min: '2025-12-01',
      retrieved_max: '2026-02-03'
    },
    mock: false,
    ...over
  };
}

const empty = (mock: boolean): References => ({
  sources: [],
  leads: [],
  attributions: [],
  stats: { published_files: 0, records_total: 0, records_without_url: 0, sources_used: 0, retrieved_min: null, retrieved_max: null },
  mock
});

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ReferencesPage: summary and states', () => {
  it('shows the title, the landmarks and the summary line from the stats', () => {
    render(<ReferencesPage references={refs()} />);
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Sources and attributions' })).toBeDefined();
    expect(screen.getByText('4 sources back 3 published files. Retrieved between 2025-12-01 and 2026-02-03.')).toBeDefined();
  });

  it('uses the singular for one source and one file', () => {
    const one = refs({ sources: [src('s:1')], stats: { ...refs().stats, published_files: 1, sources_used: 1 } });
    render(<ReferencesPage references={one} />);
    expect(screen.getByText('1 source backs 1 published file. Retrieved between 2025-12-01 and 2026-02-03.')).toBeDefined();
  });

  it('shows the empty state and the sample-data message when the data is mock', () => {
    render(<ReferencesPage references={empty(true)} />);
    expect(screen.getByText('No sources are registered yet.')).toBeDefined();
    expect(screen.getByText('Sample data: these are not real sources')).toBeDefined();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('shows only the empty message when there is no mock', () => {
    render(<ReferencesPage references={empty(false)} />);
    expect(screen.getByText('No sources are registered yet.')).toBeDefined();
    expect(screen.queryByText(/Sample data/)).toBeNull();
  });

  it('shows the sample-data message next to real entries when mock is true', () => {
    render(<ReferencesPage references={refs({ mock: true })} />);
    expect(screen.getByText('Sample data: these are not real sources')).toBeDefined();
  });

  it('shows the records-without-link line only when it is greater than zero', () => {
    const { unmount } = render(<ReferencesPage references={refs()} />);
    expect(screen.getByText('2 of 10 records have no link to a source page.')).toBeDefined();
    unmount();
    render(<ReferencesPage references={refs({ stats: { ...refs().stats, records_without_url: 0 } })} />);
    expect(screen.queryByText(/have no link to a source page/)).toBeNull();
  });
});

describe('ReferencesPage: list', () => {
  it('groups by publisher type in the enum order with the counts', () => {
    render(<ReferencesPage references={refs()} />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 3)).toEqual(['Official (2)', 'International (1)', 'Consultancy (1)']);
  });

  it('gives every entry an anchor id equal to the source id and an external link with target and rel', () => {
    render(<ReferencesPage references={refs()} />);
    for (const id of ['s:1', 's:2', 's:3', 's:4']) expect(document.getElementById(id)).not.toBeNull();
    const link = within(document.getElementById('s:1')!).getByRole('link', { name: 'Original title' });
    expect(link.getAttribute('href')).toBe('https://example.com/s-1');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows the details of an entry, and "date not stated" when there is none', () => {
    render(<ReferencesPage references={refs()} />);
    const first = document.getElementById('s:1')!;
    expect(within(first).getByText('Secretaría de Minería')).toBeDefined();
    expect(within(first).getByText('Published 2020-05-01')).toBeDefined();
    expect(within(first).getByText('Retrieved 2026-01-10')).toBeDefined();
    expect(within(first).getByText('Language: es')).toBeDefined();
    expect(within(first).getByText('License: CC BY 4.0')).toBeDefined();
    expect(within(first).getByText('Used by: economy.json, projects.json')).toBeDefined();
    const second = document.getElementById('s:2')!;
    expect(within(second).getByText('date not stated')).toBeDefined();
    expect(within(second).queryByText(/Language:/)).toBeNull();
    expect(within(second).queryByText(/License:/)).toBeNull();
  });

  it('links "derived from" to the anchor when the entry is in the list and shows plain text otherwise', () => {
    render(<ReferencesPage references={refs()} />);
    const derived = within(document.getElementById('s:2')!).getByRole('link', { name: 'Original title' });
    expect(derived.getAttribute('href')).toBe('#s:1');
    const missing = document.getElementById('s:3')!;
    expect(within(missing).getByText('Derived from s:99')).toBeDefined();
    expect(within(missing).queryByRole('link', { name: /s:99/ })).toBeNull();
  });
});

describe('ReferencesPage: filters', () => {
  it('filters by the search text and announces the count in a polite live region', () => {
    render(<ReferencesPage references={refs()} />);
    const live = screen.getByRole('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('4 sources shown');
    fireEvent.change(screen.getByLabelText('Search sources'), { target: { value: 'secretaria' } });
    expect(live.textContent).toBe('1 source shown');
    expect(document.getElementById('s:1')).not.toBeNull();
    expect(document.getElementById('s:2')).toBeNull();
  });

  it('filters by publisher type with chips built from the types present', () => {
    render(<ReferencesPage references={refs()} />);
    expect(screen.queryByRole('button', { name: 'Bank' })).toBeNull();
    const chip = screen.getByRole('button', { name: 'International' });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(chip);
    expect(screen.getByRole('button', { name: 'International' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('1 source shown');
    expect(document.getElementById('s:3')).not.toBeNull();
    expect(document.getElementById('s:1')).toBeNull();
  });

  it('says so when nothing matches and clears the filters', () => {
    render(<ReferencesPage references={refs()} />);
    fireEvent.change(screen.getByLabelText('Search sources'), { target: { value: 'zzzz' } });
    expect(screen.getByRole('status').textContent).toBe('0 sources shown');
    expect(screen.getByText('No source matches the filters.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'International' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect((screen.getByLabelText('Search sources') as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('status').textContent).toBe('4 sources shown');
    expect(screen.getByRole('button', { name: 'International' }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('ReferencesPage: attributions, leads and links', () => {
  it('lists the attributions with a link when there is a source url', () => {
    render(<ReferencesPage references={refs()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Attributions' })).toBeDefined();
    expect(screen.getByText(/^Terrain:/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Terrain data by Example DEM' }).getAttribute('href')).toBe('https://dem.example/terrain');
    expect(screen.getByText('Province boundaries: Boundaries by Example Institute')).toBeDefined();
  });

  it('keeps the leads inside a collapsed details element with its sentence', () => {
    render(<ReferencesPage references={refs()} />);
    const summary = screen.getByText('Not verified leads');
    const details = summary.closest('details')!;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    expect(within(details).getByText('These pages were not opened; no figure in this app relies on them.')).toBeDefined();
    expect(within(details).getByRole('link', { name: 'Lead one' }).getAttribute('href')).toBe('https://example.com/lead-1');
    // leads are never listed among the sources
    expect(document.getElementById('s:7')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('4 sources shown');
  });

  it('does not render the leads section when there are none', () => {
    render(<ReferencesPage references={refs({ leads: [] })} />);
    expect(screen.queryByText('Not verified leads')).toBeNull();
  });

  it('links back to the app', () => {
    render(<ReferencesPage references={refs()} />);
    expect(screen.getByRole('link', { name: 'Back to the app' }).getAttribute('href')).toBe('index.html');
  });
});

describe('ReferencesPage: copy citation', () => {
  it('copies the exact citation and shows a short status', async () => {
    const writeText = vi.fn(async () => undefined);
    setClipboard({ writeText });
    render(<ReferencesPage references={refs()} />);
    const entry = document.getElementById('s:1')!;
    fireEvent.click(within(entry).getByRole('button', { name: 'Copy citation' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(formatCitation(refs().sources[0]!));
    await within(entry).findByText('Copied');
  });

  it('does not fail when the clipboard is unavailable', async () => {
    setClipboard(undefined);
    render(<ReferencesPage references={refs()} />);
    const entry = document.getElementById('s:1')!;
    fireEvent.click(within(entry).getByRole('button', { name: 'Copy citation' }));
    await within(entry).findByText('Could not copy');
  });

  it('does not fail when writing to the clipboard is rejected', async () => {
    setClipboard({ writeText: vi.fn(async () => { throw new Error('denied'); }) });
    render(<ReferencesPage references={refs()} />);
    const entry = document.getElementById('s:1')!;
    fireEvent.click(within(entry).getByRole('button', { name: 'Copy citation' }));
    await within(entry).findByText('Could not copy');
  });
});

describe('ReferencesApp', () => {
  it('loads references.json and renders the page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => refs() })));
    render(<ReferencesApp />);
    expect(screen.getByText('Loading...')).toBeDefined();
    await screen.findByRole('heading', { level: 1, name: 'Sources and attributions' });
  });

  it('shows an error state when the file cannot be loaded or is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    const { unmount } = render(<ReferencesApp />);
    await screen.findByText('Error loading data.');
    unmount();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ nope: true }) })));
    render(<ReferencesApp />);
    await screen.findByText('Error loading data.');
  });
});
