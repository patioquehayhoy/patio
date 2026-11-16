import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/glass-button';
import { photoAge, type DishPhoto } from '@/lib/dish-photos-order';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { useTheme, Type, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type DishSheetDish = { name: string; description?: string; price?: string };

// Hoja del platillo (2026-11-15): tocar un platillo en la ficha la abre. Arriba
// el platillo; abajo todas sus fotos en cuadrícula, en el orden de
// `orderDishPhotos`. Tocar una foto la abre grande y se pasa a los lados
// (carrusel normal: aquí el dedo está libre, a diferencia del vistazo).
// Cada foto de cliente dice quién, cuándo y su frase. Quien la subió la
// corrige (de qué platillo es, la frase) o la quita; los demás la reportan.
// «Agregar tu foto» lleva a la reseña con el platillo ya elegido.
export function DishSheet({
  dish,
  photos,
  dishOptions,
  canAdd,
  onAdd,
  onClose,
  onFix,
  onRemove,
  onReport,
}: {
  dish: DishSheetDish | null;
  photos: DishPhoto[];
  /** Platillos del lugar, para corregir de cuál es una foto. */
  dishOptions: string[];
  canAdd: boolean;
  onAdd: () => void;
  onClose: () => void;
  onFix: (photo: DishPhoto, dish: string, note: string) => Promise<void>;
  onRemove: (photo: DishPhoto) => Promise<void>;
  onReport: (photo: DishPhoto, reason: 'inaccurate' | 'abuse') => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [viewing, setViewing] = useState<number | null>(null);
  const [fixing, setFixing] = useState<DishPhoto | null>(null);
  const [fixDish, setFixDish] = useState('');
  const [fixNote, setFixNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pager = useRef<FlatList<DishPhoto>>(null);

  // Al abrir otro platillo, empieza en la cuadrícula.
  useEffect(() => { setViewing(null); setFixing(null); }, [dish?.name]);

  const pageWidth = width;
  const tile = (Math.min(width, 600) - 32 - 2 * 4) / 3;
  const current = viewing != null ? photos[viewing] : undefined;

  const startFix = (photo: DishPhoto) => {
    setFixing(photo);
    setFixDish(dish?.name ?? '');
    setFixNote(photo.note ?? '');
  };
  const saveFix = async () => {
    if (!fixing || busy) return;
    setBusy(true);
    try {
      await onFix(fixing, fixDish, fixNote);
      setFixing(null);
      // Si ya no es de este platillo, sale de esta hoja.
      if (fixDish !== dish?.name) setViewing(null);
    } catch {
      Alert.alert(noWidow('No se guardó el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      setBusy(false);
    }
  };
  const askRemove = (photo: DishPhoto) => {
    Alert.alert(noWidow('¿Quitar tu foto?'), noWidow('Tu reseña se queda; solo deja de verse la foto.'), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar foto', style: 'destructive', onPress: () => {
          onRemove(photo).then(() => setViewing(null), () => Alert.alert(noWidow('No se quitó la foto'), noWidow('Revisa tu conexión e inténtalo otra vez.')));
        },
      },
    ]);
  };
  const askReport = (photo: DishPhoto) => {
    Alert.alert(noWidow('Reportar foto'), noWidow('¿Qué tiene?'), [
      { text: 'No es de este platillo', onPress: () => onReport(photo, 'inaccurate') },
      { text: 'Ofensiva o inapropiada', onPress: () => onReport(photo, 'abuse') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const credit = (photo: DishPhoto) => (photo.by
    ? [photo.mine ? 'Tu foto' : photo.by, photoAge(photo.at)].filter(Boolean).join(' · ')
    : 'Del lugar');

  return (
    <Modal visible={!!dish} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => (fixing ? setFixing(null) : viewing != null ? setViewing(null) : onClose())}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.nav}>
          {viewing != null || fixing
            ? <GlassIconButton icon="chevron-back" accessibilityLabel={fixing ? 'Regresar a la foto' : 'Todas las fotos'} onPress={() => (fixing ? setFixing(null) : setViewing(null))} />
            : <View style={s.navSpacer} />}
          <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onClose} />
        </View>

        {fixing ? (
          // Corregir tu foto: de qué platillo es y su frase.
          <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
            <Text style={s.title} accessibilityRole="header" allowFontScaling={true}>{noWidow('Corregir tu foto')}</Text>
            <Image source={{ uri: fixing.url }} style={s.fixThumb} contentFit="cover" accessibilityIgnoresInvertColors />
            <Text style={s.label} allowFontScaling={true}>{noWidow('¿De qué platillo es?')}</Text>
            <View style={s.chips}>
              {dishOptions.map((name) => {
                const on = fixDish === name;
                return (
                  <TouchableOpacity key={name} style={[s.chip, on ? s.chipOn : s.chipOff]} onPress={() => setFixDish(name)} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ selected: on }}>
                    <Text style={[s.chipText, on && s.chipTextOn]} allowFontScaling={true}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.label} allowFontScaling={true}>{noWidow('Algo del platillo (opcional)')}</Text>
            <View style={s.inputCard}>
              <TextInput
                style={s.input}
                value={fixNote}
                onChangeText={(value) => setFixNote(value.slice(0, TEXT_LIMITS.reviewPhotoNote))}
                placeholder="Ej. La salsa verde pica en serio"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Frase del platillo"
                selectionColor={theme.accent}
                allowFontScaling={true}
              />
            </View>
          </ScrollView>
        ) : current ? (
          // Una foto grande; a los lados, las demás.
          <View style={{ flex: 1 }}>
            <FlatList
              ref={pager}
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={viewing ?? 0}
              getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
              keyExtractor={(photo) => photo.url}
              onMomentumScrollEnd={(event) => setViewing(Math.round(event.nativeEvent.contentOffset.x / pageWidth))}
              renderItem={({ item }) => (
                <View style={{ width: pageWidth }}>
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: pageWidth, height: pageWidth, backgroundColor: theme.border }}
                    contentFit="cover"
                    transition={120}
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={`Foto de ${dish?.name ?? 'el platillo'}, ${credit(item)}`}
                  />
                </View>
              )}
            />
            {/* El pie vive siempre en el mismo lugar: no brinca entre fotos. */}
            <View style={[s.caption, { paddingBottom: insets.bottom + 24 }]}>
              <View style={s.captionHead}>
                <Text style={s.credit} allowFontScaling={true}>{credit(current)}</Text>
                <Text style={s.counter} allowFontScaling={true}>{`${(viewing ?? 0) + 1} de ${photos.length}`}</Text>
              </View>
              {!!current.note && <Text style={s.note} allowFontScaling={true}>{noWidow(`«${current.note}»`)}</Text>}
              {!!current.by && current.reviewId && (
                <View style={s.photoActions}>
                  {current.mine ? (
                    <>
                      <TouchableOpacity style={s.textAction} onPress={() => startFix(current)} accessibilityRole="button" hitSlop={8}>
                        <Text style={s.textActionLabel} allowFontScaling={true}>Corregir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.textAction} onPress={() => askRemove(current)} accessibilityRole="button" hitSlop={8}>
                        <Text style={[s.textActionLabel, { color: theme.textSecondary }]} allowFontScaling={true}>Quitar mi foto</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={s.textAction} onPress={() => askReport(current)} accessibilityRole="button" hitSlop={8}>
                      <Text style={[s.textActionLabel, { color: theme.textSecondary }]} allowFontScaling={true}>Reportar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + (canAdd ? 120 : 40) }]} showsVerticalScrollIndicator={false}>
            {!!dish && (
              <>
                <View style={s.titleRow}>
                  <Text style={[s.title, { flex: 1 }]} accessibilityRole="header" allowFontScaling={true}>{noWidow(dish.name)}</Text>
                  {!!dish.price && <Text style={s.price} allowFontScaling={true}>{dish.price}</Text>}
                </View>
                {!!dish.description && <Text style={s.description} allowFontScaling={true}>{noWidow(dish.description)}</Text>}
              </>
            )}
            {photos.length ? (
              <>
                <Text style={s.sectionLabel} allowFontScaling={true}>{photos.length === 1 ? '1 foto' : `${photos.length.toLocaleString('es-MX')} fotos`}</Text>
                <View style={s.grid}>
                  {photos.map((photo, index) => (
                    <Pressable
                      key={photo.url}
                      onPress={() => setViewing(index)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`Foto ${index + 1}, ${credit(photo)}`}>
                      <Image source={{ uri: photo.url }} style={[s.tile, { width: tile, height: tile }]} contentFit="cover" transition={120} accessibilityIgnoresInvertColors />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <Text style={s.empty} allowFontScaling={true}>{noWidow('Todavía no hay fotos de este platillo. Si lo pediste, sube la tuya: le ayuda a quien no sabe qué es.')}</Text>
            )}
          </ScrollView>
        )}

        {/* Una sola acción destacada por vista. */}
        {fixing ? (
          <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={[s.cta, (busy || !fixDish) && s.ctaDisabled]} onPress={saveFix} disabled={busy || !fixDish} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ busy }}>
              <Text style={s.ctaText} allowFontScaling={true}>{busy ? 'Guardando…' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        ) : viewing == null && canAdd ? (
          <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={s.cta} onPress={onAdd} activeOpacity={0.85} accessibilityRole="button">
              <Ionicons name="camera-outline" size={18} color="#fff" />
              <Text style={s.ctaText} allowFontScaling={true}>Agregar tu foto</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    navSpacer: { width: 40, height: 40 },
    content: { paddingHorizontal: 16, paddingTop: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    title: { ...Type.section, color: t.text },
    price: { fontSize: 17, lineHeight: 26, fontWeight: '500', color: t.text, fontVariant: ['tabular-nums'] },
    description: { marginTop: 4, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary },
    sectionLabel: { marginTop: 24, marginBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textSecondary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    tile: { borderRadius: 8, borderCurve: 'continuous', backgroundColor: t.border },
    empty: { marginTop: 24, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary },

    caption: { paddingHorizontal: 16, paddingTop: 12, gap: 4 },
    captionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    credit: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '700', color: t.text },
    counter: { fontSize: 13, lineHeight: 20, fontWeight: '400', color: t.textSecondary, fontVariant: ['tabular-nums'] },
    note: { fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.text },
    photoActions: { flexDirection: 'row', gap: 24, marginTop: 12 },
    textAction: { minHeight: 44, justifyContent: 'center' },
    textActionLabel: { fontSize: 15, fontWeight: '500', color: t.accent },

    fixThumb: { width: 96, height: 96, borderRadius: 14, borderCurve: 'continuous', marginTop: 16, backgroundColor: t.border },
    label: { marginTop: 24, marginBottom: 6, fontSize: 13, fontWeight: '400', color: t.textSecondary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
    chipOff: { backgroundColor: t.surface, borderColor: t.border },
    chipOn: { backgroundColor: t.text, borderColor: t.text },
    chipText: { fontSize: 13, fontWeight: '500', color: t.text },
    chipTextOn: { color: t.bg },
    inputCard: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    input: { fontSize: 15, lineHeight: 20, color: t.text, padding: 0 },

    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: t.bg },
    cta: { minHeight: 54, borderRadius: 27, borderCurve: 'continuous', backgroundColor: t.accent, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
