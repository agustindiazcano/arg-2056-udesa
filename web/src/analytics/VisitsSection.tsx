import React, { useEffect, useState } from 'react';
import { APP_LOCALE } from '../charts/format';
import { parseVisits, summarize } from './visits';
import type { VisitsArchive } from './visits';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; archive: VisitsArchive };

const number = new Intl.NumberFormat(APP_LOCALE);
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Totals and a table by country from the archive that .github/workflows/visits.yml keeps up to date. */
export function VisitsSection({ url = '/analytics/visits.json' }: { url?: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (active) setState({ status: 'ok', archive: parseVisits(json) });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [url]);

  if (state.status === 'loading') return null;

  const summary = state.status === 'ok' ? summarize(state.archive) : null;

  return (
    <section aria-labelledby="visits">
      <h2 id="visits">Visits</h2>
      {state.status === 'error' && <p>Visit counts are not available.</p>}
      {summary !== null && summary.days === 0 && <p>No visits have been archived yet.</p>}
      {state.status === 'ok' && summary !== null && summary.days > 0 && (
        <>
          <p>{`${number.format(summary.visitors)} ${plural(summary.visitors, 'visitor', 'visitors')} and ${number.format(summary.pageviews)} ${plural(summary.pageviews, 'page view', 'page views')}`}</p>
          <p style={{ color: 'var(--ink-2)' }}>
            {`Counted from ${summary.firstDay} to ${summary.lastDay} (${summary.days} ${plural(summary.days, 'day', 'days')}).`}
          </p>
          <table style={{ borderCollapse: 'collapse' }}>
            <caption style={{ textAlign: 'left' }}>Visits by country</caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', padding: '8px' }}>Country</th>
                <th scope="col" style={{ textAlign: 'right', padding: '8px' }}>Visitors</th>
                <th scope="col" style={{ textAlign: 'right', padding: '8px' }}>Page views</th>
              </tr>
            </thead>
            <tbody>
              {summary.countries.map((c) => (
                <tr key={c.code}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--grid)' }}>
                    {c.flag !== '' && <span aria-hidden="true">{c.flag}</span>}
                    {c.flag !== '' && ' '}
                    {c.name}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--grid)' }}>{number.format(c.visitors)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--grid)' }}>{number.format(c.pageviews)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" style={{ textAlign: 'left', padding: '8px' }}>Total</th>
                <td style={{ padding: '8px', textAlign: 'right' }}>{number.format(summary.visitors)}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{number.format(summary.pageviews)}</td>
              </tr>
            </tfoot>
          </table>
          {state.archive.note && <p style={{ color: 'var(--ink-2)' }}>{state.archive.note}</p>}
        </>
      )}
    </section>
  );
}
