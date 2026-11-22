import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type * as ImagePicker from 'expo-image-picker';

import { canonicalDishName } from './menu-store';
import { photoHashFromBase64 } from './photo-hash';
import { supabase } from './supabase';

export { pickPlacePhoto as pickDishPhoto, PlacePhotoPermissionError as DishPhotoPermissionError } from './place-photo';

// Foto de un platillo (2026-11-15): se ve en la ficha al mantener presionado
// el platillo o al abrir sus fotos. 1200 px por el lado largo alcanza para la
// vista grande; calidad 0.72 deja cada foto en ~150 KB sin que se note.
const LONG_SIDE = 1200;
const QUALITY = 0.72;
// Cada foto tiene nombre único y nunca cambia: el CDN y el teléfono la pueden
// guardar un año en vez de una hora (lo que pone Supabase si no se dice).
const IMMUTABLE = '31536000';

export type UploadedPhoto = { url: string; /** ThumbHash en hexadecimal (lib/photo-hash.ts). */ hash?: string };

/** Lado largo a 1200 sin agrandar las chicas; vertical u horizontal. */
function resizeFor(width: number, height: number) {
  return width >= height ? { width: Math.min(LONG_SIDE, width || LONG_SIDE) } : { height: Math.min(LONG_SIDE, height || LONG_SIDE) };
}

/** Vista previa instantánea; si el teléfono no la puede calcular, la foto sube igual. */
async function hashOf(uri: string): Promise<string | undefined> {
  try { return photoHashFromBase64(await Image.generateThumbhashAsync(uri)); } catch { return undefined; }
}

/** Foto de una reseña (de un cliente): misma medida, en su propia carpeta. */
export async function uploadReviewPhoto(uri: string): Promise<UploadedPhoto> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('auth');
  const original = await manipulateAsync(uri, []);
  const image = await manipulateAsync(uri, [{ resize: resizeFor(original.width, original.height) }], { compress: QUALITY, format: SaveFormat.JPEG });
  const hash = await hashOf(image.uri);
  const bytes = await new File(image.uri).arrayBuffer();
  // Varias fotos suben a la vez: el nombre lleva algo al azar para no chocar.
  const path = `${auth.user.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const bucket = supabase.storage.from('review-photos');
  const upload = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: false, cacheControl: IMMUTABLE });
  if (upload.error) throw upload.error;
  return { url: bucket.getPublicUrl(path).data.publicUrl, hash };
}

/** Sube la foto a la carpeta del dueño. Regresa la URL pública y su vista previa. */
export async function uploadDishPhoto(asset: Pick<ImagePicker.ImagePickerAsset, 'uri' | 'width' | 'height'>, dishName: string): Promise<UploadedPhoto> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('auth');
  const image = await manipulateAsync(asset.uri, [{ resize: resizeFor(asset.width ?? 0, asset.height ?? 0) }], { compress: QUALITY, format: SaveFormat.JPEG });
  const hash = await hashOf(image.uri);
  const bytes = await new File(image.uri).arrayBuffer();
  const slug = canonicalDishName(dishName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'platillo';
  // Nombre único: cambiar la foto nunca deja la anterior en caché.
  const path = `${auth.user.id}/${slug}-${Date.now().toString(36)}.jpg`;
  const bucket = supabase.storage.from('dish-photos');
  const upload = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: false, cacheControl: IMMUTABLE });
  if (upload.error) throw upload.error;
  return { url: bucket.getPublicUrl(path).data.publicUrl, hash };
}
