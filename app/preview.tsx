import { router, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useMenuPreviewController } from '@/lib/controllers/useMenuPreviewController';
import { useTheme, Type } from '@/lib/theme';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { GlassIconButton } from '@/components/glass-button';
import { NewMenuSheet } from '@/components/new-menu-sheet';
import { noWidow } from '@/lib/typography';

// Vista canónica del menú publicado. Vive dentro de Patio y siempre conserva la
// misma identidad; compartir distribuye un enlace a esta publicación.
const LIGHT = { bg: '#F8F8F5', card: '#FFFFFF', ink: '#111214', inkSoft: '#4A4A47', mute: '#8A8A85', sep: 'rgba(17,18,20,0.06)', accent: '#F2612F' };

export default function PreviewScreen() {
  return <MenuPoster />;
}

// Recién publicado: la misma pantalla del póster con la confirmación arriba.
// Un solo paso: ves lo que publicaste, lo compartes, y «Editar» queda junto
// al menú que estás viendo.
export function MenuPoster({ justPublished = false }: { justPublished?: boolean }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(c);
  const { businessName, fecha, handleBack, handleOpenProfile, handleShare, patioId, priceLabel, sections } = useMenuPreviewController();
  const posterRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [newMenuSheetVisible, setNewMenuSheetVisible] = useState(false);
  const checkScale = useRef(new Animated.Value(justPublished ? 0.6 : 1)).current;
  useEffect(() => {
    if (!justPublished) return;
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, stiffness: 360, damping: 22, mass: 0.8 }).start();
  }, [checkScale, justPublished]);
  const editMenu = () => router.replace({ pathname: '/menu-editar', params: { reuse: '1' } });

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
          <Ionicons name="document-text-outline" size={32} color={c.accent} />
        </View>
        <Text style={s.emptyTitle}>{noWidow('Primero publica lo de hoy')}</Text>
        <Text style={s.emptyBody}>{noWidow('Cuando tu menú esté listo, aquí aparecerá publicado.')}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Crear menú" style={s.emptyButton} onPress={() => setNewMenuSheetVisible(true)} activeOpacity={0.85}>
          <Text style={s.emptyButtonText}>{noWidow('Crear menú')}</Text>
        </TouchableOpacity>
        <NewMenuSheet visible={newMenuSheetVisible} onClose={() => setNewMenuSheetVisible(false)} replaceOnNavigate />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={[s.top, { top: insets.top + 6 }]}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={handleBack} />
        {justPublished ? (
          <View style={s.publishedTitle} accessibilityRole="header" accessibilityLabel="Menú publicado">
            <Animated.View style={[s.publishedCheck, { transform: [{ scale: checkScale }] }]}>
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            </Animated.View>
            <Text style={s.topTitle} allowFontScaling={true}>Publicado</Text>
          </View>
        ) : <Text style={s.topTitle} allowFontScaling={true}>Póster</Text>}
        {justPublished ? (
          <TouchableOpacity style={s.editButton} onPress={editMenu} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Editar menú">
            <Text style={s.editText} allowFontScaling={true}>Editar</Text>
          </TouchableOpacity>
        ) : <View style={s.navBtn} />}
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
            {/* Precio del menú completo (comida corrida): a la derecha, como
                en la pizarra de la fonda — visible, un paso abajo del nombre. */}
            {!!priceLabel && (
              <View style={s.posterPrice} accessible accessibilityLabel={`Menú del día, ${priceLabel}`}>
                <Text style={s.posterPriceLabel} allowFontScaling={true}>MENÚ</Text>
                <Text style={s.posterPriceValue} allowFontScaling={true}>{priceLabel}</Text>
              </View>
            )}
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
                      {dish.descripcion ? <Text style={s.menuRowDescription}>{noWidow(dish.descripcion)}</Text> : null}
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
            <Text style={s.posterSign} allowFontScaling={true}>{noWidow('¿Qué hay hoy? Saaaaaaabes.')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* El póster es un objeto compartible real: la acción principal genera
          un JPG y abre la hoja nativa de iOS. */}
      <View style={[s.ctaWrap, { paddingBottom: (insets.bottom || 10) + 24 }]}>
        <TouchableOpacity
          style={s.cta}
          onPress={sharePoster}
          disabled={sharing}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={sharing ? 'Preparando imagen' : 'Compartir como imagen'}
          accessibilityState={{ disabled: sharing, busy: sharing }}>
          <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          <Text style={s.ctaText} allowFontScaling={true}>{sharing ? 'Preparando…' : 'Compartir como imagen'}</Text>
        </TouchableOpacity>
        {justPublished ? (
          // Después de publicar, «Listo» lleva a tu ficha: ahí ves lo que la
          // gente ya está viendo.
          <TouchableOpacity style={s.shareLink} onPress={() => router.replace('/mi-patio')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Listo, ver mi ficha">
            <Text style={[s.shareLinkText, { color: c.textSecondary }]} allowFontScaling={true}>Listo</Text>
          </TouchableOpacity>
        ) : (
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
        )}
      </View>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  emptyRoot: { paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Type.section, marginTop: 18, color: c.text, textAlign: 'center' },
  emptyBody: { maxWidth: 310, marginTop: 9, fontSize: 15, lineHeight: 21, fontWeight: '400', color: c.textSecondary, textAlign: 'center' },
  emptyButton: { width: '100%', maxWidth: 330, minHeight: 54, marginTop: 24, borderRadius: 27, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  // Espaciador de la top bar: mismo ancho que el botón de volver, SIN fondo —
  // solo existe para centrar el título.
  navBtn: { width: 44, height: 44 },
  topTitle: { fontSize: 17, fontWeight: '700', color: c.text, lineHeight: 22 },
  publishedTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  publishedCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent },
  editButton: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  editText: { fontSize: 16, fontWeight: '700', color: c.accent },

  posterWrap: { alignItems: 'center', paddingHorizontal: 22 },
  poster: { width: 330, borderRadius: 26, backgroundColor: LIGHT.bg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.24, shadowRadius: 34, elevation: 12 },
  posterHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18 },
  posterHeadLeft: { flex: 1 },
  posterPrice: { alignItems: 'flex-end' },
  posterPriceLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: LIGHT.inkSoft, marginBottom: 7 },
  posterPriceValue: { ...Type.section, color: LIGHT.ink, fontVariant: ['tabular-nums'] },
  posterDate: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: LIGHT.accent, marginBottom: 7 },
  posterName: { ...Type.screen, color: LIGHT.ink },

  // Densidad editorial (regla HIG): nombre+descripción son una unidad óptica
  // (1px de separación), filas a 5px, secciones a 10px — el aire vive ENTRE
  // grupos, nunca dentro de ellos.
  menuCard: { marginHorizontal: 18, padding: 18, borderRadius: 18, backgroundColor: LIGHT.card, borderWidth: StyleSheet.hairlineWidth, borderColor: LIGHT.sep },
  menuSection: { marginTop: 10 },
  menuSectionTitle: { marginBottom: 2, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: LIGHT.accent, textTransform: 'uppercase', lineHeight: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.sep },
  menuRowName: { fontSize: 14, lineHeight: 18, fontWeight: '500', color: LIGHT.ink, marginRight: 10 },
  menuRowDescription: { marginTop: 1, fontSize: 12, lineHeight: 16, color: LIGHT.inkSoft },
  menuRowPrice: { fontSize: 13, fontWeight: '400', color: LIGHT.inkSoft },

  posterFoot: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 18 },
  footRule: { height: StyleSheet.hairlineWidth, backgroundColor: LIGHT.sep, marginBottom: 12 },
  posterSign: { textAlign: 'center', fontSize: 11, fontWeight: '400', letterSpacing: 0.4, color: LIGHT.mute },

  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
  cta: { height: 54, borderRadius: 27, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  shareLink: { minHeight: 44, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareLinkText: { fontSize: 14, fontWeight: '500' },
  });
}
