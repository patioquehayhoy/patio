import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { saveMenuHoy } from '@/lib/db';
import { saveDevPublishedMenu } from '@/lib/demo';
import { saveLocalMenu } from '@/lib/menu-history';
import {
  canonicalSeccion,
  getTipoNegocio,
  makePlatilloId,
  makeSectionId,
  seccionSugerencias,
  setMenuData,
  type MenuData,
  type Platillo,
  type Seccion,
} from '@/lib/menu-store';
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

export function emptyMenu(): MenuData {
  // Sin nombre pre-llenado: "MENÚ DE HOY" se leía como contenido ya escrito,
  // no como guía. El placeholder de la primera sección hace ese trabajo.
  return { secciones: [blankSection('')] };
}

function cleanMenu(data: MenuData): MenuData {
  return {
    secciones: data.secciones
      .map((section) => ({
        ...section,
        nombre: section.nombre.trim() || 'MENÚ DE HOY',
        precio: section.precio.trim(),
        platillos: section.platillos
          .filter((dish) => dish.nombre.trim())
          .map((dish) => ({
            ...dish,
            nombre: dish.nombre.trim(),
            descripcion: dish.descripcion.trim(),
            precio: dish.precio.trim(),
          })),
      }))
      .filter((section) => section.platillos.length),
  };
}

export function useFonderoMenuDraftController(initialData: MenuData) {
  const [data, setData] = useState<MenuData>(() =>
    initialData.secciones.length ? initialData : emptyMenu()
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const [sectionActions, setSectionActions] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const patchSection = useCallback((id: string, patch: Partial<Seccion>) => {
    setData((prev) => ({
      secciones: prev.secciones.map((section) => section.id === id ? { ...section, ...patch } : section),
    }));
  }, []);

  const patchDish = useCallback((sectionId: string, dishId: string, patch: Partial<Platillo>) => {
    setData((prev) => ({
      secciones: prev.secciones.map((section) =>
        section.id === sectionId
          ? { ...section, platillos: section.platillos.map((dish) => dish.id === dishId ? { ...dish, ...patch } : dish) }
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
  const saveDraft = useCallback(async () => {
    const clean = cleanMenu(data);
    if (!clean.secciones.length) {
      Alert.alert('Nada que guardar', 'Escribe al menos un platillo.');
      return;
    }
    setMenuData(clean);
    const ok = await saveLocalMenu(clean);
    if (!ok) {
      Alert.alert('No se pudo guardar', 'Inténtalo otra vez.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }, [data]);

  const publish = useCallback(async () => {
    if (publishing) return;
    const clean = cleanMenu(data);
    if (!clean.secciones.length) {
      Alert.alert('Falta el menú', 'Escribe al menos un platillo para publicarlo.');
      return;
    }

    setPublishing(true);
    try {
      setMenuData(clean);
      await saveLocalMenu(clean);
      if (__DEV__) await saveDevPublishedMenu(clean);
      const fonditaId = getFonditaId();
      if (fonditaId) await saveMenuHoy(fonditaId, clean);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/menu-publicado');
    } catch {
      Alert.alert('No se pudo publicar', 'Revisa tu conexión e inténtalo otra vez.');
      setPublishing(false);
    }
  }, [data, publishing]);

  return {
    addDish,
    addSection,
    collapsed,
    data,
    dayPrice,
    details,
    moveSection,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    revealDetails,
    saveDraft,
    savedFlash,
    sectionActions,
    sectionSuggestions,
    setDayPrice,
    toggleCollapsed,
    toggleSectionActions,
  };
}
