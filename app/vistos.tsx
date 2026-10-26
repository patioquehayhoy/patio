import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsingHeader, CollapsingTitle } from '@/components/collapsing-header';
import { PatioCardInfo } from '@/components/patio-card-info';
import { PatioIdentityIcon } from '@/components/patio-identity-icon';
import { patioCardAccessibilityLabel } from '@/lib/patio-card-info';
import { FoodieLoading } from '@/components/foodie-loading';
import { useViewedPatiosController } from '@/lib/controllers/useViewedPatiosController';
import { useTheme, type Theme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 40 },
    // Header editorial

    // Lista
    list: { paddingHorizontal: 18, gap: 8, marginTop: 16 },
    card: { flexDirection: 'row', gap: 8, backgroundColor: t.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, padding: 12 },
    body: { flex: 1, minWidth: 0, justifyContent: 'center' },
    // Empty
    empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    emptyTitle: { ...Type.section, color: t.text, textAlign: 'center' },
    emptyText: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },
    cta: { marginTop: 26, minHeight: 54, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 27, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });
}

export default function VistosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { patios, loading, loadError, reload } = useViewedPatiosController();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CollapsingHeader
        scrollY={scrollY}
        c={theme}
        onBack={() => router.replace('/actividad')}
        title="Lo que viste"
      />

      <Animated.ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 48 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}>

        <CollapsingTitle
          scrollY={scrollY}
          c={theme}
          eyebrow={`${patios.length} ${patios.length === 1 ? 'lugar' : 'lugares'}`}
          title="Lo que viste"
          subtitle={noWidow('Las cocinas que abriste, lo más reciente primero')}
        />

        {loading && !patios.length ? <FoodieLoading label="Cargando lugares" /> : loadError ? <View style={s.empty}>
          <Text style={s.emptyTitle}>{noWidow('No pudimos cargar los lugares')}</Text>
          <TouchableOpacity style={s.cta} accessibilityRole="button" accessibilityLabel="Reintentar" onPress={reload}><Text style={s.ctaText}>Reintentar</Text></TouchableOpacity>
        </View> : patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="eye-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('Aún no has visto nada')}</Text>
            <Text style={s.emptyText} allowFontScaling={true}>{noWidow('Cuando abras una cocina en el mapa, aparece aquí para volver rápido.')}</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Ver qué hay hoy">
              <Text style={s.ctaText} allowFontScaling={true}>{noWidow('Ver qué hay hoy')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {patios.map((patio) => <TouchableOpacity key={patio.id} style={s.card}
              onPress={() => router.push(`/patio/${patio.id}`)} activeOpacity={0.82}
              accessibilityRole="button" accessibilityLabel={patioCardAccessibilityLabel(patio)}>
              <PatioIdentityIcon patio={patio} />
              <PatioCardInfo patio={patio} />
            </TouchableOpacity>)}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}
