import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { supabase } from '@/lib/supabase';
import { Fonts } from '@/lib/theme';

// FonderoFonda exacto a Figma: hero con foto + racha + filas de info.
const HERO = require('../assets/hero/botanica-6.png');
const ROLE_KEY = '@patio_user_role';
const SUPPORT_PHONE = '525500000000'; // WhatsApp soporte

const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  accent: '#FF6A3D',
};

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
      <View style={s.rowIcon}>
        <Ionicons name={icon} size={16} color={accent ? DARK.accent : 'rgba(248,248,245,0.7)'} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.rowTitle} allowFontScaling={true}>{title}</Text>
        {sub ? <Text style={s.rowSub} allowFontScaling={true}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={14} color={DARK.textMute} />
    </TouchableOpacity>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(ROLE_KEY).catch(() => {});
    router.replace('/');
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        {/* Hero band con foto */}
        <View style={s.hero}>
          <Image source={HERO} style={s.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(17,18,20,0.4)', 'rgba(17,18,20,0.5)', DARK.bg]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.heroText, { paddingTop: insets.top + 70 }]}>
            <Text style={s.eyebrow} allowFontScaling={true}>Tu Patio</Text>
            <Text style={s.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={true}>Cocina de Lupita</Text>
            <View style={s.metaRow}>
              <Ionicons name="location-outline" size={12} color={DARK.textSecondary} />
              <Text style={s.metaText} allowFontScaling={true}>Roma Norte</Text>
              <Text style={s.metaDot} allowFontScaling={true}>·</Text>
              <Ionicons name="time-outline" size={12} color={DARK.textSecondary} />
              <Text style={s.metaText} allowFontScaling={true}>13–17h · Lun–Vie</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Racha */}
          <LinearGradient
            colors={['rgba(255,106,61,0.15)', 'rgba(255,106,61,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.streakCard}>
            <Text style={s.streakNum} allowFontScaling={true}>14</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.streakLabel} allowFontScaling={true}>Días seguidos publicando</Text>
              <Text style={s.streakBody} allowFontScaling={true}>Tu mejor racha. Mañana cumples 3 semanas.</Text>
            </View>
          </LinearGradient>

          {/* Grupo gestión */}
          <View style={s.group}>
            <Row icon="create-outline" title="Información del lugar" sub="Nombre, dirección, horario" accent onPress={() => router.push('/perfil-editar' as any)} />
            <Row icon="camera-outline" title="Foto de portada" sub="Sin foto · usando ambiente Patio" onPress={() => router.push('/perfil-editar' as any)} />
            <Row icon="time-outline" title="Horario por día" sub="Recordatorios automáticos" last onPress={() => router.push('/perfil-editar' as any)} />
          </View>

          {/* Grupo cuenta */}
          <View style={s.group}>
            <Row icon="help-circle-outline" title="Soporte" sub="WhatsApp con el equipo" onPress={() => router.push('/perfil-editar' as any)} />
            <Row icon="log-out-outline" title="Cerrar sesión" last onPress={handleSignOut} />
          </View>
        </View>
      </ScrollView>

      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },
  hero: { height: 240, overflow: 'hidden' },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroText: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 22, paddingBottom: 6 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: DARK.accent, marginBottom: 6 },
  name: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: DARK.text, marginBottom: 8, fontFamily: Fonts.brand },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, fontWeight: '300', color: DARK.textSecondary },
  metaDot: { fontSize: 13, color: 'rgba(248,248,245,0.2)', marginHorizontal: 2 },

  body: { paddingHorizontal: 18, paddingTop: 18, gap: 14 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,106,61,0.25)' },
  streakNum: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 44, color: DARK.accent, minWidth: 56, fontFamily: Fonts.brand },
  streakLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: DARK.accent, marginBottom: 3 },
  streakBody: { fontSize: 13, fontWeight: '300', lineHeight: 18, color: 'rgba(248,248,245,0.65)' },

  group: { borderRadius: 18, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '500', letterSpacing: -0.1, color: DARK.text, lineHeight: 18 },
  rowSub: { marginTop: 2, fontSize: 11.5, fontWeight: '300', color: 'rgba(248,248,245,0.5)' },
});
