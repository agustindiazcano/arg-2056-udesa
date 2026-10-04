// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, configure } from '@testing-library/react';
import { getDataVersion, resetDataVersion, versionedUrl } from '../../src/data/version';
import { useDataset } from '../../src/data/useDataset';

configure({ asyncUtilTimeout: 4000 });

type Route = { ok: boolean; status?: number; json: () => Promise<unknown> } | Error;

/** A fetch that answers from a table keyed by URL and records every call with its options. */
function stubFetch(routes: Record<string, Route>) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const route = routes[url];
    if (route === undefined) throw new Error(`unexpected url ${url}`);
    if (route instanceof Error) throw route;
    return { status: 200, ...route };
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

const VERSION: Route = { ok: true, json: async () => ({ data_version: 'abc123def456' }) };

beforeEach(() => {
  resetDataVersion();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getDataVersion', () => {
  it('reads /data/_version.json with cache: no-store and returns data_version', async () => {
    const calls = stubFetch({ '/data/_version.json': VERSION });
    expect(await getDataVersion()).toBe('abc123def456');
    expect(calls).toEqual([{ url: '/data/_version.json', init: { cache: 'no-store' } }]);
  });

  it('asks only once however many callers there are (one shared promise)', async () => {
    const calls = stubFetch({ '/data/_version.json': VERSION });
    const versions = await Promise.all([getDataVersion(), getDataVersion(), getDataVersion()]);
    expect(versions).toEqual(['abc123def456', 'abc123def456', 'abc123def456']);
    await getDataVersion();
    expect(calls).toHaveLength(1);
  });

  it('is null, without throwing or logging, when the request fails', async () => {
    stubFetch({ '/data/_version.json': new Error('network down') });
    expect(await getDataVersion()).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('is null for an HTTP error, for invalid JSON and for a document without a version', async () => {
    stubFetch({ '/data/_version.json': { ok: false, status: 404, json: async () => ({}) } });
    expect(await getDataVersion()).toBeNull();
    resetDataVersion();
    stubFetch({
      '/data/_version.json': {
        ok: true,
        json: async () => {
          throw new SyntaxError('bad');
        }
      }
    });
    expect(await getDataVersion()).toBeNull();
    resetDataVersion();
    stubFetch({ '/data/_version.json': { ok: true, json: async () => ({ other: 1 }) } });
    expect(await getDataVersion()).toBeNull();
    resetDataVersion();
    stubFetch({ '/data/_version.json': { ok: true, json: async () => ({ data_version: '' }) } });
    expect(await getDataVersion()).toBeNull();
  });
});

describe('versionedUrl', () => {
  it('appends ?v=<version>', async () => {
    stubFetch({ '/data/_version.json': VERSION });
    expect(await versionedUrl('/data/economy_series.json')).toBe('/data/economy_series.json?v=abc123def456');
  });

  it('leaves the url as it is when there is no version', async () => {
    stubFetch({ '/data/_version.json': new Error('down') });
    expect(await versionedUrl('/data/economy_series.json')).toBe('/data/economy_series.json');
  });
});

describe('useDataset', () => {
  function Probe({ name }: { name: string }) {
    const { status, data } = useDataset<{ n: number }>(name);
    return <span data-testid={name}>{status === 'success' ? `ok ${data?.n}` : status}</span>;
  }

  it('requests the file with ?v=<data_version>, after reading the version once', async () => {
    const calls = stubFetch({
      '/data/_version.json': VERSION,
      '/data/economy_series.json?v=abc123def456': { ok: true, json: async () => ({ n: 1 }) }
    });
    render(<Probe name="economy_series" />);
    expect((await screen.findByTestId('economy_series')).textContent).toBe('ok 1');
    expect(calls.map((c) => c.url)).toEqual(['/data/_version.json', '/data/economy_series.json?v=abc123def456']);
  });

  it('reads _version.json once for several datasets', async () => {
    const calls = stubFetch({
      '/data/_version.json': VERSION,
      '/data/a.json?v=abc123def456': { ok: true, json: async () => ({ n: 1 }) },
      '/data/b.json?v=abc123def456': { ok: true, json: async () => ({ n: 2 }) }
    });
    render(
      <>
        <Probe name="a" />
        <Probe name="b" />
      </>
    );
    expect((await screen.findByTestId('a')).textContent).toBe('ok 1');
    expect((await screen.findByTestId('b')).textContent).toBe('ok 2');
    expect(calls.filter((c) => c.url === '/data/_version.json')).toHaveLength(1);
  });

  it('still works without a version: the file is requested without a query', async () => {
    const calls = stubFetch({
      '/data/_version.json': new Error('down'),
      '/data/a.json': { ok: true, json: async () => ({ n: 7 }) }
    });
    render(<Probe name="a" />);
    expect((await screen.findByTestId('a')).textContent).toBe('ok 7');
    expect(calls.map((c) => c.url)).toEqual(['/data/_version.json', '/data/a.json']);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('reports an HTTP error of the file as before', async () => {
    stubFetch({ '/data/_version.json': VERSION, '/data/a.json?v=abc123def456': { ok: false, status: 500, json: async () => ({}) } });
    render(<Probe name="a" />);
    expect((await screen.findByTestId('a')).textContent).toBe('error');
  });
});
