import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { supabase } from '@/lib/supabase';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts } from '@/lib/theme';

// Mi Patio (FonderoFonda): la cocina del Fondero vista con orgullo.
// Hero con avatar + nombre, tira de stats vivos, acciones limpias.
const HERO = require('../assets/hero/botanica-6.png');
const ROLE_KEY = '@patio_user_role';
const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';

const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  accent: '#FF6A3D',
};

// Datos de ejemplo (Cocina de Lupita) — tal cual el resto del flujo Fondero.
const STATS = [
  { num: '14', label: 'días\nseguidos' },
  { num: '312', label: 'foodies\nesta semana' },
  { num: '4.8', label: 'calificación' },
];

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  accent?: boolean;
  last?: boolean;
  onPress?: () => void;
};

function Row({ icon, title, sub, accent, last, onPress }: RowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[s.row, !last && s.rowBorder]}>
      <View style={[s.rowIcon, accent && s.rowIconAccent]}>
        <Ionicons name={icon} size={17} color={accent ? DARK.accent : 'rgba(248,248,245,0.7)'} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowTitle, accent && s.rowTitleAccent]} allowFontScaling={true}>{title}</Text>
        {sub ? <Text style={s.rowSub} allowFontScaling={true}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color={DARK.textMute} />
    </TouchableOpacity>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(ROLE_KEY).catch(() => {});
    router.replace('/');
  };

  const handleSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Patio`).catch(() => {});
  };

  const goEdit = () => router.push('/perfil-editar' as any);

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Hero band con foto + velo */}
        <View style={s.hero}>
          <Image source={HERO} style={s.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(17,18,20,0.25)', 'rgba(17,18,20,0.55)', DARK.bg]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.heroText, { paddingTop: insets.top + 64 }]}>
            <Text style={s.eyebrow} allowFontScaling={true}>Mi Patio</Text>
            <View style={s.identityRow}>
              <View style={s.avatar}>
                <Image source={HERO} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={s.avatarRing} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={true}>Cocina de Lupita</Text>
                <View style={s.metaRow}>
                  <View style={s.liveDot} />
                  <Text style={s.metaLive} allowFontScaling={true}>Publicando hoy</Text>
                  <Text style={s.metaDot} allowFontScaling={true}>·</Text>
                  <Text style={s.metaText} allowFontScaling={true}>Roma Norte</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Tira de stats vivos */}
          <View style={s.statsCard}>
            {STATS.map((st, i) => (
              <View key={st.label} style={[s.statCol, i < STATS.length - 1 && s.statDivider]}>
                <Text style={s.statNum} allowFontScaling={true}>{st.num}</Text>
                <Text style={s.statLabel} allowFontScaling={true}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Racha — banner cálido con contexto */}
          <LinearGradient
            colors={['rgba(255,106,61,0.16)', 'rgba(255,106,61,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.streakCard}>
            <View style={s.streakIcon}>
              <Ionicons name="flame" size={20} color={DARK.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.streakLabel} allowFontScaling={true}>Racha de 14 días</Text>
              <Text style={s.streakBody} allowFontScaling={true}>Tu mejor marca. Mañana cumples 3 semanas seguidas.</Text>
            </View>
          </LinearGradient>

          {/* Acción primaria: editar el lugar */}
          <TouchableOpacity style={s.primaryRow} onPress={goEdit} activeOpacity={0.85}>
            <View style={s.primaryIcon}>
              <Ionicons name="storefront-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.primaryTitle} allowFontScaling={true}>Editar mi lugar</Text>
              <Text style={s.primarySub} allowFontScaling={true}>Nombre, dirección, horario y foto</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          {/* Grupo: cambiar de lado + cuenta */}
          <View style={s.group}>
            <Row icon="map-outline" title="Explorar cocinas" sub="Ver Patio como quien busca" onPress={() => router.push('/explorar' as any)} />
            <Row icon="help-circle-outline" title="Soporte" sub="Escríbenos por correo" onPress={handleSupport} />
            <Row icon="log-out-outline" title="Cerrar sesión" last onPress={handleSignOut} />
          </View>

          <View style={s.footer}>
            <Ionicons name="ellipse" size={5} color={DARK.textMute} />
            <Text style={s.footerText} allowFontScaling={true}>Patio · v0.1 · CDMX</Text>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },

  // Hero
  hero: { height: 252, overflow: 'hidden' },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroText: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 22, paddingBottom: 8 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: DARK.accent, marginBottom: 14 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 62, height: 62, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
  avatarRing: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  name: { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 32, color: DARK.text, marginBottom: 6, fontFamily: Fonts.brand },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1F9D55' },
  metaLive: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, color: '#3FBE75' },
  metaText: { fontSize: 12.5, fontWeight: '300', color: DARK.textSecondary },
  metaDot: { fontSize: 12, color: 'rgba(248,248,245,0.25)' },

  body: { paddingHorizontal: 18, paddingTop: 18, gap: 14 },

  // Stats
  statsCard: { flexDirection: 'row', paddingVertical: 18, borderRadius: 20, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border },
  statCol: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statDivider: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: DARK.border },
  statNum: { fontSize: 26, fontWeight: '900', letterSpacing: -1, lineHeight: 28, color: DARK.text, fontFamily: Fonts.brand },
  statLabel: { marginTop: 5, fontSize: 10.5, fontWeight: '300', lineHeight: 13, textAlign: 'center', color: DARK.textSecondary },

  // Racha
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,106,61,0.22)' },
  streakIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,106,61,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,106,61,0.25)', alignItems: 'center', justifyContent: 'center' },
  streakLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: DARK.accent, marginBottom: 3 },
  streakBody: { fontSize: 13, fontWeight: '300', lineHeight: 18, color: 'rgba(248,248,245,0.65)' },

  // Acción primaria
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.09)' },
  primaryIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: DARK.accent, alignItems: 'center', justifyContent: 'center', shadowColor: DARK.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4 },
  primaryTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, color: DARK.text, marginBottom: 2 },
  primarySub: { fontSize: 12.5, fontWeight: '300', color: DARK.textSecondary },

  // Grupos de filas
  group: { borderRadius: 18, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  rowIconAccent: { backgroundColor: 'rgba(255,106,61,0.12)' },
  rowTitle: { fontSize: 14.5, fontWeight: '500', letterSpacing: -0.1, color: DARK.text, lineHeight: 18 },
  rowTitleAccent: { color: DARK.accent },
  rowSub: { marginTop: 2, fontSize: 12, fontWeight: '300', color: 'rgba(248,248,245,0.5)' },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 10 },
  footerText: { fontSize: 11, fontWeight: '300', letterSpacing: 0.4, textTransform: 'uppercase', color: DARK.textMute },
});
