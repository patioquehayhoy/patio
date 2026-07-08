import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getLocalMenus, renameLocalMenu, seedDemoHistory } from '@/lib/menu-history';
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

export function defaultHistoryTitle(menu: PublishedMenu): string {
  const dishes = summary(menu.secciones);
  return dishes ? `${dateLabel(menu.fecha)} · ${dishes}` : `${dateLabel(menu.fecha)} · Menú publicado`;
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

  return {
    closeRename,
    draftName,
    editing,
    loading,
    menus,
    openRename,
    reuse,
    saveName,
    setDraftName,
  };
}
