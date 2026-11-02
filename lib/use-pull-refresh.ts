import { useCallback, useRef, useState } from 'react';

// Jalar hacia abajo para actualizar (Ley de Jakob: la gente lo espera porque
// así funcionan las apps que más usa). El indicador vive mientras la carga real
// dura, ni más ni menos.
export function usePullRefresh(load: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(false);
  const onRefresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setRefreshing(true);
    try {
      await load();
    } catch {
      // La pantalla ya muestra su propio estado de error al cargar.
    } finally {
      pending.current = false;
      setRefreshing(false);
    }
  }, [load]);
  return { refreshing, onRefresh };
}
