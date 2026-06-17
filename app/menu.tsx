import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { Fonts } from '@/lib/theme';

// Pantalla "Hoy" del Fondero: elección de cómo armar el menú del día.
// La foto es el héroe (Patio lo lee por ti = la magia que vendemos).
const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  accent: '#FF6A3D',
};

function todayLabel(): string {
  try {
    return new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  } catch { return 'HOY'; }
}

export default function HoyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 22, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>

        {/* Header editorial */}
        <Text style={s.eyebrow} allowFontScaling={true}>{todayLabel()}</Text>
        <Text style={s.title} allowFontScaling={true}>Lo de hoy</Text>
        <Text style={s.sub} allowFontScaling={true}>Arma tu menú en 30 segundos. Quien anda cerca lo ve.</Text>

        {/* Héroe: tomar foto */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/foto-menu')} style={s.heroCard}>
          <LinearGradient
            colors={['#FF8458', '#F2612F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroGradient}>
            <View style={s.heroIcon}>
              <Ionicons name="camera" size={30} color="#fff" />
            </View>
            <Text style={s.heroTitle} allowFontScaling={true}>Toma foto de tu menú</Text>
            <Text style={s.heroBody} allowFontScaling={true}>Patio lo lee y lo organiza por ti. Sin escribir nada.</Text>
            <View style={s.heroTag}>
              <Ionicons name="sparkles" size={12} color="#fff" />
              <Text style={s.heroTagText} allowFontScaling={true}>Lo más rápido</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.orLabel} allowFontScaling={true}>o hazlo a mano</Text>

        {/* Opción: escribir */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/menu-editar')} style={s.optionRow}>
          <View style={s.optionIcon}>
            <Ionicons name="create-outline" size={20} color={DARK.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.optionTitle} allowFontScaling={true}>Escribe tu menú</Text>
            <Text style={s.optionSub} allowFontScaling={true}>Platillo por platillo, con precio</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DARK.textMute} />
        </TouchableOpacity>

        {/* Opción: usar anterior */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/historial')} style={s.optionRow}>
          <View style={s.optionIcon}>
            <Ionicons name="refresh-outline" size={20} color={DARK.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.optionTitle} allowFontScaling={true}>Usa un menú anterior</Text>
            <Text style={s.optionSub} allowFontScaling={true}>Repite uno que ya publicaste</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DARK.textMute} />
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: DARK.accent, marginBottom: 8 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1.3, lineHeight: 38, color: DARK.text, marginBottom: 6, fontFamily: Fonts.brand },
  sub: { fontSize: 14, fontWeight: '300', lineHeight: 20, color: DARK.textSecondary, marginBottom: 24 },

  heroCard: { borderRadius: 24, overflow: 'hidden', shadowColor: '#F2612F', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 28, elevation: 8 },
  heroGradient: { padding: 24, minHeight: 200, justifyContent: 'flex-end' },
  heroIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6, color: '#fff', marginBottom: 6, fontFamily: Fonts.brand },
  heroBody: { fontSize: 14, fontWeight: '300', lineHeight: 19, color: 'rgba(255,255,255,0.9)', marginBottom: 14, maxWidth: 280 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.18)' },
  heroTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: '#fff' },

  orLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: DARK.textMute, textAlign: 'center', marginVertical: 20 },

  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border, marginBottom: 10 },
  optionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, color: DARK.text, marginBottom: 2 },
  optionSub: { fontSize: 13, fontWeight: '300', color: DARK.textSecondary },
});
