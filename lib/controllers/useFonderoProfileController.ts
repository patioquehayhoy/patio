import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { FONDITA_ID_KEY } from '@/lib/db';
import { signOutAccount } from '@/lib/account-session';
import { noWidow } from '@/lib/typography';
import { nombreDisponible } from '@/lib/fondita-name';
import {
  deserialize,
  horarioDefault,
  hhmmToDate,
  migrarStringLegacy,
  resumenHorario,
  serialize,
  type HorarioSemanal,
} from '@/lib/horario';
import { markHintSeen, shouldShowHint } from '@/lib/hints';
import {
  getFonditaDescription,
  getFonditaDireccion,
  getFonditaHorario,
  getFonditaHorarioSemanal,
  getFonditaName,
  getPagosEfectivo,
  getPagosTarjeta,
  getPagosTrans,
  getTipoNegocio,
  setFonditaDescription,
  setFonditaDireccion,
  setFonditaHorario,
  setFonditaHorarioSemanal,
  setFonditaName,
  setPagosEfectivo,
  setPagosTarjeta,
  setPagosTrans,
  setTipoNegocio,
} from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';
import { getFonditaId, setFonditaId } from '@/lib/user-store';

type SavedProfileValues = {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  horarioJSON: string;
  pagosEfectivo: boolean;
  pagosTrans: boolean;
  pagosTarjeta: boolean;
  tipoNegocio: string;
};

const FONDITA_SELECT = 'id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, horario_semanal, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio, latitude, longitude';

function initialSemanal() {
  return getFonditaHorarioSemanal() ?? migrarStringLegacy(getFonditaHorario()) ?? horarioDefault();
}

function savedFromLocal(semanal: HorarioSemanal): SavedProfileValues {
  return {
    nombre: getFonditaName(),
    descripcion: getFonditaDescription(),
    ubicacion: getFonditaDireccion(),
    horarioJSON: JSON.stringify(serialize(semanal)),
    pagosEfectivo: getPagosEfectivo(),
    pagosTrans: getPagosTrans(),
    pagosTarjeta: getPagosTarjeta(),
    tipoNegocio: getTipoNegocio() ?? 'otro',
  };
}

export function useFonderoProfileController() {
  const initialSchedule = useMemo(() => initialSemanal(), []);
  const [nombre, setNombre] = useState(getFonditaName());
  const [descripcion, setDescripcion] = useState(getFonditaDescription());
  const [ubicacion, setUbicacion] = useState(getFonditaDireccion());
  const [semanal, setSemanal] = useState<HorarioSemanal>(initialSchedule);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [showApertura, setShowApertura] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [pagosEfectivo, setPagosEfectivoState] = useState(getPagosEfectivo());
  const [pagosTrans, setPagosTransState] = useState(getPagosTrans());
  const [pagosTarjeta, setPagosTarjetaState] = useState(getPagosTarjeta());
  const [tipoNegocio, setTipoNegocioState] = useState(getTipoNegocio() ?? 'otro');
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [savedValues, setSavedValues] = useState<SavedProfileValues>(() => savedFromLocal(initialSchedule));
  const [showPerfilHint, setShowPerfilHint] = useState(false);
  const fonditaIdRef = useRef<string | null>(getFonditaId());
  const nombreUpdatedAtRef = useRef<string | null>(null);

  const horarioResumen = useMemo(() => resumenHorario(semanal), [semanal]);
  const semanalJSON = useMemo(() => JSON.stringify(serialize(semanal)), [semanal]);
  const diaActivo = useMemo(() => (
    seleccion.length > 0
      ? semanal.find((dia) => dia.dia === seleccion[0])!
      : (semanal.find((dia) => dia.dia === 1) ?? semanal[0])
  ), [seleccion, semanal]);
  const apertura = diaActivo && !diaActivo.cerrado && diaActivo.abre ? hhmmToDate(diaActivo.abre) : null;
  const cierre = diaActivo && !diaActivo.cerrado && diaActivo.cierra ? hhmmToDate(diaActivo.cierra) : null;
  const isDirty =
    nombre !== savedValues.nombre ||
    descripcion !== savedValues.descripcion ||
    ubicacion !== savedValues.ubicacion ||
    semanalJSON !== savedValues.horarioJSON ||
    pagosEfectivo !== savedValues.pagosEfectivo ||
    pagosTrans !== savedValues.pagosTrans ||
    pagosTarjeta !== savedValues.pagosTarjeta ||
    tipoNegocio !== savedValues.tipoNegocio;

  const aplicarHora = useCallback((campo: 'abre' | 'cierra', value: string) => {
    const target = new Set(seleccion);
    setSemanal((prev) => prev.map((dia) =>
      target.has(dia.dia) ? { ...dia, cerrado: false, [campo]: value } : dia
    ));
  }, [seleccion]);

  const toggleCerrado = useCallback(() => {
    const target = new Set(seleccion);
    setSemanal((prev) => prev.map((dia) =>
      target.has(dia.dia)
        ? dia.cerrado
          ? { ...dia, cerrado: false, abre: '08:00', cierra: '16:00' }
          : { ...dia, cerrado: true, abre: null, cierra: null }
        : dia
    ));
  }, [seleccion]);

  const aplicarATodos = useCallback(() => {
    if (!diaActivo) return;
    setSemanal((prev) => prev.map((dia) => ({
      ...dia,
      cerrado: diaActivo.cerrado,
      abre: diaActivo.abre,
      cierra: diaActivo.cierra,
    })));
  }, [diaActivo]);

  const toggleDia = useCallback((dia: number) => {
    setShowApertura(false);
    setShowCierre(false);
    setSeleccion((prev) => prev[0] === dia ? [] : [dia]);
  }, []);

  const markPerfilHintDone = useCallback(() => {
    markHintSeen('fondero_perfil');
    setShowPerfilHint(false);
  }, []);

  useFocusEffect(useCallback(() => {
    shouldShowHint('fondero_perfil').then((show) => {
      if (!show) return;
      const name = getFonditaName();
      if (!name || name === 'Mi Fondita' || name === 'La Fondita') setShowPerfilHint(true);
    });
  }, []));

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;

        if (!user?.email) {
          let fallbackId: string | null = getFonditaId();
          if (!fallbackId) fallbackId = await AsyncStorage.getItem(FONDITA_ID_KEY);
          if (fallbackId && active) fonditaIdRef.current = fallbackId;
          return;
        }

        setEmail(user.email);

        const selectResult = await supabase
          .from('fonditas')
          .select(FONDITA_SELECT)
          .eq('telefono', user.email)
          .maybeSingle();

        if (selectResult.error) throw selectResult.error;
        if (!active) return;

        let fondita = selectResult.data;

        if (!fondita) {
          const insertResult = await supabase
            .from('fonditas')
            .insert({ telefono: user.email, nombre: '' })
            .select(FONDITA_SELECT)
            .single();
          fondita = insertResult.data;
          if (insertResult.error) throw insertResult.error;
        }

        if (!fondita || !active) return;

        fonditaIdRef.current = fondita.id;
        setFonditaId(fondita.id);

        const nextNombre = fondita.nombre ?? getFonditaName();
        const nextDescripcion = fondita.descripcion ?? getFonditaDescription();
        const nextUbicacion = fondita.direccion ?? getFonditaDireccion();
        const horario = fondita.horario ?? '';
        const nextPagosEfectivo = fondita.pagos_efectivo ?? false;
        const nextPagosTrans = fondita.pagos_transferencia ?? false;
        const nextPagosTarjeta = fondita.pagos_tarjeta ?? false;
        const nextTipoNegocio = (fondita as any).tipo_negocio ?? 'otro';
        const nextSemanal = deserialize((fondita as any).horario_semanal)
          ?? migrarStringLegacy(horario)
          ?? horarioDefault();

        setNombre(nextNombre);
        setFonditaName(nextNombre);
        setDescripcion(nextDescripcion);
        setFonditaDescription(nextDescripcion);
        setUbicacion(nextUbicacion);
        setFonditaDireccion(nextUbicacion);
        setFonditaHorario(horario);
        setTipoNegocio(nextTipoNegocio);
        setTipoNegocioState(nextTipoNegocio);
        setSemanal(nextSemanal);
        setFonditaHorarioSemanal(nextSemanal);
        setSeleccion([]);

        setPagosEfectivoState(nextPagosEfectivo);
        setPagosEfectivo(nextPagosEfectivo);
        setPagosTransState(nextPagosTrans);
        setPagosTrans(nextPagosTrans);
        setPagosTarjetaState(nextPagosTarjeta);
        setPagosTarjeta(nextPagosTarjeta);
        setSavedValues({
          nombre: nextNombre,
          descripcion: nextDescripcion,
          ubicacion: nextUbicacion,
          horarioJSON: JSON.stringify(serialize(nextSemanal)),
          pagosEfectivo: nextPagosEfectivo,
          pagosTrans: nextPagosTrans,
          pagosTarjeta: nextPagosTarjeta,
          tipoNegocio: nextTipoNegocio,
        });

        if (fondita.nombre_updated_at) nombreUpdatedAtRef.current = fondita.nombre_updated_at;
        if (fondita.latitude != null && fondita.longitude != null) setLocationSaved(true);
      } catch {
        if (active) Alert.alert(noWidow('No pudimos cargar tu negocio'), noWidow('Revisa tu conexión y vuelve a abrir el perfil.'));
      } finally {
        if (active) setReady(true);
      }
    };

    init();
    return () => { active = false; };
  }, []);

  const handleBack = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }
    Alert.alert('¿Descartar cambios?', 'Hiciste cambios que no has guardado. Si sales, se pierden.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [isDirty]);

  const handleSaveAll = useCallback(async () => {
    if (isSaving) return;
    if (nombre.trim().length < 2 || nombre.trim().length > 80) {
      Alert.alert(noWidow('Revisa el nombre'), noWidow('Usa entre 2 y 80 caracteres para el nombre de tu negocio.'));
      return;
    }
    setIsSaving(true);
    try {
      const fonditaId = fonditaIdRef.current;
      const newSaved = { ...savedValues };
      const payload: Record<string, unknown> = {};
      let nameNotice: string | null = null;

      if (nombre !== savedValues.nombre) {
        const lastUpdated = nombreUpdatedAtRef.current;
        const blocked = lastUpdated && (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24) < 15;
        if (blocked) {
          const fechaDisponible = new Date(new Date(lastUpdated).getTime() + 15 * 24 * 60 * 60 * 1000);
          nameNotice = `Podrás cambiar el nombre el ${fechaDisponible.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
        } else if (!(await nombreDisponible(nombre, fonditaId ?? undefined))) {
          nameNotice = 'Ya hay un negocio con ese nombre en Patio. Elige otro.';
        } else {
          payload.nombre = nombre.trim();
          payload.nombre_updated_at = new Date().toISOString();
          newSaved.nombre = nombre.trim();
        }
      }

      if (descripcion !== savedValues.descripcion) {
        payload.descripcion = descripcion.trim();
        newSaved.descripcion = descripcion.trim();
      }
      if (ubicacion !== savedValues.ubicacion) {
        payload.direccion = ubicacion.trim();
        newSaved.ubicacion = ubicacion.trim();
      }
      if (semanalJSON !== savedValues.horarioJSON) {
        payload.horario_semanal = serialize(semanal);
        payload.horario = horarioResumen;
        newSaved.horarioJSON = semanalJSON;
      }
      if (pagosEfectivo !== savedValues.pagosEfectivo) {
        payload.pagos_efectivo = pagosEfectivo;
        newSaved.pagosEfectivo = pagosEfectivo;
      }
      if (pagosTrans !== savedValues.pagosTrans) {
        payload.pagos_transferencia = pagosTrans;
        newSaved.pagosTrans = pagosTrans;
      }
      if (pagosTarjeta !== savedValues.pagosTarjeta) {
        payload.pagos_tarjeta = pagosTarjeta;
        newSaved.pagosTarjeta = pagosTarjeta;
      }
      if (tipoNegocio !== savedValues.tipoNegocio) {
        payload.tipo_negocio = tipoNegocio;
        newSaved.tipoNegocio = tipoNegocio;
      }

      if (Object.keys(payload).length > 0) {
        if (!fonditaId && !__DEV__) throw new Error('No hay un negocio activo.');
        if (fonditaId) {
          const { error } = await supabase.from('fonditas').update(payload).eq('id', fonditaId).select('id').single();
          if (error) throw error;
        }
        if ('nombre' in payload) {
          setFonditaName(nombre.trim());
          nombreUpdatedAtRef.current = new Date().toISOString();
        }
        if ('descripcion' in payload) setFonditaDescription(descripcion.trim());
        if ('direccion' in payload) setFonditaDireccion(ubicacion.trim());
        if ('horario_semanal' in payload) {
          setFonditaHorarioSemanal(semanal);
          setFonditaHorario(horarioResumen);
        }
        if ('pagos_efectivo' in payload) setPagosEfectivo(pagosEfectivo);
        if ('pagos_transferencia' in payload) setPagosTrans(pagosTrans);
        if ('pagos_tarjeta' in payload) setPagosTarjeta(pagosTarjeta);
        if ('tipo_negocio' in payload) setTipoNegocio(tipoNegocio);
      }

      setSavedValues(newSaved);
      if (nameNotice) Alert.alert(noWidow('Revisa el nombre'), noWidow(nameNotice));
      if (!Object.keys(payload).length) return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
    } catch {
      Alert.alert(noWidow('No pudimos guardar los cambios'), noWidow('Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.'));
    } finally {
      setIsSaving(false);
    }
  }, [
    descripcion,
    horarioResumen,
    isSaving,
    nombre,
    pagosEfectivo,
    pagosTarjeta,
    pagosTrans,
    savedValues,
    semanal,
    semanalJSON,
    tipoNegocio,
    ubicacion,
  ]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutAccount();
      router.replace('/');
    } catch {
      Alert.alert(noWidow('No pudimos cerrar sesión'), noWidow('Inténtalo de nuevo. Tus datos siguen guardados.'));
    }
  }, []);

  const handleMarkLocation = useCallback(async () => {
    const fonditaId = fonditaIdRef.current;
    if (!fonditaId) {
      Alert.alert('Guarda tu perfil primero');
      return;
    }
    setIsSavingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sin permiso de ubicación', 'Activa la ubicación en Ajustes para aparecer en el mapa.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const { error } = await supabase.from('fonditas').update({ latitude, longitude }).eq('id', fonditaId);
      if (error) throw error;
      setLocationSaved(true);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la ubicación. Intenta de nuevo.');
    } finally {
      setIsSavingLocation(false);
    }
  }, []);

  return {
    apertura,
    aplicarATodos,
    aplicarHora,
    cierre,
    descripcion,
    diaActivo,
    email,
    handleBack,
    handleMarkLocation,
    handleSaveAll,
    handleSignOut,
    isDirty,
    isSaving,
    savedFlash,
    isSavingLocation,
    locationSaved,
    markPerfilHintDone,
    nombre,
    pagosEfectivo,
    pagosTarjeta,
    pagosTrans,
    tipoNegocio,
    ready,
    seleccion,
    semanal,
    setSemanal,
    setDescripcion,
    setNombre,
    setPagosEfectivoState,
    setPagosTarjetaState,
    setPagosTransState,
    setTipoNegocioState,
    setShowApertura,
    setShowCierre,
    setUbicacion,
    showApertura,
    showCierre,
    showPerfilHint,
    toggleCerrado,
    toggleDia,
    ubicacion,
  };
}
