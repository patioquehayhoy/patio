import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { deleteLocalMenu, deleteLocalMenus, getLocalMenus, renameLocalMenu, seedDemoHistory } from '@/lib/menu-history';
import { removeFechasFromAllCollections } from '@/lib/menu-collections';
import { setMenuData, type MenuData } from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';
import { getFonditaId } from '@/lib/user-store';

export type PublishedMenu = { fecha: string; secciones: MenuData; nombre?: string };

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
  const uniqueSorted = Array.from(new Set(fechas)).sort().reverse();
  if (uniqueSorted.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mostRecent = new Date(`${uniqueSorted[0]}T12:00:00`);
  const gapFromToday = Math.round((today.getTime() - mostRecent.getTime()) / 86400000);
  if (gapFromToday > 1) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(`${uniqueSorted[i - 1]}T12:00:00`);
    const curr = new Date(`${uniqueSorted[i]}T12:00:00`);
    if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) streak++;
    else break;
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
      let remotos: PublishedMenu[] = [];
      if (id) {
        const { data } = await supabase
          .from('menus')
          .select('fecha,secciones')
          .eq('fondita_id', id)
          .order('fecha', { ascending: false })
          .limit(20);
        remotos = (data ?? []) as PublishedMenu[];
      }

      const porFecha = new Map<string, PublishedMenu>();
      for (const menu of locales) porFecha.set(menu.fecha, menu);
      for (const menu of remotos) {
        const local = porFecha.get(menu.fecha);
        porFecha.set(menu.fecha, { ...menu, nombre: menu.nombre ?? local?.nombre });
      }
      const merged = [...porFecha.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 20);
      if (active) {
        setMenus(merged);
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []));

  const reuse = useCallback((menu: MenuData) => {
    setMenuData(menu);
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
    await renameLocalMenu(editing.fecha, cleanName, editing.secciones);
    setMenus((prev) => prev.map((menu) => (
      menu.fecha === editing.fecha ? { ...menu, nombre: cleanName || undefined } : menu
    )));
    closeRename();
  }, [closeRename, draftName, editing]);

  const deleteMenu = useCallback((menu: PublishedMenu) => {
    Alert.alert(
      'Eliminar menú',
      `Se borrará "${menu.nombre || defaultHistoryTitle(menu)}" del historial. No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteLocalMenu(menu.fecha);
            await removeFechasFromAllCollections([menu.fecha]);
            const id = getFonditaId();
            if (id) await supabase.from('menus').delete().eq('fondita_id', id).eq('fecha', menu.fecha);
            setMenus((prev) => prev.filter((m) => m.fecha !== menu.fecha));
          },
        },
      ],
    );
  }, []);

  const deleteMenus = useCallback((fechas: string[]) => {
    Alert.alert(
      'Eliminar menús',
      `Se borrarán ${fechas.length} ${fechas.length === 1 ? 'menú' : 'menús'} del historial. No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteLocalMenus(fechas);
            await removeFechasFromAllCollections(fechas);
            const id = getFonditaId();
            if (id) await supabase.from('menus').delete().eq('fondita_id', id).in('fecha', fechas);
            setMenus((prev) => prev.filter((m) => !fechas.includes(m.fecha)));
          },
        },
      ],
    );
  }, []);

  const streak = useMemo(() => computeStreak(menus.map((menu) => menu.fecha)), [menus]);

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
