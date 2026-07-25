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
        ['Mole rojo con pollo', 'Con arroz rojo, frijoles y tortillas', '95'],
        ['Enchiladas verdes', 'Pollo, crema, queso y cebolla', '90'],
        ['Caldo tlalpeño', 'Con garbanzo, pollo y chipotle', '85'],
      ]),
      section('BEBIDAS', [
        ['Agua de jamaica', '', '25'],
        ['Agua de horchata', '', '25'],
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
    price: '$',
    address: 'Presa Salinillas 24',
    open: '8am-5pm',
    rating: 'Nuevo',
    reason: 'Tu menú publicado en modo simulador',
    latitude: 19.4429,
    longitude: -99.2044,
    x: 52,
    y: 45,
    menu: menuToSections(data),
    payments: ['Efectivo', 'Transferencia'],
    weeklyHours: null,
  };
}

export async function getDevPublishedPatio(): Promise<Patio | null> {
  const menu = await getDevPublishedMenu();
  return menu ? makeDevPublishedPatio(menu) : null;
}

export const DEMO_PATIOS: Patio[] = [
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
    weeklyHours: null,
  },
];

// Guardados y vistos de ejemplo: mezcla de mocks reales y demo para que
// Guardados/Vistos tengan volumen y variedad de categorías.
const DEMO_SAVED = ['demo-cocina-carmelita', 'demo-pozoleria-jalisco', 'demo-elotes-lupita', 'cochitacos', 'don-bonachon', 'demo-pasteles-nube'];
const DEMO_VIEWED = ['demo-jugos-sol', 'demo-burgers-charly', 'demo-mariscos-güero', 'cintora-taqueria', 'aaattaco', 'demo-cocina-carmelita', 'demo-pozoleria-jalisco', 'cochitacos'];

export async function seedDemoFoodie(): Promise<void> {
  if (!__DEV__) return;
  const [saved, viewed, published] = await Promise.all([getFavoritePatioIds(), getViewedPatioIds(), getDevPublishedMenu()]);
  if (!published) await saveDevPublishedMenu(makeDemoMenu());
  if (saved.length === 0) await setFavoritePatioIds(DEMO_SAVED);
  if (viewed.length <= 5) {
    // Registrar en orden inverso deja el primero de la lista como el más reciente.
    for (const id of [...DEMO_VIEWED].reverse()) await registerPatioView(id);
  }
}
