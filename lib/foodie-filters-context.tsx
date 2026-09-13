import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { onLocalAccountChange } from '@/lib/account-storage';

import { EMPTY_FOODIE_FILTERS, type FoodieFilters } from '@/components/foodie-filter-bar';

// Un solo filtro compartido entre Mapa y Guardados — filtrar por "tacos" en
// cualquiera de las dos pantallas se refleja en la otra, a petición explícita
// de Alejandro (2026-08-20): son dos vistas del mismo criterio, no dos
// contextos independientes. Montado en la raíz (junto a
// ThemeProvider/TabBarVisibilityProvider) para que sobreviva también al
// router.replace() que remonta cada pantalla al cambiar de pestaña (ver
// bottom-tab-bar.tsx). Se reinicia al cerrar la app o cambiar de cuenta.

type Ctx = { filters: FoodieFilters; setFilters: Dispatch<SetStateAction<FoodieFilters>> };

const FoodieFiltersContext = createContext<Ctx | null>(null);

export function FoodieFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FoodieFilters>(EMPTY_FOODIE_FILTERS);
  useEffect(() => onLocalAccountChange(() => setFilters(EMPTY_FOODIE_FILTERS)), []);
  return <FoodieFiltersContext.Provider value={{ filters, setFilters }}>{children}</FoodieFiltersContext.Provider>;
}

export function useFoodieFilters(): Ctx {
  const ctx = useContext(FoodieFiltersContext);
  if (!ctx) throw new Error('useFoodieFilters debe usarse dentro de FoodieFiltersProvider');
  return ctx;
}
