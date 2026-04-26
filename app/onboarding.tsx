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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_done';

const SLIDES = [
  {
    title: '¿Qué hay hoy?',
    sub:   'Saaaaaaabes.',
  },
  {
    title: 'Tu menú del día, a tiempo.',
    sub:   'Hecho para compartir.',
  },
  {
    title: 'Haz que tus clientes lo sepan.',
    sub:   null,
    last:  true,
  },
];

function finish() {
  AsyncStorage.setItem(ONBOARDING_KEY, '1');
  router.replace('/');
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const advance = () => {
    if (index === SLIDES.length - 1) { finish(); return; }
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIndex(i => i + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  const slide = SLIDES[index];

  return (
    <TouchableOpacity style={styles.root} activeOpacity={1} onPress={advance}>
      {/* Logo fijo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo-negro.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Texto con fade */}
      <Animated.View style={[styles.textBlock, { opacity: fadeAnim }]}>
        <Text style={styles.title} allowFontScaling={true}>{slide.title}</Text>
        {!!slide.sub && <Text style={styles.sub} allowFontScaling={true}>{slide.sub}</Text>}
        {slide.last && (
          <TouchableOpacity style={styles.startBtn} onPress={finish} activeOpacity={0.85}>
            <Text style={styles.startBtnText} allowFontScaling={true}>Empezar</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5E9D9',
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 320,
    height: 120,
    marginLeft: -7,
  },
  textBlock: {
    position: 'absolute',
    top: height * 0.56,
    left: 40,
    right: 40,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  sub: {
    fontSize: 15,
    fontWeight: '300',
    color: '#1A1A1A',
    opacity: 0.6,
    textAlign: 'center',
  },
  startBtn: {
    marginTop: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 48,
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
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A1A1A',
  },
  dotInactive: {
    backgroundColor: 'transparent',
  },
});
