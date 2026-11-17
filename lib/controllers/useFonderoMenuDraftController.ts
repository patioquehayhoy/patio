import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getDishPhotoCounts, loadCarta, loadRecentMenus, saveCarta, saveMenuHoy } from '@/lib/db';
import { announceMenuPublication } from '@/lib/community-notifications';
import { saveDevPublishedMenu } from '@/lib/demo';
import { getLocalMenus, newMenuDraftId, renameLocalMenu, saveMenuPublication, saveLocalMenu } from '@/lib/menu-history';
import { recordMenuCorrection } from '@/lib/menu-learning';
import {
  cleanAntes,
  clearMenuExtractionSnapshot,
  getMenuExtractionSnapshot,
  makePlatilloId,
  makeSectionId,
  normalizeMenuData,
  setMenuData,
  type MenuData,
  type Platillo,
  type Seccion,
} from '@/lib/menu-store';
import { noWidow } from '@/lib/typography';
import { syncPublishReminder } from '@/lib/local-reminders';
import { getFonditaId } from '@/lib/user-store';
import { cleanMenuPrecios } from '@/lib/menu-prices';
import { cartaByHeading, cartaSignature, joinCarta, splitCarta, withCartaHeading } from '@/lib/menu-carta';
import { compareDishNames, dishKey } from '@/lib/dish-identity';
import { declineDishPair, getDeclinedDishPairs, isDeclinedPair } from '@/lib/dish-links';

/** Sugerencia de unir un platillo nuevo con uno parecido que ya tiene fotos. */
export type DishLinkSuggestion = {
  /** Cómo se llama el otro (el que se muestra en la pregunta). */
  name: string;
  /** Todos sus nombres: pasan a ser otros nombres de este platillo. */
  names: string[];
  foto?: string;
  fotoHash?: string;
  /** Fotos de clientes que pasarían a verse en este platillo. */
  customerPhotos: number;
};

const blankDish = (): Platillo => ({
  id: makePlatilloId(),
  nombre: '',
  descripcion: '',
  precio: '',
});

// El menú nuevo trae un renglón vacío donde espera el cursor; una sección que
// se agrega después nace sin renglones: primero se escribe su título.
const blankSection = (name = 'MENÚ DE HOY', carta = false, withDish = true): Seccion => ({
  id: makeSectionId(),
  nombre: name,
  precio: '',
  platillos: withDish ? [blankDish()] : [],
  ...(carta ? { carta: true } : {}),
});

// Núcleo real de "publicar" — separado del hook para que otras pantallas
// (ej. "Publicar igual" desde Menús, sin pasar por todo el editor) puedan
// escribir un menú como el público de hoy por el mismo camino real, en vez
// de reinventar/duplicar los mismos pasos. Asume `data` ya limpio
// (cleanMenu) y no vacío — el caller decide qué hacer si está vacío.
export async function publishMenuNow(data: MenuData, opts: { source?: 'foto' | 'manual'; nombre?: string; draftId?: string } = {}): Promise<MenuData> {
  // Solo lo de hoy se publica; la carta se guarda aparte (ver el editor).
  const full = cleanMenu(data);
  const clean = splitCarta(full).hoy;
  if (!clean.secciones.length) throw new Error('El menú necesita al menos un platillo.');
  const fonditaId = getFonditaId();
  if (!fonditaId && !__DEV__) throw new Error('Entra a tu cuenta de negocio para publicar.');
  await saveMenuPublication(clean, opts.nombre, opts.draftId ?? newMenuDraftId(), async (saved) => {
  if (!fonditaId && !saved) throw new Error('No se pudo guardar el menú.');
  if (fonditaId) {
    // Solo el guardado remoto confirma que el menú está publicado.
    await saveMenuHoy(fonditaId, clean);
    syncPublishReminder(true).catch(() => {});
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
      try { await recordMenuCorrection(snapshot.menu, full, snapshot.warnings); } catch {}
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
    ...data,
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

const hasAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) > 0;

/**
 * El menú como pizarrón (2026-11-16, Parco): solo secciones con su título y su
 * precio. «MENÚ DEL DÍA $100» es una sección (con o sin platillos debajo) y
 * «CARTA $110» empieza lo de siempre. Los precios del menú de antes
 * (`precios`, también los que lee una foto) pasan a encabezados arriba de lo
 * de hoy; «Incluye…» se quita: lo dicen los platillos de la sección. Una
 * carta sin encabezado recibe «CARTA».
 */
export function boardFromMenu(data: MenuData): MenuData {
  const prices = cleanMenuPrecios(data.precios);
  let secciones = data.secciones;
  if (prices.length) {
    const first = secciones[0];
    // Un solo precio sin nombre y la primera sección sin nombre propio: esa es
    // «MENÚ DEL DÍA $100». Si no, cada precio es su encabezado arriba.
    if (prices.length === 1 && !prices[0].nombre && first && !first.carta && !first.precio.trim()
      && (!first.nombre.trim() || /^men[uú] de hoy$/i.test(first.nombre.trim()))) {
      secciones = [{ ...first, nombre: 'MENÚ DEL DÍA', precio: prices[0].precio }, ...secciones.slice(1)];
    } else {
      const headings = prices.map((price): Seccion => ({
        id: makeSectionId(),
        nombre: (price.nombre || 'MENÚ DEL DÍA').toUpperCase().slice(0, 40),
        precio: price.precio,
        platillos: [],
      }));
      secciones = [...headings, ...secciones];
    }
  }
  const cartaAt = secciones.findIndex((section) => section.carta);
  if (cartaAt >= 0) {
    secciones = [...secciones.slice(0, cartaAt), ...withCartaHeading(secciones.slice(cartaAt), makeSectionId)];
  }
  const { incluye: _incluye, ...rest } = data;
  return { ...rest, precios: [], secciones: cartaByHeading(secciones) };
}

export function cleanMenu(data: MenuData): MenuData {
  return {
    // Siempre presente y vacía: el precio del menú vive en su sección, y un
    // menú nuevo nunca se lee como uno de antes del 14 nov.
    precios: [],
    secciones: data.secciones
      .map((section) => ({
        ...section,
        nombre: section.nombre.trim() || (section.carta ? 'CARTA' : 'MENÚ DE HOY'),
        precio: section.precio.trim(),
        platillos: section.platillos
          .filter((dish) => dish.nombre.trim())
          .map((dish) => ({
            id: dish.id,
            nombre: dish.nombre.trim(),
            descripcion: dish.descripcion.trim(),
            precio: dish.precio.trim(),
            ...(dish.foto ? { foto: dish.foto } : {}),
            ...(dish.foto && dish.fotoHash ? { fotoHash: dish.fotoHash } : {}),
            ...(dish.antes?.length ? { antes: dish.antes } : {}),
          })),
      }))
      // Un encabezado con precio se queda aunque no tenga platillos debajo
      // («MENÚ DEL DÍA $100» y luego SOPAS, GUISADOS…).
      .filter((section) => section.platillos.length || hasAmount(section.precio)),
  };
}

export function useFonderoMenuDraftController(initialData: MenuData, source: 'foto' | 'manual' = 'manual') {
  const [data, setRawData] = useState<MenuData>(() =>
    normalizeDraftPresentation(boardFromMenu(initialData.secciones.length ? initialData : emptyMenu()))
  );
  // Cada cambio vuelve a leer el pizarrón: lo que queda abajo del encabezado
  // de la carta es carta, lo de arriba es lo de hoy.
  const setData = useCallback((update: MenuData | ((current: MenuData) => MenuData)) => {
    setRawData((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      if (next === prev) return prev;
      const secciones = cartaByHeading(next.secciones);
      return secciones.every((section, index) => section === next.secciones[index]) ? next : { ...next, secciones };
    });
  }, []);
  // La carta guardada aparece debajo de lo de hoy, lista para cambiarse. Si
  // el borrador ya la trae (foto del pizarrón o borrador guardado), manda esa.
  // `cartaBase` dice si cambió: solo entonces se vuelve a guardar.
  const cartaBase = useRef<string | null>(null);
  // Lo que había al abrir (o al guardar por última vez): cerrar con cambios
  // pregunta antes de perderlos. Lo de hoy y la carta se comparan aparte
  // porque la carta guardada llega después de abrir.
  const savedBase = useRef<{ hoy: string; carta: string } | null>(null);
  if (!savedBase.current) {
    const split = splitCarta(cleanMenu(data));
    savedBase.current = { hoy: cartaSignature(split.hoy), carta: cartaSignature(split.carta) };
  }
  const savedOnce = useRef(false);

  // Identidad de los platillos (2026-11-15, lib/dish-identity.ts). Lo que se
  // sabe de cada platillo —su foto y sus otros nombres— se recuerda por su
  // llave, no por el texto exacto: «Tacos de pastor» recupera la foto de
  // «Taco al pastor» sola. Aprende de la carta, de los menús guardados en este
  // teléfono y de los publicados en los últimos 60 días (servidor), así
  // funciona aunque el negocio cambie de teléfono. Un nombre parecido a otro
  // con fotos («Pozole rojo» y «Pozole») se sugiere unir; el negocio decide.
  // Quitar una foto la olvida para ese platillo mientras dura la edición.
  type KnownDish = { names: string[]; foto?: string; fotoHash?: string };
  const knownDishes = useRef(new Map<string, KnownDish>());
  const forgottenPhotos = useRef(new Set<string>());
  const customerPhotoCounts = useRef(new Map<string, { name: string; count: number }>());
  const declinedPairs = useRef(new Set<string>());
  // Cambia cuando se aprende algo nuevo: las sugerencias se vuelven a calcular.
  const [identityVersion, setIdentityVersion] = useState(0);
  const rememberDish = useCallback((nombre: string, photo?: { foto?: string; fotoHash?: string }, antes: string[] = []) => {
    const names = [nombre, ...antes].map((name) => name.trim()).filter(Boolean);
    const keys = [...new Set(names.map(dishKey))];
    if (!keys.length) return;
    // Todos los nombres de un mismo platillo comparten lo que se sabe de él.
    const found = keys.map((key) => knownDishes.current.get(key)).filter((item): item is KnownDish => !!item);
    const merged: KnownDish = { names: [] };
    for (const item of [...found, { names, ...(photo?.foto ? { foto: photo.foto, fotoHash: photo.fotoHash } : {}) }]) {
      merged.names = cleanAntes([...merged.names, ...item.names], '__ninguno__');
      if (!merged.foto && item.foto) { merged.foto = item.foto; merged.fotoHash = item.fotoHash; }
    }
    for (const key of new Set([...keys, ...merged.names.map(dishKey)])) knownDishes.current.set(key, merged);
  }, []);
  const learnPhotos = useCallback((menu: MenuData | null | undefined) => {
    for (const section of menu?.secciones ?? []) {
      for (const dish of section.platillos) {
        if (!dish.nombre.trim() || (!dish.foto && !dish.antes?.length)) continue;
        // La primera foto que se aprende manda (el borrador de hoy va primero).
        const known = knownDishes.current.get(dishKey(dish.nombre));
        rememberDish(dish.nombre, known?.foto ? undefined : { foto: dish.foto, fotoHash: dish.fotoHash }, dish.antes);
      }
    }
  }, [rememberDish]);
  const fillKnownPhotos = useCallback(() => {
    setData((prev) => {
      let changed = false;
      const secciones = prev.secciones.map((section) => ({
        ...section,
        platillos: section.platillos.map((dish) => {
          const key = dishKey(dish.nombre);
          const known = key ? knownDishes.current.get(key) : undefined;
          if (!known) return dish;
          let next = dish;
          if (!dish.foto && known.foto && !forgottenPhotos.current.has(key)) {
            next = { ...next, foto: known.foto, ...(known.fotoHash ? { fotoHash: known.fotoHash } : {}) };
          }
          const antes = cleanAntes([...(dish.antes ?? []), ...known.names], dish.nombre);
          if (antes.join('|') !== (dish.antes ?? []).join('|')) next = { ...next, ...(antes.length ? { antes } : {}) };
          if (next !== dish) changed = true;
          return next;
        }),
      }));
      return changed ? { ...prev, secciones } : prev;
    });
    setIdentityVersion((version) => version + 1);
  }, [setData]);
  useEffect(() => {
    let active = true;
    learnPhotos(initialData);
    getLocalMenus()
      .then((list) => {
        if (!active) return;
        list.forEach((entry) => learnPhotos(entry.secciones));
        fillKnownPhotos();
      })
      .catch(() => {});
    const fonditaId = getFonditaId();
    if (fonditaId) {
      loadRecentMenus(fonditaId)
        .then((menus) => {
          if (!active) return;
          menus.forEach((menu) => learnPhotos(normalizeMenuData(menu)));
          fillKnownPhotos();
        })
        .catch(() => {});
      getDishPhotoCounts(fonditaId)
        .then((counts) => {
          if (!active) return;
          customerPhotoCounts.current = counts;
          setIdentityVersion((version) => version + 1);
        })
        .catch(() => {});
    }
    getDeclinedDishPairs()
      .then((pairs) => { if (active) { declinedPairs.current = pairs; setIdentityVersion((version) => version + 1); } })
      .catch(() => {});
    return () => { active = false; };
  }, [initialData, learnPhotos, fillKnownPhotos]);

  // ¿Este platillo nuevo se parece a otro que ya tiene fotos? Solo se sugiere
  // si el otro trae algo (su foto o fotos de clientes) y si el negocio no dijo
  // antes que son distintos.
  const linkSuggestion = useCallback((dish: Platillo): DishLinkSuggestion | null => {
    void identityVersion;
    const name = dish.nombre.trim();
    if (name.length < 3 || dish.antes?.length) return null;
    const ownKey = dishKey(name);
    // Cada platillo conocido (con todos sus nombres) y cada nombre con fotos de clientes.
    const families: { names: string[]; foto?: string; fotoHash?: string }[] = [...new Set(knownDishes.current.values())];
    for (const [key, entry] of customerPhotoCounts.current) {
      if (!knownDishes.current.has(key)) families.push({ names: [entry.name] });
    }
    let best: DishLinkSuggestion | null = null;
    let bestScore = 0;
    for (const family of families) {
      if (family.names.some((other) => dishKey(other) === ownKey)) continue;
      const match = family.names.find((other) => compareDishNames(name, other) === 'maybe' && !isDeclinedPair(declinedPairs.current, name, other));
      if (!match) continue;
      const customers = family.names.reduce((sum, other) => sum + (customerPhotoCounts.current.get(dishKey(other))?.count ?? 0), 0);
      // Solo si trae algo: su foto (si este no tiene) o fotos de clientes.
      const score = (family.foto && !dish.foto ? 1 : 0) + customers;
      if (score > bestScore) {
        bestScore = score;
        best = { name: match, names: family.names, foto: family.foto, fotoHash: family.fotoHash, customerPhotos: customers };
      }
    }
    return best;
  }, [identityVersion]);
  // «Sí, es el mismo»: el platillo guarda el otro nombre (sus fotos de clientes
  // se juntan en la ficha) y, si no tenía foto, toma la suya.
  const linkDish = useCallback((sectionId: string, dishId: string, suggestion: DishLinkSuggestion) => {
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((section) => section.id !== sectionId ? section : {
        ...section,
        platillos: section.platillos.map((dish) => {
          if (dish.id !== dishId) return dish;
          const antes = cleanAntes([...(dish.antes ?? []), ...suggestion.names], dish.nombre);
          const photo = !dish.foto && suggestion.foto ? { foto: suggestion.foto, ...(suggestion.fotoHash ? { fotoHash: suggestion.fotoHash } : {}) } : {};
          rememberDish(dish.nombre, dish.foto ? { foto: dish.foto, fotoHash: dish.fotoHash } : suggestion.foto ? { foto: suggestion.foto, fotoHash: suggestion.fotoHash } : undefined, antes);
          return { ...dish, ...photo, antes };
        }),
      }),
    }));
    setIdentityVersion((version) => version + 1);
  }, [rememberDish, setData]);
  // «No»: son distintos; no se vuelve a sugerir este par.
  const declineLink = useCallback((dish: Platillo, suggestion: DishLinkSuggestion) => {
    void declineDishPair(dish.nombre, suggestion.name).then((pairs) => {
      declinedPairs.current = pairs;
      setIdentityVersion((version) => version + 1);
    });
    declinedPairs.current = new Set([...declinedPairs.current, [dishKey(dish.nombre), dishKey(suggestion.name)].sort().join('|')]);
    setIdentityVersion((version) => version + 1);
  }, []);
  const setDishPhoto = useCallback((sectionId: string, dishId: string, photo: { foto: string; fotoHash?: string } | null) => {
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((section) => section.id !== sectionId ? section : {
        ...section,
        platillos: section.platillos.map((dish) => {
          if (dish.id !== dishId) return dish;
          const key = dishKey(dish.nombre);
          if (photo) {
            forgottenPhotos.current.delete(key);
            // La foto nueva manda para este platillo y sus otros nombres.
            const known = knownDishes.current.get(key);
            if (known) { known.foto = photo.foto; known.fotoHash = photo.fotoHash; }
            else rememberDish(dish.nombre, photo, dish.antes);
            const { fotoHash: _previous, ...base } = dish;
            return { ...base, ...photo };
          }
          forgottenPhotos.current.add(key);
          const { foto: _removed, fotoHash: _removedHash, ...rest } = dish;
          return rest;
        }),
      }),
    }));
  }, [rememberDish, setData]);
  useEffect(() => {
    if (initialData.secciones.some((section) => section.carta)) return;
    const fonditaId = getFonditaId();
    if (!fonditaId) return;
    let active = true;
    loadCarta(fonditaId)
      .then((raw) => {
        const carta = normalizeMenuData(raw);
        if (!active || !carta?.secciones.length) return;
        const withHeading = { ...carta, secciones: withCartaHeading(carta.secciones, makeSectionId) };
        cartaBase.current = cartaSignature(splitCarta(cleanMenu(joinCarta({ secciones: [] }, withHeading))).carta);
        setData((prev) => {
          if (prev.secciones.some((section) => section.carta)) return prev;
          if (savedBase.current) savedBase.current = { ...savedBase.current, carta: cartaBase.current ?? '' };
          return joinCarta(prev, withHeading);
        });
        learnPhotos(carta);
        fillKnownPhotos();
      })
      .catch(() => {});
    return () => { active = false; };
  }, [initialData, learnPhotos, fillKnownPhotos, setData]);
  const draftId = useRef(initialData.localDraftId ?? newMenuDraftId()).current;
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
      ...prev,
      secciones: prev.secciones.map((section) => section.id === id ? { ...section, ...patch } : section),
    }));
  }, [setData]);

  const patchDish = useCallback((sectionId: string, dishId: string, patch: Partial<Platillo>) => {
    setData((prev) => ({
      ...prev,
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
  }, [setData]);

  // Deshacer (2026-11-15, Parco: «lo borré y me arrepentí»): lo último que
  // se borró —sección o platillo— se puede regresar a su lugar. Se ofrece
  // hasta que la persona lo regresa, lo cierra o borra otra cosa.
  const [lastRemoved, setLastRemoved] = useState<
    | { kind: 'section'; section: Seccion; index: number }
    | { kind: 'dish'; sectionId: string; dish: Platillo; index: number }
    | null
  >(null);

  const removeDish = useCallback((sectionId: string, dishId: string) => {
    const section = data.secciones.find((item) => item.id === sectionId);
    const index = section?.platillos.findIndex((dish) => dish.id === dishId) ?? -1;
    const dish = section && index >= 0 ? section.platillos[index] : null;
    // Un renglón vacío se quita sin ofrecer deshacer.
    if (dish && (dish.nombre.trim() || dish.descripcion.trim() || dish.precio.trim() || dish.foto)) {
      setLastRemoved({ kind: 'dish', sectionId, dish, index });
    }
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((item) =>
        item.id === sectionId ? { ...item, platillos: item.platillos.filter((entry) => entry.id !== dishId) } : item
      ),
    }));
  }, [data.secciones, setData]);

  const undoRemove = useCallback(() => {
    const removed = lastRemoved;
    if (!removed) return;
    setLastRemoved(null);
    setData((prev) => {
      if (removed.kind === 'section') {
        if (prev.secciones.some((section) => section.id === removed.section.id)) return prev;
        const secciones = [...prev.secciones];
        secciones.splice(Math.min(removed.index, secciones.length), 0, removed.section);
        return { ...prev, secciones };
      }
      return {
        ...prev,
        secciones: prev.secciones.map((section) => {
          if (section.id !== removed.sectionId || section.platillos.some((dish) => dish.id === removed.dish.id)) return section;
          const platillos = [...section.platillos];
          platillos.splice(Math.min(removed.index, platillos.length), 0, removed.dish);
          return { ...section, platillos };
        }),
      };
    });
  }, [lastRemoved, setData]);

  const dismissUndo = useCallback(() => setLastRemoved(null), []);

  // Arrastrar en el pizarrón (2026-11-16): un platillo va a cualquier lugar,
  // también a otra sección o a la carta; una sección se mueve completa. El
  // índice de destino cuenta sin el que se mueve.
  const moveDishTo = useCallback((dishId: string, toSectionId: string, toIndex: number) => {
    setData((prev) => {
      const from = prev.secciones.find((section) => section.platillos.some((dish) => dish.id === dishId));
      const dish = from?.platillos.find((item) => item.id === dishId);
      if (!from || !dish || !prev.secciones.some((section) => section.id === toSectionId)) return prev;
      const without = prev.secciones.map((section) => section.id === from.id
        ? { ...section, platillos: section.platillos.filter((item) => item.id !== dishId) }
        : section);
      const secciones = without.map((section) => {
        if (section.id !== toSectionId) return section;
        const at = Math.max(0, Math.min(toIndex, section.platillos.length));
        return { ...section, platillos: [...section.platillos.slice(0, at), dish, ...section.platillos.slice(at)] };
      });
      return { ...prev, secciones };
    });
  }, [setData]);
  const moveSectionTo = useCallback((sectionId: string, toIndex: number) => {
    setData((prev) => {
      const section = prev.secciones.find((item) => item.id === sectionId);
      if (!section) return prev;
      const rest = prev.secciones.filter((item) => item.id !== sectionId);
      const at = Math.max(0, Math.min(toIndex, rest.length));
      return { ...prev, secciones: [...rest.slice(0, at), section, ...rest.slice(at)] };
    });
  }, [setData]);

  // «siguiente» en un platillo abre el renglón de abajo, en la misma sección.
  const insertDishAfter = useCallback((sectionId: string, afterDishId: string | null): string => {
    const dish = blankDish();
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((section) => {
        if (section.id !== sectionId) return section;
        const at = afterDishId ? section.platillos.findIndex((item) => item.id === afterDishId) + 1 : section.platillos.length;
        const platillos = [...section.platillos];
        platillos.splice(Math.max(0, at), 0, dish);
        return { ...section, platillos };
      }),
    }));
    return dish.id;
  }, [setData]);

  const removeSection = useCallback((id: string) => {
    const target = data.secciones.find((section) => section.id === id);
    if (!target?.carta && data.secciones.filter((section) => !section.carta).length === 1) {
      Alert.alert('Tu menú necesita una sección');
      return;
    }
    const index = data.secciones.findIndex((section) => section.id === id);
    if (target && target.platillos.some((dish) => dish.nombre.trim()) ) setLastRemoved({ kind: 'section', section: target, index });
    setData((prev) => ({ ...prev, secciones: prev.secciones.filter((section) => section.id !== id) }));
  }, [data.secciones, setData]);

  const addDish = useCallback((section: Seccion): string => {
    const dish = blankDish();
    patchSection(section.id, { platillos: [...section.platillos, dish] });
    return dish.id;
  }, [patchSection]);

  const addSection = useCallback((nombre?: string, carta = false) => {
    // Sin nombre sugerido: la sección nace vacía y el placeholder "SECCIÓN"
    // del campo guía al Fondero — nunca simular contenido con "SECCIÓN 6".
    // Una sección de hoy entra antes de la carta; una de la carta, al final.
    const section = blankSection(nombre ?? '', carta, false);
    setData((prev) => {
      if (carta) return { ...prev, secciones: [...prev.secciones, section] };
      const firstCarta = prev.secciones.findIndex((item) => item.carta);
      const at = firstCarta < 0 ? prev.secciones.length : firstCarta;
      return { ...prev, secciones: [...prev.secciones.slice(0, at), section, ...prev.secciones.slice(at)] };
    });
    return section.id;
  }, [setData]);

  // Guardar sin publicar («Listo» en el editor): para el fondero que ajusta su
  // menú de mañana o sube un precio, sin anunciarlo todavía. Publicar sigue
  // siendo el acto final.
  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) return false;
    const clean = cleanMenu(data);
    if (!splitCarta(clean).hoy.secciones.some((section) => section.platillos.length)) {
      Alert.alert(noWidow('Nada que guardar'), noWidow('Escribe al menos un platillo de hoy.'));
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
      const split = splitCarta(clean);
      savedBase.current = { hoy: cartaSignature(split.hoy), carta: cartaSignature(split.carta) };
      savedOnce.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return true;
    } finally {
      savingRef.current = false;
    }
  }, [data, nombre, draftId]);

  // La carta se guarda al publicar y solo si cambió. Si falla, lo de hoy
  // ya quedó publicado: se avisa sin deshacerlo.
  const saveCartaIfChanged = useCallback(async (clean: MenuData): Promise<boolean> => {
    const fonditaId = getFonditaId();
    if (!fonditaId) return true;
    const { carta } = splitCarta(clean);
    const signature = cartaSignature(carta);
    if (signature === (cartaBase.current ?? cartaSignature({ secciones: [] }))) return true;
    try {
      await saveCarta(fonditaId, carta);
      cartaBase.current = signature;
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * ¿Se perdería algo al cerrar? Lo que cambió desde que se abrió o se guardó;
   * un menú leído de una foto cuenta como nuevo hasta guardarlo (la lectura cuesta).
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    const split = splitCarta(cleanMenu(data));
    const hasContent = split.hoy.secciones.length > 0 || split.carta.secciones.length > 0;
    if (source === 'foto' && !savedOnce.current) return hasContent;
    const base = savedBase.current;
    return !!base && (cartaSignature(split.hoy) !== base.hoy || cartaSignature(split.carta) !== base.carta);
  }, [data, source]);
  /** Hay al menos un platillo de hoy: se puede guardar sin publicar. */
  const canSaveDraft = useMemo(() => splitCarta(cleanMenu(data)).hoy.secciones.some((section) => section.platillos.length), [data]);

  const publish = useCallback(async () => {
    if (savingRef.current) return;
    const clean = cleanMenu(data);
    if (!splitCarta(clean).hoy.secciones.length) {
      Alert.alert(noWidow('Falta el menú'), noWidow('Escribe al menos un platillo de hoy para publicarlo.'));
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
      const cartaSaved = await saveCartaIfChanged(clean);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/menu-publicado');
      if (!cartaSaved) Alert.alert(noWidow('Tu menú ya está publicado'), noWidow('La carta no se guardó. Ábrela otra vez y publica cuando tengas conexión.'));
    } catch {
      Alert.alert(noWidow('No se pudo publicar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      savingRef.current = false;
      setPublishing(false);
    }
  }, [data, nombre, source, draftId, saveCartaIfChanged]);

  return {
    addDish,
    addSection,
    canSaveDraft,
    data,
    declineLink,
    dismissUndo,
    fillKnownPhotos,
    hasUnsavedChanges,
    insertDishAfter,
    lastRemoved,
    linkDish,
    linkSuggestion,
    moveDishTo,
    moveSectionTo,
    nombre,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    saveDraft,
    saveNombre,
    setDishPhoto,
    setNombre,
    undoRemove,
  };
}
