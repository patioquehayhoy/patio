import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import {
  makePlatilloId,
  makeSectionId,
  type MenuData,
} from '@/lib/menu-store';
import { leerMenuDeFoto, type MenuSeccion } from '@/lib/vision';

export type FotoMenuState = 'idle' | 'processing' | 'review';

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
        precio: '',
      })),
    })),
  };
}

export function useFotoMenuController() {
  const [state, setState] = useState<FotoMenuState>('idle');
  const [menu, setMenu] = useState<MenuData>({ secciones: [] });

  const analyze = useCallback(async (uri: string) => {
    setState('processing');
    try {
      const ImageManipulator = await import('expo-image-manipulator');
      const normalized = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const result = await leerMenuDeFoto(normalized.uri);
      const hasDishes = result.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()));
      if (result.error || !hasDishes) {
        Alert.alert('No pudimos leerlo', 'Prueba con una imagen más clara o escríbelo manualmente.');
        setState('idle');
        return;
      }
      setMenu(visionToMenu(result.secciones, result.precio));
      setState('review');
    } catch {
      Alert.alert('No pudimos leerlo', 'Prueba otra foto o escríbelo manualmente.');
      setState('idle');
    }
  }, []);

  const openCamera = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Cámara desactivada', 'Puedes elegir una foto de tu galería.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    const asset = !result.canceled ? result.assets[0] : null;
    if (asset) await analyze(asset.uri);
  }, [analyze]);

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
