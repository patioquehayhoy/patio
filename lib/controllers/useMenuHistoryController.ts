import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { deleteLocalMenus, getLocalMenus, renameLocalMenu, seedDemoHistory, type LocalMenuEntry } from '@/lib/menu-history';
import { removeFechasFromAllCollections } from '@/lib/menu-collections';
import { normalizeMenuData, setMenuData, type MenuData } from '@/lib/menu-store';
import { localMenuDate } from '@/lib/menu-date';
import { noWidow } from '@/lib/typography';
import { supabase } from '@/lib/supabase';
import { getFonditaId } from '@/lib/user-store';

export type PublishedMenu = LocalMenuEntry;
type RemoteMenu = { fecha: string; secciones: MenuData };

export function mergeMenuHistory(local: LocalMenuEntry[], remote: RemoteMenu[], authoritative = true): PublishedMenu[] {
  const merged = new Map(local.map((menu) => [menu.id, { ...menu, published: authoritative ? false : menu.published }]));
  for (const menu of remote) {
    const existing = local.find((entry) => entry.fecha === menu.fecha && entry.published)
      ?? local.find((entry) => entry.fecha === menu.fecha && JSON.stringify(entry.secciones) === JSON.stringify(menu.secciones));
    const id = existing?.id ?? (merged.has(menu.fecha) ? `remote:${menu.fecha}` : menu.fecha);
    merged.set(id, { ...menu, id, nombre: existing?.nombre, published: true });
  }
  return [...merged.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
}


function summary(menu: MenuData): string {
  return menu.secciones
    .flatMap((section) => section.platillos)
    .map((dish) => dish.nombre.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');
}

export function dateLabel(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

// Racha real de publicación, contada desde el último menú publicado hacia
// atrás — no desde "hoy" a fuerza, para no reventar la racha solo porque
// todavía no publicas hoy. Se rompe si hay más de un día de hueco entre el
// último menú y hoy. Base para el mecanismo de compromiso mutuo Fondero/
// Foodie (The Cold Start Problem, Andrew Chen): el lado difícil de la red
// (Fondero) necesita una razón propia para volver a diario, independiente
// del tamaño de la red — la racha es esa razón, calculada 100% de menús
// reales, nunca de datos sintéticos.
export function computeStreak(fechas: string[]): number {
  const today = localMenuDate();
  const valid = fechas.filter((fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha <= today && Number.isFinite(Date.parse(`${fecha}T00:00:00Z`)));
  const uniqueSorted = Array.from(new Set(valid)).sort().reverse();
  if (!uniqueSorted.length) return 0;
  const dayNumber = (fecha: string) => Date.parse(`${fecha}T00:00:00Z`) / 86400000;
  if (dayNumber(today) - dayNumber(uniqueSorted[0]) > 1) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    if (dayNumber(uniqueSorted[i - 1]) - dayNumber(uniqueSorted[i]) !== 1) break;
    streak++;
  }
  return streak;
}

export function defaultHistoryTitle(menu: PublishedMenu): string {
  // La fecha ya se muestra por separado en la fila (dateLabel) — repetirla
  // aquí era redundante (ley dictada 2026-07-22: quitar la fecha al inicio).
  const dishes = summary(menu.secciones);
  return dishes || 'Menú publicado';
}

export function useMenuHistoryController() {
  const [menus, setMenus] = useState<PublishedMenu[]>([]);
  const [editing, setEditing] = useState<PublishedMenu | null>(null);
  const [draftName, setDraftName] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      await seedDemoHistory();
      const locales = await getLocalMenus();
      const id = getFonditaId();
      let remotos: RemoteMenu[] = [];
      let authoritative = !__DEV__;
      if (id) {
        const { data, error } = await supabase
          .from('menus')
          .select('fecha,secciones')
          .eq('fondita_id', id)
          .order('fecha', { ascending: false })
          .limit(20);
        authoritative = !error;
        remotos = (data ?? []).flatMap((row): RemoteMenu[] => {
          const secciones = normalizeMenuData(row.secciones);
          return secciones && typeof row.fecha === 'string' ? [{ fecha: row.fecha, secciones }] : [];
        });
      }

      const merged = mergeMenuHistory(locales, remotos, authoritative);
      if (active) {
        setMenus(merged);
        setLoading(false);
      }
    };

    void load().catch(() => {
      if (active) {
        setLoading(false);
        Alert.alert(noWidow('No se pudo cargar el historial'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      }
    });
    return () => {
      active = false;
    };
  }, []));

  const reuse = useCallback((menu: PublishedMenu) => {
    setMenuData({ ...menu.secciones, localDraftId: menu.published ? undefined : menu.id });
    router.push({ pathname: '/menu-editar', params: { reuse: '1' } });
  }, []);

  const openRename = useCallback((menu: PublishedMenu) => {
    setEditing(menu);
    setDraftName(menu.nombre ?? defaultHistoryTitle(menu));
  }, []);

  const closeRename = useCallback(() => {
    setEditing(null);
    setDraftName('');
  }, []);

  const saveName = useCallback(async () => {
    if (!editing) return;
    const cleanName = draftName.trim();
    try {
      await renameLocalMenu(editing.id, cleanName, editing.secciones, editing.fecha, editing.published);
    } catch {
      Alert.alert(noWidow('No se pudo guardar el nombre'), noWidow('Inténtalo otra vez.'));
      return;
    }
    setMenus((prev) => prev.map((menu) => (
      menu.id === editing.id ? { ...menu, nombre: cleanName || undefined } : menu
    )));
    closeRename();
  }, [closeRename, draftName, editing]);

  const removeMenus = useCallback(async (ids: string[]) => {
    const fechas = menus.filter((menu) => ids.includes(menu.id) && menu.published).map((menu) => menu.fecha);
    try {
      const id = getFonditaId();
      if (id && fechas.length) {
        const { error } = await supabase.from('menus').delete().eq('fondita_id', id).in('fecha', fechas);
        if (error) throw error;
      }
      await deleteLocalMenus(ids);
      await removeFechasFromAllCollections(ids);
      setMenus((prev) => prev.filter((menu) => !ids.includes(menu.id)));
    } catch {
      Alert.alert(noWidow('No se pudo completar la eliminación'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    }
  }, [menus]);

  const deleteMenu = useCallback((menu: PublishedMenu) => {
    Alert.alert(
      noWidow('Eliminar menú'),
      noWidow(`Se borrará "${menu.nombre || defaultHistoryTitle(menu)}" del historial. No se puede deshacer.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { void removeMenus([menu.id]); } },
      ],
    );
  }, [removeMenus]);

  const deleteMenus = useCallback((fechas: string[]) => {
    if (!fechas.length) return;
    Alert.alert(
      noWidow('Eliminar menús'),
      noWidow(`Se borrarán ${fechas.length} ${fechas.length === 1 ? 'menú' : 'menús'} del historial. No se puede deshacer.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { void removeMenus(fechas); } },
      ],
    );
  }, [removeMenus]);

  const streak = useMemo(() => computeStreak(menus.filter((menu) => menu.published).map((menu) => menu.fecha)), [menus]);

  return {
    closeRename,
    deleteMenu,
    deleteMenus,
    draftName,
    editing,
    loading,
    menus,
    openRename,
    reuse,
    saveName,
    setDraftName,
    streak,
  };
}
