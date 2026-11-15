import { Alert, Linking, StyleSheet, Text } from 'react-native';

import { noWidow } from '@/lib/typography';

/** URL pública del aviso de privacidad (solo https). Sin ella no se muestra nada. */
export function privacyNoticeUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_PRIVACY_URL;
  try {
    return url && new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * «Al continuar aceptas el Aviso de privacidad.» bajo el correo, en los dos
 * accesos (negocio y comunidad), como Meta al registrarse (2026-11-15). La
 * ley pide dar a conocer el aviso cuando se piden datos. Aparece sola en
 * cuanto exista la URL pública del aviso (`EXPO_PUBLIC_PRIVACY_URL`); antes
 * no se muestra un enlace que no lleva a ningún lado.
 */
export function PrivacyConsentLine({ align = 'center' }: { align?: 'center' | 'left' }) {
  const url = privacyNoticeUrl();
  if (!url) return null;
  const open = () => {
    Linking.openURL(url).catch(() => Alert.alert(noWidow('No pudimos abrir el aviso'), noWidow('Inténtalo de nuevo.')));
  };
  return (
    <Text style={[s.line, { textAlign: align }]} allowFontScaling={true} maxFontSizeMultiplier={1.6}>
      {'Al continuar aceptas el '}
      <Text style={s.link} onPress={open} accessibilityRole="link" suppressHighlighting={false}>{noWidow('Aviso de privacidad')}</Text>
      {'.'}
    </Text>
  );
}

const s = StyleSheet.create({
  // Letra chica sobre fondo oscuro (botánica / vidrio): se lee si se busca.
  line: { marginTop: 12, maxWidth: 320, alignSelf: 'center', fontSize: 12, lineHeight: 17, fontWeight: '400', color: 'rgba(248,248,245,0.62)' },
  link: { color: 'rgba(248,248,245,0.86)', textDecorationLine: 'underline' },
});
