import * as FileSystem from 'expo-file-system/legacy';

import { getTipoNegocio } from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';

export interface MenuSeccion {
  nombre: string;
  platillos: { nombre: string; descripcion: string }[];
  precioSeccion?: string;
}

export interface MenuVisualResult {
  secciones: MenuSeccion[];
  precio: string;
  error?: string;
}

function isMenuVisualResult(value: unknown): value is MenuVisualResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<MenuVisualResult>;
  return Array.isArray(result.secciones) && typeof result.precio === 'string';
}

export async function leerMenuDeFoto(imageUri: string): Promise<MenuVisualResult> {
  const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { data, error } = await supabase.functions.invoke('read-menu', {
    body: {
      imageBase64,
      mediaType: 'image/jpeg',
      tipo: getTipoNegocio(),
    },
  });

  if (error) throw new Error(error.message || 'No se pudo leer el menú');
  if (!isMenuVisualResult(data)) throw new Error('La lectura devolvió un formato inválido');
  return data;
}
