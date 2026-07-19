import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  makePlatilloId,
  makeSectionId,
  type MenuData,
} from '@/lib/menu-store';
import { leerMenuDeFoto, type MenuSeccion } from '@/lib/vision';

export type FotoMenuState = 'idle' | 'processing' | 'review';

type FotoMenuHandlers = {
  /** El humano canceló la cámara/galería sin foto: salir del flujo. */
  onExit?: () => void;
  /** Eligió escribir el menú a mano tras un fallo de lectura. */
  onManual?: () => void;
};

function visionToMenu(sections: MenuSeccion[], menuPrice: string): MenuData {
  const price = (value?: string) => (value ?? '').replace(/[^0-9.]/g, '');
  const clean = (value: string) => value
    .replace(/\((?:men[uú]|menu)\)/gi, '')
    .replace(/\b(?:men[uú]|menu)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    secciones: sections.map((section, index) => ({
      id: makeSectionId(),
      nombre: clean(section.nombre) || 'MENÚ DE HOY',
      precio: index === 0 ? price(menuPrice) : price(section.precioSeccion),
      platillos: section.platillos.map((dish) => ({
        id: makePlatilloId(),
        nombre: clean(dish.nombre),
        descripcion: clean(dish.descripcion ?? ''),
        precio: price(dish.precio),
      })),
    })),
  };
}

export function useFotoMenuController(handlers?: FotoMenuHandlers) {
  const [state, setState] = useState<FotoMenuState>('idle');
  const [menu, setMenu] = useState<MenuData>({ secciones: [] });
  // analyze necesita relanzar la cámara desde el Alert sin ciclo de deps.
  const openCameraRef = useRef<() => Promise<void>>(async () => {});

  const analyze = useCallback(async (uri: string) => {
    setState('processing');
    try {
      const ImageManipulator = await import('expo-image-manipulator');
      // Redimensionar es obligatorio: una foto de cámara (12MP, ~4MB) excede
      // el límite de imagen de la API de visión y truena la lectura completa.
      // 1600px de ancho conserva el texto del menú legible y pesa ~300KB.
      const normalized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const result = await leerMenuDeFoto(normalized.uri);
      const hasDishes = result.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()));
      if (result.error || !hasDishes) throw new Error(result.error || 'sin platillos');
      setMenu(visionToMenu(result.secciones, result.precio));
      setState('review');
    } catch (error) {
      console.warn('[foto-menu] lectura falló:', error);
      setState('idle');
      Alert.alert('No pudimos leerlo', 'Prueba con otra foto o escríbelo a mano.', [
        { text: 'Escribirlo a mano', onPress: () => handlers?.onManual?.() },
        { text: 'Otra foto', onPress: () => { void openCameraRef.current(); } },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCamera = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      // Sin permiso de cámara: la galería nativa es el plan B.
      const lib = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      const libAsset = !lib.canceled ? lib.assets[0] : null;
      if (libAsset) await analyze(libAsset.uri);
      else handlers?.onExit?.();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    const asset = !result.canceled ? result.assets[0] : null;
    if (asset) await analyze(asset.uri);
    else handlers?.onExit?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyze]);

  openCameraRef.current = openCamera;

  const choosePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Fotos desactivadas', 'Activa el permiso para elegir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    const asset = !result.canceled ? result.assets[0] : null;
    if (asset) await analyze(asset.uri);
    else handlers?.onExit?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyze]);

  const resetToIdle = useCallback(() => {
    setState('idle');
  }, []);

  return {
    choosePhoto,
    menu,
    openCamera,
    resetToIdle,
    state,
  };
}
