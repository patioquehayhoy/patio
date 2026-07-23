import { router, useLocalSearchParams } from 'expo-router';

import { emptyMenu, MenuComposer } from '@/components/menu-composer';
import { getMenuData } from '@/lib/menu-store';

export default function MenuEditarScreen() {
  const { reuse } = useLocalSearchParams<{ reuse?: string }>();
  return (
    <MenuComposer
      initialData={reuse === '1' ? (getMenuData() ?? emptyMenu()) : emptyMenu()}
      source="manual"
      onBack={() => router.replace('/historial')}
    />
  );
}
