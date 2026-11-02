import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { todayDish } from '@/lib/controllers/patioListHelpers';
import { getAllSavedPatioMeta, type SavedPatioMeta } from '@/lib/collections';
import { getFavoritePatioIds } from '@/lib/favorites';
import { fetchFonditaById, type Patio } from '@/lib/patios';

export { todayDish };

export function useFavoritePatiosController() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [patios, setPatios] = useState<Patio[]>([]);
  // Estatus/nota/calificación propia por lugar (capturados en
  // app/guardar/[id].tsx al guardar) — antes se guardaban y nunca volvían a
  // leerse en la lista; ahora alimentan el badge "Ya fui" y el orden por
  // calificación (pedido de Alejandro 2026-08-30).
  const [metaById, setMetaById] = useState<Record<string, SavedPatioMeta>>({});

  const load = useCallback(async (isMounted: () => boolean = () => true) => {
    setLoading(true); setLoadError(false);
    try {
      const [ids, metas] = await Promise.all([getFavoritePatioIds(), getAllSavedPatioMeta()]);
      if (!isMounted()) return;
      const remote = await Promise.all(ids.map((id) => fetchFonditaById(id, { throwOnError: true })));
      const real = remote.filter((patio): patio is Patio => patio !== null);
      if (isMounted()) {
        setPatios(real);
        setMetaById(metas);
      }
    } catch {
      if (isMounted()) setLoadError(true);
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      void load(() => mounted);
      return () => {
        mounted = false;
      };
      // `retry` vuelve a disparar la carga desde «Reintentar».
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, retry])
  );

  const withMenu = useMemo(() => patios.filter((patio) => todayDish(patio) !== null).length, [patios]);

  // Ya tenemos los objetos completos en memoria — quitar localmente evita un
  // refetch de red tras una eliminación en lote que el usuario ya confirmó.
  const removeLocally = useCallback((ids: string[]) => {
    const toRemove = new Set(ids);
    setPatios((current) => current.filter((patio) => !toRemove.has(patio.id)));
  }, []);

  return {
    loading,
    loadError,
    reload: () => setRetry((current) => current + 1),
    refresh: () => load(),
    patios,
    metaById,
    withMenu,
    removeLocally,
  };
}
