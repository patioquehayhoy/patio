import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveMenuHoy } from '@/lib/db';
import { saveLocalMenu } from '@/lib/menu-history';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import {
  makePlatilloId,
  makeSectionId,
  setMenuData,
  type MenuData,
  type Platillo,
  type Seccion,
} from '@/lib/menu-store';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { getFonditaId } from '@/lib/user-store';
import { GlassIconButton } from '@/components/glass-button';

type Props = {
  initialData: MenuData;
  source: 'foto' | 'manual';
  onBack: () => void;
  onRetake?: () => void;
};

const blankDish = (): Platillo => ({
  id: makePlatilloId(),
  nombre: '',
  descripcion: '',
  precio: '',
});

const blankSection = (name = 'MENÚ DE HOY'): Seccion => ({
  id: makeSectionId(),
  nombre: name,
  precio: '',
  platillos: [blankDish()],
});

export function emptyMenu(): MenuData {
  return { secciones: [blankSection()] };
}

export function MenuComposer({ initialData, source, onBack, onRetake }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = useMemo(() => makeStyles(c), [c]);
  const [data, setData] = useState<MenuData>(() =>
    initialData.secciones.length ? initialData : emptyMenu()
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const [sectionActions, setSectionActions] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const patchSection = (id: string, patch: Partial<Seccion>) =>
    setData(prev => ({
      secciones: prev.secciones.map(sec => sec.id === id ? { ...sec, ...patch } : sec),
    }));

  const patchDish = (sectionId: string, dishId: string, patch: Partial<Platillo>) =>
    setData(prev => ({
      secciones: prev.secciones.map(sec =>
        sec.id === sectionId
          ? { ...sec, platillos: sec.platillos.map(dish => dish.id === dishId ? { ...dish, ...patch } : dish) }
          : sec
      ),
    }));

  const removeDish = (sectionId: string, dishId: string) =>
    setData(prev => ({
      secciones: prev.secciones.map(sec =>
        sec.id === sectionId
          ? { ...sec, platillos: sec.platillos.filter(dish => dish.id !== dishId) }
          : sec
      ),
    }));

  const moveSection = (id: string, direction: -1 | 1) =>
    setData(prev => {
      const next = [...prev.secciones];
      const index = next.findIndex(sec => sec.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { secciones: next };
    });

  const removeSection = (id: string) => {
    if (data.secciones.length === 1) {
      Alert.alert('Tu menú necesita una sección');
      return;
    }
    setData(prev => ({ secciones: prev.secciones.filter(sec => sec.id !== id) }));
  };

  const publish = async () => {
    if (publishing) return;
    const clean: MenuData = {
      secciones: data.secciones
        .map(sec => ({
          ...sec,
          nombre: sec.nombre.trim() || 'MENÚ DE HOY',
          precio: sec.precio.trim(),
          platillos: sec.platillos
            .filter(dish => dish.nombre.trim())
            .map(dish => ({
              ...dish,
              nombre: dish.nombre.trim(),
              descripcion: dish.descripcion.trim(),
              precio: dish.precio.trim(),
            })),
        }))
        .filter(sec => sec.platillos.length),
    };
    if (!clean.secciones.length) {
      Alert.alert('Falta el menú', 'Escribe al menos un platillo para publicarlo.');
      return;
    }
    setPublishing(true);
    try {
      setMenuData(clean);
      await saveLocalMenu(clean);
      const fonditaId = getFonditaId();
      if (fonditaId) await saveMenuHoy(fonditaId, clean);
      router.replace('/menu-publicado');
    } catch {
      Alert.alert('No se pudo publicar', 'Revisa tu conexión e inténtalo otra vez.');
      setPublishing(false);
    }
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.nav, { paddingTop: insets.top + 6 }]}>
          <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onBack} size={38} iconSize={19} />
          <Text style={s.navTitle}>{source === 'foto' ? 'Revisión' : 'Nuevo menú'}</Text>
          {source === 'foto' && onRetake ? (
            <GlassIconButton icon="camera-outline" accessibilityLabel="Tomar otra foto" onPress={onRetake} size={38} iconSize={18} />
          ) : <View style={s.navButton} />}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 150 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.eyebrow}>{source === 'foto' ? 'PATIO LEYÓ LA FOTO' : 'LO DE HOY'}</Text>
          <Text style={s.title}>{source === 'foto' ? '¿Así queda?' : 'Arma tu menú'}</Text>
          <Text style={s.subtitle}>
            {noWidow(source === 'foto'
              ? 'Corrige solo lo necesario. Lo demás ya está listo.'
              : 'Escribe lo que vendes hoy. No necesitas llenar categorías ni precios.')}
          </Text>

          {data.secciones.map((section, sectionIndex) => {
            const isCollapsed = !!collapsed[section.id];
            const actionsOpen = sectionActions === section.id;
            return (
              <View key={section.id} style={s.section}>
                <View style={s.sectionHeader}>
                  <TouchableOpacity
                    style={s.collapseButton}
                    onPress={() => setCollapsed(prev => ({ ...prev, [section.id]: !isCollapsed }))}
                    activeOpacity={0.7}>
                    <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={17} color={c.textSecondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.sectionName}
                    value={section.nombre}
                    onChangeText={nombre => patchSection(section.id, { nombre: nombre.toUpperCase() })}
                    placeholder="SECCIÓN"
                    placeholderTextColor={c.textMute}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={s.moreButton}
                    onPress={() => setSectionActions(actionsOpen ? null : section.id)}
                    activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={19} color={c.textSecondary} />
                  </TouchableOpacity>
                </View>

                {actionsOpen && (
                  <View style={s.sectionActions}>
                    <TouchableOpacity disabled={sectionIndex === 0} onPress={() => moveSection(section.id, -1)} style={s.action}>
                      <Ionicons name="arrow-up" size={15} color={sectionIndex === 0 ? c.textMute : c.text} />
                      <Text style={[s.actionText, sectionIndex === 0 && { color: c.textMute }]}>Subir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity disabled={sectionIndex === data.secciones.length - 1} onPress={() => moveSection(section.id, 1)} style={s.action}>
                      <Ionicons name="arrow-down" size={15} color={sectionIndex === data.secciones.length - 1 ? c.textMute : c.text} />
                      <Text style={[s.actionText, sectionIndex === data.secciones.length - 1 && { color: c.textMute }]}>Bajar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeSection(section.id)} style={s.action}>
                      <Ionicons name="trash-outline" size={15} color="#D94841" />
                      <Text style={[s.actionText, { color: '#D94841' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isCollapsed && (
                  <>
                    <View style={s.generalPrice}>
                      <Text style={s.generalPriceLabel}>Precio general</Text>
                      <Text style={s.currency}>$</Text>
                      <TextInput
                        style={s.generalPriceInput}
                        value={section.precio}
                        onChangeText={precio => patchSection(section.id, { precio: precio.replace(/[^0-9.]/g, '') })}
                        placeholder="Opcional"
                        placeholderTextColor={c.textMute}
                        keyboardType="decimal-pad"
                      />
                    </View>

                    {section.platillos.map((dish, dishIndex) => {
                      const showDetails = details[dish.id] || !!dish.descripcion || !!dish.precio;
                      return (
                        <View key={dish.id} style={[s.dish, dishIndex > 0 && s.dishDivider]}>
                          <View style={s.dishMainRow}>
                            <TextInput
                              style={s.dishName}
                              value={dish.nombre}
                              onChangeText={nombre => patchDish(section.id, dish.id, { nombre })}
                              placeholder="Platillo"
                              placeholderTextColor={c.textMute}
                              returnKeyType="next"
                            />
                            <TouchableOpacity
                              style={s.removeDish}
                              onPress={() => removeDish(section.id, dish.id)}
                              activeOpacity={0.7}>
                              <Ionicons name="close" size={15} color={c.textMute} />
                            </TouchableOpacity>
                          </View>
                          {showDetails ? (
                            <View style={s.detailRow}>
                              <TextInput
                                style={s.description}
                                value={dish.descripcion}
                                onChangeText={descripcion => patchDish(section.id, dish.id, { descripcion })}
                                placeholder="Detalle opcional"
                                placeholderTextColor={c.textMute}
                              />
                              <Text style={s.currency}>$</Text>
                              <TextInput
                                style={s.dishPrice}
                                value={dish.precio}
                                onChangeText={precio => patchDish(section.id, dish.id, { precio: precio.replace(/[^0-9.]/g, '') })}
                                placeholder="Precio"
                                placeholderTextColor={c.textMute}
                                keyboardType="decimal-pad"
                              />
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => setDetails(prev => ({ ...prev, [dish.id]: true }))}
                              activeOpacity={0.7}>
                              <Text style={s.addDetail}>+ detalle o precio</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}

                    <TouchableOpacity
                      style={s.addDish}
                      onPress={() => patchSection(section.id, { platillos: [...section.platillos, blankDish()] })}
                      activeOpacity={0.7}>
                      <Ionicons name="add" size={16} color={c.accent} />
                      <Text style={s.addDishText}>Agregar platillo</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={s.addSection}
            onPress={() => setData(prev => ({
              secciones: [...prev.secciones, blankSection(`SECCIÓN ${prev.secciones.length + 1}`)],
            }))}
            activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={18} color={c.textSecondary} />
            <Text style={s.addSectionText}>Agregar otra sección</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[s.publishDock, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={s.publishButton} onPress={publish} disabled={publishing} activeOpacity={0.86}>
            <Text style={s.publishText}>{publishing ? 'Publicando…' : 'Publicar menú'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    nav: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
    navTitle: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: c.accent, marginBottom: 8 },
    title: { fontSize: 36, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2, color: c.text, fontFamily: Fonts.brand },
    subtitle: { marginTop: 8, marginBottom: 28, maxWidth: 330, fontSize: 14, lineHeight: 20, fontWeight: '300', color: c.textSecondary },
    section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingVertical: 14 },
    sectionHeader: { minHeight: 40, flexDirection: 'row', alignItems: 'center' },
    collapseButton: { width: 30, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
    sectionName: { flex: 1, paddingVertical: 6, fontSize: 13, fontWeight: '800', letterSpacing: 0.8, color: c.text },
    moreButton: { width: 38, height: 38, alignItems: 'flex-end', justifyContent: 'center' },
    sectionActions: { alignSelf: 'flex-end', flexDirection: 'row', gap: 4, padding: 5, borderRadius: 12, backgroundColor: c.iconBg, marginBottom: 8 },
    action: { minHeight: 34, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionText: { fontSize: 12, fontWeight: '500', color: c.text },
    generalPrice: { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 4, paddingLeft: 30 },
    generalPriceLabel: { flex: 1, fontSize: 12, color: c.textSecondary },
    currency: { fontSize: 13, color: c.textMute },
    generalPriceInput: { minWidth: 70, paddingVertical: 6, paddingLeft: 4, textAlign: 'right', fontSize: 13, color: c.text },
    dish: { paddingVertical: 12, paddingLeft: 30 },
    dishDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    dishMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dishName: { flex: 1, paddingVertical: 4, fontSize: 17, lineHeight: 22, fontWeight: '600', color: c.text },
    removeDish: { width: 30, height: 30, alignItems: 'flex-end', justifyContent: 'center' },
    addDetail: { paddingTop: 5, fontSize: 12, color: c.textSecondary },
    detailRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
    description: { flex: 1, paddingVertical: 4, fontSize: 13, color: c.textSecondary },
    dishPrice: { width: 58, paddingVertical: 4, textAlign: 'right', fontSize: 13, color: c.text },
    addDish: { minHeight: 44, marginLeft: 30, flexDirection: 'row', alignItems: 'center', gap: 7 },
    addDishText: { fontSize: 13, fontWeight: '600', color: c.accent },
    addSection: { minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    addSectionText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    publishDock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: c.bg },
    publishButton: { minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent },
    publishText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
