import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { getFonditaName } from '@/lib/menu-store';
import {
  cancelInvite, getMyRole, getTeam, inviteMessage, inviteToTeam, isValidEmail, removeFromTeam,
  ROLE_HELP, ROLE_LABEL, teamErrorMessage, type MyRole, type TeamEntry, type TeamRole,
} from '@/lib/team';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { supabase } from '@/lib/supabase';
import { usePullRefresh } from '@/lib/use-pull-refresh';
import { getFonditaId } from '@/lib/user-store';

// Equipo del negocio (fase 1, docs/SUCURSALES_Y_EQUIPO_2026-11-23.md §3):
// cada persona entra con su propio correo y el dueño la invita con un rol.
// Nunca se comparte la cuenta. Quien invita le manda el mensaje por donde
// quiera (WhatsApp, SMS) con la hoja de compartir del sistema.
export default function EquipoScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const negocioId = getFonditaId();
  const [team, setTeam] = useState<TeamEntry[]>([]);
  const [me, setMe] = useState<MyRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('administrador');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!negocioId) { setLoading(false); return; }
    try {
      const [people, mine, session] = await Promise.all([getTeam(negocioId), getMyRole(negocioId), supabase.auth.getSession()]);
      setTeam(people);
      setMe(mine);
      setMyUserId(session.data.session?.user.id ?? null);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [negocioId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const pull = usePullRefresh(load);

  const canManage = me?.rol === 'propietario';
  const businessName = getFonditaName();

  const shareInvite = async (to: string) => {
    await Share.share({ message: inviteMessage(businessName, to) }).catch(() => {});
  };

  const invite = async () => {
    if (!negocioId || inviting) return;
    if (!isValidEmail(email)) { setInviteError('Revisa el correo: le falta algo.'); return; }
    setInviting(true);
    setInviteError('');
    try {
      const to = email.trim().toLowerCase();
      await inviteToTeam(negocioId, to, role);
      setEmail('');
      await load();
      await shareInvite(to);
    } catch (error) {
      setInviteError(teamErrorMessage(error, 'No pudimos invitar. Revisa tu conexión e inténtalo de nuevo.'));
    } finally {
      setInviting(false);
    }
  };

  const remove = (entry: Extract<TeamEntry, { kind: 'person' }>, self: boolean) => {
    Alert.alert(
      noWidow(self ? 'Salir del equipo' : `Quitar a ${entry.name}`),
      noWidow(self ? 'Dejarás de publicar y de ver Hoy de este negocio.' : 'Ya no podrá publicar ni ver Hoy de este negocio.'),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: self ? 'Salir' : 'Quitar', style: 'destructive', onPress: async () => {
            setBusy(entry.id);
            try {
              await removeFromTeam(entry.id);
              if (self) { router.replace('/'); return; }
              await load();
            } catch (error) {
              Alert.alert(noWidow('No se guardó el cambio'), noWidow(teamErrorMessage(error, 'Revisa tu conexión e inténtalo de nuevo.')));
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const inviteActions = (entry: Extract<TeamEntry, { kind: 'invite' }>) => {
    Alert.alert(entry.email, noWidow(`Invitación como ${ROLE_LABEL[entry.role].toLowerCase()}.`), [
      { text: 'Volver a mandar el mensaje', onPress: () => { void shareInvite(entry.email); } },
      {
        text: 'Cancelar invitación', style: 'destructive', onPress: async () => {
          setBusy(entry.id);
          try { await cancelInvite(entry.id); await load(); } catch (error) {
            Alert.alert(noWidow('No se canceló la invitación'), noWidow(teamErrorMessage(error, 'Revisa tu conexión e inténtalo de nuevo.')));
          } finally { setBusy(null); }
        },
      },
      { text: 'Cerrar', style: 'cancel' },
    ]);
  };

  const people = team.filter((entry): entry is Extract<TeamEntry, { kind: 'person' }> => entry.kind === 'person');
  const invites = team.filter((entry): entry is Extract<TeamEntry, { kind: 'invite' }> => entry.kind === 'invite');
  const mySelf = people.find((entry) => !entry.principal && entry.userId === myUserId) ?? null;

  return (
    <KeyboardAvoidingView style={[s.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/perfil')} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={s.navTitle}>Equipo</Text>
        <View style={s.navButton} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={theme.textSecondary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        <Text style={s.lead}>{noWidow('Cada persona entra con su propio correo. Nadie comparte su cuenta.')}</Text>

        {loading ? <ActivityIndicator style={{ marginTop: 32 }} color={theme.textSecondary} accessibilityLabel="Cargando el equipo" /> : failed ? (
          <TouchableOpacity onPress={() => { setLoading(true); void load(); }} accessibilityRole="button" style={s.retry}>
            <Text style={{ color: theme.accent, fontSize: 15 }}>{noWidow('No pudimos cargar tu equipo. Reintentar.')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={s.groupLabel}>Personas</Text>
            <View style={s.list}>
              {people.map((entry, index) => {
                const removable = canManage && !entry.principal && (entry.role === 'administrador' || me?.principal);
                const sub = entry.principal ? 'Propietario principal' : ROLE_LABEL[entry.role];
                return (
                  <View key={entry.id} style={[s.row, index > 0 && s.rowDivider]}>
                    <AvatarCircle name={entry.name} backgroundColor={theme.surface2} textColor={theme.textSecondary} />
                    <View style={s.rowBody}>
                      <Text style={s.rowTitle}>{entry.name}</Text>
                      <Text style={s.rowSub}>{noWidow(entry.email && entry.email !== entry.name ? `${sub} · ${entry.email}` : sub)}</Text>
                    </View>
                    {removable && (
                      <TouchableOpacity onPress={() => remove(entry, false)} disabled={busy !== null} hitSlop={8}
                        accessibilityRole="button" accessibilityLabel={`Quitar a ${entry.name} del equipo`} style={s.rowAction}>
                        {busy === entry.id ? <ActivityIndicator color={theme.danger} /> : <Text style={[s.rowActionText, { color: theme.danger }]}>Quitar</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {invites.map((entry) => {
                const days = Math.max(1, Math.ceil((new Date(entry.expiresAt).getTime() - Date.now()) / 86_400_000));
                return (
                  <TouchableOpacity key={entry.id} style={[s.row, s.rowDivider]} onPress={() => inviteActions(entry)} disabled={busy !== null}
                    accessibilityRole="button" accessibilityLabel={`Invitación pendiente para ${entry.email}`}>
                    <View style={s.inviteIcon}><Ionicons name="mail-outline" size={18} color={theme.textSecondary} /></View>
                    <View style={s.rowBody}>
                      <Text style={s.rowTitle}>{entry.email}</Text>
                      <Text style={s.rowSub}>{noWidow(`${ROLE_LABEL[entry.role]} · invitación pendiente · vence en ${days} ${days === 1 ? 'día' : 'días'}`)}</Text>
                    </View>
                    {busy === entry.id ? <ActivityIndicator color={theme.textSecondary} /> : <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMute} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {canManage && (
              <>
                <Text style={[s.groupLabel, { marginTop: 32 }]}>Invitar</Text>
                <View style={s.form}>
                  <Text style={s.fieldLabel}>Correo</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={(value) => { setEmail(value); if (inviteError) setInviteError(''); }}
                    placeholder="nombre@correo.com"
                    placeholderTextColor={theme.textMute}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="send"
                    onSubmitEditing={() => { void invite(); }}
                    accessibilityLabel="Correo de la persona"
                  />
                  {!!inviteError && <Text style={s.error}>{noWidow(inviteError)}</Text>}
                  <Text style={[s.fieldLabel, { marginTop: 16 }]}>Rol</Text>
                  <View style={s.segmented} accessibilityRole="radiogroup">
                    {(['administrador', 'propietario'] as TeamRole[]).map((value, index) => {
                      const selected = role === value;
                      return (
                        <TouchableOpacity key={value} onPress={() => setRole(value)}
                          style={[s.segment, index > 0 && s.segmentDivider, selected && s.segmentOn]}
                          accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={ROLE_LABEL[value]}>
                          <Text style={[s.segmentText, selected && s.segmentTextOn]}>{ROLE_LABEL[value]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={s.help}>{noWidow(ROLE_HELP[role])}</Text>
                </View>
                <TouchableOpacity style={[s.cta, (!email.trim() || inviting) && s.ctaOff]} disabled={!email.trim() || inviting}
                  onPress={() => { void invite(); }} accessibilityRole="button" accessibilityLabel="Invitar"
                  accessibilityState={{ disabled: !email.trim() || inviting, busy: inviting }}>
                  {inviting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.ctaText}>Invitar</Text>}
                </TouchableOpacity>
                <Text style={s.help}>{noWidow('Después le mandas un mensaje con qué hacer. La invitación dura 7 días.')}</Text>

                <View style={{ marginTop: 24 }}>
                  <SettingsGroup c={sc}>
                    <SettingsRow c={sc} icon="time-outline" title="Registro de actividad" sub="Quién publicó o cambió algo, y a qué hora"
                      onPress={() => router.push('/registro-actividad')} />
                  </SettingsGroup>
                </View>
              </>
            )}

            {mySelf && (
              <TouchableOpacity style={s.leave} onPress={() => remove(mySelf, true)} accessibilityRole="button" accessibilityLabel="Salir del equipo">
                <Text style={[s.rowActionText, { color: theme.danger }]}>Salir del equipo</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    navTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: t.text },
    lead: { fontSize: 14, lineHeight: 20, color: t.textSecondary, marginBottom: 24 },
    retry: { minHeight: 44, justifyContent: 'center', marginTop: 16 },
    groupLabel: { ...Type.label, color: t.textSecondary, marginBottom: 8 },
    list: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden', backgroundColor: t.surface },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 64 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    rowBody: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: t.text },
    rowSub: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    rowAction: { minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
    rowActionText: { fontSize: 15, fontWeight: '500' },
    inviteIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center' },
    form: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, padding: 16 },
    fieldLabel: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: t.text, marginBottom: 6 },
    input: { minHeight: 44, borderRadius: 14, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 12, fontSize: 16, color: t.text, backgroundColor: t.bg },
    error: { marginTop: 6, fontSize: 13, lineHeight: 18, color: t.danger },
    segmented: { flexDirection: 'row', borderRadius: 14, borderCurve: 'continuous', borderWidth: 1, borderColor: t.border, overflow: 'hidden' },
    segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    segmentDivider: { borderLeftWidth: 1, borderLeftColor: t.border },
    segmentOn: { backgroundColor: t.surface2 },
    segmentText: { fontSize: 14, fontWeight: '500', color: t.textSecondary },
    segmentTextOn: { color: t.text, fontWeight: '700' },
    help: { marginTop: 8, fontSize: 13, lineHeight: 18, color: t.textSecondary },
    cta: { marginTop: 16, height: 50, borderRadius: 25, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    ctaOff: { opacity: 0.4 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    leave: { marginTop: 32, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  });
}
