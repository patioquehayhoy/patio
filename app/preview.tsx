import { router, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useMenuPreviewController } from '@/lib/controllers/useMenuPreviewController';
import { Fonts, useTheme } from '@/lib/theme';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { GlassIconButton } from '@/components/glass-button';

// Vista canónica del menú publicado. Vive dentro de Patio y siempre conserva la
// misma identidad; compartir distribuye un enlace a esta publicación.
const LIGHT = { bg: '#F8F8F5', card: '#FFFFFF', ink: '#111214', inkSoft: '#4A4A47', mute: '#8A8A85', sep: 'rgba(17,18,20,0.06)', accent: '#F2612F' };

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(c);
  const { businessName, fecha, handleBack, handleOpenProfile, handleShare, patioId, sections } = useMenuPreviewController();
  const posterRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const sharePoster = async () => {
    if (sharing || !posterRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(posterRef, { format: 'jpg', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          UTI: 'public.jpeg',
          dialogTitle: `Compartir póster de ${businessName}`,
        });
      } else {
        await handleShare();
      }
    } finally {
      setSharing(false);
    }
  };

  if (sections.length === 0) {
    return (
      <View style={[s.root, s.emptyRoot, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.emptyIcon}>
          <Ionicons name="receipt-outline" size={28} color={c.accent} />
        </View>
        <Text style={s.emptyTitle}>Primero publica lo de hoy</Text>
        <Text style={s.emptyBody}>Cuando tu menú esté listo, aquí aparecerá publicado.</Text>
        <TouchableOpacity style={s.emptyButton} onPress={() => router.replace('/menu')} activeOpacity={0.84}>
          <Text style={s.emptyButtonText}>Crear menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={[s.top, { top: insets.top + 6 }]}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={handleBack} />
        <Text style={s.topTitle} allowFontScaling={true}>Póster</Text>
        <View style={s.navBtn} />
      </View>

      {/* Póster editorial, scrolleable si el menú real es largo. */}
      <ScrollView contentContainerStyle={[s.posterWrap, { paddingTop: insets.top + 74, paddingBottom: insets.bottom + 132 }]} showsVerticalScrollIndicator={false}>
        <View ref={posterRef} collapsable={false} style={s.poster}>
          {/* Header editorial: identidad primero. El precio único es un dato
              secundario y nunca compite con el nombre o los platillos. */}
          <View style={s.posterHead}>
            <View style={s.posterHeadLeft}>
              <Text style={s.posterDate} allowFontScaling={true}>{fecha}</Text>
              <Text style={s.posterName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6} allowFontScaling={true}>{businessName}</Text>
            </View>
          </View>

          {/* Card de menú: las secciones hablan solas, sin label redundante. */}
          <View style={s.menuCard}>
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

          {/* Firma de marca: minimalista — una línea sutil en light, nada más. */}
          <View style={s.posterFoot}>
            <View style={s.footRule} />
            <Text style={s.posterSign} allowFontScaling={true}>¿Qué hay hoy? Saaaaaaabes.</Text>
          </View>
        </View>
      </ScrollView>

      {/* El póster es un objeto compartible real: la acción principal genera
          un JPG y abre la hoja nativa de iOS. */}
      <View style={[s.ctaWrap, { paddingBottom: (insets.bottom || 10) + 24 }]}>
        <TouchableOpacity style={s.cta} onPress={sharePoster} disabled={sharing} activeOpacity={0.86}>
          <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          <Text style={s.ctaText} allowFontScaling={true}>{sharing ? 'Preparando…' : 'Compartir como imagen'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.shareLink} onPress={handleOpenProfile} disabled={!patioId} activeOpacity={0.72}>
          <Text style={[s.shareLinkText, { color: c.textSecondary }]} allowFontScaling={true}>Ver en mi perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  emptyRoot: { paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 18, fontSize: 26, lineHeight: 30, fontWeight: '900', color: c.text, textAlign: 'center', fontFamily: Fonts.brand },
  emptyBody: { maxWidth: 310, marginTop: 9, fontSize: 14, lineHeight: 20, fontWeight: '400', color: c.textSecondary, textAlign: 'center' },
  emptyButton: { width: '100%', maxWidth: 330, minHeight: 56, marginTop: 24, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  // Espaciador de la top bar: mismo ancho que el botón de volver, SIN fondo —
  // solo existe para centrar el título.
  navBtn: { width: 40, height: 40 },
  topTitle: { fontSize: 14, fontWeight: '600', color: c.text },

  posterWrap: { alignItems: 'center', paddingHorizontal: 22 },
  poster: { width: 330, borderRadius: 26, backgroundColor: LIGHT.bg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.24, shadowRadius: 34, elevation: 12 },
  posterHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18 },
  posterHeadLeft: { flex: 1 },
  posterDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: LIGHT.accent, marginBottom: 7 },
  posterName: { fontSize: 32, lineHeight: 35, fontWeight: '900', letterSpacing: -1, color: LIGHT.ink, fontFamily: Fonts.brand },

  // Densidad editorial (regla HIG): nombre+descripción son una unidad óptica
  // (1px de separación), filas a 5px, secciones a 10px — el aire vive ENTRE
  // grupos, nunca dentro de ellos.
  menuCard: { marginHorizontal: 18, padding: 18, borderRadius: 18, backgroundColor: LIGHT.card, borderWidth: StyleSheet.hairlineWidth, borderColor: LIGHT.sep },
  menuSection: { marginTop: 10 },
  menuSectionTitle: { marginBottom: 2, fontSize: 10, fontWeight: '800', letterSpacing: 1, color: LIGHT.accent, textTransform: 'uppercase' },
  menuRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.sep },
  menuRowName: { fontSize: 14, lineHeight: 17, fontWeight: '500', color: LIGHT.ink, marginRight: 10 },
  menuRowDescription: { marginTop: 1, fontSize: 11.5, lineHeight: 14, color: LIGHT.inkSoft },
  menuRowPrice: { fontSize: 13, fontWeight: '400', color: LIGHT.inkSoft },

  posterFoot: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 18 },
  footRule: { height: StyleSheet.hairlineWidth, backgroundColor: LIGHT.sep, marginBottom: 12 },
  posterSign: { textAlign: 'center', fontSize: 11, fontWeight: '400', letterSpacing: 0.4, color: LIGHT.mute },

  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
  cta: { height: 54, borderRadius: 27, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: '#FFFFFF' },
  shareLink: { minHeight: 44, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  shareLinkText: { fontSize: 13.5, fontWeight: '500' },
  });
}
