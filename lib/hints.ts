import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  fondero_perfil:  'hint_v1_fondero_perfil',
  fondero_menu:    'hint_v1_fondero_menu',
  fondero_share:   'hint_v1_fondero_share',
  foodie_explorar: 'hint_v1_foodie_explorar',
} as const;

export async function shouldShowHint(key: keyof typeof KEYS): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS[key]);
  return val === null;
}

export async function markHintSeen(key: keyof typeof KEYS): Promise<void> {
  await AsyncStorage.setItem(KEYS[key], '1');
}
