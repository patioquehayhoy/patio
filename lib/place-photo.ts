import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type PlacePhotoSource = 'camera' | 'library';

// La foto del lugar (alta y «Editar mi negocio»): la ve la gente arriba de la
// ficha. Se guarda tal cual la tomó la persona, a 1600 px por el lado largo;
// cada pantalla la acomoda a su marco.
const LONG_SIDE = 1600;

export class PlacePhotoPermissionError extends Error {}

/** Abre la cámara o Fotos. Regresa null si la persona cancela. */
export async function pickPlacePhoto(source: PlacePhotoSource): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PlacePhotoPermissionError(source);
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  return result.canceled ? null : result.assets?.[0] ?? null;
}

/** Sube la foto a la carpeta del dueño y la guarda en su negocio. Regresa la URL pública. */
export async function uploadPlacePhoto(negocioId: string, asset: Pick<ImagePicker.ImagePickerAsset, 'uri' | 'width' | 'height'>): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('auth');
  const landscape = (asset.width ?? 0) >= (asset.height ?? 0);
  const resize = landscape ? { width: Math.min(LONG_SIDE, asset.width || LONG_SIDE) } : { height: Math.min(LONG_SIDE, asset.height || LONG_SIDE) };
  const image = await manipulateAsync(asset.uri, [{ resize }], { compress: 0.8, format: SaveFormat.JPEG });
  const bytes = await new File(image.uri).arrayBuffer();
  const path = `${auth.user.id}/${negocioId}.jpg`;
  const bucket = supabase.storage.from('place-photos');
  const upload = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (upload.error) throw upload.error;
  // `?v=` evita que el teléfono siga mostrando la foto anterior.
  const url = `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase.from('negocios').update({ foto_url: url }).eq('id', negocioId);
  if (error) throw error;
  return url;
}

/** Quita la foto: la ficha vuelve a su foto de siempre. */
export async function removePlacePhoto(negocioId: string): Promise<void> {
  const { error } = await supabase.from('negocios').update({ foto_url: null }).eq('id', negocioId);
  if (error) throw error;
}
