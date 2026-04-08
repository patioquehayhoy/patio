import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useTheme, type Theme } from '@/lib/theme';
import {
  getCartaData,
  getFonditaDescription,
  getFonditaDireccion,
  getFonditaHorario,
  getFonditaName,
  getMenuData,
  getPagosEfectivo,
  getPagosTarjeta,
  getPagosTrans,
  getTiempoLabels,
  type MenuData,
} from '@/lib/menu-store';

function SectionBlock({ data, title, theme, fecha }: { data: MenuData; title: string; theme: Theme; fecha?: string }) {
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
    if (si === -1) return <Text key={i} style={s.item} allowFontScaling={true}>• {item}</Text>;
    return (
      <Text key={i} style={s.item} allowFontScaling={true}>
        {'• ' + item.slice(0, si)}<Text style={s.itemDesc} allowFontScaling={true}>{' / ' + item.slice(si + 3)}</Text>
      </Text>
    );
  };

  return (
    <View style={s.block}>
      <View style={s.blockTitleRow}>
        <Text style={s.blockTitle} allowFontScaling={true}>{title}</Text>
        {!!fecha && <Text style={s.blockFecha} allowFontScaling={true}>{fecha}</Text>}
      </View>

      {data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel} allowFontScaling={true}>{primerLabel}</Text>
          {data.primerTiempo.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel} allowFontScaling={true}>{segundoLabel}</Text>
          {data.segundoTiempo.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel} allowFontScaling={true}>{tercerLabel}</Text>
          {data.tercerTiempoGuisado.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.aguas.enabled && data.aguas.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel} allowFontScaling={true}>Bebidas</Text>
          {data.aguas.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.postre.enabled && data.postre.items.some(Boolean) && (
        <View style={s.subsection}>
          <Text style={s.subsectionLabel} allowFontScaling={true}>Postre</Text>
          {data.postre.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.precio.enabled && data.precio.value.trim() && (
        <Text style={s.precio} allowFontScaling={true}>${data.precio.value}</Text>
      )}
    </View>
  );
}

export default function PreviewScreen() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cartaData, setCartaData] = useState<MenuData | null>(null);
  const [fonditaName, setFonditaNameState] = useState(getFonditaName());
  const [fonditaDesc, setFonditaDescState] = useState(getFonditaDescription());
  const [fonditaDireccion, setFonditaDireccionState] = useState(getFonditaDireccion());
  const [fonditaHorario,   setFonditaHorarioState]   = useState(getFonditaHorario());
  const [pagosEfectivo,    setPagosEfectivoState]    = useState(getPagosEfectivo());
  const [pagosTrans,       setPagosTransState]       = useState(getPagosTrans());
  const [pagosTarjeta,     setPagosTarjetaState]     = useState(getPagosTarjeta());
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const shareCardRef = useRef<View | null>(null);
  const landscapeShareRef = useRef<View | null>(null);
  useFocusEffect(
    useCallback(() => {
      setMenuData(getMenuData());
      setCartaData(getCartaData());
      setFonditaNameState(getFonditaName());
      setFonditaDescState(getFonditaDescription());
      setFonditaDireccionState(getFonditaDireccion());
      setFonditaHorarioState(getFonditaHorario());
      setPagosEfectivoState(getPagosEfectivo());
      setPagosTransState(getPagosTrans());
      setPagosTarjetaState(getPagosTarjeta());
    }, [])
  );

  const hasAnything = menuData !== null || cartaData !== null;
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const pagos = [pagosEfectivo && 'Efectivo', pagosTrans && 'Transferencia', pagosTarjeta && 'Tarjeta'].filter(Boolean).join(' · ');

  const shareFile = async (uri: string, mimeType: string, dialogTitle: string, uti?: string) => {
    if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: uti });
      return;
    }
    await Share.share({ url: uri });
  };

  const handleShareImage = async () => {
    if (!landscapeShareRef.current) return;
    try {
      const uri = await captureRef(landscapeShareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await shareFile(uri, 'image/png', 'Compartir imagen horizontal', 'public.png');
    } catch {
      Alert.alert('No se pudo compartir la imagen', 'Intentemos de nuevo.');
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View ref={shareCardRef} collapsable={false} style={s.shareFrame}>
          <View style={s.shareCard}>
            <View style={s.scrollBody}>
              <View>
                <Text style={s.fonditaName} allowFontScaling={true}>{fonditaName}</Text>
                {!!fonditaDesc && <Text style={s.fonditaDesc} allowFontScaling={true}>{fonditaDesc}</Text>}
                {!!fonditaDireccion && <Text style={s.fonditaDireccion} allowFontScaling={true}>{fonditaDireccion}</Text>}
                <View style={s.headerDivider} />

                {cartaData && <SectionBlock data={cartaData} title="Carta" theme={theme} />}
                {cartaData && menuData && <View style={s.sectionSeparator} />}
                {menuData && <SectionBlock data={menuData} title="Menú del día" theme={theme} />}
              </View>

              <View>
                {hasAnything && (
                  <View style={s.infoBlock}>
                    <Text style={s.infoFecha} allowFontScaling={true}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                    {!!fonditaHorario && <Text style={s.infoLine} allowFontScaling={true}>{fonditaHorario}</Text>}
                    {(pagosEfectivo || pagosTrans || pagosTarjeta) && (
                      <Text style={s.infoLine} allowFontScaling={true}>
                        {[pagosEfectivo && 'Efectivo', pagosTrans && 'Transferencia', pagosTarjeta && 'Tarjeta'].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                )}

                {!hasAnything && (
                  <Text style={s.empty} allowFontScaling={true}>Aún no hay contenido. Llena tu menú primero.</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {hasAnything && (
        <View style={s.actions}>
          <TouchableOpacity style={s.shareButton} onPress={handleShareImage} activeOpacity={0.82}>
            <Ionicons name="image-outline" size={20} color={theme.surface} style={{ marginRight: 8 }} />
            <Text style={s.shareButtonText} allowFontScaling={true}>Compartir</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.captureRoot} pointerEvents="none">
        <View ref={landscapeShareRef} collapsable={false} style={s.landscapeCanvas}>
          <View style={s.landscapeCard}>
            <View style={s.landscapeHeader}>
              <Text style={s.landscapeName}>{fonditaName}</Text>
              {!!fonditaDesc && <Text style={s.landscapeDesc}>{fonditaDesc}</Text>}
              {!!fonditaDireccion && <Text style={s.landscapeDireccion}>{fonditaDireccion}</Text>}
            </View>
            <View style={s.landscapeColumns}>
              <View style={s.landscapeColumnPrimary}>
                {menuData ? <SectionBlock data={menuData} title="Menú del día" theme={theme} /> : <Text style={s.landscapeEmpty}>Sin menú del día</Text>}
              </View>
              <View style={s.landscapeDivider} />
              <View style={s.landscapeColumnSecondary}>
                {cartaData ? <SectionBlock data={cartaData} title="Carta" theme={theme} /> : <Text style={s.landscapeEmpty}>Sin carta</Text>}
              </View>
            </View>
            <View style={s.landscapeFooter}>
              <Text style={s.infoFecha}>{fecha}</Text>
              {!!fonditaHorario && <Text style={s.infoLine}>{fonditaHorario}</Text>}
              {!!pagos && <Text style={s.infoLine}>{pagos}</Text>}
            </View>
          </View>
        </View>
      </View>
      <BottomTabBar />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:         { flex: 1, backgroundColor: t.bg },
    scroll:            { flex: 1 },
    scrollContent:     { flexGrow: 1, padding: 24, paddingBottom: 4 },
    shareFrame:        { backgroundColor: t.bg, paddingHorizontal: 0, paddingVertical: 16 },
    shareCard:         { backgroundColor: t.surface, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 24 },
    scrollBody:        { flexGrow: 1, justifyContent: 'space-between' },
    headerDivider:     { height: StyleSheet.hairlineWidth, backgroundColor: t.sep, marginBottom: 24 },
    fonditaName:       { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5, lineHeight: 34, marginBottom: 2 },
    fonditaDesc:       { fontSize: 15, fontWeight: '300', color: t.gray, lineHeight: 22, marginBottom: 2 },
    fonditaDireccion:  { fontSize: 12, fontWeight: '300', color: t.gray, lineHeight: 17, opacity: 0.5, marginBottom: 6 },
    block:             { marginBottom: 0 },
    blockTitleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    blockTitle:        { fontSize: 12, fontWeight: '900', letterSpacing: 1.4, color: t.accent, textTransform: 'uppercase' },
    blockFecha:        { fontSize: 12, fontWeight: '300', color: t.gray },
    subsection:        { marginBottom: 0 },
    subsectionLabel:   { fontSize: 12, fontWeight: '900', letterSpacing: 1.0, color: t.text, marginTop: 16, marginBottom: 6, textTransform: 'uppercase', opacity: 0.5 },
    item:              { fontSize: 17, fontWeight: '900', color: t.text, marginLeft: 4, marginBottom: 8 },
    itemDesc:          { fontSize: 15, fontWeight: '300', color: t.gray, lineHeight: 22 },
    precio:            { fontSize: 22, fontWeight: '900', color: t.accent, marginTop: 12, marginBottom: 0 },
    sectionSeparator:  { height: StyleSheet.hairlineWidth, backgroundColor: t.sep, marginVertical: 24 },
    infoBlock:         { marginTop: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, alignItems: 'center' },
    infoFecha:         { fontSize: 12, fontWeight: '300', color: t.gray, opacity: 0.6, lineHeight: 18, textAlign: 'center', marginBottom: 2 },
    infoLine:          { fontSize: 12, fontWeight: '300', color: t.gray, opacity: 0.6, lineHeight: 18, textAlign: 'center', marginBottom: 2 },
    empty:             { textAlign: 'center', fontWeight: '300', color: t.gray, fontStyle: 'italic', marginTop: 40 },
    actions:           { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, paddingTop: 12 },
    shareButton:       { backgroundColor: t.text, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginBottom: 24, shadowColor: t.text, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
    shareButtonText:   { color: t.surface, fontSize: 15, fontWeight: '700' },
    captureRoot:       { position: 'absolute', left: -2000, top: 0, opacity: 1 },
    landscapeCanvas:   { width: 767, backgroundColor: t.bg, paddingVertical: 10, paddingHorizontal: 10 },
    landscapeCard:     { backgroundColor: t.surface, borderRadius: 14, paddingTop: 20, paddingBottom: 18, paddingHorizontal: 13 },
    landscapeHeader:   { width: 522, alignSelf: 'center', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    landscapeName:     { fontSize: 36, fontWeight: '900', color: t.text, lineHeight: 40, marginBottom: 4, textAlign: 'center' },
    landscapeDesc:     { fontSize: 15, fontWeight: '300', color: t.gray, lineHeight: 22, marginBottom: 2, textAlign: 'center' },
    landscapeDireccion:{ fontSize: 12, fontWeight: '300', color: t.gray, lineHeight: 17, opacity: 0.5, marginBottom: 2, textAlign: 'center' },
    landscapeColumns:  { width: 522, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
    landscapeColumnPrimary:{ width: 307, flexShrink: 0 },
    landscapeColumnSecondary:{ width: 203, flexShrink: 0 },
    landscapeDivider:  { width: 12 },
    landscapeFooter:   { width: 522, alignSelf: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, alignItems: 'center' },
    landscapeEmpty:    { fontSize: 16, fontWeight: '300', color: t.gray, fontStyle: 'italic', marginTop: 8 },
  });
}
