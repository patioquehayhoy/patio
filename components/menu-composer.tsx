import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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

import { emptyMenu, useFonderoMenuDraftController } from '@/lib/controllers/useFonderoMenuDraftController';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { markHintSeen, shouldShowHint } from '@/lib/hints';
import type { MenuData, Platillo, Seccion } from '@/lib/menu-store';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { GlassIconButton } from '@/components/glass-button';

export { emptyMenu };

type Props = {
  initialData: MenuData;
  source: 'foto' | 'manual';
  onBack: () => void;
  onRetake?: () => void;
};

export function MenuComposer({ initialData, source, onBack, onRetake }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = useMemo(() => makeStyles(c), [c]);
  const {
    addDish,
    addSection,
    collapsed,
    data,
    dayPrice,
    details,
    moveSection,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    revealDetails,
    saveDraft,
    savedFlash,
    sectionActions,
    sectionSuggestions,
    setDayPrice,
    toggleCollapsed,
    toggleSectionActions,
  } = useFonderoMenuDraftController(initialData);

  // La explicación del modelo de precio se muestra UNA vez (onboarding suave);
  // después el campo habla solo.
  const [showPriceHint, setShowPriceHint] = useState(false);
  useEffect(() => {
    shouldShowHint('fondero_precio').then((show) => {
      if (show) {
        setShowPriceHint(true);
        markHintSeen('fondero_precio').catch(() => {});
      }
    });
  }, []);

  // Cadena de foco: "siguiente" recorre platillo → descripción → siguiente
  // platillo. El precio se toca aparte (cambia de vez en cuando, no es parte
  // del ritmo de captura). Claves: `n-{dishId}` nombre · `d-{dishId}` detalle.
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const pendingFocus = useRef<string | null>(null);
  const registerInput = (key: string) => (ref: TextInput | null) => {
    inputRefs.current[key] = ref;
    if (ref && pendingFocus.current === key) {
      pendingFocus.current = null;
      requestAnimationFrame(() => ref.focus());
    }
  };
  const focusKey = (key: string) => inputRefs.current[key]?.focus();

  const addDishFocused = (section: Seccion) => {
    pendingFocus.current = `n-${addDish(section)}`;
  };

  const submitDishName = (dish: Platillo) => {
    // Siempre pasa a la descripción del mismo platillo; si aún no existe el
    // campo, se revela y el foco cae ahí al montarse.
    const showDetails = details[dish.id] || !!dish.descripcion || !!dish.precio;
    if (showDetails) {
      focusKey(`d-${dish.id}`);
    } else {
      pendingFocus.current = `d-${dish.id}`;
      revealDetails(dish.id);
    }
  };

  const submitDishDetail = (section: Seccion, dishIndex: number) => {
    const next = section.platillos[dishIndex + 1];
    if (next) focusKey(`n-${next.id}`);
    else addDishFocused(section);
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 32 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.eyebrow}>{source === 'foto' ? 'PATIO LEYÓ LA FOTO' : 'LO DE HOY'}</Text>
          <Text style={s.title}>{source === 'foto' ? '¿Así queda?' : 'Arma tu menú'}</Text>
          <Text style={s.subtitle}>
            {noWidow(source === 'foto'
              ? 'Corrige solo lo necesario. Lo demás ya está listo.'
              : 'Escribe lo que vendes hoy. Los precios son opcionales.')}
          </Text>

          {/* Precio del día — compacto, sin gritar. La explicación del modelo
              (día + a la carta) solo aparece la primera vez. */}
          <View style={s.dayPrice}>
            <Text style={s.dayPriceLabel}>Precio del día</Text>
            <Text style={s.dayPriceCurrency}>$</Text>
            <TextInput
              style={s.dayPriceInput}
              value={dayPrice}
              onChangeText={setDayPrice}
              placeholder="—"
              placeholderTextColor={c.textMute}
              keyboardType="decimal-pad"
              maxLength={6}
              accessibilityLabel="Precio del menú del día"
            />
          </View>
          {showPriceHint && (
            <Text style={s.dayPriceHint}>{noWidow('Un precio para el menú de hoy. Platillos con precio propio van a la carta.')}</Text>
          )}

          {data.secciones.map((section, sectionIndex) => {
            const isCollapsed = !!collapsed[section.id];
            const actionsOpen = sectionActions === section.id;
            return (
              <View key={section.id} style={s.section}>
                <View style={s.sectionHeader}>
                  <TouchableOpacity
                    style={s.collapseButton}
                    onPress={() => toggleCollapsed(section.id)}
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
                    onPress={() => toggleSectionActions(section.id)}
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
                    {section.platillos.map((dish, dishIndex) => {
                      const showDetails = details[dish.id] || !!dish.descripcion || !!dish.precio;
                      return (
                        <View key={dish.id} style={[s.dish, dishIndex > 0 && s.dishDivider]}>
                          <View style={s.dishMainRow}>
                            <TextInput
                              ref={registerInput(`n-${dish.id}`)}
                              style={s.dishName}
                              value={dish.nombre}
                              onChangeText={nombre => patchDish(section.id, dish.id, { nombre })}
                              placeholder="Platillo"
                              placeholderTextColor={c.textMute}
                              returnKeyType="next"
                              blurOnSubmit={false}
                              onSubmitEditing={() => submitDishName(dish)}
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
                                ref={registerInput(`d-${dish.id}`)}
                                style={s.description}
                                value={dish.descripcion}
                                onChangeText={descripcion => patchDish(section.id, dish.id, { descripcion })}
                                placeholder="Detalle opcional"
                                placeholderTextColor={c.textMute}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => submitDishDetail(section, dishIndex)}
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
                              onPress={() => {
                                revealDetails(dish.id);
                                pendingFocus.current = `d-${dish.id}`;
                              }}
                              activeOpacity={0.7}>
                              <Text style={s.addDetail}>+ detalle o precio</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}

                    <TouchableOpacity
                      style={s.addDish}
                      onPress={() => addDishFocused(section)}
                      activeOpacity={0.7}>
                      <Ionicons name="add" size={16} color={c.accent} />
                      <Text style={s.addDishText}>Agregar platillo</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}

          {/* Secciones sugeridas según el giro: un toque y aparece la sección. */}
          <View style={s.addSectionBlock}>
            <Text style={s.addSectionLabel}>AGREGAR SECCIÓN</Text>
            <View style={s.chipsRow}>
              {sectionSuggestions.map((nombre) => (
                <TouchableOpacity key={nombre} style={s.chip} onPress={() => addSection(nombre)} activeOpacity={0.7}>
                  <Ionicons name="add" size={13} color={c.accent} />
                  <Text style={s.chipText}>{nombre}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.chip} onPress={() => addSection()} activeOpacity={0.7}>
                <Ionicons name="add" size={13} color={c.textSecondary} />
                <Text style={[s.chipText, { color: c.textSecondary }]}>OTRA</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cierre del flujo, dentro del contenido: cápsulas HIG en fila —
              el secundario abraza su texto (tintado, sin borde), el primario
              lleva el peso. Nada ocupa todo el ancho. */}
          <View style={s.actionsBlock}>
            <TouchableOpacity style={s.saveButton} onPress={saveDraft} activeOpacity={0.8}>
              <Ionicons name={savedFlash ? 'checkmark' : 'bookmark-outline'} size={15} color={c.text} />
              <Text style={s.saveText}>{savedFlash ? 'Guardado' : 'Guardar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.publishButton} onPress={publish} disabled={publishing} activeOpacity={0.86}>
              <Text style={s.publishText}>{publishing ? 'Publicando…' : 'Publicar menú'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    subtitle: { marginTop: 6, marginBottom: 16, maxWidth: 330, fontSize: 14, lineHeight: 19, fontWeight: '300', color: c.textSecondary },

    dayPrice: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, minHeight: 48, marginBottom: 12, borderRadius: 14, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    dayPriceLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
    dayPriceHint: { marginTop: -6, marginBottom: 12, paddingHorizontal: 2, fontSize: 11.5, lineHeight: 15, fontWeight: '300', color: c.textSecondary },
    dayPriceCurrency: { fontSize: 15, fontWeight: '700', color: c.textSecondary },
    dayPriceInput: { minWidth: 56, height: 44, paddingVertical: 0, paddingLeft: 2, textAlign: 'right', fontSize: 17, fontWeight: '700', color: c.text },

    section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingVertical: 8 },
    sectionHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center' },
    collapseButton: { width: 30, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
    sectionName: { flex: 1, paddingVertical: 6, fontSize: 13, fontWeight: '800', letterSpacing: 0.8, color: c.text },
    moreButton: { width: 38, height: 38, alignItems: 'flex-end', justifyContent: 'center' },
    sectionActions: { alignSelf: 'flex-end', flexDirection: 'row', gap: 4, padding: 5, borderRadius: 12, backgroundColor: c.iconBg, marginBottom: 8 },
    action: { minHeight: 34, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionText: { fontSize: 12, fontWeight: '500', color: c.text },
    currency: { fontSize: 13, color: c.textMute },
    dish: { paddingVertical: 7, paddingLeft: 30 },
    dishDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    dishMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dishName: { flex: 1, paddingVertical: 3, fontSize: 17, lineHeight: 22, fontWeight: '600', color: c.text },
    removeDish: { width: 30, height: 30, alignItems: 'flex-end', justifyContent: 'center' },
    addDetail: { paddingTop: 3, fontSize: 12, color: c.textSecondary },
    detailRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 5 },
    description: { flex: 1, paddingVertical: 3, fontSize: 13, color: c.textSecondary },
    dishPrice: { width: 58, paddingVertical: 3, textAlign: 'right', fontSize: 13, color: c.text },
    addDish: { minHeight: 40, marginLeft: 30, flexDirection: 'row', alignItems: 'center', gap: 7 },
    addDishText: { fontSize: 13, fontWeight: '600', color: c.accent },

    addSectionBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingTop: 14 },
    addSectionLabel: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.4, color: c.textMute, marginBottom: 10 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 14, minHeight: 36, borderRadius: 100, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    chipText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: c.text },

    actionsBlock: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveButton: { height: 50, borderRadius: 25, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: c.iconBg },
    saveText: { fontSize: 15, fontWeight: '600', color: c.text },
    publishButton: { height: 50, borderRadius: 25, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent, shadowColor: c.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 4 },
    publishText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  });
}
