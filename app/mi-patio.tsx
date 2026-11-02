import { DEV_MY_PATIO_ID } from '@/lib/demo';
import { getFonditaId } from '@/lib/menu-store';
import { PatioDetailView } from './patio/[id]';

// Pestaña «Mi Patio»: la ficha pública del negocio, tal como la ve la gente.
export default function MiPatioScreen() {
  return <PatioDetailView id={getFonditaId() || (__DEV__ ? DEV_MY_PATIO_ID : undefined)} own />;
}
