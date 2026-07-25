import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MenuData } from '@/lib/menu-store';

const MENU_CORRECTIONS_KEY = '@patio_menu_corrections_v1';
const MAX_LOCAL_RECORDS = 100;

export type MenuCorrectionRecord = {
  createdAt: string;
  extracted: MenuData;
  published: MenuData;
  warnings: string[];
  changed: boolean;
};

function comparable(data: MenuData): string {
  return JSON.stringify({
    secciones: data.secciones.map((section) => ({
      nombre: section.nombre.trim(),
      precio: section.precio.trim(),
      platillos: section.platillos.map((dish) => ({
        nombre: dish.nombre.trim(),
        descripcion: dish.descripcion.trim(),
        precio: dish.precio.trim(),
      })),
    })),
  });
}

export async function recordMenuCorrection(
  extracted: MenuData,
  published: MenuData,
  warnings: string[] = []
): Promise<void> {
  const record: MenuCorrectionRecord = {
    createdAt: new Date().toISOString(),
    extracted,
    published,
    warnings,
    changed: comparable(extracted) !== comparable(published),
  };

  try {
    const raw = await AsyncStorage.getItem(MENU_CORRECTIONS_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const safe = Array.isArray(current) ? current : [];
    await AsyncStorage.setItem(
      MENU_CORRECTIONS_KEY,
      JSON.stringify([record, ...safe].slice(0, MAX_LOCAL_RECORDS))
    );
  } catch (error) {
    if (__DEV__) console.warn('[menu-learning] no se guardó la corrección', error);
  }
}
