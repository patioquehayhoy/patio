import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share } from 'react-native';

import { DEV_MY_PATIO_ID, getDevPublishedMenu } from '@/lib/demo';
import { getLatestLocalMenu, getLocalMenus } from '@/lib/menu-history';
import { loadCarta, loadMenuHoy } from '@/lib/db';
import { localMenuDate } from '@/lib/menu-date';
import { splitCarta } from '@/lib/menu-carta';
import { getFonditaName, getMenuData, normalizeMenuData, type MenuData } from '@/lib/menu-store';
import { getFonditaId } from '@/lib/user-store';
import { publicMenuPrices, withMenuPrecios } from '@/lib/menu-prices';

export function useMenuPreviewController() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [businessName, setBusinessName] = useState('Tu Patio');
  const [patioId, setPatioId] = useState<string | null>(null);
  const [savedCarta, setSavedCarta] = useState<MenuData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
      // El póster lleva también la carta, como el pizarrón de la fonda.
      const fonditaId = getFonditaId();
      setRefreshing(!!inMemory?.localLive);
      if (inMemory?.localLive) {
        // El póster refleja la disponibilidad guardada, no el editor antiguo.
        const scheduled = (!!inMemory.localFecha && inMemory.localFecha > localMenuDate())
          || (!!inMemory.localPublishAt && new Date(inMemory.localPublishAt).getTime() > Date.now());
        const fresh = fonditaId ? loadMenuHoy(fonditaId, inMemory.localFecha ?? localMenuDate())
          : __DEV__ ? scheduled
            ? getLocalMenus().then((entries) => entries.find((entry) => entry.id === inMemory.localDraftId)?.secciones ?? null)
            : getDevPublishedMenu()
          : Promise.resolve(null);
        fresh.then((raw) => {
          const menu = normalizeMenuData(raw);
          if (active && menu) setMenuData({ ...inMemory, ...menu });
        }).catch(() => {}).finally(() => { if (active) setRefreshing(false); });
      }
      if (fonditaId) {
        loadCarta(fonditaId)
          .then((raw) => { if (active) setSavedCarta(normalizeMenuData(raw)); })
          .catch(() => {});
      }
      return () => {
        active = false;
      };
    }, [])
  );

  // Menús guardados antes del 14 nov traen el precio en la primera sección.
  // Un borrador del editor puede traer la carta marcada: esa manda.
  const split = menuData ? splitCarta(menuData) : null;
  const withPrices = split ? withMenuPrecios(split.hoy) : null;
  const tidy = (list: MenuData['secciones']) => list
    .map((section) => ({ ...section, platillos: section.platillos.filter((dish) => dish.nombre.trim()) }))
    // Un encabezado con precio («MENÚ DEL DÍA $100») sale aunque no tenga platillos debajo.
    .filter((section) => section.platillos.length || Number(section.precio.replace(/[^0-9.]/g, '')) > 0);
  const sections = tidy(withPrices?.secciones ?? []);
  const carta = tidy(split?.carta.secciones.length ? split.carta.secciones : savedCarta?.secciones ?? []);
  const menuPrices = withPrices ? publicMenuPrices(withPrices) : [];
  const priceLabel = menuPrices[0]?.price ?? null;
  const priceName = menuPrices[0]?.label || 'Menú';
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  const handleBack = useCallback(() => {
    router.replace('/historial');
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
    refreshing,
    businessName,
    fecha,
    handleBack,
    handleOpenProfile,
    handleShare,
    patioId,
    priceLabel,
    priceName,
    menuPrices,
    sections,
    carta,
  };
}
