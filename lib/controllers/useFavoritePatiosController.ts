import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { todayDish } from '@/lib/controllers/patioListHelpers';
import { getAllSavedPatioMeta, type SavedPatioMeta } from '@/lib/collections';
import { getFavoritePatioIds } from '@/lib/favorites';
import { fetchFonditaById, type Patio } from '@/lib/patios';

export { todayDish };

export function useFavoritePatiosController() {
  const [patios, setPatios] = useState<Patio[]>([]);
  // Estatus/nota/calificación propia por lugar (capturados en
  // app/guardar/[id].tsx al guardar) — antes se guardaban y nunca volvían a
  // leerse en la lista; ahora alimentan el badge "Ya fui" y el orden por
  // calificación (pedido de Alejandro 2026-08-30).
  const [metaById, setMetaById] = useState<Record<string, SavedPatioMeta>>({});

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([getFavoritePatioIds(), getAllSavedPatioMeta()]).then(async ([ids, metas]) => {
        if (!mounted) return;
        const remote = await Promise.all(ids.map((id) => fetchFonditaById(id)));
        const real = remote.filter((patio): patio is Patio => patio !== null);
        if (mounted) {
          setPatios(real);
          setMetaById(metas);
        }
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
    metaById,
    withMenu,
    removeLocally,
  };
}
