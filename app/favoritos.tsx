import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { FoodieFilterBar, matchesFoodieFilters } from '@/components/foodie-filter-bar';
import { SaveToListSheet } from '@/components/save-to-list-sheet';
import { todayDish, useFavoritePatiosController } from '@/lib/controllers/useFavoritePatiosController';
import { useFoodieFilters } from '@/lib/foodie-filters-context';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { estaAbiertoAhora } from '@/lib/horario';
import { createCollection, getCollections, publishCollection, setPatiosInCollection, type PatioCollection } from '@/lib/collections';
import { removeFavoritePatios } from '@/lib/favorites';

const OPEN_GREEN = '#1F9D55';

// Densidad de fila y contenedor calcados de la misma referencia que ya usan
// vistos.tsx/explorar.tsx (sheet de resultados) en esta app: tarjeta propia
// por lugar (t.surface, Radius.card, borde hairline, gap 10 entre tarjetas)
// en vez de una tabla suelta sin fondo — así Guardados no inventa un tercer
// lenguaje de lista. Es también el estilo "grouped" que Apple documenta para
// listas de datos (developer.apple.com/design/human-interface-guidelines/
// lists-and-tables, sección "Style": el estilo agrupado usa espacio y
// separación adicional para comunicar agrupación). Dentro de cada tarjeta,
// paddingVertical se queda en 7 (tope de la ley de densidad de CLAUDE.md)
// porque el contenido real son 3 líneas (nombre, platillo de hoy, ubicación
// + rating) — más denso que un row de 1-2 líneas no perdería legibilidad.
function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    filterWrap: { marginTop: 12, marginBottom: 12 },

    // Selección rápida: link a la derecha, arriba del filtro — mismo lugar
    // donde iOS pone "Seleccionar" en Fotos/Archivos (esquina superior).
    selectRow: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'flex-end' },
    selectToggle: { minHeight: 32, justifyContent: 'center' },
    selectToggleText: { fontSize: 14, fontWeight: '700' },

    // Lista: pila de tarjetas individuales, no tabla continua.
    list: { paddingHorizontal: 20, gap: 10 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 14, paddingVertical: 7 },
    thumb: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, position: 'relative' },
    menuDot: { position: 'absolute', right: -2, top: -2, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: t.surface, backgroundColor: OPEN_GREEN },
    body: { flex: 1, minWidth: 0, justifyContent: 'center' },
    // Nombre + platillo de hoy son una sola unidad óptica (identidad +
    // "descripción" del lugar, igual que título/artista en Apple Music —
    // ver CLAUDE.md "Campos de texto agrupados"): 2px máximo entre ellos.
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
    name: { flexShrink: 1, fontSize: 16, fontWeight: '800', letterSpacing: -0.2, color: t.text, lineHeight: 20 },
    today: { fontSize: 13, fontWeight: '400', color: t.text, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaArea: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
    metaAreaText: { fontSize: 12, fontWeight: '400', color: t.textSecondary, flexShrink: 1 },
    separator: { fontSize: 11.5, color: t.textMute },
    contextText: { fontSize: 11.5, fontWeight: '500', color: t.textSecondary },

    // Sin resultados de filtro: misma tarjeta que una fila, para no
    // introducir un cuarto tratamiento visual solo para este estado.
    filterEmptyCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, backgroundColor: t.surface, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    filterEmptyText: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },

    // Empty
    empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: t.text, textAlign: 'center', fontFamily: Fonts.brand },
    emptyText: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },
    cta: { marginTop: 26, height: 54, paddingHorizontal: 24, borderRadius: Radius.card, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    // Barra de acciones en lote — reemplaza la tab bar mientras se
    // selecciona, mismo lenguaje de vidrio que el resto de panels flotantes.
    actionBar: {
      position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, overflow: 'hidden',
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)',
      backgroundColor: t.isDark ? 'rgba(17,18,20,0.4)' : 'rgba(248,248,245,0.4)',
      shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: t.isDark ? 0.20 : 0.08, shadowRadius: 32,
    },
    actionCount: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    actionBtnDisabled: { opacity: 0.35 },
    actionBtnText: { fontSize: 13, fontWeight: '700' },
  });
}

export default function FavoritosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { patios, removeLocally } = useFavoritePatiosController();

  // Filtros: pensados para cuando los guardados crecen (~70 items). 'hoy'
  // filtra por menú publicado; el resto son las categorías reales de lo
  // guardado — se construyen solas, sin taxonomía inventada.
  const { filters, setFilters } = useFoodieFilters();
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  useEffect(() => {
    getCollections().then(setCollections).catch(() => {});
  }, []);

  // Selección rápida (patrón Fotos/Archivos de iOS): "Seleccionar" activa
  // círculos de selección por fila y cambia la barra inferior por acciones
  // en lote — nada de esto compite con el tap normal de abrir un lugar.
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);

  const exitSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeSelected = async () => {
    const ids = Array.from(selectedIds);
    await removeFavoritePatios(ids);
    removeLocally(ids);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    exitSelecting();
  };

  const shareSelected = async () => {
    const ids = Array.from(selectedIds);
    const names = patios.filter((patio) => selectedIds.has(patio.id)).map((patio) => patio.name);
    if (!names.length) return;
    Haptics.selectionAsync().catch(() => {});
    // A diferencia del share de texto plano: convierte la selección en una
    // lista real (unlisted) para que el link abra Patio con los lugares de
    // verdad — no solo nombres sueltos que la otra persona no puede tocar.
    const created = await setPatiosInCollection((await createCollection('Selección', 'unlisted')).id, ids, true);
    const published = created ? await publishCollection(created) : null;
    const link = published?.remoteId ? `\n\npatio://coleccion-publica/${published.remoteId}` : '';
    await Share.share({ message: `Mis lugares en Patio\n${names.map((name) => `• ${name}`).join('\n')}${link}` }).catch(() => {});
  };
  const categories = useMemo(
    () => [...new Set(patios.flatMap((patio) => patio.categories).filter(Boolean))].sort(),
    [patios]
  );
  const filtered = useMemo(() => patios.filter((patio) => matchesFoodieFilters(filters, {
    patioId: patio.id,
    hasTodayMenu: todayDish(patio) !== null,
    isOpenNow: !!(patio.weeklyHours && estaAbiertoAhora(patio.weeklyHours)),
    categories: patio.categories,
    payments: patio.payments,
    collections,
  })), [collections, patios, filters]);

  const renderPatio = (patio: (typeof patios)[number]) => {
    const today = todayDish(patio);
    const hasMenu = today !== null;
    const isSelected = selectedIds.has(patio.id);
    return (
      <TouchableOpacity
        key={patio.id}
        style={s.card}
        onPress={() => (selecting ? toggleSelect(patio.id) : router.push(`/patio/${patio.id}`))}
        onLongPress={() => { if (!selecting) { Haptics.selectionAsync().catch(() => {}); setSelecting(true); toggleSelect(patio.id); } }}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={selecting ? `${isSelected ? 'Quitar de la selección' : 'Seleccionar'} ${patio.name}` : `Abrir ${patio.name}`}>
        {selecting && (
          <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? theme.accent : theme.textMute} />
        )}
        <View style={s.thumb}>
          <Ionicons name="restaurant-outline" size={16} color={theme.textSecondary} />
          {hasMenu && <View style={s.menuDot} />}
        </View>
        <View style={s.body}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1} allowFontScaling={true}>{patio.name}</Text>
            {patio.isVerifiedBusiness && <Ionicons name="checkmark-circle" size={14} color={theme.accent} />}
          </View>
          {today ? (
            <Text style={s.today} numberOfLines={1} allowFontScaling={true}>{today}</Text>
          ) : null}
          <View style={s.metaRow}>
            <View style={s.metaArea}>
              <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
              <Text style={s.metaAreaText} numberOfLines={1} allowFontScaling={true}>{patio.area}</Text>
              {!!patio.rating && patio.rating !== 'Nuevo' && <>
                <Text style={s.separator}>·</Text>
                <Ionicons name="star" size={10} color={theme.textSecondary} />
                <Text style={s.contextText}>{patio.rating}{patio.ratingCount != null ? ` (${patio.ratingCount})` : ''}</Text>
              </>}
            </View>
          </View>
        </View>
        {!selecting && <Ionicons name="chevron-forward" size={16} color={theme.textMute} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + (selecting ? 96 : 40) }]} showsVerticalScrollIndicator={false}>
        {patios.length > 0 && (
          <>
            {/* Sin texto "Seleccionar" permanente — se entra al modo solo
                manteniendo presionado un lugar. "Cancelar" es contextual:
                solo existe mientras el modo está activo. El filtro/Listas de
                abajo se OCULTA durante la selección (como Fotos: los
                controles de navegación normales desaparecen al seleccionar,
                para no competir con la barra de acciones en lote — antes
                convivían dos íconos de guardado en pantalla a la vez, fuente
                real de la confusión reportada 2026-08-23). */}
            {selecting ? (
              <View style={s.selectRow}>
                <TouchableOpacity onPress={exitSelecting} accessibilityRole="button" accessibilityLabel="Cancelar selección" hitSlop={8} style={s.selectToggle}>
                  <Text style={[s.selectToggleText, { color: theme.accent }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.filterWrap}>
                <FoodieFilterBar
                  filters={filters}
                  onChange={setFilters}
                  collections={collections}
                  categories={categories}
                  onCollectionCreated={(c) => setCollections((prev) => [c, ...prev])}
                  onCollectionUpdated={(c) => setCollections((prev) => prev.map((item) => item.id === c.id ? c : item))}
                  onCollectionRemoved={(id) => setCollections((prev) => prev.filter((item) => item.id !== id))}
                />
              </View>
            )}
          </>
        )}

        {patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="bookmark-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('Guarda tus lugares de confianza')}</Text>
            <Text style={s.emptyText} allowFontScaling={true}>{noWidow('Cuando encuentres un lugar que te late, usa el marcador para volver rápido.')}</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Buscar algo rico">
              <Text style={s.ctaText} allowFontScaling={true}>{noWidow('Buscar algo rico')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.length === 0 && (
              <View style={s.filterEmptyCard}>
                <Ionicons name="filter-outline" size={20} color={theme.textSecondary} />
                <Text style={s.filterEmptyText} allowFontScaling={true}>{noWidow('Ninguno de tus guardados entra en ese filtro hoy.')}</Text>
              </View>
            )}
            {filtered.map(renderPatio)}
          </View>
        )}
      </ScrollView>
      {selecting ? (
        <View style={[s.actionBar, { paddingBottom: insets.bottom + 10 }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <Text style={[s.actionCount, { color: theme.textSecondary }]}>
            {selectedIds.size} {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
          </Text>
          <View style={s.actionButtons}>
            <TouchableOpacity
              disabled={selectedIds.size === 0}
              onPress={() => setSaveSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Agregar a una lista"
              style={[s.actionBtn, selectedIds.size === 0 && s.actionBtnDisabled]}>
              <Ionicons name="bookmark-outline" size={18} color={theme.text} />
              <Text style={[s.actionBtnText, { color: theme.text }]}>Añadir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={selectedIds.size === 0}
              onPress={shareSelected}
              accessibilityRole="button"
              accessibilityLabel="Compartir selección"
              style={[s.actionBtn, selectedIds.size === 0 && s.actionBtnDisabled]}>
              <Ionicons name="share-outline" size={18} color={theme.text} />
              <Text style={[s.actionBtnText, { color: theme.text }]}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={selectedIds.size === 0}
              onPress={removeSelected}
              accessibilityRole="button"
              accessibilityLabel="Quitar de Guardados"
              style={[s.actionBtn, selectedIds.size === 0 && s.actionBtnDisabled]}>
              <Ionicons name="trash-outline" size={18} color={theme.text} />
              <Text style={[s.actionBtnText, { color: theme.text }]}>Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <BottomTabBar variant="foodie" />
      )}
      <SaveToListSheet
        visible={saveSheetVisible}
        patioIds={Array.from(selectedIds)}
        patioName=""
        onDismiss={() => { setSaveSheetVisible(false); exitSelecting(); }}
      />
    </View>
  );
}
