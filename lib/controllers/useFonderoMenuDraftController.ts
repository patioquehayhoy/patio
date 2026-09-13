import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { saveMenuHoy } from '@/lib/db';
import { announceMenuPublication } from '@/lib/community-notifications';
import { saveDevPublishedMenu } from '@/lib/demo';
import { getLocalMenus, newMenuDraftId, renameLocalMenu, saveMenuPublication, saveLocalMenu } from '@/lib/menu-history';
import { recordMenuCorrection } from '@/lib/menu-learning';
import {
  canonicalSeccion,
  clearMenuExtractionSnapshot,
  getMenuExtractionSnapshot,
  getTipoNegocio,
  makePlatilloId,
  makeSectionId,
  seccionSugerencias,
  setMenuData,
  type MenuData,
  type Platillo,
  type Seccion,
} from '@/lib/menu-store';
import { noWidow } from '@/lib/typography';
import { getFonditaId } from '@/lib/user-store';

const blankDish = (): Platillo => ({
  id: makePlatilloId(),
  nombre: '',
  descripcion: '',
  precio: '',
});

const blankSection = (name = 'MENÚ DE HOY'): Seccion => ({
  id: makeSectionId(),
  nombre: name,
  precio: '',
  platillos: [blankDish()],
});

// Núcleo real de "publicar" — separado del hook para que otras pantallas
// (ej. "Publicar igual" desde Menús, sin pasar por todo el editor) puedan
// escribir un menú como el público de hoy por el mismo camino real, en vez
// de reinventar/duplicar los mismos pasos. Asume `data` ya limpio
// (cleanMenu) y no vacío — el caller decide qué hacer si está vacío.
export async function publishMenuNow(data: MenuData, opts: { source?: 'foto' | 'manual'; nombre?: string; draftId?: string } = {}): Promise<MenuData> {
  const clean = cleanMenu(data);
  if (!clean.secciones.length) throw new Error('El menú necesita al menos un platillo.');
  const fonditaId = getFonditaId();
  if (!fonditaId && !__DEV__) throw new Error('Entra a tu cuenta de negocio para publicar.');
  await saveMenuPublication(clean, opts.nombre, opts.draftId ?? newMenuDraftId(), async (saved) => {
  if (!fonditaId && !saved) throw new Error('No se pudo guardar el menú.');
  if (fonditaId) {
    // Solo el guardado remoto confirma que el menú está publicado.
    await saveMenuHoy(fonditaId, clean);
    announceMenuPublication(fonditaId).catch((error) => {
      if (__DEV__) console.warn('[push] no se pudo anunciar la publicación', error);
    });
  } else if (__DEV__) {
    await saveDevPublishedMenu(clean);
  }
  setMenuData(clean);
  if (opts.source === 'foto') {
    const snapshot = getMenuExtractionSnapshot();
    if (snapshot) {
      // El aprendizaje es secundario: no convertir una publicación real en
      // un mensaje de fallo si este registro local no se pudo escribir.
      try { await recordMenuCorrection(snapshot.menu, clean, snapshot.warnings); } catch {}
      clearMenuExtractionSnapshot();
    }
  }
  });
  return clean;
}

export function emptyMenu(): MenuData {
  // Sin nombre pre-llenado: "MENÚ DE HOY" se leía como contenido ya escrito,
  // no como guía. El placeholder de la primera sección hace ese trabajo.
  return { secciones: [blankSection('')] };
}

function normalizeDraftPresentation(data: MenuData): MenuData {
  return {
    secciones: data.secciones.map((section) => ({
      ...section,
      platillos: section.platillos.map((dish) => ({
        ...dish,
        descripcion: dish.descripcion
          .replace(/^opciones(?:\s+de\s+(?:preparaci[oó]n|relleno))?\s*:\s*/i, '')
          .replace(/^opciones\s*:\s*/i, '')
          .trim(),
        revision: /precio|\$|importe/i.test(dish.revision ?? '') ? undefined : dish.revision,
      })),
    })),
  };
}

export function cleanMenu(data: MenuData): MenuData {
  return {
    secciones: data.secciones
      .map((section) => ({
        ...section,
        nombre: section.nombre.trim() || 'MENÚ DE HOY',
        precio: section.precio.trim(),
        platillos: section.platillos
          .filter((dish) => dish.nombre.trim())
          .map((dish) => ({
            id: dish.id,
            nombre: dish.nombre.trim(),
            descripcion: dish.descripcion.trim(),
            precio: dish.precio.trim(),
          })),
      }))
      .filter((section) => section.platillos.length),
  };
}

export function useFonderoMenuDraftController(initialData: MenuData, source: 'foto' | 'manual' = 'manual') {
  const [data, setData] = useState<MenuData>(() =>
    normalizeDraftPresentation(initialData.secciones.length ? initialData : emptyMenu())
  );
  const draftId = useRef(initialData.localDraftId ?? newMenuDraftId()).current;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const [sectionActions, setSectionActions] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Título del menú de hoy — funciona como el título de una nota: en blanco
  // muestra el placeholder ("Nuevo menú"/"Revisión"), y en cuanto el fondero
  // le pone nombre, ese nombre queda. Se lee del historial local (mismo
  // campo `nombre` que ya usa Menús para renombrar publicados) para que un
  // menú ya nombrado hoy conserve su título al reabrir el editor.
  const [nombre, updateNombre] = useState('');
  const nombreEdited = useRef(false);
  const savingRef = useRef(false);
  const setNombre = useCallback((value: string) => {
    nombreEdited.current = true;
    updateNombre(value);
  }, []);
  useEffect(() => {
    let active = true;
    getLocalMenus().then((list) => {
      if (!active || nombreEdited.current) return;
      const today = list.find((menu) => menu.id === draftId);
      if (today?.nombre) updateNombre(today.nombre);
    });
    return () => { active = false; };
  }, [draftId]);

  // Guarda el título ni bien el fondero sale del campo — igual que Notas: el
  // título de una nota en blanco existe desde que lo escribes, no hasta que
  // guardas el cuerpo. Se llama también al Guardar/Publicar (líneas abajo)
  // para no perder el nombre si esos pasos ocurren primero.
  const saveNombre = useCallback(async () => {
    const clean = cleanMenu(data);
    try {
      // Un blur puede terminar después de Guardar/Publicar. Cambiar sólo el
      // nombre conserva el contenido y la confirmación más recientes; clean
      // sirve de contenido inicial únicamente si el borrador aún no existe.
      await renameLocalMenu(draftId, nombre, clean);
      return true;
    } catch {
      Alert.alert(noWidow('No se pudo guardar el nombre'), noWidow('Inténtalo otra vez.'));
      return false;
    }
  }, [data, nombre, draftId]);

  const patchSection = useCallback((id: string, patch: Partial<Seccion>) => {
    setData((prev) => ({
      secciones: prev.secciones.map((section) => section.id === id ? { ...section, ...patch } : section),
    }));
  }, []);

  const patchDish = useCallback((sectionId: string, dishId: string, patch: Partial<Platillo>) => {
    setData((prev) => ({
      secciones: prev.secciones.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              platillos: section.platillos.map((dish) =>
                dish.id === dishId
                  ? {
                      ...dish,
                      ...patch,
                      ...(patch.nombre !== undefined || patch.descripcion !== undefined || patch.precio !== undefined
                        ? { revision: undefined }
                        : {}),
                    }
                  : dish
              ),
            }
          : section
      ),
    }));
  }, []);

  const removeDish = useCallback((sectionId: string, dishId: string) => {
    setData((prev) => ({
      secciones: prev.secciones.map((section) =>
        section.id === sectionId
          ? { ...section, platillos: section.platillos.filter((dish) => dish.id !== dishId) }
          : section
      ),
    }));
  }, []);

  const moveSection = useCallback((id: string, direction: -1 | 1) => {
    setData((prev) => {
      const next = [...prev.secciones];
      const index = next.findIndex((section) => section.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { secciones: next };
    });
  }, []);

  const removeSection = useCallback((id: string) => {
    if (data.secciones.length === 1) {
      Alert.alert('Tu menú necesita una sección');
      return;
    }
    setData((prev) => ({ secciones: prev.secciones.filter((section) => section.id !== id) }));
  }, [data.secciones.length]);

  const toggleCollapsed = useCallback((sectionId: string) => {
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const toggleSectionActions = useCallback((sectionId: string) => {
    setSectionActions((current) => current === sectionId ? null : sectionId);
  }, []);

  const closeSectionActions = useCallback(() => {
    setSectionActions(null);
  }, []);

  const revealDetails = useCallback((dishId: string) => {
    setDetails((prev) => ({ ...prev, [dishId]: true }));
  }, []);

  const addDish = useCallback((section: Seccion): string => {
    const dish = blankDish();
    patchSection(section.id, { platillos: [...section.platillos, dish] });
    return dish.id;
  }, [patchSection]);

  const addSection = useCallback((nombre?: string) => {
    // Sin nombre sugerido: la sección nace vacía y el placeholder "SECCIÓN"
    // del campo guía al Fondero — nunca simular contenido con "SECCIÓN 6".
    setData((prev) => ({
      secciones: [...prev.secciones, blankSection(nombre ?? '')],
    }));
  }, []);

  // Precio del día: UN precio para el menú de hoy, guardado en la primera
  // sección (el modelo Seccion.precio ya existía; la UI lo eleva a primera
  // clase). Los platillos con precio propio se cobran a la carta — el modelo
  // original de Patio: precio del día + extras coexisten.
  const dayPrice = data.secciones.find((section) => section.precio.trim())?.precio ?? '';

  const setDayPrice = useCallback((precio: string) => {
    const clean = precio.replace(/[^0-9.]/g, '');
    setData((prev) => ({
      secciones: prev.secciones.map((section, index) => ({
        ...section,
        precio: index === 0 ? clean : '',
      })),
    }));
  }, []);

  // Nombres de sección del giro que el fondero todavía no usa hoy. La
  // comparación es canónica: "PRIMER TIEMPO" ya cuenta como "1ER TIEMPO".
  const sectionSuggestions = useMemo(() => {
    const used = new Set(data.secciones.map((section) => canonicalSeccion(section.nombre)));
    return seccionSugerencias(getTipoNegocio()).filter((nombre) => !used.has(canonicalSeccion(nombre)));
  }, [data.secciones]);

  // Guardar sin publicar: para el fondero que ajusta su menú de mañana o sube
  // un precio, sin anunciarlo todavía. Publicar sigue siendo el acto final.
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => { setSavedFlash(false); }, [data, nombre]);
  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) return false;
    const clean = cleanMenu(data);
    if (!clean.secciones.length) {
      Alert.alert(noWidow('Nada que guardar'), noWidow('Escribe al menos un platillo.'));
      return false;
    }
    savingRef.current = true;
    try {
      const ok = await saveLocalMenu(clean, nombre, { id: draftId });
      if (!ok) {
        Alert.alert(noWidow('No se pudo guardar'), noWidow('Inténtalo otra vez.'));
        return false;
      }
      setMenuData(clean);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSavedFlash(true);
      return true;
    } finally {
      savingRef.current = false;
    }
  }, [data, nombre, draftId]);

  const publish = useCallback(async () => {
    if (savingRef.current) return;
    const clean = cleanMenu(data);
    if (!clean.secciones.length) {
      Alert.alert(noWidow('Falta el menú'), noWidow('Escribe al menos un platillo para publicarlo.'));
      return;
    }
    if (!getFonditaId() && !__DEV__) {
      Alert.alert(noWidow('Entra a tu negocio'), noWidow('Inicia sesión para publicar tu menú.'), [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Entrar', onPress: () => router.push('/fondero-acceso') },
      ]);
      return;
    }

    savingRef.current = true;
    setPublishing(true);
    try {
      await publishMenuNow(clean, { source, nombre, draftId });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/menu-publicado');
    } catch {
      Alert.alert(noWidow('No se pudo publicar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      savingRef.current = false;
      setPublishing(false);
    }
  }, [data, nombre, source, draftId]);

  return {
    addDish,
    addSection,
    closeSectionActions,
    collapsed,
    data,
    dayPrice,
    details,
    moveSection,
    nombre,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    revealDetails,
    saveDraft,
    saveNombre,
    savedFlash,
    sectionActions,
    sectionSuggestions,
    setDayPrice,
    setNombre,
    toggleCollapsed,
    toggleSectionActions,
  };
}
