import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveMenuHoy } from '@/lib/db';
import { makePlatilloId, makeSectionId, setMenuData as saveMenuData, type MenuData } from '@/lib/menu-store';
import { getFonditaId } from '@/lib/user-store';
import { Fonts, useTheme } from '@/lib/theme';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';

// ── FonderoPublish exacto a Figma ──────────────────────────────────────────────
// Respeta el tema claro/oscuro vía fonderoPalette.

// Lista cerrada de secciones (igual que Figma).
const SECTION_OPTIONS = [undefined, 'Entrada', 'Guisado', 'Acompañante', 'Postre', 'Bebida', 'Tacos', 'Antojito', 'Especial del día'] as const;
type SectionOpt = (typeof SECTION_OPTIONS)[number];

type Item = { id: string; name: string; price?: number; section?: SectionOpt };

// Semilla de ejemplo (Cocina de Lupita) — tal cual Figma.
const SEED: Item[] = [
  { id: 'l1', name: 'Sopa de fideo aguada', section: 'Entrada' },
  { id: 'l2', name: 'Tinga de pollo', section: 'Guisado' },
  { id: 'l3', name: 'Bistec a la mexicana', section: 'Guisado' },
  { id: 'l4', name: 'Chiles rellenos de queso', section: 'Guisado' },
  { id: 'l5', name: 'Arroz rojo · Frijoles refritos · Tortillas', section: 'Acompañante' },
  { id: 'l6', name: 'Gelatina de mosaico', section: 'Postre' },
];

function nextSection(cur?: SectionOpt): SectionOpt {
  const i = SECTION_OPTIONS.indexOf(cur);
  return SECTION_OPTIONS[(i + 1) % SECTION_OPTIONS.length];
}

let idCounter = 100;
const newId = () => `i${idCounter++}`;

function todayLabel(): string {
  try {
    return new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  } catch { return 'HOY'; }
}

// Convierte el modelo plano (items) → MenuData{secciones} para Supabase.
function toMenuData(items: Item[], dayPrice?: number): MenuData {
  const order: string[] = [];
  const bySection = new Map<string, Item[]>();
  for (const it of items) {
    const key = it.section ?? 'Menú';
    if (!bySection.has(key)) { bySection.set(key, []); order.push(key); }
    bySection.get(key)!.push(it);
  }
  return {
    secciones: order.map((nombre, idx) => ({
      id: makeSectionId(),
      nombre: nombre.toUpperCase(),
      precio: idx === 0 && typeof dayPrice === 'number' ? String(dayPrice) : '',
      platillos: bySection.get(nombre)!.map((it) => ({
        id: makePlatilloId(),
        nombre: it.name,
        descripcion: '',
        precio: typeof it.price === 'number' ? String(it.price) : '',
      })),
    })),
  };
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(c);
  const [priceMode, setPriceMode] = useState<'fixed' | 'perItem'>('fixed');
  const [dayPrice, setDayPrice] = useState<number | undefined>(55);
  const [items, setItems] = useState<Item[]>(() => SEED.map((it) => ({ ...it })));
  const [publishing, setPublishing] = useState(false);

  // Firma del estado inicial para detectar cambios sin guardar.
  const initialSig = useMemo(() => JSON.stringify({ priceMode: 'fixed', dayPrice: 55, items: SEED }), []);
  const dirty = JSON.stringify({ priceMode, dayPrice, items }) !== initialSig;

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, { id: newId(), name: '' }]);

  // Back protegido: si hay cambios sin publicar, confirma antes de salir.
  const handleBack = () => {
    if (!dirty) { router.replace('/menu'); return; }
    Alert.alert('¿Descartar cambios?', 'No publicaste tu menú. Si sales, se pierde lo que escribiste.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.replace('/menu') },
    ]);
  };

  const handlePublish = async () => {
    if (publishing) return;
    // No publicar vacío: al menos un platillo con nombre.
    const conNombre = items.filter((it) => it.name.trim().length > 0);
    if (conNombre.length === 0) {
      Alert.alert('Tu menú está vacío', 'Escribe al menos un platillo antes de publicar.');
      return;
    }
    setPublishing(true);
    const data = toMenuData(conNombre, priceMode === 'fixed' ? dayPrice : undefined);
    saveMenuData(data);
    const fonditaId = getFonditaId();
    if (fonditaId) {
      try {
        await saveMenuHoy(fonditaId, data);
      } catch {
        setPublishing(false);
        Alert.alert('No se pudo publicar', 'Revisa tu conexión e inténtalo de nuevo.');
        return;
      }
    }
    router.push('/menu-publicado');
  };

  const showPerItemPrice = priceMode === 'perItem';
  // Velo de fundido sobre el CTA, baja al fondo del tema.
  const ctaFade: [string, string, string] = theme.isDark
    ? ['rgba(17,18,20,0)', 'rgba(17,18,20,0.95)', c.bg]
    : ['rgba(248,248,245,0)', 'rgba(248,248,245,0.95)', c.bg];

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={[s.topBar, { top: insets.top + 6 }]}>
        <TouchableOpacity style={s.glassBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 60, paddingHorizontal: 22, paddingBottom: 290 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header editorial */}
          <Text style={s.eyebrow} numberOfLines={1} allowFontScaling={true}>{todayLabel()}</Text>
          <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} allowFontScaling={true}>Menú de hoy</Text>
          <Text style={s.sub} allowFontScaling={true}>30 segundos. Tú lo escribes, quien anda cerca lo ve.</Text>

          {/* Toggle precio único / por platillo */}
          <View style={s.segmented}>
            <TouchableOpacity
              style={[s.segBtn, priceMode === 'fixed' && s.segBtnActive]}
              onPress={() => setPriceMode('fixed')}
              activeOpacity={0.8}>
              <Text style={[s.segText, priceMode === 'fixed' && s.segTextActive]} allowFontScaling={true}>Precio único</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.segBtn, priceMode === 'perItem' && s.segBtnActive]}
              onPress={() => setPriceMode('perItem')}
              activeOpacity={0.8}>
              <Text style={[s.segText, priceMode === 'perItem' && s.segTextActive]} allowFontScaling={true}>Precio por platillo</Text>
            </TouchableOpacity>
          </View>

          {/* Precio del día (modo único) */}
          {priceMode === 'fixed' && (
            <View style={s.priceCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.priceLabel} allowFontScaling={true}>Precio del menú</Text>
                {typeof dayPrice === 'number' ? (
                  <Text style={s.priceValue} allowFontScaling={true}>
                    ${dayPrice}<Text style={s.priceMxn}> MXN</Text>
                  </Text>
                ) : (
                  <Text style={s.priceEmpty} allowFontScaling={true}>Sin precio fijo · solo a la carta</Text>
                )}
              </View>
              <View style={s.priceBtns}>
                <TouchableOpacity
                  style={s.circleBtn}
                  onPress={() => setDayPrice((p) => (typeof p === 'number' ? (p - 5 < 5 ? undefined : p - 5) : undefined))}
                  activeOpacity={0.8}>
                  <Ionicons name="remove" size={16} color={c.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.circleBtn, s.circleBtnAccent]}
                  onPress={() => setDayPrice((p) => (typeof p === 'number' ? p + 5 : 50))}
                  activeOpacity={0.8}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista de platillos */}
          <View style={{ gap: 8, marginBottom: 12 }}>
            {items.map((it) => (
              <View key={it.id} style={s.itemCard}>
                <View style={s.itemTop}>
                  <TextInput
                    style={s.itemInput}
                    value={it.name}
                    onChangeText={(v) => updateItem(it.id, { name: v })}
                    placeholder="Nombre del platillo"
                    placeholderTextColor={c.textMute}
                    selectionColor={c.accent}
                    allowFontScaling={true}
                  />
                  <TouchableOpacity style={s.removeBtn} onPress={() => removeItem(it.id)} activeOpacity={0.7}>
                    <Ionicons name="close" size={12} color={c.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={s.itemBottom}>
                  <TouchableOpacity
                    style={[s.sectionPill, it.section ? s.sectionPillOn : s.sectionPillOff]}
                    onPress={() => updateItem(it.id, { section: nextSection(it.section) })}
                    activeOpacity={0.8}>
                    <Text style={[s.sectionPillText, { color: it.section ? c.accent : c.textSecondary }]} allowFontScaling={true}>
                      {it.section ?? 'Sin sección'}
                    </Text>
                  </TouchableOpacity>
                  {showPerItemPrice && (
                    <View style={s.priceTag}>
                      <Text style={s.priceTagDollar} allowFontScaling={true}>$</Text>
                      <TextInput
                        style={s.priceTagInput}
                        value={it.price != null ? String(it.price) : ''}
                        onChangeText={(v) => {
                          const n = parseInt(v.replace(/\D/g, ''), 10);
                          updateItem(it.id, { price: Number.isNaN(n) ? undefined : n });
                        }}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={c.textMute}
                        selectionColor={c.accent}
                        allowFontScaling={true}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Añadir platillo */}
          <TouchableOpacity style={s.addBtn} onPress={addItem} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={c.textSecondary} />
            <Text style={s.addText} allowFontScaling={true}>Añadir platillo</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* CTA publicar */}
        <View style={[s.ctaWrap, { paddingBottom: (insets.bottom || 10) + 90 }]}>
          <LinearGradient
            colors={ctaFade}
            locations={[0, 0.4, 1]}
            style={s.ctaFade}
            pointerEvents="none"
          />
          <TouchableOpacity style={[s.cta, publishing && { opacity: 0.6 }]} onPress={handlePublish} disabled={publishing} activeOpacity={0.86}>
            <Text style={s.ctaText} allowFontScaling={true}>{publishing ? 'Publicando…' : 'Publicar menú · Visible ya'}</Text>
          </TouchableOpacity>
          <Text style={s.ctaHint} allowFontScaling={true}>Se oculta automáticamente a las 17:30</Text>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
    glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },

    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: c.accent, marginBottom: 8 },
    title: { fontSize: 38, fontWeight: '900', letterSpacing: -1.3, lineHeight: 38, color: c.text, marginBottom: 6, fontFamily: Fonts.brand },
    sub: { fontSize: 14, fontWeight: '300', lineHeight: 19, color: c.textSecondary, marginBottom: 20 },

    segmented: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16, backgroundColor: c.surface, marginBottom: 12 },
    segBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    segBtnActive: { backgroundColor: c.accent },
    segText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    segTextActive: { color: '#fff' },

    priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 20, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, marginBottom: 12 },
    priceLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: c.textMute, marginBottom: 4 },
    priceValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1, color: c.text, fontFamily: Fonts.brand },
    priceMxn: { fontSize: 16, fontWeight: '500', color: c.textMute },
    priceEmpty: { fontSize: 15, fontWeight: '300', color: c.textMute },
    priceBtns: { flexDirection: 'row', gap: 8 },
    circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.iconBg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    circleBtnAccent: { backgroundColor: c.accent, borderColor: c.accent },

    itemCard: { padding: 14, borderRadius: 16, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemInput: { flex: 1, fontSize: 15, color: c.text, padding: 0 },
    removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center' },
    itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    sectionPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
    sectionPillOn: { backgroundColor: 'rgba(255,106,61,0.15)', borderColor: 'rgba(255,106,61,0.35)' },
    sectionPillOff: { backgroundColor: c.iconBg, borderColor: c.border },
    sectionPillText: { fontSize: 12, fontWeight: '600' },
    priceTag: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: c.iconBg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    priceTagDollar: { fontSize: 14, color: c.textMute },
    priceTagInput: { width: 44, fontSize: 14, fontWeight: '600', color: c.text, textAlign: 'right', padding: 0 },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed' },
    addText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },

    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 16 },
    ctaFade: { position: 'absolute', left: 0, right: 0, top: -40, bottom: 0 },
    cta: { height: 56, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', shadowColor: c.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 5 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
    ctaHint: { marginTop: 10, fontSize: 11.5, fontWeight: '300', color: c.textMute, textAlign: 'center' },
  });
}
