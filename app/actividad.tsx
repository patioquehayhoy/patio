import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { getFavoritePatioIds } from '@/lib/favorites';
import { fetchPublicFonditas, type Patio } from '@/lib/patios';
import { getSavedMapCategories, setSavedMapCategories } from '@/lib/saved-map-filters';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export default function LugaresScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState<Patio[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    Promise.all([getFavoritePatioIds(), fetchPublicFonditas(), getSavedMapCategories()])
      .then(([ids, patios, active]) => {
        if (!mounted) return;
        setSaved(patios.filter((patio) => ids.includes(patio.id)));
        setActiveCategories(active);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []));

  const groups = useMemo(() => {
    const grouped = new Map<string, Patio[]>();
    saved.forEach((patio) => {
      const category = patio.category || 'Otros';
      grouped.set(category, [...(grouped.get(category) ?? []), patio]);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [saved]);

  const toggleCategory = async (category: string) => {
    const next = activeCategories.includes(category)
      ? activeCategories.filter((item) => item !== category)
      : [...activeCategories, category];
    setActiveCategories(next);
    await setSavedMapCategories(next);
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 130 }}>
        <Text style={[s.eyebrow, { color: theme.accent }]}>TU MAPA</Text>
        <Text style={[s.title, { color: theme.text }]}>{noWidow('Tus lugares')}</Text>
        <Text style={[s.subtitle, { color: theme.textSecondary }]}>
          {noWidow('Activa categorías para ver sólo esos lugares guardados en el mapa.')}
        </Text>

        {groups.length === 0 ? (
          <View style={[s.empty, { borderColor: theme.border }]}>
            <Ionicons name="bookmark-outline" size={30} color={theme.textMute} />
            <Text style={[s.emptyTitle, { color: theme.text }]}>Todavía no guardas lugares</Text>
            <Text style={[s.emptyBody, { color: theme.textSecondary }]}>
              Guarda un Patio desde su perfil y aquí podrás organizarlo.
            </Text>
            <TouchableOpacity style={[s.mapButton, { backgroundColor: theme.text }]} onPress={() => router.replace('/explorar')} activeOpacity={0.82}>
              <Text style={[s.mapButtonText, { color: theme.bg }]}>Explorar el mapa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.list}>
              {groups.map(([category, patios]) => {
                const active = activeCategories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: active }}
                    style={[s.category, { borderColor: active ? theme.accent : theme.border, backgroundColor: active ? theme.accentSoft : theme.surface }]}
                    onPress={() => toggleCategory(category)}
                    activeOpacity={0.78}>
                    <View style={[s.categoryIcon, { backgroundColor: active ? theme.accent : theme.bg }]}>
                      <Ionicons name={active ? 'eye' : 'eye-off-outline'} size={18} color={active ? '#fff' : theme.textSecondary} />
                    </View>
                    <View style={s.categoryCopy}>
                      <Text style={[s.categoryTitle, { color: theme.text }]}>{category}</Text>
                      <Text style={[s.categoryNames, { color: theme.textSecondary }]} numberOfLines={2}>
                        {patios.map((patio) => patio.name).join(' · ')}
                      </Text>
                    </View>
                    <Text style={[s.count, { color: active ? theme.accent : theme.textMute }]}>{patios.length}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[s.mapButton, { backgroundColor: theme.text }]} onPress={() => router.replace('/explorar')} activeOpacity={0.82}>
              <Ionicons name="map-outline" size={17} color={theme.bg} />
              <Text style={[s.mapButtonText, { color: theme.bg }]}>
                {activeCategories.length ? 'Ver selección en el mapa' : 'Ver todos en el mapa'}
              </Text>
            </TouchableOpacity>
            {!!activeCategories.length && (
              <TouchableOpacity
                style={s.clear}
                onPress={async () => {
                  setActiveCategories([]);
                  await setSavedMapCategories([]);
                }}>
                <Text style={[s.clearText, { color: theme.textSecondary }]}>Mostrar todos otra vez</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.3, fontFamily: Fonts.brand },
  subtitle: { maxWidth: 330, marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: '300' },
  list: { marginTop: 26, gap: 10 },
  category: { minHeight: 82, padding: 14, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 13 },
  categoryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { flex: 1 },
  categoryTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  categoryNames: { marginTop: 4, fontSize: 12.5, lineHeight: 17, fontWeight: '300' },
  count: { fontSize: 14, fontWeight: '700' },
  mapButton: { minHeight: 52, marginTop: 22, paddingHorizontal: 18, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapButtonText: { fontSize: 15, fontWeight: '700' },
  clear: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 13, fontWeight: '500' },
  empty: { marginTop: 32, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20, fontWeight: '300' },
});
