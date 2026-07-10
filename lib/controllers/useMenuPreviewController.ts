import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, Share, type View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { getLatestLocalMenu } from '@/lib/menu-history';
import { getFonditaName, getMenuData, type MenuData } from '@/lib/menu-store';

export function useMenuPreviewController() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [businessName, setBusinessName] = useState('Tu Patio');
  const posterRef = useRef<View | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const inMemory = getMenuData();
      if (inMemory) setMenuData(inMemory);
      else {
        getLatestLocalMenu().then((latest) => {
          if (active) setMenuData(latest);
        });
      }
      setBusinessName(getFonditaName() || 'Tu Patio');
      return () => {
        active = false;
      };
    }, [])
  );

  const sections = (menuData?.secciones ?? [])
    .map((section) => ({ ...section, platillos: section.platillos.filter((dish) => dish.nombre.trim()) }))
    .filter((section) => section.platillos.length);
  const dayPrice = sections.find((section) => section.precio.trim())?.precio.trim();
  const priceLabel = dayPrice ? `$${dayPrice}` : null;
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  const handleBack = useCallback(() => {
    router.replace('/menu');
  }, []);

  const handleShare = useCallback(async () => {
    if (!posterRef.current) return;
    try {
      const uri = await captureRef(posterRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir menú', UTI: 'public.png' });
      } else {
        await Share.share({ url: uri });
      }
    } catch {
      Alert.alert('No se pudo compartir', 'Intentemos de nuevo.');
    }
  }, [posterRef]);

  return {
    businessName,
    fecha,
    handleBack,
    handleShare,
    posterRef,
    priceLabel,
    sections,
  };
}
