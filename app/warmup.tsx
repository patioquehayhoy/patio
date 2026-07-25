import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

// Pantalla puente invisible. Ver index.tsx: el primer montaje nativo de
// CUALQUIER pantalla tras un cold start no entrega touches; un SEGUNDO
// montaje de una pantalla DISTINTA sí funciona (confirmado en simulador
// 2026-07-24, reproducido también en build Release sin Metro con
// instalación limpia — no era artefacto del dev client). Este componente
// existe solo para ser ese primer montaje desechable antes del destino real,
// que llega serializado en el parámetro `to`. Todo boot pasa por aquí, no
// solo el camino a /entrada — el bug es del PRIMER montaje tras cold start,
// no de una ruta en particular.
export default function WarmupScreen() {
  const { to } = useLocalSearchParams<{ to?: string }>();

  useEffect(() => {
    try {
      const destination = to ? JSON.parse(to) : { pathname: '/entrada' };
      router.replace(destination);
    } catch {
      router.replace('/entrada');
    }
  }, [to]);

  return <View style={{ flex: 1, backgroundColor: '#0B0B0C' }} />;
}
