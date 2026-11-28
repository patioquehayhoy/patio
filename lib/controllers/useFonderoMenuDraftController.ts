import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getDishPhotoCounts, loadCarta, loadMenuHoy, loadRecentMenus, saveCarta, saveMenuHoy } from '@/lib/db';
import { localMenuDate } from '@/lib/menu-date';
import { menuNameForDate } from '@/lib/menu-title';
import { announceMenuPublication } from '@/lib/community-notifications';
import { saveDevPublishedMenu } from '@/lib/demo';
import { deleteLocalMenu, getLocalMenus, newMenuDraftId, renameLocalMenu, saveMenuPublication, saveLocalMenu } from '@/lib/menu-history';
import { recordMenuCorrection } from '@/lib/menu-learning';
import {
  canonicalSeccion,
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
import { cartaByHeading, cartaSignature, isCartaHeading, isCartaName, joinCarta, splitCarta, withCartaHeading } from '@/lib/menu-carta';
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

// Una pausa al escribir y el borrador ya quedó guardado. No tan corta: guardar
// lee y escribe todos los menús del teléfono, y no debe tocar a la siguiente letra.
const AUTOSAVE_MS = 1200;

// El menú nuevo trae un renglón vacío donde espera el cursor; una sección que
// se agrega después nace sin renglones: primero se escribe su título.
const blankSection = (name = 'MENÚ DE HOY', carta = false, withDish = true): Seccion => ({
  id: makeSectionId(),
  nombre: name,
  precio: '',
  platillos: withDish ? [blankDish()] : [],
  ...(carta ? { carta: true } : {}),
});

/** Sin título, sin precio y sin nada escrito en sus renglones: no hay qué borrar. */
export function isBlankSection(section: Seccion): boolean {
  return !section.nombre.trim() && !section.precio.trim()
    && section.platillos.every((dish) => !dish.nombre.trim() && !dish.descripcion.trim() && !dish.precio.trim() && !dish.foto);
}

type MovedFrom = { dishId: string; sectionId: string; index: number };

// Mover varios platillos juntos: al final de `targetId`, en el orden en que
// estaban. Una sección sin título ni precio que se queda vacía se va (una
// con título, «MENÚ DEL DÍA $100», se queda: su precio sigue valiendo).
// Devuelve también de dónde salió cada uno, para «Deshacer».
export function moveDishesIn(secciones: Seccion[], ids: Set<string>, targetId: string, fresh: Seccion | null) {
  if (!fresh && !secciones.some((section) => section.id === targetId)) return null;
  const from: MovedFrom[] = [];
  const picked = secciones.flatMap((section) => section.id === targetId ? [] : section.platillos.flatMap((dish, index) => {
    if (!ids.has(dish.id)) return [];
    from.push({ dishId: dish.id, sectionId: section.id, index });
    return [dish];
  }));
  if (!picked.length) return null;
  let next = secciones.map((section) => section.id !== targetId && section.platillos.some((dish) => ids.has(dish.id))
    ? { ...section, platillos: section.platillos.filter((dish) => !ids.has(dish.id)) }
    : section);
  if (fresh) {
    const section = { ...fresh, platillos: picked };
    const firstCarta = next.findIndex((item) => item.carta);
    const at = fresh.carta || firstCarta < 0 ? next.length : firstCarta;
    next = [...next.slice(0, at), section, ...next.slice(at)];
  } else {
    next = next.map((section) => section.id === targetId ? { ...section, platillos: [...section.platillos, ...picked] } : section);
  }
  const before = new Set(secciones.filter((section) => !isBlankSection(section)).map((section) => section.id));
  const dropped: { section: Seccion; index: number }[] = [];
  const kept = next.filter((section) => {
    const goes = section.id !== targetId && before.has(section.id) && isBlankSection(section);
    if (goes) dropped.push({ section, index: secciones.findIndex((item) => item.id === section.id) });
    return !goes;
  });
  return kept.some((section) => !section.carta)
    ? { secciones: kept, from, dropped }
    : { secciones: next, from, dropped: [] };
}

// «Deshacer» de mover: cada platillo vuelve a su sección y a su lugar (con lo
// que se le haya escrito después), regresan las secciones que se fueron por
// quedar vacías y la sección nueva se va si se quedó sin platillos.
export function undoMoveIn(secciones: Seccion[], moved: { toSectionId: string; created: boolean; from: MovedFrom[]; dropped: { section: Seccion; index: number }[] }): Seccion[] {
  const ids = new Set(moved.from.map((item) => item.dishId));
  const current = new Map(secciones.flatMap((section) => section.platillos.filter((dish) => ids.has(dish.id)).map((dish) => [dish.id, dish] as const)));
  let next = secciones.map((section) => section.platillos.some((dish) => ids.has(dish.id))
    ? { ...section, platillos: section.platillos.filter((dish) => !ids.has(dish.id)) }
    : section);
  // La sección nueva sin platillos se va antes de regresar las demás a su lugar.
  if (moved.created) next = next.filter((section) => section.id !== moved.toSectionId || section.platillos.length);
  [...moved.dropped].sort((a, b) => a.index - b.index).forEach(({ section, index }) => {
    if (next.some((item) => item.id === section.id)) return;
    next = [...next.slice(0, index), { ...section, platillos: [] }, ...next.slice(index)];
  });
  next = next.map((section) => {
    const back = moved.from.filter((item) => item.sectionId === section.id && current.has(item.dishId)).sort((a, b) => a.index - b.index);
    if (!back.length) return section;
    const platillos = [...section.platillos];
    back.forEach((item) => platillos.splice(Math.min(item.index, platillos.length), 0, current.get(item.dishId)!));
    return { ...section, platillos };
  });
  return next;
}

// Núcleo real de "publicar" — separado del hook para que otras pantallas
// (ej. "Publicar igual" desde Menús, sin pasar por todo el editor) puedan
// escribir un menú como el público de hoy por el mismo camino real, en vez
// de reinventar/duplicar los mismos pasos. Asume `data` ya limpio
// (cleanMenu) y no vacío — el caller decide qué hacer si está vacío.
export type PublishSchedule = { fecha: string; publishAt: string };

// Con `schedule` (2026-11-21, «dejar listo el menú de mañana»): se guarda para
// ese día y sale solo a esa hora; hasta entonces solo lo ve su dueño y el aviso
// a quienes lo siguen lo manda el servidor a esa hora
// (send-scheduled-publications).
export async function publishMenuNow(data: MenuData, opts: { source?: 'foto' | 'manual'; nombre?: string; draftId?: string; schedule?: PublishSchedule } = {}): Promise<MenuData> {
  // Solo lo de hoy se publica; la carta se guarda aparte (ver el editor).
  const full = cleanMenu(data);
  const clean = splitCarta(full).hoy;
  if (!clean.secciones.length) throw new Error('El menú necesita al menos un platillo.');
  const fonditaId = getFonditaId();
  if (!fonditaId && !__DEV__) throw new Error('Entra a tu cuenta de negocio para publicar.');
  const id = opts.draftId ?? newMenuDraftId();
  const schedule = opts.schedule;
  await saveMenuPublication(clean, opts.nombre, id, async (saved) => {
  if (!fonditaId && !saved) throw new Error('No se pudo guardar el menú.');
  if (fonditaId) {
    // Solo el guardado remoto confirma que el menú está publicado.
    await saveMenuHoy(fonditaId, clean, schedule ? { schedule } : {});
    // Lo programado se anuncia solo a su hora (servidor).
    if (!schedule) {
      announceMenuPublication(fonditaId).catch((error) => {
        if (__DEV__) console.warn('[push] no se pudo anunciar la publicación', error);
      });
    }
  } else if (__DEV__ && !schedule) {
    await saveDevPublishedMenu(clean);
  }
  // El menú en memoria sabe cuál es: «Editar» lo cambia en su lugar
  // («Actualizar»), sin crear otro en Menús; si es programado, sigue
  // programado para su día y su hora.
  setMenuData(schedule
    ? { ...clean, localDraftId: id, localLive: true, localFecha: schedule.fecha, localPublishAt: schedule.publishAt, ...(opts.nombre ? { localNombre: opts.nombre } : {}) }
    : { ...clean, localDraftId: id, localLive: true, localFecha: localMenuDate(), ...(opts.nombre ? { localNombre: opts.nombre } : {}) });
  if (opts.source === 'foto') {
    const snapshot = getMenuExtractionSnapshot();
    if (snapshot) {
      // El aprendizaje es secundario: no convertir una publicación real en
      // un mensaje de fallo si este registro local no se pudo escribir.
      try { await recordMenuCorrection(snapshot.menu, full, snapshot.warnings); } catch {}
      clearMenuExtractionSnapshot();
    }
  }
  }, schedule);
  // Después de guardar en el teléfono, para que el aviso vea el día ya publicado.
  if (fonditaId) syncPublishReminder(!schedule).catch(() => {});
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
const amount = (value: string) => Number(value.replace(/[^0-9.]/g, ''));

/** «MENÚ», «MENÚ DEL DÍA», «COMIDA CORRIDA», «COMPLETO» o sin nombre: el menú del día, sin más. */
function isDayMenuName(name: string): boolean {
  return !name.trim()
    || /^(?:MENU(?: DEL DIA| DE HOY| COMPLETO)?|COMPLETO|COMIDA(?: CORRIDA| DEL DIA| COMPLETA)?)$/.test(canonicalSeccion(name));
}

/**
 * El menú como pizarrón (2026-11-16, Parco): solo secciones con su título y su
 * precio. «MENÚ DEL DÍA $100» es una sección (con o sin platillos debajo) y
 * «CARTA $110» empieza lo de siempre. Los precios del menú de antes
 * (`precios`, también los que lee una foto) pasan a encabezados arriba de lo
 * de hoy; «Incluye…» se quita: lo dicen los platillos de la sección. Una
 * carta sin encabezado recibe «CARTA».
 *
 * Un precio que ya tiene su sección va en ella, nunca como otro encabezado
 * (27 nov, el pizarrón de Parco: salía «MENÚ $100» vacío arriba de «MENÚ DEL
 * DÍA», y «CARTA $110» arriba metía el menú del día dentro de la carta).
 */
export function boardFromMenu(data: MenuData): MenuData {
  let secciones = data.secciones;
  const priceOn = (id: string, precio: string) => {
    secciones = secciones.map((section) => section.id === id && !section.precio.trim() ? { ...section, precio } : section);
  };
  const prices = cleanMenuPrecios(data.precios).filter((price) => {
    // «CARTA $110» cobra la carta: es el precio de su encabezado (al final, donde
    // empieza la carta), no una forma de cobrar el menú del día.
    if (isCartaName(price.nombre)) {
      const carta = secciones.find((section) => isCartaHeading(section.nombre));
      if (carta) priceOn(carta.id, price.precio);
      else secciones = [...secciones, { id: makeSectionId(), nombre: 'CARTA', precio: price.precio, platillos: [], carta: true }];
      return false;
    }
    // «GUISADOS $85» y ya hay una sección GUISADOS de hoy: es su precio.
    const twin = price.nombre
      ? secciones.find((section) => !section.carta && canonicalSeccion(section.nombre) === canonicalSeccion(price.nombre))
      : undefined;
    if (!twin) return true;
    priceOn(twin.id, price.precio);
    return false;
  });
  if (prices.length) {
    const first = secciones[0];
    // Un solo precio del menú del día y la primera sección es el menú del día
    // («MENÚ», «MENÚ DEL DÍA» o sin nombre): es la misma, con su precio. Si no
    // (tiempos, guisados, varias formas de cobrar), cada precio es su
    // encabezado arriba.
    if (prices.length === 1 && isDayMenuName(prices[0].nombre) && first && !first.carta && isDayMenuName(first.nombre)
      && (!first.precio.trim() || amount(first.precio) === amount(prices[0].precio))) {
      const nombre = first.nombre.trim() && !/^men[uú] de hoy$/i.test(first.nombre.trim()) ? first.nombre : 'MENÚ DEL DÍA';
      secciones = [{ ...first, nombre, precio: prices[0].precio }, ...secciones.slice(1)];
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
            ...(dish.agotado ? { agotado: true } : {}),
            ...(typeof dish.vegetariano === 'boolean' ? { vegetariano: dish.vegetariano } : {}),
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
  // Lo que cambia la persona (escribir, mover, eliminar) cuenta para guardar y
  // para «Actualizar». Lo que el sistema completa solo al abrir (las fotos que
  // ya conoce, la carta) es parte de lo que ya había mientras no toque nada:
  // abrir un menú y salir no crea otro ni enciende «Actualizar».
  const touched = useRef(false);
  const applyData = useCallback((update: MenuData | ((current: MenuData) => MenuData), quiet: boolean) => {
    setRawData((prev) => {
      const raw = typeof update === 'function' ? update(prev) : update;
      if (raw === prev) return prev;
      const secciones = cartaByHeading(raw.secciones);
      const next = secciones.every((section, index) => section === raw.secciones[index]) ? raw : { ...raw, secciones };
      if (quiet && !touched.current) {
        const split = splitCarta(cleanMenu(next));
        savedBase.current = { hoy: cartaSignature(split.hoy), carta: cartaSignature(split.carta) };
      }
      return next;
    });
  }, []);
  const setData = useCallback((update: MenuData | ((current: MenuData) => MenuData)) => {
    touched.current = true;
    applyData(update, false);
  }, [applyData]);
  const setDataQuietly = useCallback((update: MenuData | ((current: MenuData) => MenuData)) => applyData(update, true), [applyData]);
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
  // El menú publicado hoy (`localLive`): lo que cambias no se ve en la calle
  // hasta «Actualizar»; no se guarda solo. Lo demás es un borrador que se
  // guarda solo, como una nota.
  const live = initialData.localLive === true && (!initialData.localFecha || initialData.localFecha >= localMenuDate());

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
    setDataQuietly((prev) => {
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
  }, [setDataQuietly]);
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
        setDataQuietly((prev) => {
          if (prev.secciones.some((section) => section.carta)) return prev;
          if (savedBase.current) savedBase.current = { ...savedBase.current, carta: cartaBase.current ?? '' };
          return joinCarta(prev, withHeading);
        });
        learnPhotos(carta);
        fillKnownPhotos();
      })
      .catch(() => {});
    return () => { active = false; };
  }, [initialData, learnPhotos, fillKnownPhotos, setDataQuietly]);
  const draftId = useRef(initialData.localDraftId ?? newMenuDraftId()).current;
  const [publishing, setPublishing] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Título del menú de hoy — funciona como el título de una nota: en blanco
  // muestra el placeholder ("Nuevo menú"/"Revisión"), y en cuanto el fondero
  // le pone nombre, ese nombre queda. Se lee del historial local (mismo
  // campo `nombre` que ya usa Menús para renombrar publicados) para que un
  // menú ya nombrado hoy conserve su título al reabrir el editor.
  const [nombre, updateNombre] = useState(initialData.localNombre || menuNameForDate(localMenuDate()));
  const nombreEdited = useRef(false);
  const savingRef = useRef(false);
  // El nombre que ya está guardado: cambiarlo también cuenta para guardar.
  const savedName = useRef('');
  const setNombre = useCallback((value: string) => {
    nombreEdited.current = true;
    touched.current = true;
    updateNombre(value);
  }, []);
  useEffect(() => {
    let active = true;
    getLocalMenus().then((list) => {
      if (!active || nombreEdited.current) return;
      const today = list.find((menu) => menu.id === draftId);
      savedName.current = today?.nombre?.trim() ?? '';
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
    // `placeholderId`: la sección vacía que quedó en su lugar (era la única de hoy).
    | { kind: 'section'; section: Seccion; index: number; placeholderId?: string }
    | { kind: 'dish'; sectionId: string; dish: Platillo; index: number }
    // Varios platillos a la vez (Seleccionar → Eliminar).
    | { kind: 'dishes'; items: { sectionId: string; dish: Platillo; index: number }[] }
    // Lo último que se movió (Seleccionar → Mover): de dónde salió cada platillo.
    | { kind: 'moved'; toSectionId: string; created: boolean; from: MovedFrom[]; dropped: { section: Seccion; index: number }[] }
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

  // Seleccionar varios (Parco, 28 nov: arrastrar sirve con pocos, pero
  // acomodar diez platillos —cinco sopas, dos bebidas, dos postres— uno por
  // uno se complica). Como «Mover» en Mail o Archivos: los elegidos se van
  // juntos, en el orden en que estaban, al final de la sección que eliges.
  const removeDishes = useCallback((dishIds: string[]) => {
    const ids = new Set(dishIds);
    const items = data.secciones.flatMap((section) => section.platillos
      .map((dish, index) => ({ sectionId: section.id, dish, index }))
      .filter((item) => ids.has(item.dish.id)));
    if (!items.length) return;
    const worth = items.filter((item) => item.dish.nombre.trim() || item.dish.descripcion.trim() || item.dish.precio.trim() || item.dish.foto);
    if (worth.length) setLastRemoved({ kind: 'dishes', items });
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((section) => section.platillos.some((dish) => ids.has(dish.id))
        ? { ...section, platillos: section.platillos.filter((dish) => !ids.has(dish.id)) }
        : section),
    }));
  }, [data.secciones, setData]);

  /** Sin `toSectionId`: una sección nueva (sin título, para escribirlo) con los elegidos. Devuelve su id. */
  const moveDishes = useCallback((dishIds: string[], toSectionId?: string): string | null => {
    const ids = new Set(dishIds);
    const sources = data.secciones.filter((section) => section.platillos.some((dish) => ids.has(dish.id)));
    if (!sources.length) return null;
    // Lo que sale solo de la carta se queda en la carta; si no, va a lo de hoy.
    const fresh = toSectionId ? null : blankSection('', sources.every((section) => section.carta), false);
    const targetId = toSectionId ?? fresh!.id;
    const record = moveDishesIn(data.secciones, ids, targetId, fresh);
    if (!record) return null;
    // «Deshacer» también después de mover (Parco, 28 nov), como Mail.
    setLastRemoved({ kind: 'moved', toSectionId: targetId, created: !!fresh, from: record.from, dropped: record.dropped });
    setData((prev) => ({ ...prev, secciones: moveDishesIn(prev.secciones, ids, targetId, fresh)?.secciones ?? prev.secciones }));
    return targetId;
  }, [data.secciones, setData]);

  const undoRemove = useCallback(() => {
    const removed = lastRemoved;
    if (!removed) return;
    setLastRemoved(null);
    setData((prev) => {
      if (removed.kind === 'moved') return { ...prev, secciones: undoMoveIn(prev.secciones, removed) };
      if (removed.kind === 'dishes') {
        const present = new Set(prev.secciones.flatMap((section) => section.platillos.map((dish) => dish.id)));
        return {
          ...prev,
          secciones: prev.secciones.map((section) => {
            const back = removed.items.filter((item) => item.sectionId === section.id && !present.has(item.dish.id)).sort((a, b) => a.index - b.index);
            if (!back.length) return section;
            const platillos = [...section.platillos];
            back.forEach((item) => platillos.splice(Math.min(item.index, platillos.length), 0, item.dish));
            return { ...section, platillos };
          }),
        };
      }
      if (removed.kind === 'section') {
        if (prev.secciones.some((section) => section.id === removed.section.id)) return prev;
        // El lugar vacío que dejó se va si nadie escribió ahí.
        const secciones = prev.secciones.filter((section) => section.id !== removed.placeholderId || !isBlankSection(section));
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
    const index = data.secciones.findIndex((section) => section.id === id);
    const target = data.secciones[index];
    if (!target) return;
    // La única sección de hoy deja su lugar vacío, listo para escribir (27 nov;
    // antes salía «Tu menú necesita una sección» y no se borraba): arriba de la
    // carta siempre hay dónde va lo de hoy, y la carta nunca pasa a ser el menú.
    const placeholder = !target.carta && data.secciones.filter((section) => !section.carta).length === 1
      ? blankSection('')
      : null;
    if (!isBlankSection(target)) {
      setLastRemoved({ kind: 'section', section: target, index, ...(placeholder ? { placeholderId: placeholder.id } : {}) });
    }
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.flatMap((section) => section.id !== id ? [section] : placeholder ? [placeholder] : []),
    }));
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
   * ¿Qué cambió desde que se abrió o se guardó? En el menú publicado hoy, lo
   * que «Actualizar» llevaría a la calle. Un menú leído de una foto cuenta
   * como nuevo hasta guardarlo (la lectura cuesta).
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    const split = splitCarta(cleanMenu(data));
    const hasContent = split.hoy.secciones.length > 0 || split.carta.secciones.length > 0;
    if (source === 'foto' && !savedOnce.current) return hasContent;
    const base = savedBase.current;
    return !!base && (cartaSignature(split.hoy) !== base.hoy || cartaSignature(split.carta) !== base.carta);
  }, [data, source]);

  // Guardar (2026-11-16, como Notas y Recordatorios; HIG: guardar solo, sin
  // pedirlo): el borrador se guarda mientras escribes y al salir. No hay botón
  // de guardar ni «¿Salir sin guardar?». Nunca escribe encima de un menú ya
  // publicado: ese cambia con «Actualizar».
  const publishedRef = useRef(false);
  const flushQueue = useRef<Promise<boolean>>(Promise.resolve(true));
  const persistDraft = useCallback(async (final: boolean): Promise<boolean> => {
    if (live || publishedRef.current) return true;
    // Sin tocar nada no se guarda (un menú leído de una foto sí: la lectura cuesta).
    if (!touched.current && !(source === 'foto' && !savedOnce.current)) return true;
    const clean = cleanMenu(data);
    const split = splitCarta(clean);
    if (!split.hoy.secciones.some((section) => section.platillos.length)) {
      // Como una nota vacía: si sales con el menú sin platillos, el borrador
      // se va (nunca uno ya publicado).
      if (final) {
        const stored = (await getLocalMenus()).find((menu) => menu.id === draftId);
        if (stored && !stored.published) await deleteLocalMenu(draftId).catch(() => {});
      }
      return true;
    }
    // Abrir un menú y salir sin cambiar nada no crea otro en Menús.
    if (!hasUnsavedChanges() && savedName.current === nombre.trim()) return true;
    // Una sola lectura: si ya está publicado, no se escribe encima (`onlyDraft`).
    setDraftSaveState('saving');
    const ok = await saveLocalMenu(clean, nombre, { id: draftId, onlyDraft: true });
    if (ok) {
      savedBase.current = { hoy: cartaSignature(split.hoy), carta: cartaSignature(split.carta) };
      savedOnce.current = true;
      savedName.current = nombre.trim();
    }
    setDraftSaveState(ok ? 'saved' : 'error');
    return ok;
  }, [data, nombre, draftId, live, source, hasUnsavedChanges]);
  /** Guarda ya lo escrito (al salir, al irse la app al fondo). Uno a la vez. */
  const flushDraft = useCallback((final = false): Promise<boolean> => {
    const run = flushQueue.current.then(() => persistDraft(final), () => persistDraft(final));
    flushQueue.current = run.catch(() => false);
    return run;
  }, [persistDraft]);
  const flushRef = useRef(flushDraft);
  flushRef.current = flushDraft;
  // Mientras escribes: se guarda en cuanto haces una pausa.
  useEffect(() => {
    if (live) return;
    const timer = setTimeout(() => { void flushRef.current(); }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [data, nombre, live]);
  // Al salir de la pantalla (también deslizando hacia atrás).
  useEffect(() => () => { void flushRef.current(true); }, []);

  // Un menú programado que se abre para cambiarlo sigue programado para su día y su hora.
  const keptSchedule: PublishSchedule | undefined = initialData.localFecha && (initialData.localFecha > localMenuDate()
    || (initialData.localFecha === localMenuDate() && !!initialData.localPublishAt && Date.parse(initialData.localPublishAt) > Date.now()))
    ? { fecha: initialData.localFecha, publishAt: initialData.localPublishAt ?? new Date(`${initialData.localFecha}T10:00:00`).toISOString() }
    : undefined;
  const publish = useCallback(async (requested?: PublishSchedule) => {
    // Un toque al botón trae el evento del toque, no un horario.
    const schedule = requested && typeof requested.fecha === 'string' && typeof requested.publishAt === 'string' ? requested : keptSchedule;
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
    // Desde aquí nada se guarda solo encima de la publicación.
    publishedRef.current = true;
    setPublishing(true);
    try {
      const publishName = schedule && nombre === menuNameForDate(localMenuDate()) ? menuNameForDate(schedule.fecha) : nombre;
      await publishMenuNow(clean, { source, nombre: publishName, draftId, schedule });
      const cartaSaved = await saveCartaIfChanged(clean);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Publicar publica y regresa a Menús con el aviso arriba (Parco, 24 nov:
      // antes se abría el póster con «Publicado» y se veía otra vez). Cambiar
      // el de hoy no vuelve a avisar a quienes te siguen (el servidor avisa una
      // vez al día): dice «Actualizado». Lo programado dice cuándo sale.
      router.dismissTo(schedule
        ? { pathname: '/historial', params: { publicado: 'programado', at: schedule.publishAt } }
        : { pathname: '/historial', params: { publicado: live ? 'actualizado' : 'hoy' } });
      if (!cartaSaved) Alert.alert(noWidow('Tu menú ya está publicado'), noWidow('La carta no se guardó. Ábrela otra vez y publica cuando tengas conexión.'));
    } catch (error) {
      publishedRef.current = false;
      if (__DEV__) console.warn('[publicar] fallo al guardar', error);
      Alert.alert(noWidow(live ? 'No se pudo actualizar' : 'No se pudo publicar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      savingRef.current = false;
      setPublishing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, nombre, source, draftId, live, saveCartaIfChanged, initialData.localFecha, initialData.localPublishAt]);

  // «Se acabó» (2026-11-21): en el menú ya publicado (o programado), deslizar
  // un platillo de hoy y tocar «Se acabó» lo marca en la calle al instante, sin
  // «Actualizar» y sin avisar a nadie. Solo cambia esa marca del menú
  // publicado: lo demás que estés cambiando sigue esperando «Actualizar».
  // Varios a la vez (Parco, 28 nov: Seleccionar → «Se acabó»): una sola
  // escritura; si falla, cada uno vuelve a como estaba.
  const setSoldOut = useCallback(async (dishIds: string[], agotado: boolean) => {
    if (!live || !dishIds.length) return;
    const ids = new Set(dishIds);
    const was = new Map(data.secciones.flatMap((section) => section.platillos
      .filter((dish) => ids.has(dish.id))
      .map((dish) => [dish.id, !!dish.agotado] as const)));
    const withMark = (dish: Platillo, value: boolean): Platillo => {
      const { agotado: _was, ...rest } = dish;
      return value ? { ...rest, agotado: true } : rest;
    };
    const mark = (value: (dishId: string) => boolean) => setDataQuietly((prev) => ({
      ...prev,
      secciones: prev.secciones.map((section) => !section.platillos.some((dish) => ids.has(dish.id)) ? section : {
        ...section,
        platillos: section.platillos.map((dish) => ids.has(dish.id) ? withMark(dish, value(dish.id)) : dish),
      }),
    }));
    mark(() => agotado);
    Haptics.selectionAsync().catch(() => {});
    const fonditaId = getFonditaId();
    const fecha = initialData.localFecha ?? localMenuDate();
    try {
      const local = !fonditaId && __DEV__ ? (await getLocalMenus()).find((entry) => entry.id === draftId && entry.published) : null;
      const published = normalizeMenuData(fonditaId ? await loadMenuHoy(fonditaId, fecha) : local?.secciones);
      if (!published) throw new Error('Sin menú publicado');
      const next: MenuData = {
        ...published,
        secciones: published.secciones.map((section) => ({
          ...section,
          platillos: section.platillos.map((dish) => ids.has(dish.id) ? withMark(dish, agotado) : dish),
        })),
      };
      if (fonditaId) {
        await saveMenuHoy(fonditaId, next, { fecha, keepSchedule: true });
      } else if (__DEV__ && local) {
        // La prueba sin cuenta conserva «Se acabó» al salir y volver, sin
        // publicar las otras ediciones que aún esperan «Actualizar».
        await saveDevPublishedMenu(next);
        await saveLocalMenu(next, local.nombre, { id: local.id, fecha: local.fecha, published: true, publishAt: local.publishAt });
      }
    } catch {
      mark((dishId) => was.get(dishId) ?? !agotado);
      Alert.alert(noWidow('No se pudo marcar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    }
  }, [live, data.secciones, setDataQuietly, initialData.localFecha, draftId]);

  // Lo mismo a varios platillos (Seleccionar → «Vegetariano»).
  const patchDishes = useCallback((dishIds: string[], patch: Partial<Platillo>) => {
    const ids = new Set(dishIds);
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((section) => !section.platillos.some((dish) => ids.has(dish.id)) ? section : {
        ...section,
        platillos: section.platillos.map((dish) => ids.has(dish.id) ? { ...dish, ...patch } : dish),
      }),
    }));
  }, [setData]);

  return {
    addDish,
    addSection,
    data,
    draftSaveState,
    declineLink,
    dismissUndo,
    fillKnownPhotos,
    flushDraft,
    hasUnsavedChanges,
    insertDishAfter,
    lastRemoved,
    linkDish,
    linkSuggestion,
    live,
    moveDishTo,
    moveDishes,
    moveSectionTo,
    nombre,
    patchDish,
    patchDishes,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeDishes,
    removeSection,
    saveNombre,
    setDishPhoto,
    setNombre,
    setSoldOut,
    undoRemove,
  };
}
