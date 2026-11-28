import { markCartaSections } from '@/lib/menu-carta';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

import {
  clearMenuExtractionSnapshot,
  makePlatilloId,
  makePrecioId,
  makeSectionId,
  setMenuExtractionSnapshot,
  type MenuData,
} from '@/lib/menu-store';
import { noWidow } from '@/lib/typography';
import { leerMenuDeFoto, type MenuSeccion } from '@/lib/vision';

export type FotoMenuState = 'idle' | 'processing' | 'review';

type FotoMenuHandlers = {
  photoSource?: 'camera' | 'library';
  /** El humano canceló la cámara/galería sin foto: salir del flujo. */
  onExit?: () => void;
  /** Eligió escribir el menú a mano tras un fallo de lectura. */
  onManual?: () => void;
};

/** Hojas por lectura: una carta larga de restaurante cabe en una sola vez. */
export const MAX_PAGES = 6;

function visionSize(width?: number, height?: number): { width: number; height: number } | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const maxEdge = 1568;
  const maxTokens = 1568;
  const fits = (w: number, h: number) =>
    Math.ceil(w / 28) * 28 <= maxEdge
    && Math.ceil(h / 28) * 28 <= maxEdge
    && Math.ceil(w / 28) * Math.ceil(h / 28) <= maxTokens;

  if (fits(width, height)) return { width, height };

  let low = 1;
  let high = Math.max(width, height);
  const landscape = width >= height;
  const ratio = width / height;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    const candidateWidth = landscape ? middle : Math.max(1, Math.round(middle * ratio));
    const candidateHeight = landscape ? Math.max(1, Math.round(middle / ratio)) : middle;
    if (fits(candidateWidth, candidateHeight)) low = middle;
    else high = middle;
  }

  return landscape
    ? { width: low, height: Math.max(1, Math.round(low / ratio)) }
    : { width: Math.max(1, Math.round(low * ratio)), height: low };
}

function visionToMenu(sections: MenuSeccion[], menuPrice: string, menuPrices: { nombre: string; precio: string }[] = []): MenuData {
  const price = (value?: string) => {
    const matches = (value ?? '').match(/\d+(?:[.,]\d{1,2})?/g) ?? [];
    // Dos cifras suelen ser tamaños/variantes. No las concatenamos: deben
    // permanecer en la descripción para que la persona las confirme.
    if (matches.length !== 1) return '';
    return matches[0].replace(',', '.');
  };
  const clean = (value: string) => value
    .replace(/\((?:men[uú]|menu)\)/gi, '')
    .replace(/\b(?:men[uú]|menu)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const cleanDescription = (value: string) => clean(value)
    .replace(/^opciones(?:\s+de\s+(?:preparaci[oó]n|relleno))?\s*:\s*/i, '')
    .replace(/^opciones\s*:\s*/i, '')
    .trim();
  const descriptionPrice = (value: string) => {
    const matches = [...value.matchAll(/\$\s*(\d+(?:[.,]\d{1,2})?)/g)];
    return matches.length === 1 ? matches[0][1].replace(',', '.') : '';
  };
  const withoutSinglePrice = (value: string) => {
    if (!descriptionPrice(value)) return value;
    return value.replace(/(?:\s*[·•-]?\s*)?\$\s*\d+(?:[.,]\d{1,2})?\s*[.]?/g, '').trim();
  };

  // Precios del menú (2026-11-14): varias formas de cobrarlo si la foto las
  // trae; si no, el precio general. El proveedor puede clasificar un precio
  // alineado con la primera sección como general o como de sección: si no
  // hay otro precio del menú, ese también es el del día.
  const named = menuPrices
    .map((item) => ({ nombre: clean(item.nombre), precio: price(item.precio) }))
    .filter((item) => item.precio);
  const general = price(menuPrice);
  const firstSectionAsDay = !named.length && !general ? price(sections[0]?.precioSeccion) : '';
  const precios = (named.length ? named : general || firstSectionAsDay ? [{ nombre: '', precio: general || firstSectionAsDay }] : [])
    .map((item) => ({ id: makePrecioId(), ...item }));

  return {
    precios,
    // Lo que va desde «CARTA» hacia abajo es la carta (lo de siempre).
    secciones: markCartaSections(sections.map((section, index) => ({
      id: makeSectionId(),
      nombre: (clean(section.nombre) || 'MENÚ DE HOY').toUpperCase(),
      precio: index === 0 && firstSectionAsDay ? '' : price(section.precioSeccion),
      platillos: section.platillos.map((dish) => {
        const description = cleanDescription(dish.descripcion ?? '');
        const extractedPrice = price(dish.precio) || descriptionPrice(description);
        return {
        id: makePlatilloId(),
        nombre: clean(dish.nombre),
        descripcion: cleanDescription(withoutSinglePrice(description)),
        precio: extractedPrice,
        confianza: dish.confianza,
        revision: dish.requiereRevision && !/precio|\$|importe/i.test(dish.motivoRevision ?? '')
          ? (dish.motivoRevision?.trim() || 'Revisa este platillo.')
          : undefined,
        };
      }),
    }))),
  };
}

export function useFotoMenuController(handlers?: FotoMenuHandlers) {
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [state, setState] = useState<FotoMenuState>('idle');
  const [menu, setMenu] = useState<MenuData>({ secciones: [] });
  // analyze necesita volver a preparar la cámara desde el Alert sin ciclo de deps.
  const prepareCameraRef = useRef<() => Promise<boolean>>(async () => false);
  const choosePhotoRef = useRef<() => Promise<void>>(async () => {});
  // Cancelación humana durante la lectura (HIG: no obligar a esperar una
  // animación/proceso sin salida). Aborta la petición e ignora resultados tardíos.
  const requestRef = useRef(0);
  const readAbort = useRef<AbortController | null>(null);
  const pickerOpenRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; requestRef.current += 1; readAbort.current?.abort(); };
  }, []);

  // Una o varias hojas del mismo menú (una carta de cuatro hojas se lee junta).
  const analyzePages = useCallback(async (pages: { uri: string; width?: number; height?: number }[]) => {
    if (!mountedRef.current) return;
    const request = ++requestRef.current;
    readAbort.current?.abort();
    const abort = new AbortController();
    readAbort.current = abort;
    const started = Date.now();
    clearMenuExtractionSnapshot();
    setState('processing');
    try {
      const ImageManipulator = await import('expo-image-manipulator');
      // Preparamos exactamente una imagen que cabe en los límites visuales del
      // modelo. Así las coordenadas y el texto no cambian por un segundo resize
      // silencioso dentro del proveedor.
      const normalized = await Promise.all(pages.map(({ uri, width, height }) => {
        const target = visionSize(width, height);
        return ImageManipulator.manipulateAsync(
          uri,
          target ? [{ resize: target }] : [{ resize: { width: 1568 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
      }));
      if (request !== requestRef.current) return;
      if (__DEV__) console.info('[foto-menu] preparar imagen ms:', Date.now() - started, 'hojas:', pages.length);
      const result = await leerMenuDeFoto(normalized.map((page) => page.uri), abort.signal);
      if (request !== requestRef.current) return;
      const hasDishes = result.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()));
      if (result.error || !hasDishes) throw new Error(result.error || 'sin platillos');
      const extractedMenu = visionToMenu(result.secciones, result.precio, result.precios);
      setMenuExtractionSnapshot({
        menu: extractedMenu,
        warnings: result.advertencias ?? [],
      });
      setMenu(extractedMenu);
      setState('review');
    } catch (error) {
      if (request !== requestRef.current) return;
      console.warn('[foto-menu] lectura falló:', error);
      clearMenuExtractionSnapshot();
      setState('idle');
      if (error instanceof Error && error.name === 'AIServiceError' && (error as { status?: number }).status === 401) {
        // Sin cuenta, otra foto tampoco se leería: lo útil es entrar.
        Alert.alert(noWidow('Entra a tu negocio'), noWidow(error.message), [
          { text: 'Entrar', onPress: () => router.push('/fondero-acceso') },
          { text: 'Escribirlo a mano', onPress: () => handlersRef.current?.onManual?.() },
          { text: 'Ahora no', style: 'cancel', onPress: () => handlersRef.current?.onExit?.() },
        ]);
        return;
      }
      Alert.alert(noWidow('No pudimos leerlo'), noWidow(error instanceof Error && error.name === 'AIServiceError' ? error.message : 'Prueba con otra foto o escríbelo a mano.'), [
        { text: 'Otra foto', onPress: () => {
          if (handlersRef.current?.photoSource === 'library') void choosePhotoRef.current();
          else void prepareCameraRef.current();
        } },
        { text: 'Escribirlo a mano', onPress: () => handlersRef.current?.onManual?.() },
        { text: 'Ahora no', style: 'cancel', onPress: () => handlersRef.current?.onExit?.() },
      ]);
    }
  }, []);
  const analyze = useCallback((uri: string, width?: number, height?: number) => analyzePages([{ uri, width, height }]), [analyzePages]);

  const prepareCamera = useCallback(async (): Promise<boolean> => {
    const request = requestRef.current;
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!mountedRef.current || request !== requestRef.current) return false;
      setCameraAllowed(permissionResult.granted);
      if (!permissionResult.granted) {
        Alert.alert(noWidow('La cámara está desactivada'), noWidow('Puedes elegir la foto desde tus fotos o activar la cámara en Ajustes.'), [
          { text: 'Elegir de Fotos', onPress: () => { void choosePhotoRef.current(); } },
          { text: 'Abrir Ajustes', onPress: () => { void Linking.openSettings().catch(() => {}); handlersRef.current?.onExit?.(); } },
          { text: 'Ahora no', style: 'cancel', onPress: () => handlersRef.current?.onExit?.() },
        ]);
        return false;
      }
      setState('idle');
      return true;
    } catch {
      if (!mountedRef.current || request !== requestRef.current) return false;
      setCameraAllowed(false);
      Alert.alert(noWidow('No se pudo abrir la cámara'), noWidow('Puedes elegir una foto de tu galería.'), [
        { text: 'Elegir de Fotos', onPress: () => { void choosePhotoRef.current(); } },
        { text: 'Ahora no', style: 'cancel', onPress: () => handlersRef.current?.onExit?.() },
      ]);
      return false;
    }
  }, []);

  prepareCameraRef.current = prepareCamera;

  const choosePhoto = useCallback(async () => {
    if (pickerOpenRef.current) return;
    pickerOpenRef.current = true;
    const request = requestRef.current;
    try {
      // El selector nativo da acceso solo a las imágenes elegidas. Varias, en
      // orden, son las hojas de un mismo menú (una carta de cuatro hojas).
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: true, selectionLimit: MAX_PAGES, orderedSelection: true });
      if (!mountedRef.current || request !== requestRef.current) return;
      const assets = !result.canceled ? result.assets ?? [] : [];
      if (assets.length) await analyzePages(assets.slice(0, MAX_PAGES).map((asset) => ({ uri: asset.uri, width: asset.width, height: asset.height })));
      else handlersRef.current?.onExit?.();
    } catch {
      if (!mountedRef.current || request !== requestRef.current) return;
      Alert.alert(noWidow('No se pudo abrir Fotos'), noWidow('Inténtalo otra vez.'), [
        { text: 'Reintentar', onPress: () => { void choosePhotoRef.current(); } },
        { text: 'Ahora no', style: 'cancel', onPress: () => handlersRef.current?.onExit?.() },
      ]);
    } finally {
      pickerOpenRef.current = false;
    }
  }, [analyzePages]);

  choosePhotoRef.current = choosePhoto;

  const cancelRead = useCallback(() => {
    requestRef.current += 1;
    readAbort.current?.abort();
    clearMenuExtractionSnapshot();
    setState('idle');
    handlersRef.current?.onExit?.();
  }, []);

  return {
    cameraAllowed,
    cancelRead,
    choosePhoto,
    menu,
    analyzePhoto: analyze,
    analyzePages,
    prepareCamera,
    state,
  };
}
