import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { emptyMenu, MenuComposer } from '@/components/menu-composer';
import { latestMenuSeed, loadMenuHistory } from '@/lib/controllers/useMenuHistoryController';
import { clearMenuExtractionSnapshot, getMenuData, type MenuData } from '@/lib/menu-store';
import { useTheme } from '@/lib/theme';

export default function MenuEditarScreen() {
  const { reuse, desde } = useLocalSearchParams<{ reuse?: string; desde?: string }>();
  const { theme } = useTheme();
  // Desde el aviso «¿Ya publicaste lo de hoy?»: el último menú ya listo para
  // cambiar lo que no hay y publicar (sin pasar por la lista de Menús).
  const fromLatest = desde === 'ultimo';
  const [seed, setSeed] = useState<MenuData | null>(fromLatest ? null : reuse === '1' ? (getMenuData() ?? emptyMenu()) : emptyMenu());
  useEffect(() => {
    clearMenuExtractionSnapshot();
  }, []);
  useEffect(() => {
    if (!fromLatest) return;
    let active = true;
    loadMenuHistory()
      .then((menus) => { if (active) setSeed(latestMenuSeed(menus) ?? emptyMenu()); })
      .catch(() => { if (active) setSeed(emptyMenu()); });
    return () => { active = false; };
  }, [fromLatest]);
  if (!seed) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  return (
    <MenuComposer
      initialData={seed}
      source="manual"
      onBack={() => router.replace('/historial')}
    />
  );
}
