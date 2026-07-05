import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { getFonditaName, getMenuData, type MenuData } from '@/lib/menu-store';
import { Fonts, useTheme } from '@/lib/theme';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { GlassIconButton } from '@/components/glass-button';

// MenuPoster exacto a Figma: tarjeta vertical de marca que se comparte como imagen.
// El PÓSTER (tarjeta blanca) es SIEMPRE claro — es una imagen de marca que se
// comparte, no debe cambiar con el tema. Solo el chrome (fondo, top bar, hint)
// sigue el tema claro/oscuro de la app.
const LIGHT = { bg: '#F8F8F5', card: '#FFFFFF', ink: '#111214', inkSoft: '#4A4A47', mute: '#8A8A85', sep: 'rgba(17,18,20,0.06)', accent: '#F2612F' };

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(c);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [businessName, setBusinessName] = useState('Tu Patio');
  const posterRef = useRef<View | null>(null);

  useFocusEffect(
    useCallback(() => {
      setMenuData(getMenuData());
      setBusinessName(getFonditaName() || 'Tu Patio');
    }, [])
  );

  const sections = (menuData?.secciones ?? [])
    .map(section => ({ ...section, platillos: section.platillos.filter(dish => dish.nombre.trim()) }))
    .filter(section => section.platillos.length);
  const dayPrice = sections.find(section => section.precio.trim())?.precio.trim();
  const priceLabel = dayPrice ? `$${dayPrice}` : null;
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
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={() => router.replace('/menu')} />
        <Text style={s.topTitle} allowFontScaling={true}>Compartir</Text>
        <View style={s.navBtn} />
      </View>

      {/* Póster editorial, scrolleable si el menú real es largo. */}
      <ScrollView contentContainerStyle={[s.posterWrap, { paddingTop: insets.top + 74, paddingBottom: insets.bottom + 132 }]} showsVerticalScrollIndicator={false}>
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
            {sections.map((section, sectionIndex) => (
              <View key={section.id} style={sectionIndex > 0 && s.menuSection}>
                <Text style={s.menuSectionTitle}>{section.nombre}</Text>
                {section.platillos.map((dish) => (
                  <View key={dish.id} style={s.menuRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.menuRowName} allowFontScaling={true}>{dish.nombre}</Text>
                      {dish.descripcion ? <Text style={s.menuRowDescription}>{dish.descripcion}</Text> : null}
                    </View>
                    {dish.precio ? <Text style={s.menuRowPrice} allowFontScaling={true}>${dish.precio}</Text> : null}
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Firma */}
          <Text style={s.posterSign} allowFontScaling={true}>Saaaaaaabes.</Text>
        </View>
      </ScrollView>

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

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 14, fontWeight: '600', color: c.text },

  posterWrap: { alignItems: 'center', paddingHorizontal: 22 },
  poster: { width: 330, borderRadius: 26, backgroundColor: LIGHT.bg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.24, shadowRadius: 34, elevation: 12 },
  posterHead: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandMark: { width: 30, height: 30 },
  brandClaim: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, color: LIGHT.ink, fontFamily: Fonts.brand },
  posterDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: LIGHT.accent, marginBottom: 6 },
  posterName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, color: LIGHT.ink, fontFamily: Fonts.brand },

  menuCard: { marginHorizontal: 18, padding: 18, borderRadius: 18, backgroundColor: LIGHT.card, borderWidth: StyleSheet.hairlineWidth, borderColor: LIGHT.sep },
  menuCardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  menuCardLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: LIGHT.mute },
  menuCardPrice: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4, color: LIGHT.accent, fontFamily: Fonts.brand },
  menuSection: { marginTop: 14 },
  menuSectionTitle: { marginBottom: 3, fontSize: 10, fontWeight: '800', letterSpacing: 1, color: LIGHT.accent, textTransform: 'uppercase' },
  menuRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.sep },
  menuRowName: { fontSize: 14, lineHeight: 18, fontWeight: '500', color: LIGHT.ink, marginRight: 10 },
  menuRowDescription: { marginTop: 2, fontSize: 11.5, lineHeight: 15, color: LIGHT.inkSoft },
  menuRowPrice: { fontSize: 13, fontWeight: '300', color: LIGHT.inkSoft },

  posterSign: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20, textAlign: 'center', fontSize: 15, fontWeight: '900', letterSpacing: -0.3, color: LIGHT.ink, fontFamily: Fonts.brand },

  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
  cta: { height: 56, borderRadius: 18, backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  ctaHint: { marginTop: 10, fontSize: 11.5, fontWeight: '300', color: c.textMute, textAlign: 'center' },
  });
}
