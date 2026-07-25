import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share } from 'react-native';

import { DEV_MY_PATIO_ID } from '@/lib/demo';
import { getLatestLocalMenu } from '@/lib/menu-history';
import { getFonditaName, getMenuData, type MenuData } from '@/lib/menu-store';
import { getFonditaId } from '@/lib/user-store';

export function useMenuPreviewController() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [businessName, setBusinessName] = useState('Tu Patio');
  const [patioId, setPatioId] = useState<string | null>(null);

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
      setPatioId(getFonditaId() || (__DEV__ ? DEV_MY_PATIO_ID : null));
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

  const handleOpenProfile = useCallback(() => {
    if (!patioId) return;
    router.push(`/patio/${patioId}` as any);
  }, [patioId]);

  const handleShare = useCallback(async () => {
    if (!patioId) return;
    const url = `patio://patio/${patioId}`;
    await Share.share({
      title: `${businessName} en Patio`,
      message: `${businessName}\nMira el menú publicado en Patio:\n${url}`,
      url,
    });
  }, [businessName, patioId]);

  return {
    businessName,
    fecha,
    handleBack,
    handleOpenProfile,
    handleShare,
    patioId,
    priceLabel,
    sections,
  };
}
