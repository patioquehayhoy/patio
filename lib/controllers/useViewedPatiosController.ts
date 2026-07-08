import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { fetchFonditaById, type Patio } from '@/lib/patios';
import { getViewedPatioIds } from '@/lib/stats';

export function useViewedPatiosController() {
  const [patios, setPatios] = useState<Patio[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getViewedPatioIds().then(async (ids) => {
        if (!mounted) return;
        const resolved = await Promise.all(ids.map((id) => fetchFonditaById(id)));
        if (mounted) setPatios(resolved.filter((patio): patio is Patio => patio !== null));
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  return { patios };
}
