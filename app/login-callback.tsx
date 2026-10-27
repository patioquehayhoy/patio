import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { AgentSpinner } from '@/components/agent-spinner';
import { signedInDestination } from '@/lib/auth-destination';
import { resolveLoginSession } from '@/lib/auth-callback';
import { getUserRole } from '@/lib/entry-flow';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { withSessionLock } from '@/lib/session-queue';

export default function LoginCallback() {
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const liveUrl = Linking.useURL();
  const [error, setError] = useState<string | null>(null);
  const [accessRoute, setAccessRoute] = useState<'/comunidad-acceso' | '/fondero-acceso'>('/fondero-acceso');
  // Fresh route credentials take precedence over the app's stale launch URL.
  const query = new URLSearchParams();
  for (const key of ['code', 'token_hash', 'token', 'type', 'error', 'error_code', 'error_description']) {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) query.set(key, first);
  }
  const credentialQuery = query.toString();
  const callbackUrl = credentialQuery
    ? `patio://login-callback?${credentialQuery}`
    : liveUrl?.startsWith('patio://login-callback') ? liveUrl : null;

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const handle = async () => {
      const role = await getUserRole();
      if (!cancelled) setAccessRoute(role === 'foodie' ? '/comunidad-acceso' : '/fondero-acceso');
      const rawUrl = callbackUrl ?? await Linking.getInitialURL();
      if (!rawUrl) throw new Error('No pudimos recuperar el enlace. Solicita uno nuevo.');
      const session = await resolveLoginSession(rawUrl);
      if (cancelled) return;
      const destination = await signedInDestination(session, role);
      if (!cancelled) router.replace(destination as never);
    };
    void withSessionLock(async () => { if (!cancelled) await handle(); }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'No pudimos iniciar sesión. Solicita otro enlace.');
    });
    return () => { cancelled = true; };
  }, [callbackUrl, router]);

  return <View style={[s.root, { backgroundColor: theme.bg }]}>
    {!error && <AgentSpinner variant="arc" size={30} color={theme.accent} />}
    <Text style={[s.message, { color: theme.textSecondary }]} accessibilityLiveRegion="polite">
      {noWidow(error ?? 'Abriendo tu cuenta…')}
    </Text>
    {error && <TouchableOpacity style={[s.button, { backgroundColor: theme.accent }]}
      onPress={() => router.replace(accessRoute)} accessibilityRole="button" accessibilityLabel="Solicitar otro enlace">
      <Text style={s.buttonText}>{noWidow('Solicitar otro enlace')}</Text>
    </TouchableOpacity>}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { marginTop: 24, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: { minHeight: 52, borderRadius: 26, marginTop: 24, paddingHorizontal: 24, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
