import { router, Stack } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/glass-button';
import { useTheme, type Theme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 28,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 28,
    },
    logo: {
      width: 220,
      height: 82,
      marginLeft: -5,
      marginBottom: 18,
    },
    // Par de marca: mismas dos líneas, mismo rol; la segunda en tono secundario.
    intro: { ...Type.title, color: t.text, textAlign: 'center' },
    introSub: { ...Type.title, color: t.textSecondary, textAlign: 'center' },
    block: {
      marginBottom: 24,
    },
    blockLabel: { ...Type.headline, color: t.text, marginBottom: 6 },
    body: { ...Type.body, color: t.textSecondary, marginBottom: 10 },
    closing: { ...Type.headline, color: t.text, marginTop: 14 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.sep,
      marginTop: 2,
    },
    top: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20 },
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
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <GlassIconButton icon="chevron-back" accessibilityLabel="Regresar" onPress={handleBack} size={38} iconSize={19} />
        </View>
        <View style={s.hero}>
          <Image
            source={theme.isDark ? require('../assets/images/logo-blanco.png') : require('../assets/images/logo-negro.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.intro} allowFontScaling={true}>{noWidow('¿Qué hay hoy?')}</Text>
          <Text style={s.introSub} allowFontScaling={true}>Saaaaaaabes.</Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Qué es Patio')}</Text>
          <Text style={s.body} allowFontScaling={true}>
            {noWidow('La fonda, la taquería, el puestecito de elotes, la hamburguesa de la esquina: todos publican lo de hoy. Tú buscas por platillo, ves qué hay cerca y decides si vale la caminata.')}
          </Text>
          <View style={s.divider} />
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Si tú eres quien cocina')}</Text>
          <Text style={s.body} allowFontScaling={true}>
            {noWidow('Tomas foto de tu menú y Patio lo lee por ti. Lo de hoy aparece en el mapa para quien anda cerca y se oculta solo cuando cierras.')}
          </Text>
          <View style={s.divider} />
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('Gracias por llegar temprano')}</Text>
          <Text style={s.body} allowFontScaling={true}>
            {noWidow('Estás en las primeras versiones de Patio. Lo que uses y lo que nos digas le da forma a lo que sigue.')}
          </Text>
          <Text style={s.closing} allowFontScaling={true}>{noWidow('¿Qué hay hoy? Saaaaaaabes.')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
