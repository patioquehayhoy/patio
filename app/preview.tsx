import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { getFonditaName, getMenuData, type MenuData } from '@/lib/menu-store';
import { Fonts } from '@/lib/theme';

// MenuPoster exacto a Figma: tarjeta vertical de marca que se comparte como imagen.
const DARK = { bg: '#08090B', text: '#F8F8F5', textMute: 'rgba(248,248,245,0.55)', accent: '#FF6A3D' };
const LIGHT = { bg: '#F8F8F5', card: '#FFFFFF', ink: '#111214', inkSoft: '#4A4A47', mute: '#8A8A85', sep: 'rgba(17,18,20,0.06)', accent: '#F2612F' };

// Menú de ejemplo si aún no hay nada (para que el póster nunca salga vacío).
const SAMPLE: { name: string; section: string }[] = [
  { name: 'Sopa de fideo aguada', section: 'Entrada' },
  { name: 'Tinga · Bistec a la mexicana', section: 'Guisado' },
  { name: 'Arroz · Frijoles · Tortillas', section: 'Acompañante' },
  { name: 'Gelatina de mosaico', section: 'Postre' },
];

type Row = { section: string; name: string; price?: string };

function flattenMenu(m: MenuData | null): { rows: Row[]; dayPrice: string | null } {
  if (!m) return { rows: [], dayPrice: null };
  const rows: Row[] = [];
  let dayPrice: string | null = null;
  for (const sec of m.secciones) {
    if (!dayPrice && sec.precio?.trim()) dayPrice = sec.precio.trim();
    for (const p of sec.platillos) {
      if (p.nombre?.trim()) rows.push({ section: sec.nombre, name: p.nombre.trim(), price: p.precio?.trim() || undefined });
    }
  }
  return { rows, dayPrice };
}

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [businessName, setBusinessName] = useState('Fonda Lupita');
  const posterRef = useRef<View | null>(null);

  useFocusEffect(
    useCallback(() => {
      setMenuData(getMenuData());
      setBusinessName(getFonditaName() || 'Fonda Lupita');
    }, [])
  );

  const { rows, dayPrice } = flattenMenu(menuData);
  const usingSample = rows.length === 0;
  const displayRows: Row[] = usingSample ? SAMPLE.map((x) => ({ section: x.section, name: x.name })) : rows;
  const priceLabel = dayPrice ? `$${dayPrice}` : (usingSample ? '$55' : null);
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  const handleShare = async () => {
    if (!posterRef.current) return;
    try {
      const uri = await captureRef(posterRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir menú', UTI: 'public.png' });
      } else {
        await Share.share({ url: uri });
      }
    } catch {
      Alert.alert('No se pudo compartir', 'Intentemos de nuevo.');
    }
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={[s.top, { top: insets.top + 6 }]}>
        <TouchableOpacity style={s.navBtn} onPress={() => router.replace('/menu')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={DARK.text} />
        </TouchableOpacity>
        <Text style={s.topTitle} allowFontScaling={true}>Compartir</Text>
        <View style={s.navBtn} />
      </View>

      {/* Póster centrado */}
      <View style={s.posterWrap}>
        <View ref={posterRef} collapsable={false} style={s.poster}>
          {/* Header de marca */}
          <View style={s.posterHead}>
            <View style={s.brandRow}>
              <Image source={require('../assets/images/p-icon-transparent.png')} style={s.brandMark} resizeMode="contain" />
              <Text style={s.brandClaim} allowFontScaling={true}>¿Qué hay hoy?</Text>
            </View>
            <Text style={s.posterDate} allowFontScaling={true}>{fecha}</Text>
            <Text style={s.posterName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={true}>{businessName}</Text>
          </View>

          {/* Card de menú */}
          <View style={s.menuCard}>
            <View style={s.menuCardHead}>
              <Text style={s.menuCardLabel} allowFontScaling={true}>Menú del día</Text>
              {priceLabel ? <Text style={s.menuCardPrice} allowFontScaling={true}>{priceLabel}</Text> : null}
            </View>
            {displayRows.map((r, i) => (
              <View key={i} style={s.menuRow}>
                <Text style={s.menuRowName} numberOfLines={1} allowFontScaling={true}>{r.name}</Text>
                {r.price ? <Text style={s.menuRowPrice} allowFontScaling={true}>${r.price}</Text> : null}
              </View>
            ))}
          </View>

          {/* Firma */}
          <Text style={s.posterSign} allowFontScaling={true}>Saaaaaaabes.</Text>
        </View>
      </View>

      {/* CTA compartir */}
      <View style={[s.ctaWrap, { paddingBottom: (insets.bottom || 10) + 24 }]}>
        <TouchableOpacity style={s.cta} onPress={handleShare} activeOpacity={0.86}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={s.ctaText} allowFontScaling={true}>Compartir en WhatsApp</Text>
        </TouchableOpacity>
        <Text style={s.ctaHint} allowFontScaling={true}>Se manda como imagen, lista para reenviar</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 14, fontWeight: '600', color: DARK.text },

  posterWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  poster: { width: 300, borderRadius: 26, backgroundColor: LIGHT.bg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 12 },
  posterHead: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandMark: { width: 30, height: 30 },
  brandClaim: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, color: LIGHT.ink, fontFamily: Fonts.brand },
  posterDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: LIGHT.accent, marginBottom: 6 },
  posterName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, color: LIGHT.ink, fontFamily: Fonts.brand },

  menuCard: { marginHorizontal: 22, padding: 18, borderRadius: 18, backgroundColor: LIGHT.card, borderWidth: StyleSheet.hairlineWidth, borderColor: LIGHT.sep },
  menuCardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  menuCardLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: LIGHT.mute },
  menuCardPrice: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4, color: LIGHT.accent, fontFamily: Fonts.brand },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.sep },
  menuRowName: { flex: 1, fontSize: 14, fontWeight: '400', color: LIGHT.ink, marginRight: 10 },
  menuRowPrice: { fontSize: 13, fontWeight: '300', color: LIGHT.inkSoft },

  posterSign: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20, textAlign: 'center', fontSize: 15, fontWeight: '900', letterSpacing: -0.3, color: LIGHT.ink, fontFamily: Fonts.brand },

  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
  cta: { height: 56, borderRadius: 18, backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  ctaHint: { marginTop: 10, fontSize: 11.5, fontWeight: '300', color: DARK.textMute, textAlign: 'center' },
});
