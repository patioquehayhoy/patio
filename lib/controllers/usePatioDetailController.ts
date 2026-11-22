import { patioCardOpenState } from '@/lib/patio-card-info';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Share } from 'react-native';
import * as Haptics from 'expo-haptics';

import { syncSavedPatioNotificationSubscriptions } from '@/lib/community-notifications';
import { getFavoritePatioIds, peekFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { offerLunchReminderOnce } from '@/lib/first-save-offer';
import {
  DIA_CORTO,
  formatHHMM12,
  horarioDeHoy,
  minutosParaCerrar,
  proximaApertura,
  resumenHorario,
} from '@/lib/horario';
import { cleanMenuDescription, cleanMenuText, fetchMenuForFondita, type FonditaPublicMenu } from '@/lib/menu';
import { fetchFonditaById, getPatioById, type Patio, type PatioMenuSection } from '@/lib/patios';
import { publicCurrency, publicPrice } from '@/lib/prices';
import { getPatioRating, type AuthorReview, type PatioRating, type PublicPatioReview } from '@/lib/ratings';
import { registerPatioView } from '@/lib/stats';
import { usePatioReviews } from '@/lib/controllers/usePatioReviews';
import { demoPhotoHash } from '@/lib/demo-photo-hashes';
import { noWidow } from '@/lib/typography';
import { phoneCallUrl, whatsappUrl } from '@/lib/business-contact';

type PatioParam = string | string[] | undefined;

const DEMO_PROFILE_REVIEWS: PublicPatioReview[] = [
  {
    userId: 'demo-review-sofia',
    author: 'Sofía R.',
    stars: 5,
    reasons: ['Sabor casero', 'Buena porción'],
    note: 'El mole está muy bien servido y las tortillas llegan calientes. Regresaría por las enchiladas.',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    businessReply: 'Gracias, Sofía. El mole lo preparamos desde temprano; aquí te esperamos.',
    isMine: false,
  },
  {
    userId: 'demo-review-diego',
    author: 'Diego M.',
    stars: 4,
    reasons: ['Precio justo', 'Servicio amable'],
    note: 'Comida sencilla y rica. Al mediodía se llena, pero avanzan rápido.',
    timestamp: Date.now() - 1000 * 60 * 60 * 52,
    isMine: false,
  },
  {
    userId: 'demo-review-mariana',
    author: 'Mariana L.',
    stars: 5,
    reasons: ['Menú variado'],
    note: 'Probé el chile relleno y el agua de horchata. Todo se sintió fresco.',
    timestamp: Date.now() - 1000 * 60 * 60 * 80,
    isMine: false,
  },
];

const DEMO_CRITICAL_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-critical-1', author: 'Ana P.', stars: 2, reasons: ['Servicio lento'], note: 'La idea es buena, pero esperamos demasiado y varios platos llegaron fríos.', timestamp: Date.now() - 1000 * 60 * 60 * 20, isMine: false },
  { userId: 'demo-critical-2', author: 'Luis G.', stars: 1, reasons: ['No coincidió'], note: 'El menú publicado no coincidía con lo que tenían disponible al llegar.', timestamp: Date.now() - 1000 * 60 * 60 * 46, isMine: false },
  { userId: 'demo-critical-3', author: 'Majo C.', stars: 2, reasons: ['Porción pequeña'], note: 'El lugar se ve bien, aunque la porción fue menor de lo esperado por el precio.', timestamp: Date.now() - 1000 * 60 * 60 * 73, businessReply: 'Gracias por decirnos. Estamos ajustando porciones y tiempos durante estas primeras semanas.', isMine: false },
  { userId: 'demo-critical-4', author: 'Raúl V.', stars: 3, reasons: ['Buen ambiente'], note: 'Buen ambiente y café, todavía tienen que mejorar la coordinación del servicio.', timestamp: Date.now() - 1000 * 60 * 60 * 96, isMine: false },
];

const DEMO_ESTABLISHED_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-established-1', author: 'Fernanda T.', stars: 5, reasons: ['Sabor casero'], note: 'Venimos desde hace años. El chamorro sigue siendo el plato que siempre pedimos.', timestamp: Date.now() - 1000 * 60 * 60 * 30, isMine: false },
  { userId: 'demo-established-2', author: 'Jorge A.', stars: 4, reasons: ['Servicio amable'], note: 'Porciones generosas y servicio atento. Los domingos suele llenarse.', timestamp: Date.now() - 1000 * 60 * 60 * 70, isMine: false },
  { userId: 'demo-established-3', author: 'Pilar N.', stars: 5, reasons: ['Buena porción', 'Sabor casero'], note: 'Las enmoladas y el chile relleno valen mucho la visita.', timestamp: Date.now() - 1000 * 60 * 60 * 118, isMine: false },
];

const DEMO_LONGTIME_PATIO_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-longtime-1', author: 'Elena C.', stars: 5, reasons: ['Buen café', 'Servicio amable'], note: 'Es de esos lugares confiables a los que siempre se puede volver.', timestamp: Date.now() - 1000 * 60 * 60 * 40, isMine: false },
  { userId: 'demo-longtime-2', author: 'Marco V.', stars: 4, reasons: ['Ambiente tranquilo'], note: 'Buen desayuno y atención constante desde hace tiempo.', timestamp: Date.now() - 1000 * 60 * 60 * 92, isMine: false },
];

// Fotos de clientes en DEV (Unsplash, uso libre): Gringa solo tiene la de un
// cliente; Al pastor tiene la del negocio y, abajo, más de clientes.
const devCustomerPhoto = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=75`;
const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;
// Casos de largo para las fotos de clientes (docs/design/CONTENT_STRESS_CASES.md):
// nombre de 39; foto de hace 200 días (va al final); la misma persona dos
// veces (va después de las demás); una reseña de 591 letras (la historia) y
// una foto tuya para probar Corregir y Quitar.
const DEMO_DEV1_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-dev1-1', author: 'Caro M.', stars: 5, reasons: ['Sabor casero'], note: 'La gringa de pastor está buenísima, pídela con piña.', timestamp: Date.now() - HOUR * 5, photos: [
    { url: devCustomerPhoto('1565299585323-38d6b0865b47'), dish: 'Gringas de pastor con queso' },
    // Varias fotos en una visita (21 nov): dos platillos y una sin platillo
    // (sale en la reseña, no en el menú).
    { url: `${devCustomerPhoto('1599974579688-8dbdd335c77f')}&v=caro-2`, dish: 'Suadero' },
    { url: `${devCustomerPhoto('1613514785940-daed07799d9b')}&v=caro-3` },
  ], isMine: false },
  { userId: 'demo-dev1-2', author: 'Iván R.', stars: 4, reasons: ['Buena porción'], note: 'Los de pastor llegan calientitos.', timestamp: Date.now() - HOUR * 26, photos: [{ url: devCustomerPhoto('1624300629298-e9de39c13be5'), dish: 'Al pastor' }], isMine: false },
  { userId: 'demo-dev1-3', author: 'María Guadalupe del Socorro Josefina H.', stars: 5, reasons: ['Sabor casero'], note: 'Volvería.', timestamp: Date.now() - DAY * 3, photos: [{ url: `${devCustomerPhoto('1565299585323-38d6b0865b47')}&v=3`, dish: 'Al pastor' }], isMine: false },
  { userId: 'demo-dev1-2', author: 'Iván R.', stars: 4, reasons: ['Rápido'], note: 'Otra vez bien.', timestamp: Date.now() - DAY * 9, photos: [{ url: `${devCustomerPhoto('1624300629298-e9de39c13be5')}&v=4`, dish: 'Al pastor' }], isMine: false },
  { userId: 'demo-dev1-4', author: 'Leo', stars: 3, reasons: ['Precio justo'], note: 'Bien, sin más.', timestamp: Date.now() - DAY * 200, photos: [{ url: `${devCustomerPhoto('1565299585323-38d6b0865b47')}&v=5`, dish: 'Al pastor' }], isMine: false },
  { userId: 'demo-dev1-5', author: 'Sofía P.', stars: 5, reasons: ['Sabor casero', 'Buena porción'], note: 'Llegué a la una y media, justo cuando salía la primera tanda de suadero. Doña Mary me reconoció de la semana pasada y me guardó lugar en la barra. Pedí tres de suadero y uno de pastor para comparar: el suadero gana, doradito de las orillas y suave por dentro. La salsa verde es de molcajete y se nota. El agua de horchata no está empalagosa. Pagué con tarjeta sin problema. Lo único: a las dos ya no cabe nadie, así que lleguen temprano o pidan para llevar. Volví el jueves con mi hermano y también salimos felices. Ya es mi lugar de los martes y, desde hoy, también de los jueves, sin duda.', timestamp: Date.now() - DAY * 2, photos: [{ url: `${devCustomerPhoto('1599974579688-8dbdd335c77f')}&v=6`, dish: 'Suadero' }], isMine: false },
  { userId: 'demo-dev1-me', author: 'Tú', stars: 4, reasons: ['Rápido'], note: 'Rico y rápido.', timestamp: Date.now() - DAY, photos: [{ url: `${devCustomerPhoto('1551504734-5ee1c4a1479b')}&v=7`, dish: 'Campechanos' }], isMine: true },
  // Identidad del platillo: foto de cuando el menú decía «Tacos de suadero»
  // (sale en «Suadero», que guarda ese otro nombre) y la de arriba escrita en
  // plural, «Gringas…» (se junta sola con «Gringa…»).
  { userId: 'demo-dev1-11', author: 'Arturo V.', stars: 5, reasons: ['Sabor casero'], note: 'De los mejores suaderos de la Narvarte.', timestamp: Date.now() - DAY * 8, photos: [{ url: `${devCustomerPhoto('1613514785940-daed07799d9b')}&v=8`, dish: 'Tacos de suadero' }], isMine: false },
  // Reseñas sin foto, como serán la mayoría: corta, típica, larga, crítica y solo estrellas.
  { userId: 'demo-dev1-6', author: 'Rubén T.', stars: 5, reasons: ['Sabor casero'], note: '¡Rico!', timestamp: Date.now() - HOUR * 3, isMine: false },
  { userId: 'demo-dev1-7', author: 'Daniela F.', stars: 4, reasons: ['Buena porción', 'Rápido'], note: 'La comida corrida alcanza para dos: sopa de fideo, arroz y el guisado del día. El agua de jamaica sin tanta azúcar.', timestamp: Date.now() - DAY * 4, isMine: false },
  { userId: 'demo-dev1-8', author: 'Jorge Alberto R.', stars: 5, reasons: ['Sabor casero', 'Precio justo'], note: 'Vengo desde hace años, desde que la fonda era solo una barra con cuatro bancos. Doña Mary sigue haciendo el mole los jueves y el chile relleno los viernes, y se acuerda de cómo le gusta el café a cada quien. Subieron un poco los precios, como todo, pero la porción sigue siendo generosa y las tortillas salen calientes del comal. Si van en quincena, lleguen antes de la una o esperen tantito: vale la pena. Lo que más extraño es el pozole de los sábados, que ya solo hacen en septiembre.', timestamp: Date.now() - DAY * 6, isMine: false },
  { userId: 'demo-dev1-9', author: 'Mónica S.', stars: 2, reasons: ['Tardaron'], note: 'El caldo llegó tibio y tardaron mucho en traer la cuenta.', timestamp: Date.now() - DAY * 11, isMine: false },
  { userId: 'demo-dev1-10', author: 'Pablo N.', stars: 5, reasons: ['Sabor casero'], timestamp: Date.now() - DAY * 15, isMine: false },
];
// 40 fotos de un solo platillo (Chiles en nogada), para ver «12 de 40», el
// orden y una foto con 12,480 «me gusta» (ver la ficha, caso demo-dev6-1).
const DEV6_AUTHORS = ['Ana L.', 'Beto S.', 'Carmen R.', 'Diego M.', 'Elena V.', 'Fer G.', 'Gaby T.', 'Hugo P.', 'Inés C.', 'Jorge A.', 'Karla N.', 'Luis E.'];
const DEV6_PHOTOS = ['1565299585323-38d6b0865b47', '1624300629298-e9de39c13be5', '1613514785940-daed07799d9b', '1599974579688-8dbdd335c77f', '1551504734-5ee1c4a1479b'];
const DEMO_DEV6_REVIEWS: PublicPatioReview[] = Array.from({ length: 40 }, (_, i) => ({
  userId: `demo-dev6-${(i % DEV6_AUTHORS.length) + 1}`,
  author: DEV6_AUTHORS[i % DEV6_AUTHORS.length],
  stars: 3 + (i % 3),
  reasons: [],
  note: i % 5 === 0 ? 'Vale cada peso.' : undefined,
  timestamp: Date.now() - DAY * (i * 6 + 1),
  photos: [{ url: `${devCustomerPhoto(DEV6_PHOTOS[i % DEV6_PHOTOS.length])}&v=dev6-${i}`, dish: 'Chiles en nogada' }],
  isMine: false,
}));

// Las fotos de muestra traen su vista previa, como las reales.
const withDemoPhotoHashes = (reviews: PublicPatioReview[]) => reviews.map((review) => (review.photos ? {
  ...review,
  photos: review.photos.map((photo) => {
    const hash = demoPhotoHash(photo.url);
    return hash ? { ...photo, hash } : photo;
  }),
} : review));

// Reseñas de prueba de cada lugar «Dev» (solo en desarrollo).
const DEMO_REVIEWS_BY_PATIO: Record<string, () => PublicPatioReview[]> = {
  'demo-dev-1': () => withDemoPhotoHashes(DEMO_DEV1_REVIEWS),
  'demo-dev-6': () => withDemoPhotoHashes(DEMO_DEV6_REVIEWS),
  'demo-mi-patio': () => DEMO_PROFILE_REVIEWS,
  'demo-patio-2': () => DEMO_CRITICAL_REVIEWS,
  'demo-patio-3': () => DEMO_ESTABLISHED_REVIEWS,
  'demo-patio-4': () => DEMO_LONGTIME_PATIO_REVIEWS,
};

function withDemoProfileReviews(patioId: string, reviews: PublicPatioReview[]) {
  if (!__DEV__) return reviews;
  const demo = DEMO_REVIEWS_BY_PATIO[patioId];
  return demo ? [...reviews, ...demo()] : reviews;
}

/** Perfil de prueba: lo que una persona «Dev» reseñó, como lo daría el servidor. */
export function demoReviewsByAuthor(userId: string): AuthorReview[] {
  if (!__DEV__) return [];
  return Object.entries(DEMO_REVIEWS_BY_PATIO)
    .flatMap(([placeId, reviews]) => reviews()
      .filter((review) => review.userId === userId)
      .map((review) => ({
        reviewId: `${review.userId}-${review.timestamp}`,
        placeId,
        placeName: getPatioById(placeId)?.name ?? 'Lugar de prueba',
        stars: review.stars,
        note: review.note,
        timestamp: review.timestamp,
        ...(review.photos ? { photos: review.photos } : {}),
      })))
    .sort((a, b) => b.timestamp - a.timestamp);
}

function cleanParam(id: PatioParam): string | undefined {
  return Array.isArray(id) ? id[0] : id;
}

function patioStatus(patio: Patio): boolean | null {
  return patioCardOpenState(patio);
}

export function usePatioDetailController(id: PatioParam) {
  const [patio, setPatio] = useState<Patio | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveMenu, setLiveMenu] = useState<FonditaPublicMenu | null>(null);
  const [isSaved, setIsSaved] = useState(() => !!cleanParam(id) && !!peekFavoritePatioIds()?.includes(cleanParam(id)!));
  // Hasta saber si ya lo sigues, el botón no se muestra: antes salía
  // «Seguir» en naranja y medio segundo después cambiaba a «Siguiendo».
  const [savedKnown, setSavedKnown] = useState(() => peekFavoritePatioIds() !== null);
  const [userReview, setUserReview] = useState<PatioRating | null>(null);
  const cleanId = cleanParam(id);
  const patioId = patio?.id;
  const reviewsPaged = usePatioReviews(patioId, withDemoProfileReviews);
  const refreshReviews = reviewsPaged.refresh;

  useEffect(() => {
    let active = true;
    setPatio(null);
    setLiveMenu(null);
    setUserReview(null);
    // Con la copia en memoria se sabe de inmediato; si no, se espera al disco.
    const known = peekFavoritePatioIds();
    setIsSaved(!!cleanId && !!known?.includes(cleanId));
    setSavedKnown(known !== null);
    setLoading(true);
    if (!cleanId) {
      setLoading(false);
      return;
    }

    const mock = getPatioById(cleanId);
    if (mock) {
      setPatio(mock);
      setLoading(false);
      return;
    }

    fetchFonditaById(cleanId).then((found) => {
      if (!active) return;
      setPatio(found);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cleanId]);

  useEffect(() => {
    if (!patioId) return;
    let active = true;
    void registerPatioView(patioId).catch(() => {});
    getFavoritePatioIds()
      .then((ids) => { if (active) setIsSaved(ids.includes(patioId)); })
      .catch(() => {})
      .finally(() => { if (active) setSavedKnown(true); });
    return () => { active = false; };
  }, [patioId]);

  useFocusEffect(
    useCallback(() => {
      if (!patioId) return undefined;
      let active = true;
      void refreshReviews();
      // Volver del editor debe traer la disponibilidad actual, incluso si la
      // pestaña Mi Patio siguió montada. DEV usa la misma conversión pública.
      fetchMenuForFondita(patioId).then((menu) => {
        if (active) setLiveMenu(menu.sections.length ? menu : null);
      }).catch(() => {});
      fetchFonditaById(patioId).then((found) => {
        if (active && found) setPatio(found);
      }).catch(() => {});
      Promise.all([getPatioRating(patioId), getFavoritePatioIds()]).then(([rating, favoriteIds]) => {
        if (active) {
          setUserReview(rating);
          setIsSaved(favoriteIds.includes(patioId));
        }
      }).catch(() => {});
      return () => {
        active = false;
      };
    }, [patioId, refreshReviews]),
  );

  const status = useMemo(() => (patio ? patioStatus(patio) : null), [patio]);
  const isClosed = status === false;
  // Aviso "cierra pronto" — solo cuando de verdad está abierto ahora mismo.
  // Ventana compartida de 30 min para tarjetas y detalle.
  const cierraProntoMin = useMemo(() => {
    if (!patio || status !== true) return null;
    const min = minutosParaCerrar(patio.weeklyHours);
    return min != null && min <= 30 ? min : null;
  }, [patio, status]);
  const soldOut = patio?.soldOut === true;
  const tidy = (list: PatioMenuSection[]) => list.map((section) => ({
      ...section,
      section: cleanMenuText(section.section) || section.section,
      items: section.items.map((item) => ({
        ...item,
        name: cleanMenuText(item.name) || item.name,
        ...(() => {
          const description = cleanMenuDescription(item.description);
          const inferredPrice = !item.price && description?.match(/^\(\s*(\$\s*[\d,.]+)\s*\)$/)?.[1];
          return {
            description: inferredPrice ? undefined : description,
            price: item.price || inferredPrice,
          };
        })(),
      })),
    }));
  const sections = useMemo(() => tidy(liveMenu?.sections ?? patio?.menu ?? []), [liveMenu, patio]);
  // Precios del menú de hoy y la carta de siempre (2026-11-14).
  const menuPrices = useMemo(() => (liveMenu ? liveMenu.prices : patio?.menuPrices) ?? [], [liveMenu, patio]);
  const carta = useMemo(() => tidy(liveMenu ? liveMenu.carta : patio?.carta ?? []), [liveMenu, patio]);
  const hoy = useMemo(() => (patio ? horarioDeHoy(patio.weeklyHours) : null), [patio]);
  const rangoHoy = useMemo(() => {
    if (!patio) return '';
    if (!patio.weeklyHours?.length) return 'Sin horario';
    if (!hoy) return 'Sin horario hoy';
    if (hoy.cerrado) return 'Cerrado hoy';
    if (hoy.abre && hoy.cierra) return `${formatHHMM12(hoy.abre)}–${formatHHMM12(hoy.cierra)}`;
    return 'Sin horario hoy';
  }, [hoy, patio]);
  const proxTexto = useMemo(() => {
    const prox = patio ? proximaApertura(patio.weeklyHours) : null;
    return prox ? `${DIA_CORTO[prox.dia]} abre a las ${formatHHMM12(prox.abre)}` : null;
  }, [patio]);
  const menuPrice = menuPrices[0]?.price ?? sections.find((section) => publicPrice(section.price))?.price;
  const priceLabel = menuPrice ? publicCurrency(menuPrice) : publicPrice(patio?.price);
  const todayLabel = DIA_CORTO[hoy?.dia ?? new Date().getDay()];

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/explorar');
  }, []);

  // Número del negocio: llamar o WhatsApp, lo que el negocio tenga.
  const handleCall = useCallback(() => {
    if (!patio?.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(phoneCallUrl(patio.phone)).catch(() => {
      Alert.alert(noWidow('No pudimos abrir el teléfono'), noWidow('Inténtalo de nuevo.'));
    });
  }, [patio]);

  const handleWhatsapp = useCallback(() => {
    if (!patio?.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(whatsappUrl(patio.phone, patio.name)).catch(() => {
      Alert.alert(noWidow('No pudimos abrir WhatsApp'), noWidow('Revisa que esté instalado e inténtalo de nuevo.'));
    });
  }, [patio]);

  // A su lugar de hoy o, desde la lista de la ficha, a otra sucursal o al
  // lugar de otro día (lib/puntos.ts). Un toque directo trae el evento, no un lugar.
  const handleComoLlegar = useCallback((point?: { latitude: number; longitude: number }) => {
    if (!patio) return;
    const target = point && typeof point.latitude === 'number' && typeof point.longitude === 'number' ? point : patio;
    const { latitude, longitude } = target;
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Linking.openURL(url).catch(() => {
        void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`).catch(() => {
          Alert.alert(noWidow('No pudimos abrir el mapa'), noWidow('Inténtalo de nuevo.'));
        });
      });
    }
  }, [patio]);

  const handleToggleSaved = useCallback(async () => {
    if (!patio) return;
    const next = await toggleFavoritePatio(patio.id);
    setIsSaved(next.includes(patio.id));
    if (next.includes(patio.id)) void offerLunchReminderOnce();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    syncSavedPatioNotificationSubscriptions(next).catch(() => {});
  }, [patio]);

  const handleShare = useCallback(() => {
    if (!patio) return;
    const patioUrl = `patio://patio/${patio.id}`;
    const mapsUrl = `https://maps.apple.com/?q=${patio.latitude},${patio.longitude}`;
    const horarioTexto = resumenHorario(patio.weeklyHours) || patio.open;
    Share.share({
      title: `${patio.name} en Patio`,
      message: `${patio.name}\n${patio.categories[0] ?? 'Fondita'} · ${patio.area}\n${horarioTexto}\n\nVer menú en Patio:\n${patioUrl}\n\nCómo llegar:\n${mapsUrl}`,
      url: patioUrl,
    }).catch(() => {});
  }, [patio]);

  const handleStarPress = useCallback((stars: number) => {
    if (!patio) return;
    router.push({ pathname: '/resena/[id]', params: { id: patio.id, stars: String(stars) } });
  }, [patio]);

  return {
    cierraProntoMin,
    cleanId,
    handleBack,
    handleComoLlegar,
    handleCall,
    handleWhatsapp,
    handleShare,
    handleStarPress,
    handleToggleSaved,
    hoy,
    isClosed,
    isSaved,
    savedKnown,
    loading,
    patio,
    patioId,
    priceLabel,
    menuPrices,
    carta,
    proxTexto,
    rangoHoy,
    reviews: reviewsPaged.known,
    reviewsPaged,
    sections,
    soldOut,
    status,
    todayLabel,
    userRating: userReview?.stars ?? null,
    userReview,
  };
}
