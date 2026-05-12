import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, useTheme, type Theme } from '@/lib/theme';

const { height } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_done';

const SLIDES: { title: string; sub?: string; last?: boolean }[] = [
  { title: 'Encuentra comida local hoy.', sub: 'Mapa, menú y precio en una sola vista.' },
  { title: 'Publica tu menú rápido.', sub: 'Foto, plantilla o edición manual.' },
  { title: 'Elige menos. Come mejor.', sub: 'Patio te lleva al siguiente paso.', last: true },
];

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    hero: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: height * 0.20,
    },
    wordmark: { width: 260, height: 96 },
    textBlock: {
      position: 'absolute',
      top: height * 0.60,
      left: 40,
      right: 40,
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      fontFamily: Fonts.brand,
      color: t.text,
      textAlign: 'center',
      lineHeight: 30,
    },
    sub: {
      fontSize: 15,
      fontWeight: '300',
      fontFamily: Fonts.brand,
      color: t.textSecondary,
      textAlign: 'center',
    },
    startBtn: {
      marginTop: 20,
      minHeight: 52,
      backgroundColor: t.text,
      borderRadius: 14,
      paddingHorizontal: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startBtnText: {
      color: t.bg,
      fontWeight: '900',
      fontFamily: Fonts.brand,
      fontSize: 15,
    },
    dotsRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.text,
    },
    dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.text },
    dotInactive: { backgroundColor: 'transparent' },
  });
}

function finish() {
  AsyncStorage.setItem(ONBOARDING_KEY, '1');
  router.replace('/');
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const advance = () => {
    if (index === SLIDES.length - 1) { finish(); return; }
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIndex(i => i + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  useEffect(() => { fadeAnim.setValue(1); }, [fadeAnim]);

  const slide = SLIDES[index];

  return (
    <TouchableOpacity style={s.root} activeOpacity={1} onPress={advance}>
      <View style={s.hero}>
        <Image
          source={theme.isDark
            ? require('../assets/images/logo-blanco.png')
            : require('../assets/images/logo-negro.png')}
          style={s.wordmark}
          resizeMode="contain"
        />
      </View>

      <Animated.View style={[s.textBlock, { opacity: fadeAnim }]}>
        <Text style={s.title} allowFontScaling={true}>{slide.title}</Text>
        {!!slide.sub && <Text style={s.sub} allowFontScaling={true}>{slide.sub}</Text>}
        {slide.last && (
          <TouchableOpacity style={s.startBtn} onPress={finish} activeOpacity={0.85}>
            <Text style={s.startBtnText} allowFontScaling={true}>Entrar</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <View style={[s.dotsRow, { bottom: insets.bottom + 40 }]}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, i === index ? s.dotActive : s.dotInactive]} />
        ))}
      </View>
    </TouchableOpacity>
  );
}
