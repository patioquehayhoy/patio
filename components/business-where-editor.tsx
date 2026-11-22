import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { loadWhereTheySell, saveModalidad, savePedidosHasta, type WhereTheySell } from '@/lib/business-places';
import { dateFromTime, operationHourLabel, timeFromDate } from '@/lib/operation-notice';
import { diasLabel, type Modalidad } from '@/lib/puntos';
import type { Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// «Dónde vendes» (2026-11-21, lib/puntos.ts): en tu local (y otras
// sucursales), en tianguis o sobre ruedas (un lugar distinto según el día) o
// solo a domicilio (en el mapa sale tu zona, no tu calle). Se guarda en cuanto
// se elige, como la foto del lugar. Cada sucursal o día se edita en su propia
// pantalla (/punto-editar), como una dirección en Contactos.

const MODES: { value: Modalidad; title: string; sub: string; icon: 'storefront-outline' | 'calendar-outline' | 'bicycle-outline' }[] = [
  { value: 'local', title: 'En mi local', sub: 'Tu dirección y, si tienes, otras sucursales', icon: 'storefront-outline' },
  { value: 'itinerante', title: 'En tianguis o sobre ruedas', sub: 'Un lugar distinto según el día', icon: 'calendar-outline' },
  { value: 'domicilio', title: 'Solo a domicilio', sub: 'Sin local: en el mapa sale tu zona, no tu calle', icon: 'bicycle-outline' },
];
const DEFAULT_CUTOFF = '11:00';

export function BusinessWhereEditor({ colors, negocioId }: { colors: Theme; negocioId: string | null }) {
  const sc = settingsColors(colors);
  const s = makeStyles(colors);
  const [where, setWhere] = useState<WhereTheySell | null>(null);
  const [failed, setFailed] = useState(false);
  const [androidPicker, setAndroidPicker] = useState(false);

  // Al volver de editar una sucursal o un día, la lista se pone al día.
  useFocusEffect(useCallback(() => {
    if (!negocioId) return;
    let active = true;
    loadWhereTheySell(negocioId)
      .then((value) => { if (active) { setWhere(value); setFailed(false); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [negocioId]));

  const fail = () => Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
  const chooseMode = async (modalidad: Modalidad) => {
    if (!negocioId || !where || where.modalidad === modalidad) return;
    const before = where.modalidad;
    setWhere({ ...where, modalidad });
    try {
      await saveModalidad(negocioId, modalidad);
      // De a domicilio a un local: la ubicación guardada era la zona; hay que marcar el local.
      if (before === 'domicilio' && modalidad === 'local') {
        Alert.alert(noWidow('Marca tu local en el mapa'), noWidow('Toca «Marcar en el mapa» estando en tu local, para que la gente llegue a la puerta.'));
      }
    } catch {
      setWhere((current) => (current ? { ...current, modalidad: before } : current));
      fail();
    }
  };
  const setCutoff = async (hhmm: string | null) => {
    if (!negocioId || !where) return;
    const before = where.pedidosHasta;
    setWhere({ ...where, pedidosHasta: hhmm });
    try {
      await savePedidosHasta(negocioId, hhmm);
    } catch {
      setWhere((current) => (current ? { ...current, pedidosHasta: before } : current));
      fail();
    }
  };
  const openPunto = (id?: string) => {
    if (!where) return;
    router.push({ pathname: '/punto-editar', params: { tipo: where.modalidad === 'itinerante' ? 'dia' : 'sucursal', ...(id ? { id } : {}) } });
  };

  if (!negocioId) {
    return <Text style={s.help}>{noWidow('Guarda tu negocio primero para elegir dónde vendes.')}</Text>;
  }
  if (!where) {
    return <Text style={s.help}>{noWidow(failed ? 'No pudimos cargar dónde vendes. Revisa tu conexión.' : 'Cargando…')}</Text>;
  }
  const itinerante = where.modalidad === 'itinerante';
  return (
    <View style={s.root}>
      <SettingsGroup c={sc}>
        {MODES.map((mode, index) => (
          <SettingsRow
            key={mode.value}
            c={sc}
            icon={mode.icon}
            title={mode.title}
            sub={mode.sub}
            divider={index > 0}
            onPress={() => { void chooseMode(mode.value); }}
            trailing={where.modalidad === mode.value ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : <View style={s.markSlot} />}
          />
        ))}
      </SettingsGroup>

      {/* Solo a domicilio: la ficha no muestra la dirección, pero lo más seguro es no escribir la calle. */}
      {where.modalidad === 'domicilio' && (
        <Text style={s.help}>{noWidow('Tu ficha muestra tu zona y tu WhatsApp, no tu dirección. Para cuidarte, en «Dirección» deja solo tu colonia.')}</Text>
      )}

      {where.modalidad !== 'domicilio' && (
        <View style={{ gap: 8 }}>
        <Text style={s.help}>{noWidow(itinerante
          ? 'Agrega dónde te pones y qué días vas. El mapa muestra el lugar de hoy.'
          : 'Las sucursales comparten este perfil y este menú. Cada una tiene su punto en el mapa.')}</Text>
        <SettingsGroup c={sc} label={itinerante ? 'Días y lugares' : 'Otras sucursales'}>
          {where.puntos.map((punto, index) => (
            <SettingsRow
              key={punto.id}
              c={sc}
              icon={itinerante ? 'calendar-outline' : 'storefront-outline'}
              title={punto.nombre}
              sub={[itinerante ? diasLabel(punto.dias) : null, punto.direccion].filter(Boolean).join(' · ') || undefined}
              divider={index > 0}
              onPress={() => openPunto(punto.id)}
            />
          ))}
          <SettingsRow
            c={sc}
            icon="add"
            accent
            title={itinerante ? 'Agregar lugar' : 'Agregar sucursal'}
            divider={where.puntos.length > 0}
            onPress={() => openPunto()}
            trailing={<View />}
          />
        </SettingsGroup>
        </View>
      )}

      <SettingsGroup c={sc}>
        <SettingsRow
          c={sc}
          icon="time-outline"
          title="Hora límite para pedir"
          sub={where.pedidosHasta ? `Pedidos hasta ${operationHourLabel(where.pedidosHasta) ?? where.pedidosHasta}` : 'Por ejemplo, si cocinas sobre pedido'}
          trailing={<ToggleSwitch value={!!where.pedidosHasta} accessibilityLabel="Hora límite para pedir" onValueChange={(on) => { void setCutoff(on ? DEFAULT_CUTOFF : null); }} />}
        />
        {!!where.pedidosHasta && (
          <View style={[s.timeRow, s.divider]}>
            <Text style={s.timeLabel}>Pedidos hasta</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={dateFromTime(where.pedidosHasta)}
                mode="time"
                display="compact"
                minuteInterval={15}
                locale="es-MX"
                themeVariant={colors.isDark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onChange={(_, date) => { if (date) void setCutoff(timeFromDate(date)); }}
                accessibilityLabel="Pedidos hasta"
              />
            ) : (
              <TouchableOpacity style={s.timeChip} onPress={() => setAndroidPicker(true)} accessibilityRole="button" accessibilityLabel={`Pedidos hasta, ${operationHourLabel(where.pedidosHasta)}`}>
                <Text style={s.timeChipText}>{operationHourLabel(where.pedidosHasta)}</Text>
              </TouchableOpacity>
            )}
            {androidPicker && (
              <DateTimePicker value={dateFromTime(where.pedidosHasta)} mode="time" minuteInterval={15} onChange={(_, date) => { setAndroidPicker(false); if (date) void setCutoff(timeFromDate(date)); }} />
            )}
          </View>
        )}
      </SettingsGroup>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { gap: 16 },
    help: { fontSize: 13, lineHeight: 18, color: t.textSecondary },
    markSlot: { width: 18 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    timeRow: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timeLabel: { fontSize: 15, fontWeight: '400', color: t.text },
    timeChip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10, borderCurve: 'continuous', backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center' },
    timeChipText: { fontSize: 16, fontWeight: '600', color: t.text, fontVariant: ['tabular-nums'] },
  });
}
