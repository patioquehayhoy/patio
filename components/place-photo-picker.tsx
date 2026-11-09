import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ActionSheet, type ActionSheetOption } from '@/components/action-sheet';
import { PlacePhotoPermissionError, pickPlacePhoto, removePlacePhoto, uploadPlacePhoto, type PlacePhotoSource } from '@/lib/place-photo';
import { Radius } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Colors = { surface: string; border: string; text: string; textSecondary: string };

/**
 * La foto del lugar en su marco 16:9, igual en el alta y en «Editar mi
 * negocio». Al elegirla se sube en ese momento: no depende de «Guardar».
 */
export function PlacePhotoPicker({ negocioId, photoUrl, onChange, colors }: {
  negocioId: string | null;
  photoUrl: string | null;
  onChange: (url: string | null) => void;
  colors: Colors;
}) {
  const frame = useRef<View>(null);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  const choose = async (source: PlacePhotoSource) => {
    setMenu(false);
    if (!negocioId) {
      Alert.alert(noWidow('Primero entra a tu negocio'), noWidow('Inicia sesión para poner la foto de tu lugar.'));
      return;
    }
    try {
      const asset = await pickPlacePhoto(source);
      if (!asset) return;
      setBusy(true);
      onChange(await uploadPlacePhoto(negocioId, asset));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      if (error instanceof PlacePhotoPermissionError) {
        Alert.alert(
          noWidow(source === 'camera' ? 'Patio no tiene acceso a la cámara' : 'Patio no tiene acceso a tus fotos'),
          noWidow('Puedes darle permiso en Ajustes.'),
          [{ text: 'Ahora no', style: 'cancel' }, { text: 'Abrir Ajustes', onPress: () => { Linking.openSettings().catch(() => {}); } }],
        );
      } else {
        Alert.alert(noWidow('No pudimos subir la foto'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    setMenu(false);
    if (!negocioId) return;
    Alert.alert(noWidow('¿Quitar la foto?'), noWidow('Tu ficha vuelve a su foto de siempre.'), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive', onPress: () => {
          setBusy(true);
          removePlacePhoto(negocioId).then(() => onChange(null))
            .catch(() => Alert.alert(noWidow('No pudimos quitar la foto'), noWidow('Revisa tu conexión e inténtalo otra vez.')))
            .finally(() => setBusy(false));
        },
      },
    ]);
  };

  const options: ActionSheetOption[] = [
    { label: 'Tomar foto', icon: 'camera-outline', onPress: () => { void choose('camera'); } },
    { label: 'Elegir de Fotos', icon: 'images-outline', onPress: () => { void choose('library'); } },
    ...(photoUrl ? [{ label: 'Quitar foto', icon: 'trash-outline' as const, destructive: true, onPress: remove }] : []),
  ];

  return (
    <>
      <TouchableOpacity
        ref={frame}
        activeOpacity={0.85}
        disabled={busy}
        onPress={() => setMenu(true)}
        accessibilityRole="button"
        accessibilityLabel={photoUrl ? 'Cambiar la foto de tu lugar' : 'Tomar foto o elegir de Fotos'}
        accessibilityState={{ busy }}
        style={[s.frame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View style={s.empty}>
            <Ionicons name="camera-outline" size={26} color={colors.textSecondary} />
            <Text style={[s.emptyText, { color: colors.text }]} allowFontScaling={true}>{noWidow('Tomar foto o elegir de Fotos')}</Text>
          </View>
        )}
        {busy && (
          <View style={s.busy}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      <ActionSheet visible={menu} anchorRef={frame} title="Foto de tu lugar" options={options} onDismiss={() => setMenu(false)} />
    </>
  );
}

const s = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyText: { fontSize: 15, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  busy: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.32)' },
});
