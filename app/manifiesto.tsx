import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      width: 220,
      height: 82,
      alignSelf: 'center',
      marginBottom: 24,
    },
    // Par de marca: mismas dos líneas, mismo rol; la segunda en el acento.
    closing: { alignItems: 'center', marginTop: 16 },
    // 20 pt: el mínimo de la fuente de marca; remate, no titular.
    intro: { ...Type.section, fontSize: 20, lineHeight: 25, color: t.text, textAlign: 'center' },
    introSub: { ...Type.section, fontSize: 20, lineHeight: 25, color: t.accent, textAlign: 'center' },
    block: {
      marginBottom: 12,
    },
    blockLabel: { ...Type.headline, color: t.text, marginBottom: 6 },
    body: { ...Type.body, color: t.textSecondary, marginBottom: 12 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.sep,
      marginTop: 2,
    },
    nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  });
}

export default function ManifiestoScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Regresar">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
      </View>
      {/* Logo, bloques y par de marca son una sola pieza centrada en la
          pantalla: nada se ancla al borde y no hay scroll. */}
      <View style={[s.content, { paddingBottom: insets.bottom + 52 }]}>
        <Image
          source={theme.isDark ? require('../assets/images/logo-blanco.png') : require('../assets/images/logo-negro.png')}
          style={s.logo}
          resizeMode="contain"
          accessibilityLabel="Patio"
        />

        <View>
          <View style={s.block}>
            <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Lo de hoy, cerca de ti')}</Text>
            <Text style={s.body} allowFontScaling={true}>
              {noWidow('La fonda, la taquería, el puesto de elotes de la esquina: cada lugar publica lo que preparó hoy. Lo ves en el mapa, con su precio y qué tan cerca te queda.')}
            </Text>
            <View style={s.divider} />
          </View>
          <View style={s.block}>
            <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Para quien busca dónde comer')}</Text>
            <Text style={s.body} allowFontScaling={true}>
              {noWidow('Busca por platillo o por antojo, guarda tus lugares en listas y compártelas con quien quieras. Tus reseñas ayudan a que otras personas elijan bien.')}
            </Text>
            <View style={s.divider} />
          </View>
          <View style={s.block}>
            <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Para quien cocina')}</Text>
            <Text style={s.body} allowFontScaling={true}>
              {noWidow('Le tomas foto a tu menú y Patio lo pasa en limpio. Lo de hoy aparece para quien anda cerca y se oculta solo cuando cierras.')}
            </Text>
            <View style={s.divider} />
          </View>
          <View style={s.block}>
            <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Hecho en la Ciudad de México')}</Text>
            <Text style={s.body} allowFontScaling={true}>
              {noWidow('Aquí se come rico en cada esquina, aunque casi nada de eso salga en internet. Patio le da su lugar a la cocina de todos los días: la de la doña, la del puesto, la que ya es parte de tu rutina.')}
            </Text>
          </View>
        </View>
        {/* Par de marca como remate: libera el arranque y cierra la lectura. */}
        <View style={s.closing}>
          <Text style={s.intro} allowFontScaling={true}>{noWidow('¿Qué hay hoy?')}</Text>
          <Text style={s.introSub} allowFontScaling={true}>Saaaaaaabes.</Text>
        </View>
      </View>
    </View>
  );
}
