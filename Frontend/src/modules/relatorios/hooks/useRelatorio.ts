import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';

/**
 * Carrega os dados de um relatório. O `fetcher` deve ser memoizado pelo
 * chamador (useCallback) — cada mudança dele dispara um novo fetch.
 */
export function useRelatorio<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const carregar = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        if (active) setData(result);
      } catch (err: unknown) {
        if (!active) return;
        if (isAxiosError(err) && err.response?.status === 403) {
          setForbidden(true);
        } else {
          setError('Não foi possível carregar o relatório.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void carregar();

    return () => {
      active = false;
    };
  }, [fetcher, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, loading, error, forbidden, reload };
}
