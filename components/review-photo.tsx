import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { photoPlaceholder } from '@/lib/photo-hash';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type ReviewPhotoData = { url: string; hash?: string; dish?: string; note?: string };

// Foto de la visita dentro de su reseña (2026-11-15). Quien lee reseñas está
// leyendo reseñas: tocar la foto la abre grande ahí mismo, sin moverlo a
// otra parte de la ficha; tocarla otra vez la cierra. Ir al platillo en el
// menú es opcional («Ver en el menú») y la ficha ofrece volver a la reseña.
export function ReviewPhoto({ photo, load, onOpenInMenu }: {
  photo: ReviewPhotoData;
  /** Falso mientras las reseñas están lejos: solo se pinta la vista previa. */
  load: boolean;
  /** Solo si el platillo está en el menú de hoy. */
  onOpenInMenu?: () => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [open, setOpen] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setOpen((current) => !current);
  };
  const image = (style: object) => (
    <Image
      source={load || open ? { uri: photo.url } : null}
      placeholder={photoPlaceholder(photo.hash)}
      placeholderContentFit="cover"
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority={open ? 'high' : 'low'}
      transition={120}
      accessibilityIgnoresInvertColors
    />
  );

  if (!open) {
    return (
      <TouchableOpacity
        style={s.row}
        onPress={toggle}
        activeOpacity={0.85}
        accessibilityRole="imagebutton"
        accessibilityLabel={photo.dish ? `Foto de ${photo.dish}. Tócala para verla grande` : 'Foto de la visita. Tócala para verla grande'}>
        {image(s.thumb)}
        {(!!photo.dish || !!photo.note) && (
          <View style={s.text}>
            {!!photo.dish && <Text style={s.dish} allowFontScaling={true}>{photo.dish}</Text>}
            {!!photo.note && <Text style={s.note} allowFontScaling={true}>{noWidow(photo.note)}</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.open}>
      <Pressable onPress={toggle} accessibilityRole="imagebutton" accessibilityLabel={`Foto de ${photo.dish ?? 'la visita'}. Toca para cerrarla`}>
        {image(s.large)}
      </Pressable>
      {(!!photo.dish || !!onOpenInMenu) && (
        <View style={s.openHead}>
          {!!photo.dish && <Text style={[s.dish, s.openDish]} allowFontScaling={true}>{photo.dish}</Text>}
          {!!onOpenInMenu && (
            <TouchableOpacity style={s.menuLink} onPress={onOpenInMenu} hitSlop={8} accessibilityRole="link" accessibilityLabel={`Ver ${photo.dish ?? 'el platillo'} en el menú`}>
              <Text style={s.menuLinkText} allowFontScaling={true}>Ver en el menú</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {!!photo.note && <Text style={[s.note, s.openNote]} allowFontScaling={true}>{noWidow(photo.note)}</Text>}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    row: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    thumb: { width: 72, height: 72, borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.border },
    text: { flex: 1 },
    dish: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: t.text },
    note: { marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    open: { marginTop: 10 },
    large: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.border },
    openHead: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    openDish: { flex: 1 },
    menuLink: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 2 },
    menuLinkText: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: t.accent },
    openNote: { marginTop: 4, fontSize: 15, lineHeight: 21, color: t.text },
  });
}
