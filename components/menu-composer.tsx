import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
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
import type { MenuData, Platillo, Seccion } from '@/lib/menu-store';
import { useTheme } from '@/lib/theme';
import { ActionSheet } from '@/components/action-sheet';
import { GlassIconButton } from '@/components/glass-button';
import { noWidow } from '@/lib/typography';

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
    closeSectionActions,
    collapsed,
    data,
    details,
    moveSection,
    nombre,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    revealDetails,
    saveDraft,
    saveNombre,
    savedFlash,
    sectionActions,
    sectionSuggestions,
    setNombre,
    toggleCollapsed,
    toggleSectionActions,
  } = useFonderoMenuDraftController(initialData, source);

  // Palomita al salir del campo de nombre — mismo ícono que el check de
  // "Guardado" del botón Guardar (abajo), pero sin su auto-ocultado por
  // temporizador: si la persona no volvía a mirar el nav en esos ~2
  // segundos, la confirmación desaparecía sola sin que nadie la viera
  // (ruido reportado 2026-09-06). Como es un GlassIconButton real (se ve
  // tocable), tenía que responder al toque de verdad — Apple: un control
  // interactivo sin reacción al tocarlo es un control roto, no uno
  // discreto. Se resuelve por evento real, nunca por timer:
  // - Toca la palomita → confirma que la vio y desaparece (con háptico).
  // - Vuelve a entrar al campo a editar → desaparece también (ya no aplica).
  // Dos casos más, como en Notas de Apple:
  // - Si BORRASTE el nombre, se guarda igual (para que el placeholder
  //   "Nuevo menú" se quede así al reabrir, no reaparezca el nombre viejo)
  //   pero SIN palomita — no hay nada positivo que confirmar al vaciar algo.
  // - Si no cambió nada desde que entraste al campo (solo tocaste y saliste),
  //   no se guarda ni se anima — Apple no da feedback cuando no pasó nada.
  const nombreInputRef = useRef<TextInput | null>(null);
  const nombreOnFocus = useRef('');
  const [nombreSaved, setNombreSaved] = useState(false);
  const focusNombre = () => {
    nombreOnFocus.current = nombre;
    setNombreSaved(false);
  };
  const confirmNombre = async () => {
    if (nombre === nombreOnFocus.current) return;
    const saved = await saveNombre();
    if (saved && nombre.trim()) setNombreSaved(true);
  };

  // Anclaje del "···" de cada sección al mismo menú contextual homologado
  // que Historial/Colección (components/action-sheet.tsx) — antes esta
  // pantalla tenía su propio bloque inline sin backdrop, que se quedaba
  // "pegado" en pantalla porque nada escuchaba el toque afuera.
  const sectionMoreRefs = useRef<Map<string, View | null>>(new Map());
  const activeSectionIndex = data.secciones.findIndex((section) => section.id === sectionActions);
  const sectionActionOptions = activeSectionIndex >= 0 ? [
    ...(activeSectionIndex > 0 ? [{ label: 'Subir', icon: 'arrow-up' as const, onPress: () => moveSection(sectionActions!, -1) }] : []),
    ...(activeSectionIndex < data.secciones.length - 1 ? [{ label: 'Bajar', icon: 'arrow-down' as const, onPress: () => moveSection(sectionActions!, 1) }] : []),
    { label: 'Eliminar', icon: 'trash-outline' as const, destructive: true, onPress: () => removeSection(sectionActions!) },
  ] : [];

  // Revelación progresiva: las sugerencias de sección son secundarias una vez
  // que ya hay secciones armadas — no compiten por espacio con el contenido
  // (Apple HIG: "essential info gets sufficient space, don't crowd it").
  const [showSectionSuggestions, setShowSectionSuggestions] = useState(false);
  const [priceEditing, setPriceEditing] = useState<Record<string, boolean>>({});

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
    const showDetails = details[dish.id] || !!dish.descripcion;
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
          {/* Título del menú de hoy, como el de una nota: en blanco muestra el
              placeholder de siempre, y en cuanto el fondero le pone nombre
              (aquí mismo, sin salir a Menús) ese nombre se queda — ley
              dictada 2026-09-06. Alineado a la izquierda, ocupando el ancho
              disponible (un TextInput sin ancho fijo no se encoge a su
              contenido de forma confiable en RN — intentarlo dejaba el check
              flotando a medio camino, ni pegado al texto ni al borde;
              corregido el mismo día). La confirmación vive en el slot fijo
              de la derecha, como botón real (mismo GlassIconButton que sus
              vecinos), no como ícono suelto. */}
          <TextInput
            ref={nombreInputRef}
            style={[s.navTitle, { color: nombre.trim() ? c.text : c.textSecondary }]}
            value={nombre}
            onChangeText={setNombre}
            onFocus={focusNombre}
            onBlur={confirmNombre}
            onSubmitEditing={() => nombreInputRef.current?.blur()}
            placeholder={source === 'foto' ? 'Revisión' : 'Nuevo menú'}
            placeholderTextColor={c.textSecondary}
            maxLength={60}
            returnKeyType="done"
            accessibilityLabel="Nombre del menú"
          />
          {nombreSaved ? (
            <GlassIconButton
              icon="checkmark"
              accessibilityLabel="Nombre guardado, toca para continuar"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setNombreSaved(false);
              }}
              size={38}
              iconSize={18}
            />
          ) : source === 'foto' && onRetake ? (
            <GlassIconButton icon="camera-outline" accessibilityLabel="Tomar otra foto" onPress={onRetake} size={38} iconSize={18} />
          ) : <View style={s.navButton} />}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 32 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {data.secciones.map((section, sectionIndex) => {
            const isCollapsed = !!collapsed[section.id];
            const actionsOpen = sectionActions === section.id;
            return (
              <View key={section.id} style={s.section}>
                <View style={s.sectionHeader}>
                  <TouchableOpacity
                    style={s.collapseButton}
                    hitSlop={{ top: 4, bottom: 4, left: 7, right: 7 }}
                    onPress={() => toggleCollapsed(section.id)}
                    accessibilityRole="button"
                    accessibilityLabel={isCollapsed ? 'Mostrar sección' : 'Ocultar sección'}
                    activeOpacity={0.7}>
                    <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={17} color={c.textSecondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.sectionName}
                    value={section.nombre}
                    onChangeText={nombre => patchSection(section.id, { nombre: nombre.toUpperCase() })}
                    placeholder={sectionIndex === 0 ? 'PRIMER TIEMPO' : 'SECCIÓN'}
                    placeholderTextColor={c.textMute}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    ref={(el) => { sectionMoreRefs.current.set(section.id, el); }}
                    style={s.moreButton}
                    hitSlop={3}
                    onPress={() => toggleSectionActions(section.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Más acciones de la sección"
                    accessibilityState={{ expanded: actionsOpen }}
                    activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={19} color={c.textSecondary} />
                  </TouchableOpacity>
                </View>

                {!isCollapsed && (
                  <>
                    {section.platillos.map((dish, dishIndex) => {
                      const showDetails = details[dish.id] || !!dish.descripcion;
                      return (
                        <View key={dish.id} style={[s.dish, dishIndex > 0 && s.dishDivider]}>
                          {!!dish.revision && !/precio|\$|importe/i.test(dish.revision) && (
                            <View style={s.reviewNote}>
                              <Ionicons name="alert-circle-outline" size={13} color={c.accent} />
                              <Text style={s.reviewNoteText}>{dish.revision}</Text>
                            </View>
                          )}
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
                            {dish.precio || priceEditing[dish.id] ? (
                              <View style={s.inlinePrice}>
                                <Text style={s.currency}>$</Text>
                                <TextInput
                                  ref={registerInput(`p-${dish.id}`)}
                                  style={s.dishPrice}
                                  value={dish.precio}
                                  onChangeText={precio => patchDish(section.id, dish.id, { precio: precio.replace(/[^0-9.]/g, '') })}
                                  placeholder="0"
                                  placeholderTextColor={c.textMute}
                                  keyboardType="decimal-pad"
                                  selectTextOnFocus
                                  onBlur={() => {
                                    if (!dish.precio) setPriceEditing((current) => ({ ...current, [dish.id]: false }));
                                  }}
                                  accessibilityLabel={`Precio de ${dish.nombre || 'platillo'}`}
                                />
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={s.addPrice}
                                hitSlop={{ top: 5, bottom: 5, left: 4, right: 4 }}
                                onPress={() => {
                                  pendingFocus.current = `p-${dish.id}`;
                                  setPriceEditing((current) => ({ ...current, [dish.id]: true }));
                                }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Agregar precio a ${dish.nombre || 'platillo'}`}>
                                <Text style={s.addPriceText}>+$</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={s.removeDish}
                              hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                              onPress={() => removeDish(section.id, dish.id)}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`Eliminar ${dish.nombre || 'platillo'}`}>
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
                                placeholder="Descripción opcional"
                                placeholderTextColor={c.textMute}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => submitDishDetail(section, dishIndex)}
                              />
                            </View>
                          ) : (
                            <TouchableOpacity
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                              onPress={() => {
                                revealDetails(dish.id);
                                pendingFocus.current = `d-${dish.id}`;
                              }}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel="Agregar descripción">
                              <Text style={s.addDetail}>+ descripción</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}

                    <TouchableOpacity
                      style={s.addDish}
                      hitSlop={{ top: 2, bottom: 2 }}
                      onPress={() => addDishFocused(section)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar platillo">
                      <Ionicons name="add" size={16} color={c.accent} />
                      <Text style={s.addDishText}>{noWidow('Agregar platillo')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}

          {/* Secciones sugeridas según el giro. Con el menú vacío se muestran
              directas (es la acción esencial); en cuanto ya hay al menos una
              sección quedan detrás de un "+" que se puede abrir Y cerrar —
              revelación progresiva de verdad, no solo de un sentido
              (Apple HIG: chevron.right cerrado / chevron.down abierto). */}
          <View style={s.addSectionBlock}>
            {data.secciones.length > 0 && !showSectionSuggestions ? (
              <TouchableOpacity
                style={s.addSectionToggle}
                hitSlop={{ top: 2, bottom: 2 }}
                onPress={() => setShowSectionSuggestions(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Agregar sección">
                <Ionicons name="add-circle" size={20} color={c.accent} />
                <Text style={s.addSectionToggleText}>{noWidow('Agregar sección')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={s.addSectionHeader}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  activeOpacity={data.secciones.length > 0 ? 0.7 : 1}
                  disabled={data.secciones.length === 0}
                  onPress={() => setShowSectionSuggestions(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar sugerencias de sección"
                  accessibilityState={{ disabled: data.secciones.length === 0 }}>
                  <Text style={s.addSectionLabel}>{noWidow('AGREGAR SECCIÓN')}</Text>
                  {data.secciones.length > 0 && (
                    <Ionicons name="chevron-up" size={14} color={c.textMute} />
                  )}
                </TouchableOpacity>
                <View style={s.chipsRow}>
                  {sectionSuggestions.map((nombre) => (
                    <TouchableOpacity
                      key={nombre}
                      style={s.chip}
                      hitSlop={{ top: 4, bottom: 4 }}
                      onPress={() => {
                        addSection(nombre);
                        setShowSectionSuggestions(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar sección ${nombre}`}>
                      <Ionicons name="add" size={13} color={c.accent} />
                      <Text style={s.chipText}>{nombre}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={s.chip}
                    hitSlop={{ top: 4, bottom: 4 }}
                    onPress={() => {
                      addSection();
                      setShowSectionSuggestions(false);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar sección nueva">
                    <Ionicons name="add" size={13} color={c.textSecondary} />
                    <Text style={[s.chipText, { color: c.textSecondary }]}>{noWidow('SECCIÓN NUEVA')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Cierre del flujo, dentro del contenido: cápsulas HIG en fila —
              el secundario abraza su texto (tintado, sin borde), el primario
              lleva el peso. Nada ocupa todo el ancho. */}
          <View style={s.actionsBlock}>
            <TouchableOpacity
              style={s.saveButton}
              onPress={saveDraft}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={savedFlash ? 'Guardado' : 'Guardar borrador'}>
              <Ionicons name={savedFlash ? 'checkmark' : 'bookmark-outline'} size={15} color={c.text} />
              <Text style={s.saveText}>{savedFlash ? 'Guardado' : 'Guardar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.publishButton}
              onPress={publish}
              disabled={publishing}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel={publishing ? 'Publicando menú' : 'Publicar menú'}
              accessibilityState={{ disabled: publishing, busy: publishing }}>
              <Text style={s.publishText}>{publishing ? 'Publicando…' : 'Publicar menú'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={!!sectionActions}
        anchorRef={{ current: sectionActions ? sectionMoreRefs.current.get(sectionActions) ?? null : null }}
        onDismiss={closeSectionActions}
        options={sectionActionOptions}
      />
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    nav: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    // 38×38 — mismo tamaño que los GlassIconButton de este nav (cerca,
    // cámara, palomita). Antes era 44×44: al alternar con la palomita
    // (que sí es 38) el slot de la derecha cambiaba de ancho y el título
    // (flex:1) se reajustaba de golpe — el "flickeo" reportado 2026-09-06.
    navButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    navTitle: { flex: 1, textAlign: 'left', paddingHorizontal: 8, fontSize: 16, fontWeight: '700', color: c.textSecondary },
    dayPriceField: { minWidth: 78, height: 40, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: c.iconBg },
    dayPriceCurrency: { fontSize: 15, fontWeight: '700', color: c.textSecondary },
    dayPriceInput: { minWidth: 56, height: 44, paddingVertical: 0, paddingLeft: 2, textAlign: 'right', fontSize: 17, fontWeight: '700', color: c.text },
    section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingVertical: 14 },
    sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
    collapseButton: { width: 30, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
    sectionName: { flex: 1, paddingVertical: 6, fontSize: 18, lineHeight: 22, fontWeight: '900', letterSpacing: 0.5, color: c.text },
    moreButton: { width: 38, height: 38, alignItems: 'flex-end', justifyContent: 'center' },
    currency: { fontSize: 13, fontWeight: '300', color: c.textMute },
    dish: { paddingVertical: 7, paddingLeft: 30 },
    dishDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    reviewNote: { marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewNoteText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '300', color: c.accent },
    dishMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dishName: { flex: 1, paddingVertical: 3, fontSize: 16, lineHeight: 21, fontWeight: '700', color: c.text },
    removeDish: { width: 30, height: 30, alignItems: 'flex-end', justifyContent: 'center' },
    addDetail: { paddingTop: 3, fontSize: 12, fontWeight: '300', color: c.textSecondary },
    detailRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center' },
    description: { flex: 1, paddingVertical: 3, fontSize: 13, fontWeight: '300', color: c.textSecondary },
    inlinePrice: { minWidth: 68, height: 36, paddingHorizontal: 8, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: c.iconBg },
    dishPrice: { width: 44, paddingVertical: 3, textAlign: 'right', fontSize: 15, fontWeight: '700', color: c.text },
    addPrice: { minHeight: 34, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    addPriceText: { fontSize: 12, fontWeight: '300', color: c.textSecondary },
    addDish: { minHeight: 40, marginLeft: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
    addDishText: { fontSize: 13, fontWeight: '700', color: c.accent },
    addSectionBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingTop: 14 },
    addSectionToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
    addSectionToggleText: { fontSize: 13, fontWeight: '700', color: c.accent },
    addSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28, marginBottom: 10 },
    addSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: c.textMute },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 14, minHeight: 36, borderRadius: 100, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    actionsBlock: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    saveButton: { height: 50, borderRadius: 25, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.iconBg },
    saveText: { fontSize: 15, fontWeight: '700', color: c.text },
    publishButton: { height: 50, borderRadius: 25, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent, shadowColor: c.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 4 },
    publishText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  });
}
