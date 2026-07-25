import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AgentSpinner } from '@/components/agent-spinner';
import { initializeSignedInUser } from '@/lib/auth';
import { getUserRole, hasCompletedOnboarding } from '@/lib/entry-flow';
import { supabase } from '@/lib/supabase';

// Boot puro: decide a dónde mandar a la persona (sesión guardada o /entrada
// si no hay nada que resolver) y SIEMPRE pasa por /warmup antes de mostrar
// esa pantalla.
//
// index.tsx dejó de pintar la UI de bienvenida — reproducido en simulador
// 2026-07-24 en dos builds distintos (dev client Y build Release con
// instalación limpia, sin Metro — descartado que fuera artefacto de
// desarrollo): en cold start, el PRIMER montaje nativo de cualquier pantalla
// en este Stack (New Architecture + react-native-screens) no entrega
// touches a sus TouchableOpacity, sea /entrada, /menu o cualquier otra. Un
// SEGUNDO montaje de una pantalla DISTINTA sí responde de inmediato —
// confirmado con tap real (no solo texto) navegando fuera y de regreso.
// /warmup existe solo para ser ese primer montaje desechable antes del
// destino real. Ver docs/HANDOFF.md sesión 2026-07-24 para el resto del
// diagnóstico (incluye por qué la primera versión de este fix parecía no
// funcionar: se probó por error contra un build que seguía conectado a
// Metro).
function goVia(destination: { pathname: string; params?: Record<string, string> }) {
  router.replace({ pathname: '/warmup', params: { to: JSON.stringify(destination) } });
}

export default function BootScreen() {
  useEffect(() => {
    (async () => {
      try {
        if (__DEV__) {
          goVia({ pathname: '/entrada' });
          return;
        }
        const [{ data }, savedRole, onboardingDone] = await Promise.all([
          supabase.auth.getSession(),
          getUserRole(),
          hasCompletedOnboarding(),
        ]);
        const setup = data.session ? await initializeSignedInUser(data.session) : null;
        if (savedRole === 'fondero' && data.session) {
          goVia({ pathname: setup?.needsSetup ? '/patio-smart' : '/menu' });
          return;
        }
        if (savedRole === 'foodie') {
          goVia(
            onboardingDone
              ? { pathname: '/explorar' }
              : { pathname: '/onboarding', params: { intent: 'foodie' } }
          );
          return;
        }
      } catch {}
      goVia({ pathname: '/entrada' });
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0C' }}>
      <AgentSpinner variant="arc" size={28} color="#F8F8F5" />
    </View>
  );
}
