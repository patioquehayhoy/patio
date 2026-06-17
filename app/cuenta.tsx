import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { getNotifPrefs, setAvisar, setCercanas } from '@/lib/notifications';
import { getFoodieStats, type FoodieStats } from '@/lib/stats';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme, type Theme } from '@/lib/theme';

const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';
const ROLE_KEY = '@patio_user_role';
const OPEN_GREEN = '#1F9D55';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    // Header editorial
    header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, marginLeft: -8, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, fontFamily: Fonts.brand },

    body: { paddingHorizontal: 18, gap: 18, paddingTop: 12 },

    // Identidad card con degradado tibio
    idCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 18 },
    statCol: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, color: t.text, lineHeight: 30, fontFamily: Fonts.brand },
    statLabel: { marginTop: 4, fontSize: 10.5, fontWeight: '300', letterSpacing: 0.4, textTransform: 'uppercase', color: t.textSecondary },
    statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 4, backgroundColor: t.border },

    // Grupos
    group: {},
    groupLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textMute, paddingHorizontal: 6, paddingBottom: 8 },
    card: { borderRadius: 18, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 14.5, fontWeight: '500', letterSpacing: -0.1, lineHeight: 18, color: t.text },
    rowTitleAccent: { color: t.accent },
    rowSub: { marginTop: 2, fontSize: 12, fontWeight: '300', color: t.textSecondary },

    // Footer marca
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 12 },
    footerText: { fontSize: 11, fontWeight: '300', letterSpacing: 0.5, textTransform: 'uppercase', color: t.textMute },
  });
}

function ToggleSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  }, [anim, value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackBg = anim.interpolate({ inputRange: [0, 1], outputRange: ['#cbced4', OPEN_GREEN] });
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.85}>
      <Animated.View style={[tog.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[tog.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const tog = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 1 },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
});

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  accent?: boolean;
  divider?: boolean;
  onPress?: () => void;
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
};

function Row({ icon, title, sub, accent, divider, onPress, toggle, theme }: RowProps & { theme: Theme }) {
  const s = makeStyles(theme);
  const iconColor = accent ? theme.accent : theme.textSecondary;
  const iconBg = accent ? theme.accentSoft : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)');
  const content = (
    <View style={[s.row, divider && s.rowDivider]}>
      <View style={[s.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowTitle, accent && s.rowTitleAccent]} allowFontScaling={true}>{title}</Text>
        {sub ? <Text style={s.rowSub} allowFontScaling={true}>{sub}</Text> : null}
      </View>
      {toggle
        ? <ToggleSwitch value={toggle.value} onValueChange={toggle.onValueChange} />
        : <Ionicons name="chevron-forward" size={16} color={theme.textMute} />}
    </View>
  );
  if (toggle) return content;
  return <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>;
}

export default function CuentaScreen() {
  const { theme, toggleTheme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<FoodieStats>({ viewed: 0, saved: 0 });
  const [avisar, setAvisarState] = useState(false);
  const [cercanas, setCercanasState] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getFoodieStats().then(setStats);
      getNotifPrefs().then((p) => { setAvisarState(p.avisar); setCercanasState(p.cercanas); });
    }, [])
  );

  const onToggleAvisar = async (v: boolean) => {
    setAvisarState(v); // optimista
    const final = await setAvisar(v);
    setAvisarState(final); // refleja permiso real
  };

  const onToggleCercanas = async (v: boolean) => {
    setCercanasState(v);
    const final = await setCercanas(v);
    setCercanasState(final);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(ROLE_KEY).catch(() => {});
    router.replace('/');
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.eyebrow} allowFontScaling={true}>Tu Patio</Text>
          <Text style={s.title} allowFontScaling={true}>Foodie sin nombre.</Text>
        </View>

        <View style={s.body}>
          {/* Stats card — 3 columnas (datos reales con respaldo de ejemplo Figma) */}
          <View style={s.idCard}>
            <LinearGradient
              colors={theme.isDark ? [theme.surface, theme.surface] : ['#FFFFFF', theme.accentSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={s.statsRow}>
                <View style={s.statCol}>
                  <Text style={s.statNum} allowFontScaling={true}>{stats.viewed || 12}</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>fonditas vistas</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCol}>
                  <Text style={s.statNum} allowFontScaling={true}>{stats.saved || 4}</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>guardadas</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCol}>
                  <Text style={s.statNum} allowFontScaling={true}>38</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>km caminados</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Grupo: Notificaciones */}
          <View style={s.group}>
            <Text style={s.groupLabel} allowFontScaling={true}>Notificaciones</Text>
            <View style={s.card}>
              <Row theme={theme} icon="notifications-outline" title="Avísame cuando publiquen" sub={avisar ? 'Recordatorio diario a la 1pm' : 'Para tus fonditas guardadas'} accent toggle={{ value: avisar, onValueChange: onToggleAvisar }} />
              <Row theme={theme} icon="location-outline" title="Sugerencias cercanas" sub="Cuando andes cerca de algo rico" divider toggle={{ value: cercanas, onValueChange: onToggleCercanas }} />
            </View>
          </View>

          {/* Grupo: Tu Patio */}
          <View style={s.group}>
            <Text style={s.groupLabel} allowFontScaling={true}>Tu Patio</Text>
            <View style={s.card}>
              <Row theme={theme} icon="heart-outline" title="Guardados" sub="Tus lugares de confianza" onPress={() => router.push('/favoritos')} />
              <Row theme={theme} icon="moon-outline" title="Modo oscuro" divider toggle={{ value: theme.isDark, onValueChange: toggleTheme }} />
              <Row theme={theme} icon="sparkles-outline" title="Manifiesto" sub="De qué va Patio" divider onPress={() => router.push('/manifiesto')} />
            </View>
          </View>

          {/* Grupo: Patio */}
          <View style={s.group}>
            <Text style={s.groupLabel} allowFontScaling={true}>Patio</Text>
            <View style={s.card}>
              <Row theme={theme} icon="storefront-outline" title="¿Tienes una cocina?" sub="Publica tu menú como fondero" accent onPress={() => router.replace('/?intent=business')} />
              <Row theme={theme} icon="chatbubble-outline" title="Contactar soporte" divider onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Patio`)} />
              <Row theme={theme} icon="star-outline" title="Calificar la app" divider onPress={() => Linking.openURL('itms-apps://itunes.apple.com/app/id6760884735?action=write-review')} />
              <Row theme={theme} icon="log-out-outline" title="Cerrar sesión" divider onPress={handleSignOut} />
            </View>
          </View>

          <View style={s.footer}>
            <Ionicons name="ellipse" size={6} color={theme.textMute} />
            <Text style={s.footerText} allowFontScaling={true}>Patio · v0.1 · CDMX</Text>
          </View>
        </View>
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
