import { useSyncExternalStore } from 'react';

// Estado chico fuera de una pantalla grande (2026-11-15). Abrir las fotos de
// un platillo o el vistazo cambiaba un estado de toda la ficha, y la ficha
// entera (menú, reseñas, mapa) se volvía a pintar en cada toque: con menús
// largos se sentía lento. Con esto solo se pinta lo que lo usa.

export type Store<T> = {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

/** Se vuelve a pintar solo cuando cambia lo que elige `select` (un valor simple o el mismo objeto). */
export function useStore<T, S>(store: Store<T>, select: (value: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}
