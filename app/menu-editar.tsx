import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { emptyMenu, MenuComposer } from '@/components/menu-composer';
import { clearMenuExtractionSnapshot, getMenuData } from '@/lib/menu-store';

export default function MenuEditarScreen() {
  const { reuse } = useLocalSearchParams<{ reuse?: string }>();
  useEffect(() => {
    clearMenuExtractionSnapshot();
  }, []);
  return (
    <MenuComposer
      initialData={reuse === '1' ? (getMenuData() ?? emptyMenu()) : emptyMenu()}
      source="manual"
      onBack={() => router.replace('/historial')}
    />
  );
}
