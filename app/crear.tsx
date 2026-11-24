import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/glass-button';
import { getProStatus } from '@/lib/business-pro';
import { MAX_PAGES } from '@/lib/controllers/useFotoMenuController';
import { latestMenuSeed, loadMenuHistory } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { getFonditaId } from '@/lib/menu-store';
import { PLANS } from '@/lib/plans';
import { Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// «Crear» del negocio (2026-11-24). Parco: la hoja que subía desde abajo
// «arruinaba la app», y abrir la cámara de golpe era invasivo. Queda una
// pantalla completa (HIG Modality: pantalla completa para una tarea; las
// hojas, para algo corto del contexto), como «Nueva publicación» de Instagram
// o «Menú» de Google Business Profile: la foto del menú es la opción grande
// (lo que más sirve al negocio, Jev 54 %), y la cámara solo se pide al
// tocarla (HIG Privacy: el permiso, cuando se usa la función).
export default function CrearScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = useMemo(() => makeStyles(c), [c]);
  const [lastMenu, setLastMenu] = useState<string | null>(null);
  const [promoLeft, setPromoLeft] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    let active = true;
    loadMenuHistory().then((menus) => {
      const seed = latestMenuSeed(menus);
      const count = seed?.secciones.reduce((sum, section) => sum + section.platillos.filter((dish) => dish.nombre.trim()).length, 0) ?? 0;
      if (active && seed && count) setLastMenu(`${count} ${count === 1 ? 'platillo' : 'platillos'}`);
    }).catch(() => {});
    const id = getFonditaId();
    if (id) getProStatus(id).then((status) => { if (active) setPromoLeft(status?.proUntil ? status.noticesLeft : null); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const close = () => { if (router.canGoBack()) router.back(); else router.replace('/historial'); };

  // Fotos se abre desde aquí y solo con fotos elegidas se entra a leerlas:
  // cancelar deja a la persona en Crear.
  const pickFromLibrary = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: true, selectionLimit: MAX_PAGES, orderedSelection: true });
      const assets = !result.canceled ? result.assets ?? [] : [];
      if (!assets.length) return;
      const hojas = JSON.stringify(assets.slice(0, MAX_PAGES).map((asset) => ({ uri: asset.uri, width: asset.width ?? undefined, height: asset.height ?? undefined })));
      router.replace({ pathname: '/foto-menu', params: { source: 'library', hojas } });
    } catch {
      Alert.alert(noWidow('No se pudo abrir Fotos'), noWidow('Inténtalo otra vez.'));
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={close} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Text style={s.title} accessibilityRole="header">Crear</Text>

        <Text style={s.label}>Menú de hoy</Text>
        <TouchableOpacity style={s.hero} activeOpacity={0.8} onPress={() => router.replace({ pathname: '/foto-menu', params: { source: 'camera' } })}
          accessibilityRole="button" accessibilityLabel="Tomar foto del menú" accessibilityHint="Abre la cámara. Patio escribe el menú solo.">
          <View style={s.heroIcon}><Ionicons name="camera-outline" size={28} color={c.accent} /></View>
          <Text style={s.heroTitle}>{noWidow('Tomar foto del menú')}</Text>
          <Text style={s.heroSub}>{noWidow('El pizarrón, una hoja o la carta completa. Patio lo escribe solo.')}</Text>
        </TouchableOpacity>
        <View style={s.pair}>
          <TouchableOpacity style={s.tile} activeOpacity={0.8} onPress={() => { void pickFromLibrary(); }} disabled={picking}
            accessibilityRole="button" accessibilityLabel="Elegir de Fotos" accessibilityState={{ busy: picking }}>
            <Ionicons name="images-outline" size={22} color={c.text} />
            <Text style={s.tileTitle}>{noWidow('Elegir de Fotos')}</Text>
            <Text style={s.tileSub}>{noWidow('Una o varias hojas')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tile} activeOpacity={0.8} onPress={() => router.replace('/menu-editar')}
            accessibilityRole="button" accessibilityLabel="Escribir a mano">
            <Ionicons name="create-outline" size={22} color={c.text} />
            <Text style={s.tileTitle}>{noWidow('Escribir a mano')}</Text>
            <Text style={s.tileSub}>{noWidow('Siempre gratis')}</Text>
          </TouchableOpacity>
        </View>
        {!!lastMenu && (
          <View style={s.list}>
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => router.replace({ pathname: '/menu-editar', params: { desde: 'ultimo' } })}
              accessibilityRole="button" accessibilityLabel={`Partir del último menú, ${lastMenu}`}>
              <View style={s.rowIcon}><Ionicons name="copy-outline" size={18} color={c.textSecondary} /></View>
              <View style={s.rowBody}>
                <Text style={s.rowTitle}>{noWidow('Partir del último menú')}</Text>
                <Text style={s.rowSub}>{noWidow(lastMenu)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMute} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={[s.label, { marginTop: 32 }]}>Avisos</Text>
        <View style={s.list}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => router.replace('/avisar')}
            accessibilityRole="button" accessibilityLabel="Avisar a quienes te siguen. Abrimos tarde, hoy no abrimos, se acabó">
            <View style={s.rowIcon}><Ionicons name="notifications-outline" size={18} color={c.textSecondary} /></View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>{noWidow('Avisar a quienes te siguen')}</Text>
              <Text style={s.rowSub}>{noWidow('Abrimos tarde, hoy no abrimos, se acabó')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textMute} />
          </TouchableOpacity>
          {promoLeft !== null && (
            <TouchableOpacity style={[s.row, s.rowDivider]} activeOpacity={0.7} onPress={() => router.replace('/aviso-especial')}
              accessibilityRole="button" accessibilityLabel={`Aviso especial. Te quedan ${promoLeft} de ${PLANS.pro.specialNotices} este mes`}>
              <View style={s.rowIcon}><Ionicons name="megaphone-outline" size={18} color={c.textSecondary} /></View>
              <View style={s.rowBody}>
                <Text style={s.rowTitle}>{noWidow('Aviso especial')}</Text>
                <Text style={s.rowSub}>{noWidow(`Promoción de 24 horas · te quedan ${promoLeft} de ${PLANS.pro.specialNotices}`)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMute} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    nav: { height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
    title: { ...Type.screen, color: c.text, marginTop: 4, marginBottom: 24 },
    label: { ...Type.label, color: c.textSecondary, marginBottom: 8 },
    hero: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, padding: 20, minHeight: 168, justifyContent: 'flex-end' },
    heroIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroTitle: { ...Type.section, color: c.text },
    heroSub: { marginTop: 4, fontSize: 14, lineHeight: 20, color: c.textSecondary },
    pair: { flexDirection: 'row', gap: 12, marginTop: 12 },
    tile: { flex: 1, minHeight: 112, borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, padding: 16, justifyContent: 'flex-end', gap: 2 },
    tileTitle: { marginTop: 10, fontSize: 15, lineHeight: 20, fontWeight: '700', color: c.text },
    tileSub: { fontSize: 13, lineHeight: 18, color: c.textSecondary },
    list: { marginTop: 12, borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 60 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    rowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: c.text },
    rowSub: { fontSize: 13, lineHeight: 18, color: c.textSecondary },
  });
}
