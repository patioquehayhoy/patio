import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { EMPTY_FOODIE_FILTERS, FoodieFilterBar, matchesFoodieFilters, type FoodieFilters } from '@/components/foodie-filter-bar';
import { todayDish, useFavoritePatiosController } from '@/lib/controllers/useFavoritePatiosController';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';
import { estaAbiertoAhora } from '@/lib/horario';
import { getCollections, type PatioCollection } from '@/lib/collections';

const OPEN_GREEN = '#1F9D55';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    filterWrap: { marginTop: 12, marginBottom: 12 },
    filterEmpty: { paddingHorizontal: 10, paddingVertical: 24, fontSize: 14, lineHeight: 20, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },

    // Lista
    list: { paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    card: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    thumb: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, position: 'relative' },
    menuDot: { position: 'absolute', right: -2, top: -2, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: t.bg, backgroundColor: OPEN_GREEN },
    body: { flex: 1, minWidth: 0, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
    name: { flexShrink: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.2, color: t.text, lineHeight: 21 },
    today: { fontSize: 13, fontWeight: '400', color: t.text, marginBottom: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaArea: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
    metaAreaText: { fontSize: 12, fontWeight: '400', color: t.textSecondary, flexShrink: 1 },
    separator: { fontSize: 11.5, color: t.textMute },
    contextText: { fontSize: 11.5, fontWeight: '500', color: t.textSecondary },

    // Empty
    empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: t.text, textAlign: 'center', fontFamily: Fonts.brand },
    emptyText: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },
    cta: { marginTop: 26, height: 54, paddingHorizontal: 24, borderRadius: Radius.card, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });
}

export default function FavoritosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { patios } = useFavoritePatiosController();

  // Filtros: pensados para cuando los guardados crecen (~70 items). 'hoy'
  // filtra por menú publicado; el resto son las categorías reales de lo
  // guardado — se construyen solas, sin taxonomía inventada.
  const [filters, setFilters] = useState<FoodieFilters>(EMPTY_FOODIE_FILTERS);
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  useEffect(() => {
    getCollections().then(setCollections).catch(() => {});
  }, []);
  const categories = useMemo(
    () => [...new Set(patios.flatMap((patio) => patio.categories).filter(Boolean))].sort(),
    [patios]
  );
  const filtered = useMemo(() => patios.filter((patio) => matchesFoodieFilters(filters, {
    patioId: patio.id,
    hasTodayMenu: todayDish(patio) !== null,
    isOpenNow: !!(patio.weeklyHours && estaAbiertoAhora(patio.weeklyHours)),
    isSaved: true,
    categories: patio.categories,
    payments: patio.payments,
    collections,
  })), [collections, patios, filters]);

  const renderPatio = (patio: (typeof patios)[number]) => {
    const today = todayDish(patio);
    const hasMenu = today !== null;
    return (
      <TouchableOpacity
        key={patio.id}
        style={s.card}
        onPress={() => router.push(`/patio/${patio.id}`)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${patio.name}`}>
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
        <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {patios.length > 0 && (
          <View style={s.filterWrap}><FoodieFilterBar filters={filters} onChange={setFilters} collections={collections} categories={categories} onCollectionCreated={(c) => setCollections((prev) => [c, ...prev])} hideSaved /></View>
        )}

        {patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="bookmark-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>Guarda tus lugares de confianza</Text>
            <Text style={s.emptyText} allowFontScaling={true}>Cuando encuentres un lugar que te late, usa el marcador para volver rápido.</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Buscar algo rico">
              <Text style={s.ctaText} allowFontScaling={true}>Buscar algo rico</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.length === 0 && (
              <Text style={s.filterEmpty} allowFontScaling={true}>Ninguno de tus guardados entra en ese filtro hoy.</Text>
            )}
            {filtered.map(renderPatio)}
          </View>
        )}
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
