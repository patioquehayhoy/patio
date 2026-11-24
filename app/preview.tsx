import { router, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useMenuPreviewController } from '@/lib/controllers/useMenuPreviewController';
import { useTheme, Type } from '@/lib/theme';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { GlassIconButton } from '@/components/glass-button';
import { PosterCard } from '@/components/menu-poster-card';
import { noWidow } from '@/lib/typography';

// El póster del menú publicado, para compartirlo como imagen (WhatsApp,
// estados). Se llega desde «Compartir imagen» al publicar y desde «Imagen» al
// deslizar un menú en Menús. Publicar ya no abre esta pantalla: el aviso de
// «Publicado» vive en Menús (Parco, 24 nov).
export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(c);
  const { businessName, fecha, handleBack, handleOpenProfile, handleShare, menuPrices, patioId, priceLabel, priceName, sections, carta, refreshing } = useMenuPreviewController();
  const posterRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const sharePoster = async () => {
    if (sharing || refreshing || !posterRef.current) return;
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
          <Ionicons name="document-text-outline" size={32} color={c.accent} />
        </View>
        <Text style={s.emptyTitle}>{noWidow('Primero publica lo de hoy')}</Text>
        <Text style={s.emptyBody}>{noWidow('Cuando tu menú esté listo, aquí aparecerá para compartirlo.')}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Crear menú" style={s.emptyButton} onPress={() => router.replace('/crear')} activeOpacity={0.85}>
          <Text style={s.emptyButtonText}>{noWidow('Crear menú')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.top, { top: insets.top + 6 }]}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={handleBack} />
        <Text style={s.topTitle} allowFontScaling={true}>Póster</Text>
        <View style={s.navBtn} />
      </View>

      <ScrollView contentContainerStyle={[s.posterWrap, { paddingTop: insets.top + 74, paddingBottom: insets.bottom + 132 }]} showsVerticalScrollIndicator={false}>
        <PosterCard ref={posterRef} fecha={fecha} businessName={businessName} priceLabel={priceLabel} priceName={priceName} menuPrices={menuPrices} sections={sections} carta={carta} />
      </ScrollView>

      {/* El póster es un objeto compartible real: la acción principal genera
          un JPG y abre la hoja nativa de iOS. */}
      <View style={[s.ctaWrap, { paddingBottom: (insets.bottom || 10) + 24 }]}>
        <TouchableOpacity
          style={s.cta}
          onPress={sharePoster}
          disabled={sharing || refreshing}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={refreshing ? 'Actualizando menú' : sharing ? 'Preparando imagen' : 'Compartir como imagen'}
          accessibilityState={{ disabled: sharing || refreshing, busy: sharing || refreshing }}>
          <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          <Text style={s.ctaText} allowFontScaling={true}>{refreshing ? 'Actualizando…' : sharing ? 'Preparando…' : 'Compartir como imagen'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.shareLink}
          onPress={handleOpenProfile}
          disabled={!patioId}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Ver en mi perfil"
          accessibilityState={{ disabled: !patioId }}>
          <Text style={[s.shareLinkText, { color: c.textSecondary }]} allowFontScaling={true}>{noWidow('Ver en mi perfil')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  emptyRoot: { paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, borderCurve: 'continuous', backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Type.section, marginTop: 18, color: c.text, textAlign: 'center' },
  emptyBody: { maxWidth: 310, marginTop: 9, fontSize: 15, lineHeight: 21, fontWeight: '400', color: c.textSecondary, textAlign: 'center' },
  emptyButton: { width: '100%', maxWidth: 330, minHeight: 54, marginTop: 24, borderRadius: 27, borderCurve: 'continuous', backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  // Espaciador de la top bar: mismo ancho que el botón de volver, SIN fondo —
  // solo existe para centrar el título.
  navBtn: { width: 44, height: 44 },
  topTitle: { fontSize: 17, fontWeight: '700', color: c.text, lineHeight: 22 },

  posterWrap: { alignItems: 'center', paddingHorizontal: 22 },
  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
  cta: { height: 54, borderRadius: 27, borderCurve: 'continuous', backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  shareLink: { minHeight: 44, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareLinkText: { fontSize: 14, fontWeight: '500' },
  });
}
