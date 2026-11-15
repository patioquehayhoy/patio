import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type * as ImagePicker from 'expo-image-picker';

import { canonicalDishName } from './menu-store';
import { supabase } from './supabase';

export { pickPlacePhoto as pickDishPhoto, PlacePhotoPermissionError as DishPhotoPermissionError } from './place-photo';

// Foto de un platillo (2026-11-15): se ve en la ficha al mantener presionado
// el platillo. 1200 px por el lado largo alcanza para la vista grande.
const LONG_SIDE = 1200;

/** Foto de una reseña (de un cliente): misma medida, en su propia carpeta. */
export async function uploadReviewPhoto(uri: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('auth');
  const image = await manipulateAsync(uri, [{ resize: { width: LONG_SIDE } }], { compress: 0.8, format: SaveFormat.JPEG });
  const bytes = await new File(image.uri).arrayBuffer();
  const path = `${auth.user.id}/${Date.now().toString(36)}.jpg`;
  const bucket = supabase.storage.from('review-photos');
  const upload = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (upload.error) throw upload.error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Sube la foto a la carpeta del dueño. Regresa la URL pública. */
export async function uploadDishPhoto(asset: Pick<ImagePicker.ImagePickerAsset, 'uri' | 'width' | 'height'>, dishName: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('auth');
  const landscape = (asset.width ?? 0) >= (asset.height ?? 0);
  const resize = landscape ? { width: Math.min(LONG_SIDE, asset.width || LONG_SIDE) } : { height: Math.min(LONG_SIDE, asset.height || LONG_SIDE) };
  const image = await manipulateAsync(asset.uri, [{ resize }], { compress: 0.8, format: SaveFormat.JPEG });
  const bytes = await new File(image.uri).arrayBuffer();
  const slug = canonicalDishName(dishName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'platillo';
  // Nombre único: cambiar la foto nunca deja la anterior en caché.
  const path = `${auth.user.id}/${slug}-${Date.now().toString(36)}.jpg`;
  const bucket = supabase.storage.from('dish-photos');
  const upload = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (upload.error) throw upload.error;
  return bucket.getPublicUrl(path).data.publicUrl;
}
