import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useTheme, type Theme } from '@/lib/theme';
import {
  getCartaData,
  getFonditaDescription,
  getFonditaDireccion,
  getFonditaDireccionVisible,
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
  const [fonditaDireccionVisible, setFonditaDireccionVisibleState] = useState(getFonditaDireccionVisible());
  const [fonditaHorario,   setFonditaHorarioState]   = useState(getFonditaHorario());
  const [pagosEfectivo,    setPagosEfectivoState]    = useState(getPagosEfectivo());
  const [pagosTrans,       setPagosTransState]       = useState(getPagosTrans());
  const [pagosTarjeta,     setPagosTarjetaState]     = useState(getPagosTarjeta());
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      setMenuData(getMenuData());
      setCartaData(getCartaData());
      setFonditaNameState(getFonditaName());
      setFonditaDescState(getFonditaDescription());
      setFonditaDireccionState(getFonditaDireccion());
      setFonditaDireccionVisibleState(getFonditaDireccionVisible());
      setFonditaHorarioState(getFonditaHorario());
      setPagosEfectivoState(getPagosEfectivo());
      setPagosTransState(getPagosTrans());
      setPagosTarjetaState(getPagosTarjeta());
    }, [])
  );

  const hasAnything = menuData !== null || cartaData !== null;

  const handleShare = async () => {
    const lines: string[] = [];
    if (fonditaName) lines.push(fonditaName);
    if (fonditaDesc) lines.push(fonditaDesc);
    if (fonditaDireccion) lines.push(fonditaDireccion);

    const addSection = (data: MenuData, title: string) => {
      const { primerLabel, segundoLabel, tercerLabel } = getTiempoLabels(data);
      lines.push('', title.toUpperCase());
      const addItems = (label: string, items: string[], enabled: boolean) => {
        if (!enabled || !items.some(Boolean)) return;
        lines.push(label);
        items.filter(Boolean).forEach(item => {
          const si = item.indexOf(' / ');
          lines.push('• ' + (si !== -1 ? item.slice(0, si) : item));
        });
      };
      addItems(primerLabel, data.primerTiempo.items, data.primerTiempo.enabled);
      addItems(segundoLabel, data.segundoTiempo.items, data.segundoTiempo.enabled);
      addItems(tercerLabel, data.tercerTiempoGuisado.items, data.tercerTiempoGuisado.enabled);
      addItems('Bebidas', data.aguas.items, data.aguas.enabled);
      addItems('Postre', data.postre.items, data.postre.enabled);
      if (data.precio.enabled && data.precio.value.trim()) lines.push('$' + data.precio.value);
    };

    if (cartaData) addSection(cartaData, 'Carta');
    if (menuData) addSection(menuData, 'Menú del día');

    lines.push('');
    lines.push(new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }));
    if (fonditaHorario) lines.push(fonditaHorario);
    const pagos = [pagosEfectivo && 'Efectivo', pagosTrans && 'Transferencia', pagosTarjeta && 'Tarjeta'].filter(Boolean).join(' · ');
    if (pagos) lines.push(pagos);

    await Share.share({ message: lines.join('\n') });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View>
          <Text style={s.fonditaName} allowFontScaling={true}>{fonditaName}</Text>
          {!!fonditaDesc && <Text style={s.fonditaDesc} allowFontScaling={true}>{fonditaDesc}</Text>}
          {!!fonditaDireccion && <Text style={s.fonditaDireccion} allowFontScaling={true}>{fonditaDireccion}</Text>}
          <View style={s.headerDivider} />

          {cartaData && <SectionBlock data={cartaData} title="Carta" theme={theme} />}
          {cartaData && menuData && <View style={s.sectionSeparator} />}
          {menuData && <SectionBlock data={menuData} title="Menú del día" theme={theme} />}

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
      </ScrollView>

      {hasAnything && (
        <View style={s.actions}>
          <TouchableOpacity style={s.whatsappButton} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={20} color={theme.surface} style={{ marginRight: 8 }} />
            <Text style={s.whatsappButtonText} allowFontScaling={true}>Compartir</Text>
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
    headerDivider:     { height: StyleSheet.hairlineWidth, backgroundColor: t.sep, marginBottom: 20 },
    fonditaName:       { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5, lineHeight: 34, marginBottom: 2 },
    fonditaDesc:       { fontSize: 15, fontWeight: '300', color: t.gray, lineHeight: 22, marginBottom: 2 },
    fonditaDireccion:  { fontSize: 12, fontWeight: '300', color: t.gray, lineHeight: 17, opacity: 0.5, marginBottom: 6 },
    block:             { marginBottom: 0 },
    blockTitleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    blockTitle:        { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: t.accent, textTransform: 'uppercase' },
    blockFecha:        { fontSize: 12, fontWeight: '300', color: t.gray },
    subsection:        { marginBottom: 0 },
    subsectionLabel:   { fontSize: 12, fontWeight: '700', letterSpacing: 1.0, color: t.text, marginTop: 16, marginBottom: 6, textTransform: 'uppercase', opacity: 0.5 },
    item:              { fontSize: 17, fontWeight: '800', color: t.text, marginLeft: 4, marginBottom: 8 },
    itemDesc:          { fontSize: 15, fontWeight: '300', color: t.gray, lineHeight: 22 },
    precio:            { fontSize: 22, fontWeight: '900', color: t.accent, marginTop: 12, marginBottom: 0 },
    sectionSeparator:  { height: 1, backgroundColor: t.sep, marginVertical: 16 },
    infoBlock:         { marginTop: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, alignItems: 'center' },
    infoFecha:         { fontSize: 12, fontWeight: '300', color: t.gray, opacity: 0.6, lineHeight: 18, textAlign: 'center', marginBottom: 2 },
    infoLine:          { fontSize: 12, fontWeight: '300', color: t.gray, opacity: 0.6, lineHeight: 18, textAlign: 'center', marginBottom: 2 },
    empty:             { textAlign: 'center', fontWeight: '300', color: t.gray, fontStyle: 'italic', marginTop: 40 },
    actions:           { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep, paddingTop: 12 },
    whatsappButton:    { backgroundColor: t.text, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginBottom: 24, shadowColor: t.text, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
    whatsappButtonText:{ color: t.surface, fontSize: 15, fontWeight: '700' },
  });
}
