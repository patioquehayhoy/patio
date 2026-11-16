import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ActionSheet, type ActionSheetOption } from '@/components/action-sheet';
import { photoDate, type DishPhoto } from '@/lib/dish-photos-order';
import { photoPlaceholder } from '@/lib/photo-hash';
import { useTheme, type Theme } from '@/lib/theme';

export type DishGalleryLike = { count: number; mine: boolean };
export type DishGalleryAuthor = { name: string; onPress?: () => void };

const GAP = 8;
const TAP_MS = 280;

// Fotos del platillo en su lugar (2026-11-15): tocar el platillo abre sus
// fotos ahí mismo, dentro del menú, sin hoja encima (contexto espacial).
// · Cada foto a todo lo ancho (se probó dejar asomar la siguiente: no gustó).
// · Sobre la foto, fundidos abajo, solo quién la subió (lleva a su perfil) y
//   «3/12» (número y diagonal; VoiceOver dice «3 de 12»). Sin frases encima:
//   la foto queda limpia y la historia vive en la reseña (Parco, 2026-11-15).
// · Debajo, un solo renglón fijo: la fecha (mismo formato que su reseña) a la
//   izquierda y el corazón a la derecha (misma columna que los del menú). Todas las fotos miden lo
//   mismo: nada brinca al deslizar.
// · Tocar la foto de un cliente abre sus opciones: «Ver la reseña» primero
//   (la tuya: corregir o quitar; la de otro: reportar). Dos toques: me gusta.
//   Mantenerla presionada abre lo mismo.
// · «Me gusta» es el de la reseña de donde sale la foto: una visita, un solo
//   «me gusta». Responde al instante; la ficha se pone al día después.
// · Carga: la foto en pantalla primero (prioridad alta) y la vecina después;
//   mientras bajan se ve su vista previa difuminada (ThumbHash).
export function DishGallery({ dishName, photos, initialWidth, authorFor, likeFor, onToggleLike, menuFor }: {
  dishName: string;
  photos: DishPhoto[];
  /** Ancho ya conocido: la galería se pinta en el primer cuadro, sin medir antes. */
  initialWidth?: number;
  authorFor: (photo: DishPhoto) => DishGalleryAuthor;
  /** Sin valor no hay «me gusta»: fotos del lugar y las tuyas. */
  likeFor: (photo: DishPhoto) => DishGalleryLike | undefined;
  onToggleLike: (photo: DishPhoto) => void;
  /** Opciones al mantener presionada la foto; vacío, nada. */
  menuFor: (photo: DishPhoto) => ActionSheetOption[];
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [width, setWidth] = useState(initialWidth ?? 0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [menuPhoto, setMenuPhoto] = useState<DishPhoto | null>(null);
  const pageRefs = useRef(new Map<string, View | null>());
  const menuAnchor = useRef<View | null>(null);
  const lastTap = useRef<{ url: string; at: number } | null>(null);
  const burst = useRef(new Animated.Value(0)).current;
  const many = photos.length > 1;
  // El renglón de abajo (hace cuánto y corazón) existe en todas o en ninguna:
  // así todas las fotos miden lo mismo.
  const withMetaRow = photos.some((photo) => !!photo.by || !!likeFor(photo));

  // «Me gusta» al instante: se pinta aquí y la ficha se actualiza detrás.
  const [likeOverride, setLikeOverride] = useState<Record<string, DishGalleryLike>>({});
  const likeOf = (photo: DishPhoto) => (likeFor(photo) ? likeOverride[photo.url] ?? likeFor(photo) : undefined);
  const toggleLike = (photo: DishPhoto) => {
    const current = likeOf(photo);
    if (!current) return;
    setLikeOverride((all) => ({ ...all, [photo.url]: { mine: !current.mine, count: Math.max(0, current.count + (current.mine ? -1 : 1)) } }));
    onToggleLike(photo);
  };
  // Cuando la ficha ya tiene el mismo valor, se deja de usar el de aquí.
  useEffect(() => {
    setLikeOverride((all) => {
      const settled = Object.keys(all).filter((url) => {
        const photo = photos.find((candidate) => candidate.url === url);
        const real = photo ? likeFor(photo) : undefined;
        return !real || (real.mine === all[url].mine && real.count === all[url].count);
      });
      if (!settled.length) return all;
      const next = { ...all };
      settled.forEach((url) => { delete next[url]; });
      return next;
    });
  }, [photos, likeFor]);

  // En desarrollo: cuánto tarda en verse la primera foto y de dónde salió.
  const openedAt = useRef(Date.now());
  const logged = useRef(false);

  const showBurst = () => {
    burst.setValue(0);
    Animated.sequence([
      Animated.spring(burst, { toValue: 1, stiffness: 320, damping: 14, mass: 0.6, useNativeDriver: true }),
      Animated.timing(burst, { toValue: 0, duration: 200, delay: 260, useNativeDriver: true }),
    ]).start();
  };
  // Un toque: sus opciones («Ver la reseña»…), si no llega un segundo toque.
  // Dos toques seguidos en la misma foto: me gusta (nunca lo quita).
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);
  const tap = (photo: DishPhoto) => {
    const now = Date.now();
    if (lastTap.current?.url !== photo.url || now - lastTap.current.at >= TAP_MS) {
      lastTap.current = { url: photo.url, at: now };
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null;
        openMenu(photo, false);
      }, TAP_MS);
      return;
    }
    lastTap.current = null;
    if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
    const state = likeOf(photo);
    if (!state) return;
    if (!state.mine) toggleLike(photo);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showBurst();
  };
  const openMenu = (photo: DishPhoto, held = true) => {
    if (!menuFor(photo).length) return;
    if (held) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    menuAnchor.current = pageRefs.current.get(photo.url) ?? null;
    setMenuPhoto(photo);
  };

  // Renglón fijo bajo la foto: la fecha a la izquierda, corazón a la derecha.
  const metaRow = (photo: DishPhoto) => {
    const state = likeOf(photo);
    const age = photo.by ? photoDate(photo.at) : undefined;
    const name = authorFor(photo).name;
    return (
      <View style={s.metaRow}>
        <Text style={s.meta} allowFontScaling={true}>{age ?? ''}</Text>
        {!!state && (
          <TouchableOpacity
            style={s.like}
            hitSlop={10}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              toggleLike(photo);
            }}
            accessibilityRole="button"
            accessibilityLabel={state.mine ? 'Quitar me gusta' : `Me gusta la foto de ${name}`}
            accessibilityValue={state.count ? { text: `${state.count} me gusta` } : undefined}
            accessibilityState={{ selected: state.mine }}>
            {!!state.count && (
              <Text style={[s.heartCount, state.mine && { color: theme.accent }]} allowFontScaling={true}>{state.count.toLocaleString('es-MX')}</Text>
            )}
            <View style={s.heartBox}>
              <Ionicons name={state.mine ? 'heart' : 'heart-outline'} size={17} color={state.mine ? theme.accent : theme.textMute} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View
      style={s.root}
      onLayout={(event) => {
        const measured = event.nativeEvent.layout.width;
        if (Math.abs(measured - width) > 0.5) setWidth(measured);
      }}>
      {width > 0 && (
        <>
          <FlatList
            data={photos}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width + GAP}
            decelerationRate="fast"
            disableIntervalMomentum
            // Solo la de pantalla y sus vecinas: así la primera no compite por
            // la red con 40.
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            keyExtractor={(photo) => photo.url}
            extraData={[index, likeOverride]}
            getItemLayout={(_, i) => ({ length: width + GAP, offset: (width + GAP) * i, index: i })}
            ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
            scrollEventThrottle={32}
            onScroll={(event) => {
              const next = Math.max(0, Math.min(photos.length - 1, Math.round(event.nativeEvent.contentOffset.x / (width + GAP))));
              if (next !== indexRef.current) { indexRef.current = next; setIndex(next); }
            }}
            renderItem={({ item, index: i }) => {
              const options = menuFor(item);
              const state = likeOf(item);
              const author = authorFor(item);
              return (
                <View style={{ width }}>
                  <Pressable
                    ref={(ref) => { pageRefs.current.set(item.url, ref); }}
                    onPress={() => tap(item)}
                    onLongPress={options.length ? () => openMenu(item) : undefined}
                    delayLongPress={320}
                    accessibilityRole="image"
                    accessibilityLabel={`Foto de ${dishName}, de ${author.name}${many ? `. ${i + 1} de ${photos.length}` : ''}`}
                    accessibilityActions={[
                      ...(state ? [{ name: 'like', label: state.mine ? 'Quitar me gusta' : 'Me gusta' }] : []),
                      ...(author.onPress ? [{ name: 'profile', label: `Ver perfil de ${author.name}` }] : []),
                      ...(options.length ? [{ name: 'more', label: 'Más opciones' }] : []),
                    ]}
                    onAccessibilityAction={(event) => {
                      if (event.nativeEvent.actionName === 'like') toggleLike(item);
                      if (event.nativeEvent.actionName === 'profile') author.onPress?.();
                      if (event.nativeEvent.actionName === 'more') openMenu(item);
                    }}>
                    <Image
                      source={{ uri: item.url }}
                      placeholder={photoPlaceholder(item.hash)}
                      placeholderContentFit="cover"
                      style={[s.photo, { width, height: width * 0.75 }]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      priority={i === index ? 'high' : 'low'}
                      transition={150}
                      accessibilityIgnoresInvertColors
                      onLoad={__DEV__ && i === 0 ? (event) => {
                        if (logged.current) return;
                        logged.current = true;
                        console.log(`[fotos] ${dishName}: ${Date.now() - openedAt.current} ms hasta ver la foto (${event.cacheType === 'none' ? 'red' : `caché ${event.cacheType}`})`);
                      } : undefined}
                    />
                    {/* Quién y cuántas, fundidos dentro de la foto: viajan con ella y
                        siempre en el mismo lugar. */}
                    <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} style={s.fade} pointerEvents="box-none">
                      <View style={s.overlayFoot} pointerEvents="box-none">
                        <Text
                          style={s.author}
                          onPress={author.onPress}
                          suppressHighlighting={!author.onPress}
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.4}>
                          {author.name}
                        </Text>
                        {many && (
                          <Text style={s.counter} allowFontScaling={true} maxFontSizeMultiplier={1.4}>
                            {`${(i + 1).toLocaleString('es-MX')}/${photos.length.toLocaleString('es-MX')}`}
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                    {i === index && (
                      <Animated.View
                        pointerEvents="none"
                        style={[s.burst, { opacity: burst, transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
                        <Ionicons name="heart" size={72} color="#FFFFFF" />
                      </Animated.View>
                    )}
                  </Pressable>
                  {withMetaRow && metaRow(item)}
                </View>
              );
            }}
          />
          <ActionSheet
            visible={!!menuPhoto}
            anchorRef={menuAnchor}
            onDismiss={() => setMenuPhoto(null)}
            options={menuPhoto ? menuFor(menuPhoto) : []}
          />
        </>
      )}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { marginTop: 10 },
    photo: { borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.border },
    // Velo abajo de la foto: el nombre y «3/12» se leen sobre cualquier foto.
    fade: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingTop: 28, paddingBottom: 10, paddingHorizontal: 12, gap: 4,
      borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
    },
    overlayFoot: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    author: { flex: 1, color: '#FFFFFF', fontSize: 13, lineHeight: 17, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 4 },
    counter: { color: '#FFFFFF', fontSize: 13, lineHeight: 17, fontWeight: '500', fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 4 },
    burst: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    // Renglón fijo bajo la foto, igual en todas: hace cuánto y el corazón.
    metaRow: { marginTop: 8, minHeight: 21, flexDirection: 'row', alignItems: 'center', gap: 12 },
    meta: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    // El corazón va en la misma columna que el de cada platillo del menú (caja
    // de 21 pegada al borde derecho, ícono de 17); el número, a su izquierda.
    like: { minHeight: 21, flexDirection: 'row', alignItems: 'center', gap: 3 },
    heartBox: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center' },
    heartCount: { fontSize: 12, fontWeight: '500', color: t.textSecondary, fontVariant: ['tabular-nums'] },
  });
}
