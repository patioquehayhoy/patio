import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { searchPatiosByDish } from '@/lib/patios';
import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 24, paddingBottom: 34 },
    top: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: t.text },
    spacer: { width: 44 },
    searchBox: { minHeight: 58, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 18 },
    input: { flex: 1, minHeight: 42, paddingHorizontal: 12, fontSize: 18, color: t.text, fontWeight: '300' },
    sectionTitle: { marginTop: 28, marginBottom: 12, fontSize: 12, fontWeight: '900', color: t.text },
    result: { minHeight: 104, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, padding: 16, marginBottom: 10 },
    resultTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent, marginTop: 8 },
    resultBody: { flex: 1 },
    dish: { fontSize: 21, lineHeight: 25, fontWeight: '900', color: t.text },
    patio: { marginTop: 6, fontSize: 14, lineHeight: 19, color: t.textSecondary },
    context: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    contextText: { flex: 1, fontSize: 12, color: t.textSecondary },
    price: { fontSize: 13, fontWeight: '900', color: t.text },
    empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
    emptyIcon: { width: 62, height: 62, borderRadius: 31, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 19, lineHeight: 24, fontWeight: '900', color: t.text, textAlign: 'center' },
    emptyText: { marginTop: 8, fontSize: 14, lineHeight: 20, color: t.textSecondary, textAlign: 'center' },
    start: { minHeight: 340, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
    startText: { fontSize: 16, lineHeight: 23, color: t.textSecondary, textAlign: 'center' },
  });
}

export default function BuscarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchPatiosByDish(query), [query]);
  const hasQuery = query.trim().length > 0;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.title} allowFontScaling={true}>Buscar</Text>
          <View style={s.spacer} />
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={22} color={theme.text} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            placeholder="Busca mole, enchiladas, anís..."
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            selectionColor={theme.accent}
            style={s.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {!hasQuery ? (
          <View style={s.start}>
            <Ionicons name="restaurant-outline" size={30} color={theme.textSecondary} />
            <Text style={s.startText} allowFontScaling={true}>Escribe lo que se te antoja y encuentra quién lo tiene hoy.</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="restaurant-outline" size={28} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>Todavía no aparece</Text>
            <Text style={s.emptyText} allowFontScaling={true}>Cuando más fonderos publiquen menú, Patio lo va a encontrar aquí.</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionTitle} allowFontScaling={true}>RESULTADOS</Text>
            {results.map((match) => (
              <TouchableOpacity
                key={`${match.patio.id}-${match.section}-${match.item.name}`}
                style={s.result}
                onPress={() => router.push(`/patio/${match.patio.id}`)}
                activeOpacity={0.78}>
                <View style={s.resultTop}>
                  <View style={s.dot} />
                  <View style={s.resultBody}>
                    <Text style={s.dish} allowFontScaling={true}>{match.item.name}</Text>
                    <Text style={s.patio} allowFontScaling={true}>
                      {match.patio.name} · {match.patio.category}
                    </Text>
                    <View style={s.context}>
                      <Text style={s.contextText} allowFontScaling={true}>
                        {match.section} · {match.patio.open}
                      </Text>
                      <Text style={s.price} allowFontScaling={true}>{match.item.price ?? match.patio.price}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
