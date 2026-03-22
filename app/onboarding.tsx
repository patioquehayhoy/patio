import { router } from 'expo-router';
import { useRef } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_done';
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height * 0.42,
    paddingHorizontal: 40,
  },
  slideCenter: {
    alignItems: 'center',
    gap: 4,
  },
  // Slide 1
  s1Logo: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF7E0',
    letterSpacing: -1,
    textAlign: 'center',
  },
  s1Sub: {
    fontSize: 17,
    fontWeight: '300',
    color: '#FFF7E0',
    textAlign: 'center',
  },
  s1Tag: {
    fontSize: 15,
    fontWeight: '300',
    color: '#FFF7E0',
    opacity: 0.8,
    textAlign: 'center',
  },
  // Slide 2
  s2Title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3D1F00',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 30,
  },
  s2Sub: {
    fontSize: 15,
    fontWeight: '300',
    color: '#9E3F00',
    textAlign: 'center',
  },
  // Slide 3
  s3Title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF7E0',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  startBtn: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#FF5E00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  startBtnText: {
    color: '#FFF7E0',
    fontWeight: '700',
    fontSize: 15,
  },
  // Dots
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
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: 'transparent',
  },
});

const SLIDES = [
  {
    bg: '#FF5E00',
    content: (
      <View style={styles.slideCenter}>
        <Text style={styles.s1Logo} allowFontScaling={true}>PATIO</Text>
        <Text style={styles.s1Sub} allowFontScaling={true}>¿Qué hay hoy?</Text>
        <Text style={styles.s1Tag} allowFontScaling={true}>Saaaaaaabes.</Text>
      </View>
    ),
  },
  {
    bg: '#FFF7E0',
    content: (
      <View style={styles.slideCenter}>
        <Text style={styles.s2Title} allowFontScaling={true} numberOfLines={1} adjustsFontSizeToFit>Tu menú del día, a tiempo.</Text>
        <Text style={styles.s2Sub} allowFontScaling={true}>Hecho para compartir.</Text>
      </View>
    ),
  },
  {
    bg: '#3D1F00',
    content: (
      <>
        <View style={styles.slideCenter}>
          <Text style={styles.s3Title} allowFontScaling={true} numberOfLines={1} adjustsFontSizeToFit={true}>Haz que tus clientes lo sepan.</Text>
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={finish} activeOpacity={0.85}>
          <Text style={styles.startBtnText} allowFontScaling={true}>Empezar</Text>
        </TouchableOpacity>
      </>
    ),
  },
];

function finish() {
  AsyncStorage.setItem(ONBOARDING_KEY, '1');
  router.replace('/');
}

export default function OnboardingScreen() {
  // TODO: quitar antes de release
  AsyncStorage.removeItem(ONBOARDING_KEY);

  const flatRef = useRef<FlatList>(null);

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            {item.content}
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === index ? styles.dotActive : styles.dotInactive,
                    { borderColor: item.bg === '#FFF7E0' ? '#3D1F00' : '#FFF7E0' },
                    i === index && { backgroundColor: item.bg === '#FFF7E0' ? '#3D1F00' : '#FFF7E0' },
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}
