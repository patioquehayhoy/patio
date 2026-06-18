import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, useTheme, type Theme } from '@/lib/theme';

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
    title: {
      fontSize: 13,
      fontWeight: '900',
      color: t.accent,
      marginBottom: 6,
    },
    intro: {
      fontSize: 22,
      fontWeight: '900',
      fontFamily: Fonts.brand,
      color: t.text,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 4,
    },
    introSub: {
      fontSize: 14,
      fontWeight: '300',
      fontFamily: Fonts.brand,
      color: t.gray,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 308,
    },
    block: {
      marginBottom: 24,
    },
    blockLabel: {
      fontSize: 16,
      fontWeight: '900',
      color: t.text,
      lineHeight: 19,
      marginBottom: 6,
    },
    body: {
      fontSize: 14,
      fontWeight: '300',
      color: t.text,
      lineHeight: 18,
      marginBottom: 6,
      textAlign: 'left',
    },
    closing: {
      fontSize: 14,
      fontWeight: '300',
      color: t.text,
      lineHeight: 19,
      marginTop: 10,
      marginBottom: 0,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.sep,
      marginTop: 2,
    },
    top: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
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
          <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={s.hero}>
          <Image
            source={theme.isDark ? require('../assets/images/logo-blanco.png') : require('../assets/images/logo-negro.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.intro} allowFontScaling={true}>¿Qué hay hoy?</Text>
          <Text style={s.introSub} allowFontScaling={true}>Saaaaaaabes.</Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>Qué es Patio</Text>
          <Text style={s.body} allowFontScaling={true}>
            Las cocinas de tu barrio publican su menú del día. Tú buscas por platillo, ves qué hay cerca y decides si vale la caminata.
          </Text>
          <View style={s.divider} />
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>Si tienes una cocina</Text>
          <Text style={s.body} allowFontScaling={true}>
            Tomas foto de tu menú y Patio lo lee por ti. Lo de hoy aparece en el mapa para quien anda cerca y se oculta solo cuando cierras.
          </Text>
          <View style={s.divider} />
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>Gracias por llegar temprano</Text>
          <Text style={s.body} allowFontScaling={true}>
            Estás en las primeras versiones de Patio. Lo que uses y lo que nos digas le da forma a lo que sigue.
          </Text>
          <Text style={s.closing} allowFontScaling={true}>Saaaaaaabes.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
