// Datos sintéticos para recorrer la app completa en desarrollo.
// NADA de esto corre en producción: todo está detrás de __DEV__.
// Lugares variados (no solo fondas: elotes, hamburguesas, mariscos, postres…)
// para probar guardados por categoría, búsqueda por platillo y fichas.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setFavoritePatioIds, getFavoritePatioIds } from './favorites';
import { makePlatilloId, makeSectionId, type MenuData } from './menu-store';
import { registerPatioView, getViewedPatioIds } from './stats';
import type { Patio, PatioMenuSection } from './patios';
import { publicCurrency } from './prices';

export const DEV_MY_PATIO_ID = 'demo-mi-patio';
const DEV_PUBLISHED_MENU_KEY = '@patio_demo_published_menu';
const DEV_PUBLISHED_MENU_VERSION_KEY = '@patio_demo_published_menu_version';
const DEV_PUBLISHED_MENU_VERSION = '2-long-profile';

function menuToSections(data: MenuData): PatioMenuSection[] {
  return data.secciones
    .map((section) => ({
      section: section.nombre.trim() || 'MENÚ DEL DÍA',
      price: publicCurrency(section.precio) || undefined,
      items: section.platillos
        .filter((dish) => dish.nombre.trim())
        .map((dish) => ({
          name: dish.nombre.trim(),
          description: dish.descripcion.trim() || undefined,
          price: publicCurrency(dish.precio) || undefined,
          tags: [dish.nombre, dish.descripcion, section.nombre].filter(Boolean),
        })),
    }))
    .filter((section) => section.items.length);
}

function makeDemoMenu(): MenuData {
  const section = (nombre: string, platillos: [string, string, string][]) => ({
    id: makeSectionId(),
    nombre,
    precio: '',
    platillos: platillos.map(([nombrePlatillo, descripcion, precio]) => ({
      id: makePlatilloId(),
      nombre: nombrePlatillo,
      descripcion,
      precio,
    })),
  });

  return {
    secciones: [
      section('MENÚ DEL DÍA', [
        ['Sopa de tortilla', 'Aguacate, queso fresco y un toque de chile pasilla', '45'],
        ['Arroz rojo de la casa', 'Preparado cada mañana con verduras', '35'],
      ]),
      section('GUISADOS · ELIGE UNO', [
        ['Mole rojo con pollo', 'Con arroz rojo, frijoles y tortillas recién hechas', '110'],
        ['Enchiladas verdes', 'Rellenas de pollo, con crema, queso y cebolla', '105'],
        ['Chile relleno de queso', 'Capeado, en caldillo de jitomate y acompañado de arroz', '115'],
        ['Albóndigas en chipotle', 'Carne de res, arroz blanco y frijoles de la olla', '110'],
        ['Tinga de pollo', 'Con tostadas, crema, queso y salsa de la casa', '100'],
      ]),
      section('A LA CARTA', [
        ['Milanesa de pollo', 'Con ensalada, papas y tortillas', '125'],
        ['Enfrijoladas', 'Rellenas de queso, con crema y cebolla morada', '95'],
        ['Tostadas de pata', 'Orden de tres con lechuga, crema y queso', '90'],
      ]),
      section('BEBIDAS', [
        ['Agua de jamaica', 'Vaso grande', '25'],
        ['Agua de horchata', 'Vaso grande', '25'],
        ['Refresco', '355 ml', '30'],
      ]),
      section('POSTRES', [
        ['Flan napolitano', 'Hecho en casa', '40'],
        ['Arroz con leche', 'Con canela', '35'],
      ]),
    ],
  };
}

export async function saveDevPublishedMenu(data: MenuData): Promise<void> {
  if (!__DEV__) return;
  await AsyncStorage.setItem(DEV_PUBLISHED_MENU_KEY, JSON.stringify(data));
}

export async function getDevPublishedMenu(): Promise<MenuData | null> {
  if (!__DEV__) return null;
  try {
    const raw = await AsyncStorage.getItem(DEV_PUBLISHED_MENU_KEY);
    return raw ? (JSON.parse(raw) as MenuData) : null;
  } catch {
    return null;
  }
}

export function makeDevPublishedPatio(data: MenuData): Patio {
  return {
    id: DEV_MY_PATIO_ID,
    name: 'Mi Patio Demo',
    category: 'Fondita',
    area: 'Irrigación',
    price: '$90–$125',
    address: 'Presa Salinillas 24',
    open: '8am-5pm',
    rating: 'Nuevo',
    reason: 'Tu menú publicado en modo simulador',
    latitude: 19.4429,
    longitude: -99.2044,
    x: 52,
    y: 45,
    menu: menuToSections(data),
    payments: ['Efectivo', 'Transferencia', 'Tarjeta'],
    patioJoinedAt: '2026-07-25',
    businessOpenedAt: '2012-04-01',
    weeklyHours: [
      { dia: 0, cerrado: true, abre: null, cierra: null },
      { dia: 1, cerrado: false, abre: '08:00', cierra: '17:00' },
      { dia: 2, cerrado: false, abre: '08:00', cierra: '17:00' },
      { dia: 3, cerrado: false, abre: '08:00', cierra: '17:00' },
      { dia: 4, cerrado: false, abre: '08:00', cierra: '17:00' },
      { dia: 5, cerrado: false, abre: '08:00', cierra: '18:00' },
      { dia: 6, cerrado: false, abre: '09:00', cierra: '15:00' },
    ],
  };
}

export async function getDevPublishedPatio(): Promise<Patio | null> {
  const menu = await getDevPublishedMenu();
  return menu ? makeDevPublishedPatio(menu) : null;
}

export const DEMO_PATIOS: Patio[] = [
  {
    id: 'demo-patio-4',
    name: 'Café Patio de Siempre',
    category: 'Café y desayunos',
    area: 'Irrigación',
    price: '$75–$165',
    address: 'Presa Las Pilas 18',
    open: '8am-8pm',
    rating: '4.5',
    reason: '',
    latitude: 19.4446,
    longitude: -99.2068,
    x: 46,
    y: 37,
    menu: menuToSections(makeDemoMenu()),
    payments: ['Efectivo', 'Tarjeta', 'Transferencia'],
    patioJoinedAt: '2024-03-15',
    businessOpenedAt: '2016-08-20',
    isNeighborhoodFavorite: true,
    weeklyHours: [
      { dia: 0, cerrado: false, abre: '09:00', cierra: '17:00' },
      { dia: 1, cerrado: false, abre: '08:00', cierra: '20:00' },
      { dia: 2, cerrado: false, abre: '08:00', cierra: '20:00' },
      { dia: 3, cerrado: false, abre: '08:00', cierra: '20:00' },
      { dia: 4, cerrado: false, abre: '08:00', cierra: '20:00' },
      { dia: 5, cerrado: false, abre: '08:00', cierra: '20:00' },
      { dia: 6, cerrado: false, abre: '09:00', cierra: '18:00' },
    ],
  },
  {
    id: 'demo-patio-3',
    name: 'Chochilocos de Neza Iztapalapa y Antojitos de la Güera',
    category: 'Cocina mexicana',
    area: 'San Rafael',
    price: '$165–$230',
    address: 'Francisco Pimentel 74',
    open: '8am-7pm',
    rating: '4.7',
    reason: '',
    latitude: 19.4388,
    longitude: -99.2027,
    x: 58,
    y: 64,
    menu: [
      {
        section: 'ESPECIALIDADES',
        items: [
          { name: 'Chamorro en adobo', description: 'Con arroz, frijoles y tortillas', price: '$230', tags: ['chamorro', 'adobo'] },
          { name: 'Chile relleno de picadillo', description: 'Capeado y servido en caldillo', price: '$175', tags: ['chile relleno', 'picadillo'] },
          { name: 'Enmoladas de pollo', description: 'Mole de la casa, crema y queso', price: '$165', tags: ['mole', 'pollo'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Tarjeta', 'Transferencia'],
    patioJoinedAt: '2025-02-12',
    businessOpenedAt: '1998-09-18',
    isNeighborhoodFavorite: true,
    weeklyHours: [
      { dia: 0, cerrado: false, abre: '09:00', cierra: '17:00' },
      { dia: 1, cerrado: false, abre: '08:00', cierra: '19:00' },
      { dia: 2, cerrado: false, abre: '08:00', cierra: '19:00' },
      { dia: 3, cerrado: false, abre: '08:00', cierra: '19:00' },
      { dia: 4, cerrado: false, abre: '08:00', cierra: '19:00' },
      { dia: 5, cerrado: false, abre: '08:00', cierra: '19:00' },
      { dia: 6, cerrado: false, abre: '09:00', cierra: '18:00' },
    ],
  },
  {
    id: 'demo-patio-2',
    name: 'Cocina Lupita',
    category: 'Restaurante',
    area: 'Anzures',
    price: '$145–$185',
    address: 'Calle Darwin 18',
    open: '12pm-6pm · lun-vie',
    rating: '2.0',
    reason: '',
    latitude: 19.4409,
    longitude: -99.2091,
    x: 36,
    y: 48,
    menu: [
      {
        section: 'COCINA',
        items: [
          { name: 'Pollo rostizado', description: 'Con papas y ensalada', price: '$185', tags: ['pollo', 'rostizado'] },
          { name: 'Sándwich de portobello', description: 'Pan de masa madre y hojas verdes', price: '$145', tags: ['vegetariano', 'sandwich'] },
        ],
      },
      {
        section: 'BEBIDAS',
        items: [
          { name: 'Agua mineral', price: '$45', tags: ['agua', 'bebida'] },
          { name: 'Café frío', price: '$70', tags: ['cafe', 'bebida'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Tarjeta', 'Transferencia'],
    patioJoinedAt: '2026-07-28',
    businessOpenedAt: '2026-07-10',
    weeklyHours: [
      { dia: 0, cerrado: true, abre: null, cierra: null },
      { dia: 1, cerrado: false, abre: '12:00', cierra: '18:00' },
      { dia: 2, cerrado: false, abre: '12:00', cierra: '18:00' },
      { dia: 3, cerrado: false, abre: '12:00', cierra: '18:00' },
      { dia: 4, cerrado: false, abre: '12:00', cierra: '18:00' },
      { dia: 5, cerrado: false, abre: '12:00', cierra: '18:00' },
      { dia: 6, cerrado: true, abre: null, cierra: null },
    ],
  },
  {
    id: 'demo-elotes-lupita',
    name: 'Elotes Doña Lupita',
    category: 'Antojitos',
    area: 'Irrigación',
    price: '$',
    address: 'Presa Falcón esq. Presa Salinillas',
    open: '5pm-10pm',
    rating: '5.0',
    reason: 'El puestecito de la esquina',
    latitude: 19.4407,
    longitude: -99.2079,
    x: 30,
    y: 60,
    menu: [
      {
        section: 'LO DE HOY',
        items: [
          { name: 'Elote con mayonesa y queso', price: '$35', tags: ['elote', 'antojito'] },
          { name: 'Esquite grande', price: '$45', tags: ['esquite', 'antojito'] },
          { name: 'Esquite con tuétano', price: '$65', tags: ['esquite', 'tuetano'] },
        ],
      },
    ],
    payments: ['Efectivo'],
    businessOpenedAt: '2004-02-14',
    isNeighborhoodFavorite: true,
    weeklyHours: null,
  },
  {
    id: 'demo-burgers-charly',
    name: 'Burgers Charly',
    category: 'Hamburguesas',
    area: 'Legaria',
    price: '$$',
    address: 'Calz. Legaria 620',
    open: '6pm-12am',
    rating: '5.0',
    reason: 'Hamburguesa al carbón de la esquina',
    latitude: 19.4442,
    longitude: -99.1988,
    x: 70,
    y: 40,
    menu: [
      {
        section: 'HAMBURGUESAS',
        items: [
          { name: 'Hamburguesa sencilla', price: '$75', tags: ['hamburguesa', 'carne'] },
          { name: 'Doble con tocino', price: '$110', tags: ['hamburguesa', 'tocino'] },
          { name: 'Papas gajo', price: '$45', tags: ['papas'] },
        ],
      },
      { section: 'BEBIDAS', items: [{ name: 'Refresco', tags: ['bebida'] }, { name: 'Malteada de fresa', price: '$60', tags: ['malteada', 'bebida'] }] },
    ],
    payments: ['Efectivo', 'Transferencia'],
    businessOpenedAt: '2019-06-08',
    weeklyHours: null,
  },
  {
    id: 'demo-mariscos-güero',
    name: 'Mariscos El Güero',
    category: 'Mariscos',
    area: 'Irrigación',
    price: '$$',
    address: 'Presa Don Martín 205',
    open: '11am-6pm',
    rating: '5.0',
    reason: 'Caldos y cocteles de barrio',
    latitude: 19.4451,
    longitude: -99.2102,
    x: 18,
    y: 22,
    menu: [
      {
        section: 'CALDOS',
        items: [
          { name: 'Caldo de camarón', price: '$95', tags: ['caldo', 'camaron', 'mariscos'] },
          { name: 'Sopa de mariscos', price: '$130', tags: ['caldo', 'sopa', 'mariscos'] },
        ],
      },
      {
        section: 'COCTELES',
        items: [
          { name: 'Coctel de camarón chico', price: '$110', tags: ['coctel', 'camaron'] },
          { name: 'Tostada de ceviche', price: '$55', tags: ['tostada', 'ceviche'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Tarjeta'],
    businessOpenedAt: '2008-03-22',
    weeklyHours: null,
    soldOut: true,
  },
  {
    id: 'demo-cocina-carmelita',
    name: 'Cocina Carmelita',
    category: 'Comida corrida',
    area: 'Irrigación',
    price: '$',
    address: 'Presa Angostura 33',
    open: '1pm-5pm',
    rating: '5.0',
    reason: 'Comida corrida como en casa',
    latitude: 19.4419,
    longitude: -99.2043,
    x: 50,
    y: 55,
    menu: [
      {
        section: 'MENÚ DEL DÍA',
        items: [
          { name: 'Enchiladas verdes', price: '$90', tags: ['enchiladas', 'pollo', 'comida corrida'] },
          { name: 'Tinga de pollo', price: '$90', tags: ['tinga', 'pollo', 'guisado'] },
          { name: 'Sopa de fideo', tags: ['sopa', 'entrada'] },
          { name: 'Agua de jamaica', tags: ['agua', 'jamaica', 'bebida'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Transferencia'],
    businessOpenedAt: '2014-09-05',
    weeklyHours: null,
  },
  {
    id: 'demo-pozoleria-jalisco',
    name: 'Pozolería Jalisco',
    category: 'Pozolería',
    area: 'Legaria',
    price: '$$',
    address: 'Lago Como 12',
    open: '12pm-8pm · jue-dom',
    rating: '5.0',
    reason: 'Pozole rojo estilo Guadalajara',
    latitude: 19.4472,
    longitude: -99.2015,
    x: 65,
    y: 15,
    menu: [
      {
        section: 'POZOLE',
        items: [
          { name: 'Pozole rojo grande', price: '$120', tags: ['pozole', 'cerdo', 'caldo'] },
          { name: 'Pozole blanco de pollo', price: '$110', tags: ['pozole', 'pollo'] },
          { name: 'Tostadas de pata', price: '$45', tags: ['tostada', 'pata'] },
        ],
      },
    ],
    payments: ['Efectivo'],
    businessOpenedAt: '2001-11-17',
    weeklyHours: null,
  },
  {
    id: 'demo-pasteles-nube',
    name: 'Pastelería La Nube',
    category: 'Repostería',
    area: 'Irrigación',
    price: '$$',
    address: 'Presa Madín 48-B',
    open: '10am-7pm',
    rating: '5.0',
    reason: 'Pan y pasteles del día',
    latitude: 19.4396,
    longitude: -99.2058,
    x: 40,
    y: 75,
    menu: [
      {
        section: 'HOY DEL HORNO',
        items: [
          { name: 'Rebanada de tres leches', price: '$55', tags: ['pastel', 'postre', 'tres leches'] },
          { name: 'Concha con nata', price: '$28', tags: ['pan', 'concha', 'postre'] },
          { name: 'Flan napolitano', price: '$40', tags: ['flan', 'postre'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Tarjeta', 'Transferencia'],
    businessOpenedAt: '2017-05-12',
    weeklyHours: null,
  },
  {
    id: 'demo-jugos-sol',
    name: 'Jugos El Sol',
    category: 'Jugos y licuados',
    area: 'Legaria',
    price: '$',
    address: 'Calz. Legaria 455, local 2',
    open: '7am-2pm',
    rating: '5.0',
    reason: 'Desayunos rápidos de barrio',
    latitude: 19.4436,
    longitude: -99.1965,
    x: 80,
    y: 35,
    menu: [
      {
        section: 'JUGOS Y LICUADOS',
        items: [
          { name: 'Jugo verde', price: '$40', tags: ['jugo', 'verde', 'bebida'] },
          { name: 'Licuado de plátano', price: '$45', tags: ['licuado', 'bebida'] },
        ],
      },
      {
        section: 'TORTAS',
        items: [
          { name: 'Torta de tamal', price: '$30', tags: ['torta', 'tamal', 'desayuno'] },
          { name: 'Sándwich de pollo', price: '$50', tags: ['sandwich', 'pollo'] },
        ],
      },
    ],
    payments: ['Efectivo'],
    businessOpenedAt: '2021-01-09',
    weeklyHours: null,
  },
];

// Guardados y vistos de ejemplo: mezcla de mocks reales y demo para que
// Guardados/Vistos tengan volumen y variedad de categorías.
const DEMO_SAVED = ['demo-cocina-carmelita', 'demo-pozoleria-jalisco', 'demo-elotes-lupita', 'cochitacos', 'don-bonachon', 'demo-pasteles-nube'];
const DEMO_VIEWED = ['demo-jugos-sol', 'demo-burgers-charly', 'demo-mariscos-güero', 'cintora-taqueria', 'aaattaco', 'demo-cocina-carmelita', 'demo-pozoleria-jalisco', 'cochitacos'];

export async function seedDemoFoodie(): Promise<void> {
  if (!__DEV__) return;
  const [saved, viewed, published, menuVersion] = await Promise.all([
    getFavoritePatioIds(),
    getViewedPatioIds(),
    getDevPublishedMenu(),
    AsyncStorage.getItem(DEV_PUBLISHED_MENU_VERSION_KEY),
  ]);
  if (!published || menuVersion !== DEV_PUBLISHED_MENU_VERSION) {
    await saveDevPublishedMenu(makeDemoMenu());
    await AsyncStorage.setItem(DEV_PUBLISHED_MENU_VERSION_KEY, DEV_PUBLISHED_MENU_VERSION);
  }
  if (saved.length === 0) await setFavoritePatioIds(DEMO_SAVED);
  if (viewed.length <= 5) {
    // Registrar en orden inverso deja el primero de la lista como el más reciente.
    for (const id of [...DEMO_VIEWED].reverse()) await registerPatioView(id);
  }
}
