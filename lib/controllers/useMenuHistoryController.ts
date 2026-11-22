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
import { summary } from '@/lib/menu-title';

export type PublishedMenu = LocalMenuEntry;
type RemoteMenu = { fecha: string; secciones: MenuData; publishAt?: string };

/** Estado público por fecha y hora reales; el orden de la biblioteca no lo decide. */
export function menuPublicationState(menu: PublishedMenu, today = localMenuDate(), now = new Date()): 'draft' | 'scheduled' | 'live' | 'previous' {
  if (!menu.published) return 'draft';
  if (menu.fecha > today || (menu.fecha === today && !!menu.publishAt && Date.parse(menu.publishAt) > now.getTime())) return 'scheduled';
  return menu.fecha === today ? 'live' : 'previous';
}

export function mergeMenuHistory(local: LocalMenuEntry[], remote: RemoteMenu[], authoritative = true): PublishedMenu[] {
  const merged = new Map(local.map((menu) => [menu.id, { ...menu, published: authoritative ? false : menu.published }]));
  for (const menu of remote) {
    const existing = local.find((entry) => entry.fecha === menu.fecha && entry.published)
      ?? local.find((entry) => entry.fecha === menu.fecha && JSON.stringify(entry.secciones) === JSON.stringify(menu.secciones));
    const id = existing?.id ?? (merged.has(menu.fecha) ? `remote:${menu.fecha}` : menu.fecha);
    merged.set(id, { ...menu, id, nombre: existing?.nombre, published: true, ...(menu.publishAt ?? existing?.publishAt ? { publishAt: menu.publishAt ?? existing?.publishAt } : {}) });
  }
  return [...merged.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
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

/** «Se acabó» es solo de ese día: una copia para otro día empieza con todo disponible. */
export function withoutSoldOut(data: MenuData): MenuData {
  return {
    ...data,
    secciones: data.secciones.map((section) => ({
      ...section,
      platillos: section.platillos.map(({ agotado: _agotado, ...dish }) => dish),
    })),
  };
}

/**
 * Con qué abre el editor un menú de la lista (2026-11-16): el publicado hoy se
 * cambia en su lugar («Actualizar», sin otro renglón en Menús), igual que uno
 * programado para otro día (2026-11-21); uno publicado otro día se copia como
 * borrador nuevo (sin «Se acabó»); un borrador se sigue escribiendo.
 */
export function editorSeed(menu: PublishedMenu, today = localMenuDate()): MenuData {
  if (menu.published && menu.fecha === today) return { ...menu.secciones, localDraftId: menu.id, localLive: true, localFecha: menu.fecha, ...(menu.publishAt ? { localPublishAt: menu.publishAt } : {}) };
  if (menu.published && menu.fecha > today) {
    return { ...menu.secciones, localDraftId: menu.id, localLive: true, localFecha: menu.fecha, ...(menu.publishAt ? { localPublishAt: menu.publishAt } : {}) };
  }
  return { ...withoutSoldOut(menu.secciones), localDraftId: menu.published ? undefined : menu.id };
}

export function defaultHistoryTitle(menu: PublishedMenu): string {
  // La fecha ya se muestra por separado en la fila (dateLabel) — repetirla
  // aquí era redundante (ley dictada 2026-07-22: quitar la fecha al inicio).
  const dishes = summary(menu.secciones);
  return dishes || 'Menú publicado';
}

/** Los menús del teléfono y los del servidor, juntos y más nuevos primero. */
export async function loadMenuHistory(): Promise<PublishedMenu[]> {
  await seedDemoHistory();
  const locales = await getLocalMenus();
  const id = getFonditaId();
  let remotos: RemoteMenu[] = [];
  let authoritative = !__DEV__;
  if (id) {
    const { data, error } = await supabase
      .from('menus')
      .select('fecha,secciones,publish_at')
      .eq('negocio_id', id)
      .order('fecha', { ascending: false })
      .limit(20);
    authoritative = !error;
    remotos = (data ?? []).flatMap((row): RemoteMenu[] => {
      const secciones = normalizeMenuData(row.secciones);
      const publishAt = typeof row.publish_at === 'string' ? row.publish_at : undefined;
      return secciones && typeof row.fecha === 'string' ? [{ fecha: row.fecha, secciones, ...(publishAt ? { publishAt } : {}) }] : [];
    });
  }
  return mergeMenuHistory(locales, remotos, authoritative);
}

/**
 * Con qué abre el editor el aviso «¿Ya publicaste lo de hoy?» (2026-11-21):
 * el último menú publicado, como borrador nuevo (o el de hoy, si ya salió).
 * Sin ninguno publicado, el borrador más reciente; si no hay nada, null.
 */
export function latestMenuSeed(menus: PublishedMenu[], today = localMenuDate()): MenuData | null {
  // Lo de hoy o lo último publicado antes; uno programado para otro día no es «lo de hoy».
  const current = menus.filter((menu) => menu.fecha <= today);
  const latest = current.find((menu) => menu.published) ?? current[0];
  return latest ? editorSeed(latest, today) : null;
}

export function useMenuHistoryController() {
  const [menus, setMenus] = useState<PublishedMenu[]>([]);
  const [editing, setEditing] = useState<PublishedMenu | null>(null);
  const [draftName, setDraftName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const merged = await loadMenuHistory();
      if (isActive()) {
        setMenus(merged);
        setLoading(false);
      }
    } catch {
      if (isActive()) {
        setLoading(false);
        Alert.alert(noWidow('No se pudo cargar el historial'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    void load(() => active);
    return () => {
      active = false;
    };
  }, [load]));

  const reuse = useCallback((menu: PublishedMenu) => {
    setMenuData(editorSeed(menu));
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
    if (!editing) return false;
    const cleanName = draftName.trim();
    try {
      await renameLocalMenu(editing.id, cleanName, editing.secciones, editing.fecha, editing.published);
    } catch {
      Alert.alert(noWidow('No se pudo guardar el nombre'), noWidow('Inténtalo otra vez.'));
      return false;
    }
    setMenus((prev) => prev.map((menu) => (
      menu.id === editing.id ? { ...menu, nombre: cleanName || undefined } : menu
    )));
    closeRename();
    return true;
  }, [closeRename, draftName, editing]);

  const removeMenus = useCallback(async (ids: string[]) => {
    const fechas = menus.filter((menu) => ids.includes(menu.id) && menu.published).map((menu) => menu.fecha);
    try {
      const id = getFonditaId();
      if (id && fechas.length) {
        const { error } = await supabase.from('menus').delete().eq('negocio_id', id).in('fecha', fechas);
        if (error) throw error;
      }
      await deleteLocalMenus(ids);
      await removeFechasFromAllCollections(ids);
      setMenus((prev) => prev.filter((menu) => !ids.includes(menu.id)));
      return true;
    } catch {
      Alert.alert(noWidow('No se pudo completar la eliminación'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      return false;
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

  const deleteMenus = useCallback((fechas: string[], onDeleted?: () => void) => {
    if (!fechas.length) return;
    Alert.alert(
      noWidow('Eliminar menús'),
      noWidow(`Se borrarán ${fechas.length} ${fechas.length === 1 ? 'menú' : 'menús'} del historial. No se puede deshacer.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { void removeMenus(fechas).then((deleted) => { if (deleted) onDeleted?.(); }); } },
      ],
    );
  }, [removeMenus]);

  const streak = useMemo(() => computeStreak(menus.filter((menu) => menu.published).map((menu) => menu.fecha)), [menus]);

  return {
    refresh: () => load(),
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
