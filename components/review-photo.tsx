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

/**
 * Las fotos de una visita (2026-11-21: hasta 5 por reseña). Con una, la de
 * siempre (foto y su platillo al lado). Con varias, una tira de miniaturas
 * del mismo alto que se reparte el ancho; tocar una la abre grande ahí mismo
 * con su platillo, y tocarla otra vez (o la misma miniatura) la cierra.
 */
export function ReviewPhotos({ photos, load, inMenu, onOpenInMenu }: {
  photos: ReviewPhotoData[];
  load: boolean;
  /** ¿Ese platillo está en el menú de hoy? Solo entonces «Ver en el menú». */
  inMenu: (dish: string) => boolean;
  onOpenInMenu: (dish: string) => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [open, setOpen] = useState<number | null>(null);
  const linkFor = (photo: ReviewPhotoData) => (photo.dish && inMenu(photo.dish) ? () => onOpenInMenu(photo.dish!) : undefined);
  if (photos.length === 1) return <ReviewPhoto photo={photos[0]} load={load} onOpenInMenu={linkFor(photos[0])} />;
  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setOpen((current) => (current === index ? null : index));
  };
  const shown = open === null ? null : photos[open];
  const image = (photo: ReviewPhotoData, style: object, big = false) => (
    <Image
      source={load || big ? { uri: photo.url } : null}
      placeholder={photoPlaceholder(photo.hash)}
      placeholderContentFit="cover"
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority={big ? 'high' : 'low'}
      transition={120}
      accessibilityIgnoresInvertColors
    />
  );
  return (
    <View>
      <View style={s.strip}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={`${photo.url}-${index}`}
            style={s.stripCell}
            onPress={() => toggle(index)}
            activeOpacity={0.85}
            accessibilityRole="imagebutton"
            accessibilityState={{ expanded: open === index }}
            accessibilityLabel={`Foto ${index + 1} de ${photos.length}${photo.dish ? `, ${photo.dish}` : ''}. ${open === index ? 'Toca para cerrarla' : 'Tócala para verla grande'}`}>
            {image(photo, [s.stripThumb, open !== null && open !== index && s.stripDim])}
          </TouchableOpacity>
        ))}
      </View>
      {shown && (
        <View style={s.open}>
          <Pressable onPress={() => toggle(open!)} accessibilityRole="imagebutton" accessibilityLabel={`Foto de ${shown.dish ?? 'la visita'}. Toca para cerrarla`}>
            {image(shown, s.large, true)}
          </Pressable>
          {(!!shown.dish || !!linkFor(shown)) && (
            <View style={s.openHead}>
              {!!shown.dish && <Text style={[s.dish, s.openDish]} allowFontScaling={true}>{shown.dish}</Text>}
              {!!linkFor(shown) && (
                <TouchableOpacity style={s.menuLink} onPress={linkFor(shown)} hitSlop={8} accessibilityRole="link" accessibilityLabel={`Ver ${shown.dish ?? 'el platillo'} en el menú`}>
                  <Text style={s.menuLinkText} allowFontScaling={true}>Ver en el menú</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {!!shown.note && <Text style={[s.note, s.openNote]} allowFontScaling={true}>{noWidow(shown.note)}</Text>}
        </View>
      )}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    row: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    // Varias: hasta 5 del mismo alto (72 como máximo) que se reparten el ancho.
    strip: { marginTop: 10, flexDirection: 'row', gap: 8 },
    stripCell: { flex: 1, maxWidth: 72 },
    stripThumb: { width: '100%', aspectRatio: 1, borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.border },
    stripDim: { opacity: 0.5 },
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
