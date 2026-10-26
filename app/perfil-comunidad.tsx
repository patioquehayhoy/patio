import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { safeReturnTo } from '@/lib/auth-links';

export default function CommunityProfileScreen() {
  const { theme } = useTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setFirstName(data.user?.user_metadata?.first_name ?? '');
      setLastName(data.user?.user_metadata?.last_name ?? '');
      setAvatarUri(data.user?.user_metadata?.avatar_url ?? null);
      if (data.user) supabase.from('user_profiles').select('visibility,handle,bio').eq('user_id', data.user.id).maybeSingle().then(({ data: profile }) => {
        setVisibility(profile?.visibility === 'public' ? 'public' : 'private');
        setHandle(profile?.handle ?? '');
        setBio(profile?.bio ?? '');
      });
    }).catch(() => {});
  }, []);

  const save = async () => {
    if (busy) return;
    const validName = (value: string) => /^[\p{L}][\p{L}\p{M}' -]{1,39}$/u.test(value.trim());
    if (!validName(firstName) || !validName(lastName)) {
      Alert.alert(noWidow('Revisa tu nombre'), noWidow('Usa entre 2 y 40 letras. Se permiten espacios, apóstrofe y guion.'));
      return;
    }
    if (handle && !/^[a-z0-9._]{3,24}$/.test(handle.toLowerCase())) {
      Alert.alert(noWidow('Revisa tu usuario'), noWidow('Usa de 3 a 24 letras, números, punto o guion bajo.'));
      return;
    }
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace('/comunidad-acceso'); return; }
      let avatarUrl = avatarUri;
      if (avatarUri && !/^https:\/\//.test(avatarUri)) {
        const image = await manipulateAsync(avatarUri, [{ resize: { width: 600 } }], { compress: 0.8, format: SaveFormat.JPEG });
        const bytes = await new File(image.uri).arrayBuffer();
        const path = `${auth.user.id}/avatar.jpg`;
        const upload = await supabase.storage.from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
        if (upload.error) throw upload.error;
        avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      }
      const lastChanged = auth.user.user_metadata?.name_changed_at;
      const changedRecently = lastChanged && Date.now() - new Date(lastChanged).getTime() < 30 * 24 * 60 * 60 * 1000;
      const changingExisting = auth.user.user_metadata?.first_name && (
        auth.user.user_metadata.first_name !== firstName.trim() || auth.user.user_metadata.last_name !== lastName.trim()
      );
      if (changingExisting && changedRecently) {
        Alert.alert(noWidow('Tu nombre se cambió recientemente'), noWidow('Podrás volver a cambiarlo 30 días después del último ajuste.'));
        return;
      }
      const profile = {
        user_id: auth.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim().charAt(0)}.`,
        setup_completed: true,
        avatar_url: avatarUrl,
        visibility,
        handle: handle.trim().toLowerCase() || null,
        bio: bio.trim() || null,
      };
      const { error } = await supabase.from('user_profiles').upsert(profile);
      if (!error && changingExisting) {
        await supabase.from('profile_name_history').insert({
          user_id: auth.user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
        });
      }
      if (!error) {
        const { error: metadataError } = await supabase.auth.updateUser({ data: { first_name: profile.first_name, last_name: profile.last_name, profile_complete: true, avatar_url: avatarUrl, name_changed_at: changingExisting ? new Date().toISOString() : lastChanged } });
        if (metadataError) throw metadataError;
      }
      if (error) { Alert.alert(noWidow('No pudimos guardar tu perfil'), noWidow('Inténtalo otra vez.')); return; }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace(safeReturnTo(returnTo) as never);
    } catch {
      Alert.alert(noWidow('No pudimos guardar tu perfil'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Regresar"><Ionicons name="chevron-back" size={21} color={theme.text} /></TouchableOpacity>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[s.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel={avatarUri ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
          onPress={async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75 });
              if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
            } catch {
              Alert.alert(noWidow('No pudimos abrir tus fotos'), noWidow('Revisa los permisos de Patio en Ajustes e inténtalo de nuevo.'));
            }
          }}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={s.avatarImage} /> : <Ionicons name="camera-outline" size={27} color={theme.textMute} />}
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>{noWidow('Tu perfil de Foodie.')}</Text>
        <Text style={[s.body, { color: theme.textSecondary }]}>{noWidow('Ayuda a que reseñas y recomendaciones tengan una persona real detrás. Tu correo nunca se muestra.')}</Text>
        <Text style={[s.label, { color: theme.textSecondary }]}>Nombre</Text>
        <TextInput value={firstName} onChangeText={setFirstName} maxLength={40} accessibilityLabel="Nombre" autoComplete="given-name" autoCapitalize="words" placeholder="Tu nombre" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <Text style={[s.label, { color: theme.textSecondary }]}>Primer apellido</Text>
        <TextInput value={lastName} onChangeText={setLastName} maxLength={40} accessibilityLabel="Primer apellido" autoComplete="family-name" autoCapitalize="words" placeholder="Tu apellido" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <Text style={[s.label, { color: theme.textSecondary }]}>Usuario · opcional</Text>
        <TextInput value={handle} onChangeText={setHandle} maxLength={24} accessibilityLabel="Usuario, opcional" autoCorrect={false} autoCapitalize="none" placeholder="sin espacios ni arroba" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <Text style={[s.label, { color: theme.textSecondary }]}>Sobre ti · opcional</Text>
        <TextInput value={bio} onChangeText={setBio} multiline maxLength={160} accessibilityLabel="Sobre ti, opcional" placeholder="Algo sobre ti" placeholderTextColor={theme.textMute} style={[s.input, s.bio, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <TouchableOpacity style={[s.button, { backgroundColor: theme.accent, opacity: busy ? 0.55 : 1 }]} disabled={busy} onPress={save} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} accessibilityLabel={busy ? 'Guardando perfil' : 'Continuar'}>
          <Text style={[s.buttonText, { color: '#FFFFFF' }]}>{busy ? 'Guardando…' : 'Continuar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  back: { width: 44, height: 44, marginLeft: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  avatarImage: { width: 68, height: 68, borderRadius: 34 },
  title: { ...Type.screen, maxWidth: 340 },
  body: { maxWidth: 350, marginTop: 12, marginBottom: 26, fontSize: 14, lineHeight: 21 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 54, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, fontSize: 16 },
  bio: { minHeight: 96, textAlignVertical: 'top' },
  button: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
