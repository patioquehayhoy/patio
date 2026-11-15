import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { floatingSurfaceShadow } from '@/lib/surface-styles';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type DishPeekItem = {
  name: string;
  description?: string;
  price?: string;
  photo: string;
  /** Si la foto grande es de un cliente, su nombre. */
  byCustomer?: string;
  /** Más fotos de clientes, chicas abajo (hasta 3). */
  customerPhotos?: string[];
};

// Foto del platillo al mantenerlo presionado (2026-11-15, idea de Parco): el
// menú se queda como lista de texto; quien no sabe qué es algo lo mantiene
// presionado y ve la foto grande con su descripción. Se cierra al soltar,
// como la vista previa de iOS. Con VoiceOver se abre con una acción y se
// cierra tocando (`sticky`).
// La foto nunca sale debajo del dedo: si se presionó en la mitad de abajo
// aparece arriba, y al revés (`touchY` = dónde se presionó).
export function DishPeek({ item, sticky, touchY, onClose }: { item: DishPeekItem | null; sticky: boolean; touchY?: number; onClose: () => void }) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<DishPeekItem | null>(item);
  // Al cerrarse conserva su lugar: no brinca al centro mientras se va.
  const [shownY, setShownY] = useState(touchY);

  useEffect(() => {
    if (item) { setShown(item); setShownY(touchY); }
    // Entra con resorte suave (crece desde donde está el dedo); sale rápido.
    const animation = item
      ? Animated.spring(progress, { toValue: 1, damping: 18, stiffness: 260, mass: 0.8, useNativeDriver: true })
      : Animated.timing(progress, { toValue: 0, duration: 140, easing: Easing.in(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => { if (finished && !item) setShown(null); });
  }, [item, touchY, progress]);

  if (!shown) return null;
  const cardWidth = Math.min(width - 48, 380);
  // Sin punto de toque (VoiceOver) va al centro.
  const place = shownY == null ? 'center' : shownY > height / 2 ? 'top' : 'bottom';
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Animated.View
      pointerEvents={sticky ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, s.layer, { opacity }]}
      accessibilityViewIsModal={sticky}>
      <BlurView intensity={theme.isDark ? 24 : 32} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <Pressable
        style={[
          s.center,
          place === 'top' && { justifyContent: 'flex-start', paddingTop: insets.top + 24 },
          place === 'bottom' && { justifyContent: 'flex-end', paddingBottom: insets.bottom + 24 },
        ]}
        onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar foto">
        {/* La sombra va afuera: con el recorte de las esquinas se perdería. */}
        <Animated.View
          style={[
            floatingSurfaceShadow(theme.isDark),
            {
              transform: [
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [place === 'top' ? 24 : place === 'bottom' ? -24 : 0, 0] }) },
                { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
              ],
            },
          ]}>
          <View style={[s.card, { width: cardWidth, backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image
            source={{ uri: shown.photo }}
            style={{ width: cardWidth, height: cardWidth * 0.75, backgroundColor: theme.border }}
            contentFit="cover"
            transition={120}
            accessibilityIgnoresInvertColors
            accessibilityLabel={`Foto de ${shown.name}`}
          />
          <View style={s.body}>
            <View style={s.titleRow}>
              <Text style={[s.name, { color: theme.text }]} allowFontScaling={true}>{noWidow(shown.name)}</Text>
              {!!shown.price && <Text style={[s.price, { color: theme.text }]} allowFontScaling={true}>{shown.price}</Text>}
            </View>
            {!!shown.description && (
              <Text style={[s.description, { color: theme.textSecondary }]} allowFontScaling={true}>{noWidow(shown.description)}</Text>
            )}
            {!!shown.byCustomer && (
              <Text style={[s.credit, { color: theme.textSecondary }]} allowFontScaling={true}>{noWidow(`Foto de un cliente · ${shown.byCustomer}`)}</Text>
            )}
            {!!shown.customerPhotos?.length && (
              <View style={s.more}>
                <Text style={[s.credit, { color: theme.textSecondary }]} allowFontScaling={true}>{shown.byCustomer ? 'Más de clientes' : 'De clientes'}</Text>
                <View style={s.thumbs}>
                  {shown.customerPhotos.map((url) => (
                    <Image key={url} source={{ uri: url }} style={[s.thumb, { backgroundColor: theme.border }]} contentFit="cover" accessibilityIgnoresInvertColors />
                  ))}
                </View>
              </View>
            )}
          </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  layer: { zIndex: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  price: { fontSize: 17, lineHeight: 22, fontWeight: '500', fontVariant: ['tabular-nums'] },
  description: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  credit: { marginTop: 6, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  more: { marginTop: 4 },
  thumbs: { marginTop: 6, flexDirection: 'row', gap: 6 },
  thumb: { width: 56, height: 56, borderRadius: 10, borderCurve: 'continuous' },
});
