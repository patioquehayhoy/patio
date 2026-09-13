import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { getBlockedUsers, unblockUser, type BlockedProfile } from '@/lib/content-safety';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export function BlockedAccounts() {
  const { theme } = useTheme();
  const focused = useIsFocused();
  const [profiles, setProfiles] = useState<BlockedProfile[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!focused) return;
    let active = true;
    setLoading(true);
    setError(false);
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setSignedIn(!!data.session);
      if (!data.session) return;
      const rows = await getBlockedUsers();
      if (active) setProfiles(rows);
    })().catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [focused, retry]);
  const unblock = async (id: string) => {
    if (busy) return;
    setBusy(id);
    try {
      await unblockUser(id);
      setProfiles((current) => current.filter((profile) => profile.user_id !== id));
    } catch {
      Alert.alert(noWidow('No pudimos desbloquear esta cuenta'), noWidow('Inténtalo de nuevo.'));
    } finally { setBusy(null); }
  };
  if (!signedIn) return null;
  return <View style={{ marginTop: 24, gap: 8 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{noWidow('Cuentas bloqueadas')}</Text>
    {loading ? <ActivityIndicator color={theme.textSecondary} /> : error ?
      <TouchableOpacity onPress={() => setRetry((value) => value + 1)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: theme.accent }}>{noWidow('No pudimos cargar las cuentas. Reintentar.')}</Text>
      </TouchableOpacity> : profiles.length ? profiles.map((profile) =>
        <View key={profile.user_id} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 16 }}>
          <Text style={{ flex: 1, color: theme.text }} numberOfLines={1}>{profile.display_name || noWidow('Cuenta bloqueada')}</Text>
          <TouchableOpacity disabled={busy !== null} onPress={() => void unblock(profile.user_id)} accessibilityRole="button"
            accessibilityLabel={`Desbloquear ${profile.display_name || 'cuenta'}`} style={{ minHeight: 44, justifyContent: 'center' }}>
            {busy === profile.user_id ? <ActivityIndicator color={theme.accent} /> : <Text style={{ color: theme.accent }}>Desbloquear</Text>}
          </TouchableOpacity>
        </View>
      ) : <Text style={{ color: theme.textSecondary }}>{noWidow('No tienes cuentas bloqueadas.')}</Text>}
  </View>;
}
