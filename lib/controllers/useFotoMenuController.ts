import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

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
  // analyze necesita relanzar la cámara/galería desde el Alert sin ciclo de deps.
  const openCameraRef = useRef<() => Promise<void>>(async () => {});
  const choosePhotoRef = useRef<() => Promise<void>>(async () => {});
  // Cancelación humana durante la lectura (HIG: no obligar a esperar una
  // animación/proceso sin salida). La promesa en vuelo se ignora al volver.
  const cancelledRef = useRef(false);

  const analyze = useCallback(async (uri: string) => {
    cancelledRef.current = false;
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
      if (cancelledRef.current) return;
      const hasDishes = result.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()));
      if (result.error || !hasDishes) throw new Error(result.error || 'sin platillos');
      setMenu(visionToMenu(result.secciones, result.precio));
      setState('review');
    } catch (error) {
      if (cancelledRef.current) return;
      console.warn('[foto-menu] lectura falló:', error);
      setState('idle');
      Alert.alert('No pudimos leerlo', 'Prueba con otra foto o escríbelo a mano.', [
        { text: 'Otra foto', onPress: () => { void openCameraRef.current(); } },
        { text: 'Escribirlo a mano', onPress: () => handlers?.onManual?.() },
        { text: 'Ahora no', style: 'cancel', onPress: () => handlers?.onExit?.() },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCamera = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      // Sin permiso: explicar y dar control (HIG Privacy) — nunca saltar a
      // otra fuente sin avisar.
      Alert.alert('La cámara está desactivada', 'Puedes elegir la foto desde tus fotos o activar la cámara en Ajustes.', [
        { text: 'Elegir de Fotos', onPress: () => { void choosePhotoRef.current(); } },
        { text: 'Abrir Ajustes', onPress: () => { void Linking.openSettings(); handlers?.onExit?.(); } },
        { text: 'Ahora no', style: 'cancel', onPress: () => handlers?.onExit?.() },
      ]);
      return;
    }
    // Sin allowsEditing: forzaba un recorte cuadrado que mutila un menú
    // vertical. La cámara nativa conserva su confirmación Repetir/Usar foto
    // y la lectura recibe la foto completa (mismo criterio que la galería).
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    const asset = !result.canceled ? result.assets[0] : null;
    if (asset) await analyze(asset.uri);
    else handlers?.onExit?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyze]);

  openCameraRef.current = openCamera;

  const choosePhoto = useCallback(async () => {
    // El selector del sistema (PHPicker / Photo Picker) corre fuera del
    // proceso y no necesita permiso — pedirlo solo agregaba un diálogo.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    const asset = !result.canceled ? result.assets[0] : null;
    if (asset) await analyze(asset.uri);
    else handlers?.onExit?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyze]);

  choosePhotoRef.current = choosePhoto;

  const cancelRead = useCallback(() => {
    cancelledRef.current = true;
    setState('idle');
    handlers?.onExit?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cancelRead,
    choosePhoto,
    menu,
    openCamera,
    state,
  };
}
