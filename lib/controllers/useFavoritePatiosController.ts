import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { todayDish } from '@/lib/controllers/patioListHelpers';
import { getFavoritePatioIds } from '@/lib/favorites';
import { fetchFonditaById, type Patio } from '@/lib/patios';

export { todayDish };

export function useFavoritePatiosController() {
  const [patios, setPatios] = useState<Patio[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getFavoritePatioIds().then(async (ids) => {
        if (!mounted) return;
        const remote = await Promise.all(ids.map((id) => fetchFonditaById(id)));
        const real = remote.filter((patio): patio is Patio => patio !== null);
        if (mounted) setPatios(real);
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const withMenu = useMemo(() => patios.filter((patio) => todayDish(patio) !== null).length, [patios]);

  // Ya tenemos los objetos completos en memoria — quitar localmente evita un
  // refetch de red tras una eliminación en lote que el usuario ya confirmó.
  const removeLocally = useCallback((ids: string[]) => {
    const toRemove = new Set(ids);
    setPatios((current) => current.filter((patio) => !toRemove.has(patio.id)));
  }, []);

  return {
    patios,
    withMenu,
    removeLocally,
  };
}
