import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cleanMenu, emptyMenu, useFonderoMenuDraftController } from '@/lib/controllers/useFonderoMenuDraftController';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { getTipoNegocio, type MenuData, type Platillo, type Seccion } from '@/lib/menu-store';
import { useTheme } from '@/lib/theme';
import { ActionSheet } from '@/components/action-sheet';
import { GlassIconButton } from '@/components/glass-button';
import { noWidow } from '@/lib/typography';
import { TEXT_LIMITS } from '@/lib/text-limits';

const PRICE_ACCESSORY = 'dish-price-keyboard';
// Giros donde se cobra el menú completo (comida corrida): ahí el precio del
// menú se muestra de entrada; en los demás es una sugerencia.
const MENU_PRICE_TYPES = new Set(['fondita', 'casa', 'restaurante']);

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
    dayPrice,
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
    setDayPrice,
    setNombre,
    toggleCollapsed,
    toggleSectionActions,
  } = useFonderoMenuDraftController(initialData, source);
  // El botón dice qué falta en vez de fallar al tocarlo.
  const menuEmpty = !cleanMenu(data).secciones.length;

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
    collapsed[sectionActions!]
      ? { label: 'Mostrar platillos', icon: 'chevron-down' as const, onPress: () => { smoothly(); toggleCollapsed(sectionActions!); } }
      : { label: 'Ocultar platillos', icon: 'chevron-up' as const, onPress: () => { smoothly(); toggleCollapsed(sectionActions!); } },
    ...(activeSectionIndex > 0 ? [{ label: 'Subir', icon: 'arrow-up' as const, onPress: () => moveSection(sectionActions!, -1) }] : []),
    ...(activeSectionIndex < data.secciones.length - 1 ? [{ label: 'Bajar', icon: 'arrow-down' as const, onPress: () => moveSection(sectionActions!, 1) }] : []),
    { label: 'Eliminar', icon: 'trash-outline' as const, destructive: true, onPress: () => removeSection(sectionActions!) },
  ] : [];

  // Revelación progresiva: las sugerencias de sección son secundarias una vez
  // que ya hay secciones armadas — no compiten por espacio con el contenido
  // (Apple HIG: "essential info gets sufficient space, don't crowd it").
  const [showSectionSuggestions, setShowSectionSuggestions] = useState(false);

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
  // Un nombre que no se está editando se muestra en una línea; para enfocarlo
  // primero vuelve a ser campo y el foco cae al montarse.
  const focusKey = (key: string) => {
    const ref = inputRefs.current[key];
    if (ref) { ref.focus(); return; }
    pendingFocus.current = key;
    if (key.startsWith('n-')) { smoothly(); setEditingName(key.slice(2)); }
  };
  // Nombre largo: completo mientras se escribe, en una línea con «…» al salir,
  // como el campo de un chat. El precio propio aparece solo si se pide o si ya
  // tiene valor, igual que la descripción («Agregar precio», «Agregar descripción»).
  const [editingName, setEditingName] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState<Record<string, boolean>>({});
  const smoothly = () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
  const openPrice = (dishId: string) => {
    const ref = inputRefs.current[`p-${dishId}`];
    if (ref) { ref.focus(); return; }
    smoothly();
    pendingFocus.current = `p-${dishId}`;
    setPriceOpen((current) => ({ ...current, [dishId]: true }));
  };
  // Precios en fila: sobre el teclado, «Siguiente» pasa al precio del platillo
  // de abajo (sirve para llenar varios o saltarse uno) y «Listo» cierra (para
  // cambiar solo uno). En Android, la tecla de acción del teclado hace «Siguiente».
  const [priceFocus, setPriceFocus] = useState<string | null>(null);
  const menuPriceSuggested = MENU_PRICE_TYPES.has(getTipoNegocio() ?? '');
  const [dayPriceOpen, setDayPriceOpen] = useState(false);
  const [dayPriceFocused, setDayPriceFocused] = useState(false);
  const dayPriceRef = useRef<TextInput | null>(null);
  const showDayPrice = menuPriceSuggested || !!dayPrice || dayPriceOpen;
  const openDayPrice = () => {
    smoothly();
    setDayPriceOpen(true);
    requestAnimationFrame(() => dayPriceRef.current?.focus());
  };
  const priceOrder = () => data.secciones.filter((section) => !collapsed[section.id]).flatMap((section) => section.platillos.map((dish) => dish.id));
  const nextPriceDish = (dishId: string | null) => {
    if (!dishId) return undefined;
    const order = priceOrder();
    return order[order.indexOf(dishId) + 1];
  };
  const goToNextPrice = (dishId: string | null) => {
    const next = nextPriceDish(dishId);
    if (next) openPrice(next); else Keyboard.dismiss();
  };

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
          <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onBack} />
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
            maxLength={TEXT_LIMITS.menuName}
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
            />
          ) : source === 'foto' && onRetake ? (
            <GlassIconButton icon="camera-outline" accessibilityLabel="Tomar otra foto" onPress={onRetake} />
          ) : <View style={s.navButton} />}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 32 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Precio del menú del día (comida corrida): un precio para todo el
              menú, guardado en la primera sección; los platillos con precio
              propio se cobran aparte. Aparece solo en los giros de comida
              corrida (fondita, venta en casa, restaurante) o si ya tiene
              precio; en los demás se ofrece como sugerencia junto a las
              secciones. Es un dato del menú, no una sección: fila de
              lista (etiqueta a la izquierda, valor a la derecha) con el mismo
              chip que el precio de un platillo, en su misma columna. */}
          {showDayPrice && (
            <View style={s.dayPriceRow}>
              <Text style={s.dayPriceLabel} numberOfLines={1}>Precio del menú</Text>
              <TouchableOpacity
                style={[s.priceChip, !dayPrice && !dayPriceFocused && s.priceChipEmpty]}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                onPress={() => dayPriceRef.current?.focus()}
                accessible={false}>
                <Text style={s.currency}>$</Text>
                <TextInput
                  ref={dayPriceRef}
                  style={s.dishPrice}
                  value={dayPrice}
                  onChangeText={(precio) => setDayPrice(precio.slice(0, TEXT_LIMITS.dishPrice))}
                  onFocus={() => setDayPriceFocused(true)}
                  onBlur={() => {
                    setDayPriceFocused(false);
                    if (!Number(dayPrice)) { setDayPrice(''); if (!menuPriceSuggested) { smoothly(); setDayPriceOpen(false); } }
                  }}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  inputAccessoryViewID={Platform.OS === 'ios' ? PRICE_ACCESSORY : undefined}
                  selectTextOnFocus
                  accessibilityLabel="Precio del menú del día"
                  accessibilityHint="Si cobras todo el menú junto. Los platillos con precio propio se cobran aparte."
                />
              </TouchableOpacity>
              <View style={s.removeDish} />
            </View>
          )}
          {data.secciones.map((section, sectionIndex) => {
            const isCollapsed = !!collapsed[section.id];
            const actionsOpen = sectionActions === section.id;
            return (
              <View key={section.id} style={s.section}>
                <View style={s.sectionHeader}>
                  <TextInput
                    style={s.sectionName}
                    value={section.nombre}
                    onChangeText={nombre => patchSection(section.id, { nombre: nombre.toUpperCase().slice(0, TEXT_LIMITS.sectionName) })}
                    placeholder={sectionIndex === 0 ? 'PRIMER TIEMPO' : 'SECCIÓN'}
                    placeholderTextColor={c.textMute}
                    returnKeyType="done"
                  />
                  {isCollapsed && (
                    <TouchableOpacity
                      style={s.collapsedCount}
                      onPress={() => { smoothly(); toggleCollapsed(section.id); }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Mostrar ${section.platillos.length} platillos`}>
                      <Text style={s.collapsedCountText}>{`${section.platillos.length} ${section.platillos.length === 1 ? 'platillo' : 'platillos'}`}</Text>
                    </TouchableOpacity>
                  )}
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
                            {editingName === dish.id || !dish.nombre ? (
                              <TextInput
                                ref={registerInput(`n-${dish.id}`)}
                                style={s.dishName}
                                value={dish.nombre}
                                onChangeText={nombre => patchDish(section.id, dish.id, { nombre: nombre.slice(0, TEXT_LIMITS.dishName) })}
                                onFocus={() => setEditingName(dish.id)}
                                onBlur={() => { smoothly(); setEditingName((current) => current === dish.id ? null : current); }}
                                placeholder="Platillo"
                                placeholderTextColor={c.textMute}
                                multiline
                                scrollEnabled={false}
                                returnKeyType="next"
                                submitBehavior="submit"
                                onSubmitEditing={() => submitDishName(dish)}
                              />
                            ) : (
                              <TouchableOpacity
                                style={s.dishNameButton}
                                onPress={() => focusKey(`n-${dish.id}`)}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`${dish.nombre}. Editar platillo`}>
                                <Text style={s.dishName} numberOfLines={1} ellipsizeMode="tail">{dish.nombre}</Text>
                              </TouchableOpacity>
                            )}
                            {dish.precio || priceOpen[dish.id] ? (
                              <View style={s.priceChip}>
                                <Text style={s.currency}>$</Text>
                                <TextInput
                                  ref={registerInput(`p-${dish.id}`)}
                                  style={s.dishPrice}
                                  value={dish.precio}
                                  onChangeText={precio => patchDish(section.id, dish.id, { precio: precio.replace(/[^0-9.]/g, '').slice(0, TEXT_LIMITS.dishPrice) })}
                                  onFocus={() => setPriceFocus(dish.id)}
                                  onBlur={() => {
                                    setPriceFocus((current) => current === dish.id ? null : current);
                                    // Arrepentirse deja el platillo sin precio: vacío o «0» no se guarda.
                                    if (!Number(dish.precio)) {
                                      if (dish.precio) patchDish(section.id, dish.id, { precio: '' });
                                      smoothly(); setPriceOpen((current) => ({ ...current, [dish.id]: false }));
                                    }
                                  }}
                                  keyboardType="decimal-pad"
                                  returnKeyType="next"
                                  onSubmitEditing={() => goToNextPrice(dish.id)}
                                  inputAccessoryViewID={Platform.OS === 'ios' ? PRICE_ACCESSORY : undefined}
                                  selectTextOnFocus
                                  accessibilityLabel={`Precio de ${dish.nombre || 'platillo'}`}
                                />
                              </View>
                            ) : (
                              // Mismo hueco que el precio lleno (alto, ancho y radio):
                              // al escribir, el campo nace exactamente ahí.
                              <TouchableOpacity
                                style={[s.priceChip, s.priceChipEmpty]}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
                                onPress={() => openPrice(dish.id)}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Agregar precio a ${dish.nombre || 'platillo'}`}>
                                <Text style={s.currency}>$</Text>
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
                                onChangeText={descripcion => patchDish(section.id, dish.id, { descripcion: descripcion.slice(0, TEXT_LIMITS.dishDescription) })}
                                placeholder="Descripción opcional"
                                placeholderTextColor={c.textMute}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => submitDishDetail(section, dishIndex)}
                              />
                            </View>
                          ) : null}
                          <View style={s.addRow}>
                            {!showDetails && (
                              <TouchableOpacity
                                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                                onPress={() => {
                                  smoothly();
                                  revealDetails(dish.id);
                                  pendingFocus.current = `d-${dish.id}`;
                                }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Agregar descripción a ${dish.nombre || 'platillo'}`}>
                                <Text style={s.addDetail}>Agregar descripción</Text>
                              </TouchableOpacity>
                            )}
                          </View>
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
                      <Ionicons name="add" size={18} color={c.accent} />
                      <Text style={s.addText}>{noWidow('Agregar platillo')}</Text>
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
                <Ionicons name="add" size={18} color={c.accent} />
                <Text style={s.addText}>{noWidow('Agregar sección')}</Text>
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
                  {!showDayPrice && (
                    <TouchableOpacity
                      style={s.chip}
                      hitSlop={{ top: 4, bottom: 4 }}
                      onPress={() => { openDayPrice(); setShowSectionSuggestions(false); }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar precio del menú completo">
                      <Ionicons name="add" size={13} color={c.accent} />
                      <Text style={s.chipText}>PRECIO DEL MENÚ</Text>
                    </TouchableOpacity>
                  )}
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

          {/* Cierre del flujo: una primaria y una secundaria, como el alta y
              el póster. «Publicar menú» es la cápsula naranja de 54 (única
              acción prominente); «Guardar sin publicar» es texto debajo. */}
          <View style={s.actionsBlock}>
            <TouchableOpacity
              style={[s.publishButton, menuEmpty && s.publishIdle]}
              onPress={publish}
              disabled={publishing || menuEmpty}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={publishing ? 'Publicando menú' : menuEmpty ? 'Falta un platillo' : 'Publicar menú'}
              accessibilityState={{ disabled: publishing || menuEmpty, busy: publishing }}>
              {publishing && <ActivityIndicator size="small" color="#fff" />}
              <Text style={[s.publishText, menuEmpty && { color: c.textSecondary }]}>{noWidow(publishing ? 'Publicando…' : menuEmpty ? 'Falta un platillo' : 'Publicar menú')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveButton, publishing && { opacity: 0.4 }]}
              disabled={publishing}
              accessibilityState={{ disabled: publishing }}
              onPress={saveDraft}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={savedFlash ? 'Guardado' : 'Guardar sin publicar'}>
              {savedFlash && <Ionicons name="checkmark" size={16} color={c.textSecondary} />}
              <Text style={s.saveText}>{noWidow(savedFlash ? 'Guardado' : 'Guardar sin publicar')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={PRICE_ACCESSORY}>
          <View style={s.priceBar}>
            {nextPriceDish(priceFocus) ? (
              <TouchableOpacity style={s.priceBarButton} onPress={() => goToNextPrice(priceFocus)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Siguiente precio">
                <Text style={s.priceBarNext}>Siguiente</Text>
                <Ionicons name="chevron-down" size={15} color={c.text} />
              </TouchableOpacity>
            ) : <View />}
            <TouchableOpacity style={s.priceBarButton} onPress={() => Keyboard.dismiss()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Listo">
              <Text style={s.priceBarDone}>Listo</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

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
    navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    navTitle: { flex: 1, textAlign: 'left', paddingHorizontal: 8, fontSize: 17, fontWeight: '700', color: c.textSecondary },
    dayPriceRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
    dayPriceLabel: { flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '400', color: c.text },
    section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingVertical: 12 },
    sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
    sectionName: { flex: 1, paddingVertical: 6, fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    collapsedCount: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
    collapsedCountText: { fontSize: 13, fontWeight: '400', color: c.textSecondary },
    moreButton: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
    currency: { fontSize: 13, fontWeight: '300', color: c.textMute },
    dish: { paddingVertical: 7 },
    dishDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    reviewNote: { marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewNoteText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '300', color: c.accent },
    dishMainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    dishNameButton: { flex: 1, minWidth: 0 },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    dishName: { flex: 1, paddingVertical: 3, fontSize: 16, lineHeight: 21, fontWeight: '700', color: c.text },
    removeDish: { width: 30, height: 30, marginTop: -1, alignItems: 'flex-end', justifyContent: 'center' },
    addDetail: { paddingTop: 3, fontSize: 12, fontWeight: '300', color: c.textSecondary },
    detailRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center' },
    description: { flex: 1, paddingVertical: 3, fontSize: 13, fontWeight: '300', color: c.textSecondary },
    // Alto de la línea del nombre (21) + 3: el chip se centra en esa línea y
    // su número comparte la línea base del nombre, sin sobresalir.
    priceChip: { height: 24, marginTop: 1.5, paddingHorizontal: 9, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: c.iconBg },
    priceChipEmpty: { minWidth: 40, justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border },
    priceBar: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    priceBarButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceBarNext: { fontSize: 16, fontWeight: '400', color: c.text },
    priceBarDone: { fontSize: 16, fontWeight: '700', color: c.accent },
    dishPrice: { minWidth: 10, paddingVertical: 0, fontSize: 15, fontWeight: '700', color: c.text },
    addDish: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    // Toda acción «agregar» del editor: mismo ícono, tamaño y color.
    addText: { fontSize: 15, fontWeight: '700', color: c.accent },
    addSectionBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingTop: 14 },
    addSectionToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
    addSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28, marginBottom: 10 },
    addSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: c.textMute },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 14, minHeight: 36, borderRadius: 100, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    actionsBlock: { marginTop: 32, alignItems: 'center', gap: 8 },
    saveButton: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    saveText: { fontSize: 16, fontWeight: '400', color: c.textSecondary },
    publishButton: { alignSelf: 'stretch', minHeight: 54, borderRadius: 27, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.accent },
    // Mismos estados que Guardar en Editar mi negocio: falta algo (gris, dice
    // qué), listo (naranja), publicando (naranja con indicador).
    publishIdle: { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    publishText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
