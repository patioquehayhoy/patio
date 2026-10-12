import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { fetchFonditaById, type Patio } from '@/lib/patios';
import { getViewedPatioIds } from '@/lib/stats';

export function useViewedPatiosController() {
  const [patios, setPatios] = useState<Patio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestRef = useRef(0);
  const reload = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setLoadError(false);
    try {
      const ids = await getViewedPatioIds();
      const resolved = await Promise.all(ids.map((id) => fetchFonditaById(id, { throwOnError: true })));
      if (request === requestRef.current) setPatios(resolved.filter((patio): patio is Patio => patio !== null));
    } catch {
      if (request === requestRef.current) setLoadError(true);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void reload();
    return () => { requestRef.current += 1; };
  }, [reload]));
  return { patios, loading, loadError, reload };
}
