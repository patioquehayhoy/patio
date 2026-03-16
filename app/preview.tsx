import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useTheme, type Theme } from '@/lib/theme';
import {
  getCartaData,
  getFonditaDescription,
  getFonditaDireccion,
  getFonditaDireccionVisible,
  getFonditaName,
  getMenuData,
  getTiempoLabels,
  type MenuData,
} from '@/lib/menu-store';

function SectionBlock({ data, title, theme }: { data: MenuData; title: string; theme: Theme }) {
  const hasContent =
    (data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean)) ||
    (data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean)) ||
    (data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean)) ||
    (data.postre.enabled && data.postre.items.some(Boolean)) ||
    (data.aguas.enabled && data.aguas.items.some(Boolean)) ||
    (data.precio.enabled && data.precio.value.trim());

  if (!hasContent) return null;

  const { primerLabel, segundoLabel, tercerLabel } = getTiempoLabels(data);
  const s = makeStyles(theme);

  const ri = (item: string, i: number) => {
    const si = item.indexOf(' / ');
    if (si === -1) return <Text key={i} style={s.item}>• {item}</Text>;
    return (
      <Text key={i} style={s.item}>
        {'• ' + item.slice(0, si)}<Text style={s.itemDesc}>{' / ' + item.slice(si + 3)}</Text>
      </Text>
    );
  };

  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>{title}</Text>

      {data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel}>{primerLabel}</Text>
          {data.primerTiempo.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel}>{segundoLabel}</Text>
          {data.segundoTiempo.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel}>{tercerLabel}</Text>
          {data.tercerTiempoGuisado.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.postre.enabled && data.postre.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel}>Postre</Text>
          {data.postre.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.aguas.enabled && data.aguas.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel}>Bebidas</Text>
          {data.aguas.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.precio.enabled && data.precio.value.trim() && (
        <Text style={s.precio}>${data.precio.value}</Text>
      )}
    </View>
  );
}

export default function PreviewScreen() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cartaData, setCartaData] = useState<MenuData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [fonditaName, setFonditaNameState] = useState(getFonditaName());
  const [fonditaDesc, setFonditaDescState] = useState(getFonditaDescription());
  const [fonditaDireccion, setFonditaDireccionState] = useState(getFonditaDireccion());
  const [fonditaDireccionVisible, setFonditaDireccionVisibleState] = useState(getFonditaDireccionVisible());
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const viewShotRef = useRef<ViewShot>(null);
  const insets = useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      setMenuData(getMenuData());
      setCartaData(getCartaData());
      setFonditaNameState(getFonditaName());
      setFonditaDescState(getFonditaDescription());
      setFonditaDireccionState(getFonditaDireccion());
      setFonditaDireccionVisibleState(getFonditaDireccionVisible());
    }, [])
  );

  const hasAnything = menuData !== null || cartaData !== null;

  const handleShare = async () => {
    if (!viewShotRef.current) return;
    setGenerating(true);
    try {
      const uri = await viewShotRef.current.capture!();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ViewShot ref={viewShotRef} style={{ backgroundColor: theme.bg, padding: 20 }}>
          <Text style={s.fonditaName}>{fonditaName}</Text>
          {!!fonditaDesc && <Text style={s.fonditaDesc}>{fonditaDesc}</Text>}
          {!!fonditaDireccion && <Text style={s.fonditaDireccion}>{fonditaDireccion}</Text>}
          <Text style={s.fecha}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

          {cartaData && <SectionBlock data={cartaData} title="Carta" theme={theme} />}
          {cartaData && menuData && <View style={s.sectionSeparator} />}
          {menuData && <SectionBlock data={menuData} title="Menú del día" theme={theme} />}

          {!hasAnything && (
            <Text style={s.empty}>Aún no hay contenido. Llena tu menú primero.</Text>
          )}
        </ViewShot>
      </ScrollView>

      {hasAnything && (
        <View style={s.actions}>
          <TouchableOpacity style={[s.whatsappButton, generating && { opacity: 0.7 }]} onPress={handleShare} activeOpacity={0.85} disabled={generating}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.whatsappButtonText}>{generating ? 'Generando imagen...' : 'Compartir por WhatsApp'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <BottomTabBar />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:         { flex: 1, backgroundColor: t.bg },
    scroll:            { flex: 1 },
    scrollContent:     { padding: 24, paddingBottom: 16 },
    fonditaName:       { fontSize: 24, fontWeight: '900', color: t.text, marginBottom: 4 },
    fonditaDesc:       { fontSize: 13, fontWeight: '300', color: t.gray, marginBottom: 2 },
    fonditaDireccion:  { fontSize: 11, fontWeight: '300', color: t.gray, marginBottom: 6 },
    fecha:             { fontSize: 10, fontWeight: '300', color: t.gray, opacity: 0.6, marginBottom: 28 },
    block:             { marginBottom: 28 },
    blockTitle:        { fontSize: 13, fontWeight: '900', letterSpacing: 0.6, color: t.orange, textTransform: 'uppercase', marginBottom: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    subsection:        { marginBottom: 12 },
    subsectionLabel:   { fontSize: 12, fontWeight: '900', color: t.gray, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
    item:              { fontSize: 15, fontWeight: '500', color: t.text, marginLeft: 4, marginBottom: 2 },
    itemDesc:          { fontSize: 11, fontWeight: '300', color: t.gray, opacity: 0.7 },
    precio:            { fontSize: 20, fontWeight: '900', color: t.orange, marginTop: 8 },
    sectionSeparator:  { height: 1, backgroundColor: t.sep, marginVertical: 4 },
    empty:             { textAlign: 'center', fontWeight: '300', color: t.gray, fontStyle: 'italic', marginTop: 40 },
    actions:           { padding: 16, paddingTop: 12, paddingBottom: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep },
    whatsappButton:    { backgroundColor: '#FF5E00', paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B2500', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
    whatsappButtonText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
