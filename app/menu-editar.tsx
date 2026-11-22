import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { emptyMenu, MenuComposer } from '@/components/menu-composer';
import { latestMenuSeed, loadMenuHistory, withoutSoldOut } from '@/lib/controllers/useMenuHistoryController';
import { localMenuDate } from '@/lib/menu-date';
import { clearMenuExtractionSnapshot, getMenuData, type MenuData } from '@/lib/menu-store';
import { useTheme } from '@/lib/theme';

export default function MenuEditarScreen() {
  const { reuse, desde } = useLocalSearchParams<{ reuse?: string; desde?: string }>();
  const { theme } = useTheme();
  // Desde el aviso «¿Ya publicaste lo de hoy?»: el último menú ya listo para
  // cambiar lo que no hay y publicar (sin pasar por la lista de Menús).
  const fromLatest = desde === 'ultimo';
  const [seed, setSeed] = useState<{ data: MenuData; revision: number } | null>(null);
  useEffect(() => {
    clearMenuExtractionSnapshot();
  }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    const open = (data: MenuData) => { if (active) setSeed((previous) => ({ data, revision: (previous?.revision ?? 0) + 1 })); };
    if (fromLatest) {
      loadMenuHistory().then((menus) => open(latestMenuSeed(menus) ?? emptyMenu())).catch(() => open(emptyMenu()));
    } else {
      const incoming = reuse === '1' ? getMenuData() ?? emptyMenu() : emptyMenu();
      if (incoming.localLive && incoming.localFecha && incoming.localFecha < localMenuDate()) {
        const { localDraftId: _id, localLive: _live, localFecha: _day, localPublishAt: _at, ...copy } = withoutSoldOut(incoming);
        open(copy);
      } else open(incoming);
    }
    return () => { active = false; };
  }, [fromLatest, reuse]));
  if (!seed) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  return (
    <MenuComposer
      key={seed.revision}
      initialData={seed.data}
      source="manual"
      onBack={() => router.replace('/historial')}
    />
  );
}
