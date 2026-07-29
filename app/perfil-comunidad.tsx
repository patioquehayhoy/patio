import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';

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
    const validName = (value: string) => /^[\p{L}][\p{L}\p{M}' -]{1,39}$/u.test(value.trim());
    if (!validName(firstName) || !validName(lastName)) {
      Alert.alert('Revisa tu nombre', 'Usa entre 2 y 40 letras. Se permiten espacios, apóstrofe y guion.');
      return;
    }
    if (handle && !/^[a-z0-9._]{3,24}$/.test(handle.toLowerCase())) {
      Alert.alert('Revisa tu usuario', 'Usa de 3 a 24 letras, números, punto o guion bajo.');
      return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); router.replace('/comunidad-acceso'); return; }
    let avatarUrl = avatarUri;
    if (avatarUri?.startsWith('file:')) {
      const response = await fetch(avatarUri);
      const bytes = await response.arrayBuffer();
      const path = `${auth.user.id}/avatar.jpg`;
      const upload = await supabase.storage.from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (!upload.error) avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
    const lastChanged = auth.user.user_metadata?.name_changed_at;
    const changedRecently = lastChanged && Date.now() - new Date(lastChanged).getTime() < 30 * 24 * 60 * 60 * 1000;
    const changingExisting = auth.user.user_metadata?.first_name && (
      auth.user.user_metadata.first_name !== firstName.trim() || auth.user.user_metadata.last_name !== lastName.trim()
    );
    if (changingExisting && changedRecently) {
      setBusy(false);
      Alert.alert('Tu nombre se cambió recientemente', 'Podrás volver a cambiarlo 30 días después del último ajuste.');
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
    if (!error) await supabase.auth.updateUser({ data: { first_name: profile.first_name, last_name: profile.last_name, profile_complete: true, avatar_url: avatarUrl, name_changed_at: changingExisting ? new Date().toISOString() : lastChanged } });
    setBusy(false);
    if (error) { Alert.alert('No pudimos guardar tu perfil', 'Inténtalo otra vez.'); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(returnTo?.startsWith('/') ? returnTo as any : '/explorar');
  };

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={s.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={21} color={theme.text} /></TouchableOpacity>
      <View style={s.content}>
        <TouchableOpacity style={[s.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75 });
          if (!result.canceled) setAvatarUri(result.assets[0].uri);
        }}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={s.avatarImage} /> : <Ionicons name="camera-outline" size={27} color={theme.textMute} />}
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Tu nombre, nada más.</Text>
        <Text style={[s.body, { color: theme.textSecondary }]}>Ayuda a que reseñas y recomendaciones tengan una persona real detrás. Tu correo nunca se muestra.</Text>
        <TextInput value={firstName} onChangeText={setFirstName} autoCapitalize="words" placeholder="Nombre" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <TextInput value={lastName} onChangeText={setLastName} autoCapitalize="words" placeholder="Primer apellido" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" placeholder="@usuario opcional" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <TextInput value={bio} onChangeText={setBio} maxLength={160} placeholder="Descripción editorial opcional" placeholderTextColor={theme.textMute} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <TouchableOpacity style={[s.button, { backgroundColor: theme.text, opacity: busy ? 0.55 : 1 }]} disabled={busy} onPress={save}>
          <Text style={[s.buttonText, { color: theme.bg }]}>{busy ? 'Guardando…' : 'Continuar'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  back: { width: 44, height: 44, marginLeft: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 80 },
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  avatarImage: { width: 68, height: 68, borderRadius: 34 },
  title: { maxWidth: 340, fontFamily: Fonts.brand, fontSize: 36, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2 },
  body: { maxWidth: 350, marginTop: 12, marginBottom: 26, fontSize: 14, lineHeight: 21 },
  input: { height: 54, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, marginBottom: 10, fontSize: 16 },
  button: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
