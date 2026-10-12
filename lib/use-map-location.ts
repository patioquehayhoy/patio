import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Linking } from 'react-native';
import * as Location from 'expo-location';

import { noWidow } from '@/lib/typography';

export type MapLocation = { latitude: number; longitude: number };

/** A contextual, one-shot lookup; no background permission or subscription. */
export function useMapLocation(onLocated: (point: MapLocation) => void) {
  const callback = useRef(onLocated);
  callback.current = onLocated;
  const mounted = useRef(true);
  const request = useRef(0);
  const pending = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<MapLocation | null>(null);

  const cancelLocation = useCallback(() => {
    request.current += 1;
    pending.current = false;
    if (timeout.current !== null) clearTimeout(timeout.current);
    timeout.current = null;
    if (mounted.current) setLocating(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelLocation();
    };
  }, [cancelLocation]);

  const centerOnLocation = useCallback(async () => {
    if (pending.current || !mounted.current) return;
    pending.current = true;
    const current = ++request.current;
    const active = () => mounted.current && current === request.current;
    setLocating(true);
    Keyboard.dismiss();
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!active()) return;
      if (!permission.granted && permission.canAskAgain) permission = await Location.requestForegroundPermissionsAsync();
      if (!active()) return;
      if (!permission.granted) {
        Alert.alert(noWidow('Ubicación desactivada'), noWidow('Activa la ubicación de Patio en Ajustes para centrar el mapa.'), [
          { text: 'Cancelar', style: 'cancel' },
          { text: noWidow('Abrir ajustes'), onPress: () => {
            void Linking.openSettings().catch(() => Alert.alert(noWidow('No pudimos abrir Ajustes'), noWidow('Abre Ajustes y activa la ubicación de Patio.')));
          } },
        ]);
        return;
      }
      const position = await Promise.race([
        (async () => {
          const cached = await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 }).catch(() => null);
          if (!active()) return null;
          return cached ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        })(),
        new Promise<never>((_resolve, reject) => {
          timeout.current = setTimeout(() => reject(new Error('Location timed out')), 15_000);
        }),
      ]);
      if (!active() || !position) return;
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Invalid location');
      const point = { latitude, longitude };
      setLocation(point);
      callback.current(point);
    } catch {
      if (active()) Alert.alert(noWidow('No pudimos obtener tu ubicación'), noWidow('Inténtalo de nuevo para centrar el mapa.'));
    } finally {
      if (active()) {
        // A late cache response after timeout must not start another GPS lookup.
        request.current += 1;
        if (timeout.current !== null) clearTimeout(timeout.current);
        timeout.current = null;
        pending.current = false;
        setLocating(false);
      }
    }
  }, []);

  return { centerOnLocation, locating, location, cancelLocation };
}
