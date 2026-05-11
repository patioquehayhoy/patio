import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useTheme, type Theme } from '@/lib/theme';
import {
  getCartaData,
  getFonditaDescription,
  getFonditaDireccion,
  getFonditaHorario,
  getMenuData,
  getPagosEfectivo,
  getPagosTarjeta,
  getPagosTrans,
  type MenuData,
} from '@/lib/menu-store';

function SectionBlock({ data, title, theme }: { data: MenuData; title: string; theme: Theme }) {
  const hasContent = data.secciones.some(s => s.platillos.some(p => p.nombre));

  if (!hasContent) return null;

  const s = makeStyles(theme);
  const normalizePrice = (value: string): string => value.replace(/[^0-9.]/g, '');
  const cleanDescriptionAndPrice = (description: string, explicitPrice?: string) => {
    const fromParens = description.match(/\(\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*\)/i);
    const fromRaw = description.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/i);
    const extracted = explicitPrice || normalizePrice(fromParens?.[1] ?? fromRaw?.[1] ?? '');
    const cleaned = description
      .replace(/\(\s*\$?\s*[0-9]+(?:\.[0-9]+)?\s*\)/gi, '')
      .replace(/\$\s*[0-9]+(?:\.[0-9]+)?/gi, '')
      .replace(/\((?:men[uú]|menu)\)/gi, '')
      .replace(/\b(?:men[uú]|menu)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return { cleaned, extracted };
  };
  const toVariantBullets = (description: string): string[] => {
    if (!description) return [];
    if (description.includes(' / ')) {
      return description.split(' / ').map(part => part.trim()).filter(Boolean);
    }
    if (description.includes('•')) {
      return description.split('•').map(part => part.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <View style={s.block}>
      <Text style={s.groupTitle} allowFontScaling={true}>{title}</Text>
      {data.secciones.filter(sec => sec.platillos.some(p => p.nombre)).map(sec => {
        const hasSectionPrice = !!sec.precio?.trim();
        return (
          <View key={sec.id} style={s.subsection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle} allowFontScaling={true}>{sec.nombre}</Text>
              {hasSectionPrice ? <Text style={s.sectionPrice} allowFontScaling={true}>${sec.precio}</Text> : <View style={s.sectionPriceSpacer} />}
            </View>
            {sec.platillos.filter(p => p.nombre).map((plat, i) => {
              const { cleaned, extracted } = cleanDescriptionAndPrice(plat.descripcion ?? '', plat.precio ?? '');
              const variantBullets = toVariantBullets(cleaned);
              const showBullets = variantBullets.length > 1;
              return (
                <View key={plat.id ?? i} style={s.itemCard}>
                  <View style={s.itemLeft}>
                    <Text style={s.itemName} allowFontScaling={true}>{plat.nombre}</Text>
                    {!showBullets && !!cleaned && <Text style={s.itemDesc} allowFontScaling={true}>{cleaned}</Text>}
                    {showBullets && (
                      <View style={s.variantList}>
                        {variantBullets.map((line, bulletIndex) => (
                          <Text key={`${plat.id ?? i}-${bulletIndex}`} style={s.variantItem} allowFontScaling={true}>
                            {'\u2022'} {line}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={s.itemPriceWrap}>
                    {!!extracted && <Text style={s.itemPrice} allowFontScaling={true}>${extracted}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export default function PreviewScreen() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cartaData, setCartaData] = useState<MenuData | null>(null);
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
      setFonditaDescState(getFonditaDescription());
      setFonditaDireccionState(getFonditaDireccion());
      setFonditaHorarioState(getFonditaHorario());
      setPagosEfectivoState(getPagosEfectivo());
      setPagosTransState(getPagosTrans());
      setPagosTarjetaState(getPagosTarjeta());
    }, [])
  );

  const hasMenuItems = !!menuData?.secciones?.some(sec => sec.platillos.some(p => p.nombre?.trim()));
  const hasCartaItems = !!cartaData?.secciones?.some(sec => sec.platillos.some(p => p.nombre?.trim()));
  const hasAnything = hasMenuItems || hasCartaItems;
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const pagos = [pagosEfectivo && 'Efectivo', pagosTrans && 'Transferencia', pagosTarjeta && 'Tarjeta'].filter(Boolean).join(' · ');
  const showMaps = !!fonditaDireccion.trim();

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
        <View ref={shareCardRef} collapsable={false} style={[s.shareFrame, !hasAnything && s.shareFrameEmpty]}>
          <View style={[s.shareCard, !hasAnything && s.shareCardEmpty]}>
            <View style={[s.scrollBody, !hasAnything && s.scrollBodyEmpty]}>
              <View>
                {hasAnything && (
                  <>
                    {!!fonditaDesc && <Text style={s.fonditaDesc} allowFontScaling={true}>{fonditaDesc}</Text>}
                    {showMaps && <Text style={s.fonditaDireccion} allowFontScaling={true}>{fonditaDireccion}</Text>}
                    {(!!fonditaDesc || showMaps) && <View style={s.headerDivider} />}
                  </>
                )}

                {hasCartaItems && cartaData && <SectionBlock data={cartaData} title="Carta" theme={theme} />}
                {hasCartaItems && hasMenuItems && <View style={s.sectionSeparator} />}
                {hasMenuItems && menuData && <SectionBlock data={menuData} title="Menú del día" theme={theme} />}
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
                  <View style={s.emptyWrap}>
                    <SymbolView name="sparkles" size={30} tintColor={theme.accent} weight="semibold" />
                    <Text style={s.emptyTitle} allowFontScaling={true}>Llena tu menú</Text>
                    <Text style={s.emptySub} allowFontScaling={true}>Cuando tengas platillos, aquí verás la vista para compartir.</Text>
                  </View>
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
              {!!fonditaDesc && <Text style={s.landscapeDesc}>{fonditaDesc}</Text>}
              {showMaps && <Text style={s.landscapeDireccion}>{fonditaDireccion}</Text>}
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
    scrollContent:     { flexGrow: 1, padding: 16, paddingBottom: 6 },
    shareFrame:        { backgroundColor: t.bg, paddingHorizontal: 0, paddingVertical: 8 },
    shareFrameEmpty:   { flexGrow: 1, justifyContent: 'center' },
    shareCard:         { backgroundColor: t.surface, borderRadius: 22, borderWidth: 1, borderColor: t.sep, paddingHorizontal: 22, paddingVertical: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 2 },
    shareCardEmpty:    { minHeight: 360, justifyContent: 'center' },
    scrollBody:        { flexGrow: 1, justifyContent: 'space-between' },
    scrollBodyEmpty:   { minHeight: 300, justifyContent: 'center' },
    headerDivider:     { height: StyleSheet.hairlineWidth, backgroundColor: t.sep, marginBottom: 20, opacity: 0.72 },
    fonditaName:       { fontSize: 30, fontWeight: '900', color: t.text, lineHeight: 36, marginBottom: 3 },
    fonditaDesc:       { fontSize: 16, fontWeight: '300', color: t.gray, lineHeight: 22, marginBottom: 3, textAlign: 'center' },
    fonditaDireccion:  { fontSize: 12, fontWeight: '300', color: t.gray, lineHeight: 17, opacity: 0.62, marginBottom: 6 },
    block:             { marginBottom: 0 },
    groupTitle:        { fontSize: 16, fontWeight: '900', color: t.accent, marginBottom: 14, textTransform: 'uppercase' },
    subsection:        { marginBottom: 18 },
    sectionHeader:     { minHeight: 24, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 },
    sectionTitle:      { flex: 1, fontSize: 15, fontWeight: '900', color: t.text, textTransform: 'uppercase' },
    sectionPrice:      { width: 64, textAlign: 'right', fontSize: 15, fontWeight: '300', color: t.textSecondary },
    sectionPriceSpacer:{ width: 64 },
    itemCard:          { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    itemLeft:          { flex: 1, minWidth: 0, paddingRight: 12 },
    itemName:          { fontSize: 17, fontWeight: '500', color: t.text, lineHeight: 23 },
    itemDesc:          { marginTop: 3, fontSize: 14, fontWeight: '300', color: t.gray, lineHeight: 20 },
    variantList:       { marginTop: 4, gap: 2 },
    variantItem:       { fontSize: 13, fontWeight: '300', color: t.gray, lineHeight: 18 },
    itemPriceWrap:     { width: 64, alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 2 },
    itemPrice:         { fontSize: 15, fontWeight: '300', color: t.textSecondary, lineHeight: 20, textAlign: 'right' },
    precio:            { fontSize: 22, fontWeight: '900', color: t.accent, marginTop: 12, marginBottom: 0 },
    sectionSeparator:  { height: StyleSheet.hairlineWidth, backgroundColor: t.sep, marginVertical: 24 },
    infoBlock:         { marginTop: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, alignItems: 'center' },
    infoFecha:         { fontSize: 12, fontWeight: '300', color: t.gray, opacity: 0.7, lineHeight: 18, textAlign: 'center', marginBottom: 2 },
    infoLine:          { fontSize: 12, fontWeight: '300', color: t.gray, opacity: 0.7, lineHeight: 18, textAlign: 'center', marginBottom: 2 },
    emptyWrap:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 8 },
    emptyTitle:        { fontSize: 22, fontWeight: '900', color: t.text, textAlign: 'center' },
    emptySub:          { maxWidth: 290, fontSize: 15, lineHeight: 21, color: t.textSecondary, textAlign: 'center' },
    actions:           { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, paddingTop: 12 },
    shareButton:       { backgroundColor: t.text, height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginBottom: 24, shadowColor: t.text, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 4 },
    shareButtonText:   { color: t.surface, fontSize: 15, fontWeight: '900' },
    captureRoot:       { position: 'absolute', left: -2000, top: 0, opacity: 1 },
    landscapeCanvas:   { width: 767, backgroundColor: t.bg, paddingVertical: 10, paddingHorizontal: 10 },
    landscapeCard:     { backgroundColor: t.surface, borderRadius: 20, paddingTop: 22, paddingBottom: 18, paddingHorizontal: 14 },
    landscapeHeader:   { width: 522, alignSelf: 'center', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    landscapeName:     { fontSize: 36, fontWeight: '900', color: t.text, lineHeight: 40, marginBottom: 4, textAlign: 'center' },
    landscapeDesc:     { fontSize: 16, fontWeight: '300', color: t.gray, lineHeight: 22, marginBottom: 2, textAlign: 'center' },
    landscapeDireccion:{ fontSize: 12, fontWeight: '300', color: t.gray, lineHeight: 17, opacity: 0.5, marginBottom: 2, textAlign: 'center' },
    landscapeColumns:  { width: 522, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
    landscapeColumnPrimary:{ width: 307, flexShrink: 0 },
    landscapeColumnSecondary:{ width: 203, flexShrink: 0 },
    landscapeDivider:  { width: 12 },
    landscapeFooter:   { width: 522, alignSelf: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, alignItems: 'center' },
    landscapeEmpty:    { fontSize: 16, fontWeight: '300', color: t.gray, fontStyle: 'italic', marginTop: 8 },
  });
}
