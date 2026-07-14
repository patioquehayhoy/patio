import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { ToggleSwitch } from '@/components/toggle-switch';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme, type Theme } from '@/lib/theme';

const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    // Header editorial
    header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, marginLeft: -8, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, fontFamily: Fonts.brand },

    body: { paddingHorizontal: 18, gap: 16, paddingTop: 12 },

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
    // minHeight 56: altura estándar de fila tocable en toda la app (Foodie y
    // Fondero comparten la misma métrica).
    row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16 },
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
  const { onScroll } = useTabBarScroll();
  const { handleDevFondero, handleSignOut, hasSession, stats } = useFoodieAccountController();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar (modelo
            Instagram). El back solo existe en pantallas hijas. */}
        <View style={s.header}>
          <Text style={s.eyebrow} allowFontScaling={true}>Cuenta</Text>
          <Text style={s.title} allowFontScaling={true}>Tu Patio</Text>
        </View>

        <View style={s.body}>
          {/* Resumen útil: solo datos reales, sin métricas decorativas. */}
          {(stats.viewed > 0 || stats.saved > 0) && <View style={s.idCard}>
            <LinearGradient
              colors={theme.isDark ? [theme.surface, theme.surface] : ['#FFFFFF', theme.accentSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={s.statsRow}>
                <TouchableOpacity style={s.statCol} activeOpacity={0.7} onPress={() => router.push('/vistos' as any)}>
                  <Text style={s.statNum} allowFontScaling={true}>{stats.viewed}</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>lugares vistos</Text>
                </TouchableOpacity>
                <View style={s.statDivider} />
                <TouchableOpacity style={s.statCol} activeOpacity={0.7} onPress={() => router.push('/favoritos' as any)}>
                  <Text style={s.statNum} allowFontScaling={true}>{stats.saved}</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>guardadas</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>}

          {/* Jerarquía por intención: las stats de arriba YA son la puerta a
              vistos/guardados (y Guardados vive en la tab bar) — sin filas
              redundantes. Después la puerta al otro lado, y al final
              preferencias, marca y salida. */}
          <View style={s.card}>
            {__DEV__ ? (
              <Row
                theme={theme}
                icon="construct-outline"
                title="Publicar mi menú · DEV"
                sub="Entrar sin iniciar sesión"
                accent
                onPress={handleDevFondero}
              />
            ) : (
              <Row
                theme={theme}
                icon="storefront-outline"
                title="Publicar mi menú"
                sub="Para cocinas y fonditas"
                accent
                onPress={() => router.push('/fondero-acceso')}
              />
            )}
          </View>

          <View style={s.card}>
            <Row theme={theme} icon="moon-outline" title="Modo oscuro" toggle={{ value: theme.isDark, onValueChange: toggleTheme }} />
            <Row theme={theme} icon="sparkles-outline" title="Nuestro manifiesto" divider onPress={() => router.push('/manifiesto')} />
            <Row theme={theme} icon="chatbubble-outline" title="Contactar soporte" divider onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Patio`)} />
            {(hasSession || __DEV__) && <Row theme={theme} icon="log-out-outline" title="Cerrar sesión" divider onPress={handleSignOut} />}
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
