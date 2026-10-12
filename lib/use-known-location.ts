import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { Coordinates } from './patio-sort';

/** Display distance only after an existing foreground permission; never prompt. */
export function useKnownLocation() {
  const [here, setHere] = useState<Coordinates | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!active || !permission.granted) return;
      const cached = await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 }).catch(() => null);
      if (!active) return;
      const position = cached ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!active) return;
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
      setHere({ latitude, longitude });
    })().catch(() => { /* The place remains usable without a location. */ });
    return () => { active = false; };
  }, []);
  return [here, setHere] as const;
}
