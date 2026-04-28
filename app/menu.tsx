import { Stack, useFocusEffect, router } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import {
  type MenuData,
  type Seccion,
  type Platillo,
  makeSectionId,
  makePlatilloId,
  makeDefaultMenu,
  normalizeMenuData,
  setMenuData as saveMenuData,
  getMenuData,
  setCartaData as saveCartaData,
  getFonditaName,
  setFonditaName,
  getFonditaDescription,
  setFonditaDescription,
  getFonditaDireccion,
  setFonditaDireccion,
  getFonditaDireccionVisible,
  setFonditaDireccionVisible,
  getTipoNegocio,
  setTipoNegocio,
} from '@/lib/menu-store';
import { loadMenuHoy, saveMenuHoy, deleteMenuHoy, loadCarta, upsertFondita } from '@/lib/db';
import { getFonditaId, setFonditaId } from '@/lib/user-store';
import { supabase } from '@/lib/supabase';
import { useTheme, type Theme } from '@/lib/theme';

type TemplateKey = 'fondita' | 'taqueria' | 'reposteria' | 'mariscos';

const SECTION_TEMPLATES: Record<TemplateKey, { label: string; sections: string[] }> = {
  fondita: {
    label: 'Fondita',
    sections: ['1ER TIEMPO', '2DO TIEMPO', '3ER TIEMPO', 'BEBIDAS'],
  },
  taqueria: {
    label: 'Taquería',
    sections: ['TACOS', 'COMPLEMENTOS', 'BEBIDAS'],
  },
  reposteria: {
    label: 'Repostería',
    sections: ['PASTELES', 'PIEZAS', 'BEBIDAS'],
  },
  mariscos: {
    label: 'Mariscos',
    sections: ['ENTRADAS', 'CALDOS', 'PLATOS FUERTES', 'BEBIDAS'],
  },
};

const TEMPLATE_ORDER: TemplateKey[] = ['fondita', 'taqueria', 'reposteria', 'mariscos'];

function resolveTemplateFromTipo(tipo: string | null | undefined): TemplateKey {
  if (tipo === 'taqueria') return 'taqueria';
  if (tipo === 'reposteria') return 'reposteria';
  if (tipo === 'mariscos') return 'mariscos';
  return 'fondita';
}

// ─── MovePlatilloModal ────────────────────────────────────────────────────────
function MovePlatilloModal({
  visible,
  secciones,
  currentSecId,
  onMove,
  onClose,
}: {
  visible: boolean;
  secciones: Seccion[];
  currentSecId: string;
  onMove: (targetSecId: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const targets = secciones.filter(sec => sec.id !== currentSecId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={s.modalSheet}>
          <Text style={s.modalTitle} allowFontScaling={true}>Mover a sección</Text>
          {targets.map(sec => (
            <TouchableOpacity key={sec.id} style={s.modalOption} onPress={() => onMove(sec.id)}>
              <Text style={s.modalOptionText} allowFontScaling={true}>{sec.nombre}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.modalCancel} onPress={onClose}>
            <Text style={s.modalCancelText} allowFontScaling={true}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── PlatilloCard ─────────────────────────────────────────────────────────────
function PlatilloCard({
  plat,
  onNombre,
  onDesc,
  onPrecio,
  onRemove,
  onMove,
}: {
  plat: Platillo;
  onNombre: (v: string) => void;
  onDesc: (v: string) => void;
  onPrecio: (v: string) => void;
  onRemove: () => void;
  onMove: () => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const swipeRef = useRef<any>(null);

  const handleMove = () => {
    swipeRef.current?.close();
    onMove();
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onRemove();
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={() => (
        <View style={s.swipeActionsWrap}>
          <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionMove]} onPress={handleMove} activeOpacity={0.85}>
            <Text style={s.swipeActionText}>Mover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionDelete]} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={s.swipeActionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}>
      <View style={s.platCard}>
        <TouchableOpacity onPress={onMove} style={s.handle} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={s.handleIcon}>⠿</Text>
        </TouchableOpacity>
        <View style={s.platMain}>
          <View style={s.platTopRow}>
            <TextInput
              style={s.platName}
              value={plat.nombre}
              onChangeText={onNombre}
              placeholder="Platillo"
              placeholderTextColor={theme.border}
              autoCapitalize="sentences"
              selectionColor={theme.accent}
              returnKeyType="next"
              allowFontScaling={true}
            />
            <View style={s.platActions}>
              <Text style={s.pricePrefixMuted} allowFontScaling={true}>$</Text>
              <TextInput
                style={s.platPrecio}
                value={plat.precio}
                onChangeText={v => onPrecio(v.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={theme.border}
                keyboardType="decimal-pad"
                selectionColor={theme.accent}
                allowFontScaling={true}
              />
            </View>
          </View>
          <TextInput
            style={s.platDesc}
            value={plat.descripcion}
            onChangeText={onDesc}
            placeholder="Descripción"
            placeholderTextColor={theme.border}
            autoCapitalize="none"
            selectionColor={theme.accent}
            returnKeyType="next"
            allowFontScaling={true}
          />
        </View>
      </View>
    </Swipeable>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({
  sec,
  onNombre,
  onPrecio,
  onRemove,
  onMoveUp,
  canMoveUp,
  onAddPlatillo,
  onUpdatePlatillo,
  onRemovePlatillo,
  onMovePlatillo,
}: {
  sec: Seccion;
  onNombre: (v: string) => void;
  onPrecio: (v: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  canMoveUp: boolean;
  onAddPlatillo: () => void;
  onUpdatePlatillo: (platId: string, patch: Partial<Platillo>) => void;
  onRemovePlatillo: (platId: string) => void;
  onMovePlatillo: (platId: string) => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const addLabel = '+ agregar';
  const swipeRef = useRef<any>(null);

  const handleMoveUp = () => {
    swipeRef.current?.close();
    onMoveUp();
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onRemove();
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={() => (
        <View style={s.swipeActionsWrap}>
          {canMoveUp && (
            <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionMove]} onPress={handleMoveUp} activeOpacity={0.85}>
              <Text style={s.swipeActionText}>Subir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionDelete]} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={s.swipeActionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}>
      <View style={s.secCard}>
        <View style={s.secHeader}>
          <TextInput
            style={s.secName}
            value={sec.nombre}
            onChangeText={v => onNombre(v.toUpperCase())}
            autoCapitalize="characters"
            selectionColor={theme.accent}
            returnKeyType="done"
            allowFontScaling={true}
          />
          <View style={s.priceWrap}>
            <Text style={s.pricePrefix} allowFontScaling={true}>$</Text>
            <TextInput
              style={s.secPrecio}
              value={sec.precio}
              onChangeText={v => onPrecio(v.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor={theme.border}
              keyboardType="decimal-pad"
              selectionColor={theme.accent}
              allowFontScaling={true}
            />
          </View>
        </View>

        {sec.platillos.map(plat => (
          <PlatilloCard
            key={plat.id}
            plat={plat}
            onNombre={v => onUpdatePlatillo(plat.id, { nombre: v })}
            onDesc={v => onUpdatePlatillo(plat.id, { descripcion: v })}
            onPrecio={v => onUpdatePlatillo(plat.id, { precio: v })}
            onRemove={() => onRemovePlatillo(plat.id)}
            onMove={() => onMovePlatillo(plat.id)}
          />
        ))}

        <Pressable
          style={({ pressed }) => [s.addPlatilloBtn, pressed && s.addPlatilloBtnPressed]}
          onPress={onAddPlatillo}>
          <Text style={s.addPlatilloText} allowFontScaling={true}>{addLabel}</Text>
        </Pressable>
      </View>
    </Swipeable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MenuScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  const [menuData, setMenuData] = useState<MenuData>(
    () => normalizeMenuData(getMenuData()) ?? { secciones: [] }
  );
  const [movingPlatillo, setMovingPlatillo] = useState<{ secId: string; platId: string } | null>(null);
  const [sectionPickerVisible, setSectionPickerVisible] = useState(false);
  const [selectedSectionNames, setSelectedSectionNames] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('fondita');
  const [menuActionsVisible, setMenuActionsVisible] = useState(false);

  const menuSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    setFonditaName(getFonditaName());
    setFonditaDescription(getFonditaDescription());
    setFonditaDireccion(getFonditaDireccion());
    setFonditaDireccionVisible(getFonditaDireccionVisible());
  }, []));

  useEffect(() => {
    const init = async () => {
      let fonditaId = getFonditaId();
      if (!fonditaId) {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        if (!email) return;
        const id = await upsertFondita(email);
        if (!id) return;
        setFonditaId(id);
        fonditaId = id;
      }
      const [menuFromDb, cartaFromDb] = await Promise.all([loadMenuHoy(fonditaId), loadCarta(fonditaId)]);
      if (menuFromDb) {
        const m = normalizeMenuData(menuFromDb) ?? { secciones: [] };
        setMenuData(m);
        saveMenuData(m);
      }
      if (cartaFromDb) {
        const c = normalizeMenuData(cartaFromDb) ?? makeDefaultMenu(getTipoNegocio());
        saveCartaData(c);
      }
      const { data: fondita } = await supabase
        .from('fonditas')
        .select('nombre, descripcion, direccion, direccion_visible, tipo_negocio')
        .eq('id', fonditaId)
        .maybeSingle();
      if (fondita?.nombre)                    setFonditaName(fondita.nombre);
      if (fondita?.descripcion != null)        setFonditaDescription(fondita.descripcion);
      if (fondita?.direccion != null)          setFonditaDireccion(fondita.direccion);
      if (fondita?.direccion_visible != null)  setFonditaDireccionVisible(fondita.direccion_visible);
      if ((fondita as any)?.tipo_negocio != null) setTipoNegocio((fondita as any).tipo_negocio);
    };
    init();
  }, []);

  useEffect(() => {
    saveMenuData(menuData);
    const fonditaId = getFonditaId();
    if (!fonditaId) return;
    if (menuSaveTimer.current) clearTimeout(menuSaveTimer.current);
    menuSaveTimer.current = setTimeout(() => saveMenuHoy(fonditaId, menuData), 1500);
    return () => { if (menuSaveTimer.current) clearTimeout(menuSaveTimer.current); };
  }, [menuData]);

  // ── CRUD helpers ───────────────────────────────────────────────────────────
  const updateSecNombre = useCallback((secId: string, nombre: string) =>
    setMenuData(p => ({ ...p, secciones: p.secciones.map(s => s.id === secId ? { ...s, nombre } : s) })), []);

  const updateSecPrecio = useCallback((secId: string, precio: string) =>
    setMenuData(p => ({ ...p, secciones: p.secciones.map(s => s.id === secId ? { ...s, precio } : s) })), []);

  const removeSec = useCallback((secId: string) =>
    setMenuData(p => ({ ...p, secciones: p.secciones.filter(s => s.id !== secId) })), []);

  const addSec = useCallback(() =>
    setMenuData(p => ({
      ...p,
      secciones: [...p.secciones, { id: makeSectionId(), nombre: `SECCIÓN ${p.secciones.length + 1}`, precio: '', platillos: [] }],
    })), []);

  const addPlatillo = useCallback((secId: string) =>
    setMenuData(p => ({
      ...p,
      secciones: p.secciones.map(s =>
        s.id === secId
          ? { ...s, platillos: [...s.platillos, { id: makePlatilloId(), nombre: '', descripcion: '', precio: '' }] }
          : s
      ),
    })), []);

  const removePlatillo = useCallback((secId: string, platId: string) =>
    setMenuData(p => ({
      ...p,
      secciones: p.secciones.map(s =>
        s.id === secId ? { ...s, platillos: s.platillos.filter(pl => pl.id !== platId) } : s
      ),
    })), []);

  const updatePlatillo = useCallback((secId: string, platId: string, patch: Partial<Platillo>) =>
    setMenuData(p => ({
      ...p,
      secciones: p.secciones.map(s =>
        s.id === secId
          ? { ...s, platillos: s.platillos.map(pl => pl.id === platId ? { ...pl, ...patch } : pl) }
          : s
      ),
    })), []);

  const doMove = useCallback((targetSecId: string) => {
    if (!movingPlatillo) return;
    const { secId, platId } = movingPlatillo;
    setMenuData(p => {
      const srcSec = p.secciones.find(s => s.id === secId);
      if (!srcSec) return p;
      const platillo = srcSec.platillos.find(pl => pl.id === platId);
      if (!platillo) return p;
      return {
        ...p,
        secciones: p.secciones.map(s => {
          if (s.id === secId)       return { ...s, platillos: s.platillos.filter(pl => pl.id !== platId) };
          if (s.id === targetSecId) return { ...s, platillos: [...s.platillos, platillo] };
          return s;
        }),
      };
    });
    setMovingPlatillo(null);
  }, [movingPlatillo]);

  const moveSecUp = useCallback((secId: string) => {
    setMenuData(prev => {
      const idx = prev.secciones.findIndex(s => s.id === secId);
      if (idx <= 0) return prev;
      const secciones = [...prev.secciones];
      const [item] = secciones.splice(idx, 1);
      secciones.splice(idx - 1, 0, item);
      return { ...prev, secciones };
    });
  }, []);

  const handleBorrar = () => {
    Alert.alert('¿Borrar menú de hoy?', 'Se eliminarán las secciones y platillos actuales.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
        const empty: MenuData = { secciones: [] };
        setMenuData(empty); saveMenuData(empty);
        const fonditaId = getFonditaId();
        if (fonditaId) await deleteMenuHoy(fonditaId);
      }},
    ]);
  };

  const openSectionPicker = useCallback(() => {
    const template = resolveTemplateFromTipo(getTipoNegocio());
    setSelectedTemplate(template);
    setSelectedSectionNames([...SECTION_TEMPLATES[template].sections]);
    setSectionPickerVisible(true);
  }, []);

  const applyTemplate = useCallback((template: TemplateKey) => {
    setSelectedTemplate(template);
    setSelectedSectionNames([...SECTION_TEMPLATES[template].sections]);
  }, []);

  const activeTemplateSections = SECTION_TEMPLATES[selectedTemplate].sections;
  const hasAnySelectedSection = selectedSectionNames.length > 0;

  const toggleSuggestedSection = useCallback((name: string) => {
    setSelectedSectionNames(prev => (
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    ));
  }, []);

  const applySuggestedSections = useCallback(() => {
    const clean = selectedSectionNames
      .map(n => n.trim().toUpperCase())
      .filter(Boolean)
      .filter((name, idx, arr) => arr.indexOf(name) === idx);
    if (!clean.length) {
      setSectionPickerVisible(false);
      return;
    }
    setMenuData({
      secciones: clean.map(nombre => ({
        id: makeSectionId(),
        nombre,
        precio: '',
        platillos: [],
      })),
    });
    setSectionPickerVisible(false);
  }, [selectedSectionNames]);

  const startFromScratch = useCallback(() => {
    setMenuData({
      secciones: [
        {
          id: makeSectionId(),
          nombre: 'SECCIÓN 1',
          precio: '',
          platillos: [],
        },
      ],
    });
    setSectionPickerVisible(false);
  }, []);

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={[s.backIconBtn, { top: insets.top + 6 }]} onPress={() => router.back()} activeOpacity={0.76}>
        <SymbolView name="chevron.left" size={17} tintColor={theme.text} weight="semibold" />
      </TouchableOpacity>
      <MovePlatilloModal
        visible={!!movingPlatillo}
        secciones={menuData.secciones}
        currentSecId={movingPlatillo?.secId ?? ''}
        onMove={doMove}
        onClose={() => setMovingPlatillo(null)}
      />
      <Modal
        visible={sectionPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSectionPickerVisible(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSectionPickerVisible(false)}>
          <View style={s.presetSheet}>
            <View style={s.sheetGrabber} />
            <Text style={s.presetTitle} allowFontScaling={true}>Plantillas de secciones</Text>
            <Text style={s.presetSub} allowFontScaling={true}>Elige una base rápida. Luego puedes editar todo.</Text>
            <View style={s.templateRow}>
              {TEMPLATE_ORDER.map(key => {
                const selected = selectedTemplate === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => applyTemplate(key)}
                    style={({ pressed }) => [
                      s.templatePill,
                      selected && s.templatePillSelected,
                      pressed && s.templatePillPressed,
                    ]}>
                    <Text
                      style={[s.templatePillText, selected && s.templatePillTextSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.82}
                      allowFontScaling={true}>
                      {SECTION_TEMPLATES[key].label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.presetCaption} allowFontScaling={true}>Secciones incluidas</Text>
            <View style={s.sectionChecklist}>
              {activeTemplateSections.map(name => {
                const selected = selectedSectionNames.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggleSuggestedSection(name)}
                    style={({ pressed }) => [s.checkRow, pressed && s.checkRowPressed]}>
                    <View style={[s.checkDot, selected && s.checkDotSelected]}>
                      {selected && <Text style={s.checkDotMark}>✓</Text>}
                    </View>
                    <Text style={[s.checkLabel, !selected && s.checkLabelOff]} allowFontScaling={true}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TouchableOpacity
              style={[s.btnTertiary, { marginTop: 2 }]}
              onPress={startFromScratch}
              activeOpacity={0.82}>
              <Text style={s.btnTertiaryText} allowFontScaling={true}>Empezar desde cero</Text>
              <Text style={s.btnTertiarySub} allowFontScaling={true}>Crea tus propias secciones manualmente.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnPrimary, { marginTop: 10 }, !hasAnySelectedSection && s.btnPrimaryDisabled]}
              onPress={applySuggestedSections}
              activeOpacity={0.86}
              disabled={!hasAnySelectedSection}>
              <Text style={[s.btnPrimaryText, !hasAnySelectedSection && s.btnPrimaryTextDisabled]} allowFontScaling={true}>Crear secciones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSecondary, { marginTop: 8 }]}
              onPress={() => setSectionPickerVisible(false)}
              activeOpacity={0.86}>
              <Text style={s.btnSecondaryText} allowFontScaling={true}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={menuActionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuActionsVisible(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setMenuActionsVisible(false)}>
          <View style={s.actionSheetWrap}>
            <View style={s.actionSheet}>
              <View style={s.sheetGrabber} />
              <TouchableOpacity
                style={s.actionSheetItem}
                onPress={() => {
                  setMenuActionsVisible(false);
                  router.push('/foto-menu');
                }}
                activeOpacity={0.82}>
                <Text style={s.actionSheetItemText} allowFontScaling={true}>Usar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionSheetItem}
                onPress={() => {
                  setMenuActionsVisible(false);
                  openSectionPicker();
                }}
                activeOpacity={0.82}>
                <Text style={s.actionSheetItemText} allowFontScaling={true}>Elegir otra plantilla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionSheetItem}
                onPress={() => {
                  setMenuActionsVisible(false);
                  handleBorrar();
                }}
                activeOpacity={0.82}>
                <Text style={s.actionSheetDeleteText} allowFontScaling={true}>Borrar menú</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={s.actionSheetCancel}
              onPress={() => setMenuActionsVisible(false)}
              activeOpacity={0.82}>
              <Text style={s.actionSheetCancelText} allowFontScaling={true}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.keyboardView}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingTop: insets.top + 56 },
            !menuData.secciones.length && s.scrollContentEmpty,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {menuData.secciones.map((sec, idx) => (
                <SectionCard
                  key={sec.id}
                  sec={sec}
                  onNombre={v => updateSecNombre(sec.id, v)}
                  onPrecio={v => updateSecPrecio(sec.id, v)}
                  onRemove={() => removeSec(sec.id)}
                  onMoveUp={() => moveSecUp(sec.id)}
                  canMoveUp={idx > 0}
                  onAddPlatillo={() => addPlatillo(sec.id)}
                  onUpdatePlatillo={(platId, patch) => updatePlatillo(sec.id, platId, patch)}
                  onRemovePlatillo={platId => removePlatillo(sec.id, platId)}
                  onMovePlatillo={platId => setMovingPlatillo({ secId: sec.id, platId })}
                />
              ))}
              {!menuData.secciones.length && (
                <View style={s.emptyStateWrap}>
                  <View style={s.emptyStateCard}>
                    <SymbolView name="sparkles" size={30} tintColor={theme.accent} weight="semibold" />
                    <Text style={s.emptyStateTitle} allowFontScaling={true}>Empieza tu menú</Text>
                    <Text style={s.emptyStateSub} allowFontScaling={true}>Sube una foto y Patio lo llena al instante.</Text>
                    <View style={s.emptyStatePhotoActions}>
                      <TouchableOpacity
                        style={s.emptyStatePhotoWrap}
                        onPress={() => router.push('/foto-menu')}
                        activeOpacity={0.82}>
                        <View style={s.emptyStatePhotoFab}>
                          <SymbolView name="camera.fill" size={28} tintColor="#FFFFFF" weight="semibold" />
                        </View>
                        <Text style={s.emptyStatePhotoLabel} allowFontScaling={true}>Tomar foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.emptyStateSecondaryBtn} onPress={() => router.push('/foto-menu')} activeOpacity={0.82}>
                        <Text style={s.emptyStateSecondaryBtnText} allowFontScaling={true}>Elegir imagen</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {!menuData.secciones.length && (
                <TouchableOpacity style={s.templateLinkBtn} onPress={openSectionPicker} activeOpacity={0.8}>
                  <View style={s.templateLinkRow}>
                    <SymbolView name="square.grid.2x2" size={13} tintColor={theme.textSecondary} weight="medium" />
                    <Text style={s.templateLinkText} allowFontScaling={true}>Usar plantilla</Text>
                  </View>
                </TouchableOpacity>
              )}

              {!!menuData.secciones.length && (
                <TouchableOpacity style={s.addSecBtn} onPress={addSec}>
                  <Text style={s.addSecText} allowFontScaling={true}>+ Agregar sección</Text>
                </TouchableOpacity>
              )}

              {!!menuData.secciones.length && (
                <View style={s.optionsWrap}>
                  <TouchableOpacity
                    style={s.optionsToggle}
                    onPress={() => setMenuActionsVisible(true)}
                    activeOpacity={0.82}>
                    <SymbolView
                      name="ellipsis"
                      size={14}
                      tintColor={theme.textSecondary}
                      weight="medium"
                    />
                    <Text style={s.optionsToggleText} allowFontScaling={true}>Más opciones</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        <BottomTabBar />
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── makeStyles ───────────────────────────────────────────────────────────────
function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:       { flex: 1, backgroundColor: t.bg },
    backIconBtn:     { position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 16, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', zIndex: 30 },
    keyboardView:    { flex: 1 },
    scroll:          { flex: 1 },
    scrollContent:   { paddingHorizontal: 16, paddingBottom: 48 },
    scrollContentEmpty: { flexGrow: 1, justifyContent: 'center' },
    // Section card
    secCard:         { backgroundColor: t.surface, borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: t.sep, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2 },
    secHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    secName:         { flex: 1, marginRight: 12, fontSize: 12, fontWeight: '700', letterSpacing: 0.2, color: t.text, textTransform: 'uppercase', paddingVertical: 0, lineHeight: 16 },
    priceWrap:       { marginLeft: 'auto', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 1 },
    pricePrefix:     { fontSize: 13, fontWeight: '600', color: t.textSecondary, marginRight: 0 },
    secPrecio:       { minWidth: 10, fontSize: 13, fontWeight: '600', color: t.textSecondary, textAlign: 'left', paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    secRemoveBtn:    { width: 18, height: 18, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
    secRemove:       { fontSize: 18, lineHeight: 18, color: t.textSecondary, fontWeight: '300' },
    // Platillo card
    platCard:        { backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep },
    handle:          { width: 20, marginRight: 8, paddingTop: 2, alignItems: 'center' },
    handleIcon:      { fontSize: 16, color: t.textSecondary },
    platMain:        { flex: 1, minWidth: 0 },
    platTopRow:      { flexDirection: 'row', alignItems: 'baseline' },
    platActions:     { marginLeft: 8, flexDirection: 'row', alignItems: 'center' },
    platName:        { flex: 1, fontSize: 17, fontWeight: '700', color: t.text, paddingVertical: 0, lineHeight: 23 },
    platDesc:        { marginTop: 3, fontSize: 15, color: t.textSecondary, paddingVertical: 0, lineHeight: 21 },
    pricePrefixMuted:{ fontSize: 13, fontWeight: '600', color: t.textSecondary, marginRight: 0 },
    platPrecio:      { minWidth: 26, fontSize: 13, fontWeight: '600', color: t.textSecondary, textAlign: 'left', paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    platRemoveBtn:   { width: 18, height: 18, marginLeft: 6, alignItems: 'center', justifyContent: 'center' },
    platRemove:      { fontSize: 18, lineHeight: 18, color: t.textSecondary, fontWeight: '300' },
    // Add platillo
    addPlatilloBtn:  {
      alignSelf: 'stretch',
      alignItems: 'flex-start',
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginTop: 2,
    },
    addPlatilloBtnPressed: { backgroundColor: t.surface2 },
    addPlatilloText: { fontSize: 14, color: t.accent, fontWeight: '500', opacity: 0.82 },
    // Swipe actions
    swipeActionsWrap: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 12 },
    swipeActionBtn:   { minWidth: 86, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, marginLeft: 8 },
    swipeActionMove:  { backgroundColor: t.accentLight },
    swipeActionDelete:{ backgroundColor: '#E74C3C' },
    swipeActionText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
    // Add section
    addSecBtn:       { alignSelf: 'center', minWidth: 220, borderWidth: 1, borderColor: t.border, borderStyle: 'dashed', borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 18, backgroundColor: t.surface },
    addSecText:      { fontSize: 14, color: t.accent, fontWeight: '700' },
    // Empty onboarding state
    emptyStateWrap:  { flex: 1, justifyContent: 'center', marginBottom: 12 },
    emptyStateCard:  {
      backgroundColor: t.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.sep,
      paddingVertical: 28,
      paddingHorizontal: 22,
      alignItems: 'center',
      gap: 10,
      marginBottom: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 24,
      elevation: 2,
    },
    emptyStateTitle: { fontSize: 22, fontWeight: '800', color: t.text, textAlign: 'center', letterSpacing: -0.3 },
    emptyStateSub:   { maxWidth: 290, fontSize: 15, lineHeight: 21, color: t.textSecondary, textAlign: 'center' },
    emptyStatePhotoActions: { alignItems: 'center', marginTop: 8, marginBottom: 2, width: '100%' },
    emptyStatePhotoWrap: { alignItems: 'center' },
    emptyStatePhotoFab: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 7,
    },
    emptyStatePhotoLabel: { marginTop: 10, fontSize: 15, fontWeight: '700', color: t.text },
    emptyStateSecondaryBtn: {
      marginTop: 12,
      minWidth: 160,
      backgroundColor: t.surface2,
      borderRadius: 16,
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
    },
    emptyStateSecondaryBtnText: { fontSize: 14, fontWeight: '600', color: t.text },
    templateLinkBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12, marginTop: 2, marginBottom: 8, borderRadius: 999, backgroundColor: t.surface2 },
    templateLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    templateLinkText: { fontSize: 13, fontWeight: '500', color: t.textSecondary },
    // Secondary actions
    optionsWrap:       { marginTop: 6, marginBottom: 22, alignItems: 'center' },
    optionsToggle:     { minWidth: 220, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 999, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border },
    optionsToggleText: { fontSize: 13, fontWeight: '600', color: t.textSecondary, letterSpacing: -0.1 },
    actionSheetWrap:   { marginTop: 'auto', paddingHorizontal: 12, paddingBottom: 12 },
    actionSheet:       { borderRadius: 20, backgroundColor: t.surface, overflow: 'hidden', borderWidth: 1, borderColor: t.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
    actionSheetItem:   { paddingVertical: 17, paddingHorizontal: 18, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep },
    actionSheetItemText: { fontSize: 16, fontWeight: '500', color: t.text },
    actionSheetDeleteText: { fontSize: 16, fontWeight: '600', color: '#C65A45' },
    actionSheetCancel: { marginTop: 8, borderRadius: 18, backgroundColor: t.surface, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: t.border },
    actionSheetCancelText: { fontSize: 16, fontWeight: '700', color: t.text },
    // Modal
    modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet:      { backgroundColor: t.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle:      { fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 16 },
    modalOption:     { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    modalOptionText: { fontSize: 15, color: t.text },
    modalCancel:     { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    modalCancelText: { fontSize: 15, color: t.textSecondary },
    // Suggested sections picker
    sheetGrabber:    { alignSelf: 'center', width: 42, height: 5, borderRadius: 999, backgroundColor: t.border, marginBottom: 16, opacity: 0.9 },
    presetSheet:     { backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 34, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 8 },
    presetTitle:     { fontSize: 18, fontWeight: '800', color: t.text, letterSpacing: -0.2 },
    presetSub:       { marginTop: 5, marginBottom: 16, fontSize: 14, lineHeight: 20, color: t.textSecondary },
    templateRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 8, marginBottom: 16 },
    templatePill:    { flex: 1, minWidth: 0, borderWidth: 1, borderColor: t.border, borderRadius: 16, backgroundColor: t.surface, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
    templatePillSelected: { borderColor: t.accent, backgroundColor: t.accent },
    templatePillPressed: { opacity: 0.82 },
    templatePillText: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
    templatePillTextSelected: { color: '#fff' },
    presetCaption:   { marginBottom: 10, fontSize: 12, fontWeight: '700', color: t.textSecondary, letterSpacing: 0.1 },
    sectionChecklist:{ gap: 10, marginBottom: 6, height: 266, justifyContent: 'flex-start' },
    checkRow:        { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: t.sep, backgroundColor: t.surface2, paddingVertical: 13, paddingHorizontal: 14 },
    checkRowPressed: { opacity: 0.82 },
    checkDot:        { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checkDotSelected:{ borderColor: t.accent, backgroundColor: t.accent },
    checkDotMark:    { color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 12 },
    checkLabel:      { fontSize: 15, fontWeight: '600', color: t.text },
    checkLabelOff:   { color: t.textSecondary },
    btnPrimary:      { backgroundColor: t.accent, borderRadius: 17, padding: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    btnPrimaryText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
    btnPrimaryDisabled: { backgroundColor: t.surface2 },
    btnPrimaryTextDisabled: { color: t.textSecondary },
    btnTertiary:     { borderRadius: 16, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'flex-start' },
    btnTertiaryText: { fontSize: 14, fontWeight: '700', color: t.text },
    btnTertiarySub:  { marginTop: 3, fontSize: 12, lineHeight: 17, color: t.textSecondary },
    btnSecondary:    { backgroundColor: t.surface2, borderRadius: 17, padding: 14, alignItems: 'center', opacity: 0.78 },
    btnSecondaryText:{ color: t.textSecondary, fontSize: 14, fontWeight: '500' },
  });
}
