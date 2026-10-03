import { useState, useEffect } from 'react';

export type DatasetStatus = 'loading' | 'success' | 'error';

export function useDataset<T>(name: string, parser?: (data: unknown) => T) {
  const [status, setStatus] = useState<DatasetStatus>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus('loading');
    
    fetch(`/data/${name}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (!mounted) return;
        try {
          const parsed = parser ? parser(json) : json;
          setData(parsed);
          setStatus('success');
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus('error');
        }
      })
      .catch(err => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      });

    return () => {
      mounted = false;
    };
  }, [name, parser]);

  return { status, data, error };
}
