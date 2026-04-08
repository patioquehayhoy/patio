import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '@/lib/theme';

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
      color: t.text,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 4,
    },
    introSub: {
      fontSize: 14,
      fontWeight: '300',
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
  });
}

export default function ManifiestoScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>
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
            Patio nace para ayudar a negocios de comida a comunicar mejor lo que hacen con tanto esfuerzo todos los días.
          </Text>
          <View style={s.divider} />
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>Gracias por llegar temprano</Text>
          <Text style={s.body} allowFontScaling={true}>
            Si estás probando Patio desde estos primeros días, gracias de verdad. Eres de las primeras personas en conocer la app y en ayudarnos a darle forma con tus comentarios y tu experiencia.
          </Text>
          <Text style={s.body} allowFontScaling={true}>
            Queremos construir esto cerca de quienes sí viven este trabajo todos los días.
          </Text>
          <View style={s.divider} />
        </View>

        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>Lo que viene</Text>
          <Text style={s.body} allowFontScaling={true}>
            Estamos trabajando para que compartir tu menú sea todavía más útil para tu negocio y te ayude a tener mayor exposición.
          </Text>
          <Text style={s.body} allowFontScaling={true}>
            La idea es que también puedas aparecer en un mapa de negocios abiertos, y que ahí mismo se vea reflejado tu menú para ayudarte a atraer más clientes.
          </Text>
          <Text style={s.closing} allowFontScaling={true}>Gracias por ser parte de Patio.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
