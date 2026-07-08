import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { saveMenuHoy } from '@/lib/db';
import { saveDevPublishedMenu } from '@/lib/demo';
import { saveLocalMenu } from '@/lib/menu-history';
import {
  makePlatilloId,
  makeSectionId,
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
  return { secciones: [blankSection()] };
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

  const addDish = useCallback((section: Seccion) => {
    patchSection(section.id, { platillos: [...section.platillos, blankDish()] });
  }, [patchSection]);

  const addSection = useCallback(() => {
    setData((prev) => ({
      secciones: [...prev.secciones, blankSection(`SECCIÓN ${prev.secciones.length + 1}`)],
    }));
  }, []);

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
    details,
    moveSection,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    revealDetails,
    sectionActions,
    toggleCollapsed,
    toggleSectionActions,
  };
}
