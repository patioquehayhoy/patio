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
import { ahoraCDMX } from './horario';

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
    name: 'Fonda Doña Rosa',
    categories: ['Fondita'],
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

// Lugares «Dev» para QA (solo en desarrollo). Busca «dev» y salen todos;
// cada uno prueba un caso distinto:
//   Fondita Dev            menú grande (10 secciones), lleno ahora, aviso y recomendado
//   Taquería Dev 2         otro giro, menú muy extenso (14 secciones), menos gente ahora
//   Café Dev 3             menú corto, sin reseñas y sin visitas suficientes (no hay gráfica)
//   Pastelería Dev 4       «Se acabó por hoy», como de costumbre, aviso especial
//   Mariscos y Cocteles Dev 5  nombre de 29 letras, platillos larguísimos, solo precio del menú
type DevBusy = 'busy' | 'quiet' | 'usual' | 'none';
type DevQa = { patio: Patio; busy: DevBusy; notice?: string; featured?: string };

const item = (name: string, price?: string, description?: string): PatioMenuSection['items'][number] => ({
  name, price, description, tags: name.toLowerCase().split(/\s+/).slice(0, 3),
});
const section = (title: string, items: PatioMenuSection['items'], price?: string): PatioMenuSection => ({ section: title, price, items });
const week = (abre: string, cierra: string, closedDays: number[] = []) => Array.from({ length: 7 }, (_, dia) => (
  closedDays.includes(dia) ? { dia, cerrado: true, abre: null, cierra: null } : { dia, cerrado: false, abre, cierra }
));
const devPatio = (id: string, fields: Partial<Patio> & Pick<Patio, 'name' | 'categories' | 'menu' | 'latitude' | 'longitude'>): Patio => ({
  id,
  area: 'Narvarte',
  price: '$95',
  address: 'Av. Universidad 1100',
  open: '8am-10pm',
  rating: '4.6',
  ratingCount: 40,
  reason: '',
  x: 50,
  y: 50,
  hasTodayMenu: true,
  payments: ['Efectivo', 'Tarjeta'],
  weeklyHours: week('08:00', '22:00'),
  ...fields,
});

const DEV_QA: DevQa[] = [
  {
    busy: 'busy',
    notice: '2×1 en aguas frescas, hoy de 2 a 4 pm.',
    featured: 'Mole poblano con pollo',
    patio: devPatio('demo-dev-1', {
      name: 'Fondita Dev',
      categories: ['Fondita', 'Tacos', 'Café', 'Postres'],
      rating: '4.8',
      ratingCount: 126,
      isVerifiedBusiness: true,
      isNeighborhoodFavorite: true,
      reason: 'Cocina de barrio de la mañana a la noche',
      latitude: 19.3962,
      longitude: -99.1553,
      payments: ['Efectivo', 'Tarjeta', 'Transferencia'],
      businessOpenedAt: '1998-03-01',
      weeklyHours: week('08:00', '22:00'),
      menu: [
        section('DESAYUNOS', [
          item('Chilaquiles verdes con pollo y crema', '$95', 'Con frijoles refritos y un huevo estrellado'),
          item('Molletes con pico de gallo', '$65'),
          item('Huevos a la mexicana', '$70', 'Con tortillas recién hechas'),
        ], '$95'),
        section('ENTRADAS', [item('Guacamole con totopos', '$75'), item('Queso fundido con chorizo', '$85', 'Para compartir, con tortillas de harina')]),
        section('SOPAS', [item('Sopa de fideo'), item('Consomé de pollo con arroz y garbanzo', undefined, 'Con limón, cebolla y chile serrano'), item('Crema de elote')]),
        section('PLATOS FUERTES', [
          item('Milanesa de res empanizada con papas a la francesa', '$120', 'Con ensalada de la casa'),
          item('Mole poblano con pollo', '$110'),
          item('Pechuga a la plancha', '$105'),
          item('Chile relleno de queso en caldillo de jitomate', '$115'),
        ]),
        section('TACOS', [item('Al pastor', '$60', 'Orden de cuatro, con piña'), item('Suadero', '$60'), item('Campechanos', '$65'), item('Gringa de pastor con queso', '$70')]),
        section('ANTOJITOS', [item('Quesadilla de huitlacoche', '$45'), item('Sope de tinga', '$40'), item('Tlacoyo de frijol con nopales y queso fresco', '$40')]),
        section('VEGETARIANO', [item('Bowl de quinoa con verduras asadas y hummus', '$110'), item('Tacos de coliflor al pastor', '$75')]),
        section('BEBIDAS', [item('Agua de horchata', '$25'), item('Agua de jamaica', '$25', 'Sin azúcar si la pides'), item('Limonada mineral', '$35'), item('Refresco', '$25')]),
        section('CAFÉ', [item('Café de olla', '$30'), item('Americano', '$35'), item('Capuchino con leche de avena', '$55')]),
        section('POSTRES', [item('Pastel de tres leches', '$45'), item('Flan napolitano', '$40'), item('Arroz con leche', '$35'), item('Pay de queso con zarzamora', '$50')]),
      ],
    }),
  },
  {
    busy: 'quiet',
    patio: devPatio('demo-dev-2', {
      name: 'Taquería Dev 2',
      categories: ['Tacos', 'Antojitos'],
      price: '$18–$145',
      rating: '4.3',
      ratingCount: 23,
      reason: 'Tacos de guisado, pastor y canasta',
      latitude: 19.3988,
      longitude: -99.1581,
      open: '1pm-11pm',
      weeklyHours: week('13:00', '23:00', [1]),
      menu: [
        section('TACOS DE GUISADO', [item('Chicharrón en salsa verde', '$22'), item('Papa con chorizo', '$20'), item('Rajas con crema y elote', '$22'), item('Picadillo', '$20'), item('Huevo con salsa', '$18'), item('Mole verde con pollo deshebrado', '$24')]),
        section('TACOS AL PASTOR', [item('Pastor sencillo', '$18'), item('Pastor con queso', '$28'), item('Pastor con piña y cilantro', '$20'), item('Orden de cinco al pastor con todo', '$85')]),
        section('TACOS DE CANASTA', [item('Frijol', '$12'), item('Papa', '$12'), item('Chicharrón prensado', '$14'), item('Adobo', '$14'), item('Orden de cinco surtidos con salsa verde y cebolla', '$60')]),
        section('TACOS DORADOS', [item('De pollo con crema y queso', '$55'), item('De papa con lechuga y salsa roja', '$50'), item('De barbacoa', '$65')]),
        section('GRINGAS Y VOLCANES', [item('Gringa de pastor', '$55'), item('Gringa de suadero', '$55'), item('Volcán de bistec con queso gratinado', '$45'), item('Volcán de chorizo', '$40')]),
        section('QUESADILLAS', [item('Queso', '$35'), item('Huitlacoche', '$45'), item('Flor de calabaza', '$45'), item('Chicharrón prensado', '$40'), item('Tinga de pollo', '$40')]),
        section('TORTAS', [item('Torta de milanesa', '$75'), item('Torta de pastor', '$70'), item('Torta cubana con todo', '$110'), item('Pambazo de papa con chorizo', '$55')]),
        section('ALAMBRES', [item('Alambre de res', '$135'), item('Alambre de pollo', '$125'), item('Alambre de pastor con queso, pimiento y tocino', '$145')]),
        section('CALDOS', [item('Consomé de barbacoa', '$45'), item('Caldo de gallina', '$65')]),
        section('ESPECIALIDADES DE LA CASA', [item('Costra de queso con pastor', '$45'), item('Campechano de suadero y longaniza', '$28'), item('Taco de cabeza', '$22')]),
        section('PARA COMPARTIR', [item('Parrillada para cuatro', '$420', 'Pastor, bistec, chorizo, cebollitas y nopales'), item('Orden de veinte tacos surtidos', '$360')]),
        section('SALSAS', [item('Verde cruda'), item('Roja de árbol'), item('Guacamole taquero')]),
        section('BEBIDAS', [item('Agua de horchata', '$25'), item('Agua de jamaica', '$25'), item('Refresco', '$25'), item('Cerveza', '$45')]),
        section('POSTRES', [item('Arroz con leche', '$30'), item('Flan', '$35')]),
      ],
    }),
  },
  {
    busy: 'none',
    patio: devPatio('demo-dev-3', {
      name: 'Café Dev 3',
      categories: ['Café'],
      price: '$35–$60',
      rating: '',
      ratingCount: 0,
      reason: 'Café de especialidad para llevar',
      latitude: 19.3947,
      longitude: -99.1537,
      open: '7am-3pm',
      patioJoinedAt: '2026-11-06',
      weeklyHours: week('07:00', '15:00', [0]),
      menu: [
        section('CAFÉ', [item('Americano', '$35'), item('Latte', '$50'), item('Capuchino', '$50'), item('Café de olla', '$40')]),
        section('PAN', [item('Concha', '$25'), item('Cuernito de jamón y queso', '$60')]),
      ],
    }),
  },
  {
    busy: 'usual',
    notice: 'Hoy pastel de zanahoria con 20 % de descuento.',
    patio: devPatio('demo-dev-4', {
      name: 'Pastelería Dev 4',
      categories: ['Postres', 'Café'],
      price: '$40–$480',
      rating: '4.9',
      ratingCount: 88,
      isVerifiedBusiness: true,
      reason: 'Pasteles por rebanada y enteros',
      latitude: 19.3975,
      longitude: -99.1520,
      soldOut: true,
      weeklyHours: week('10:00', '20:00'),
      menu: [
        section('PASTELES', [item('Tres leches por rebanada', '$55'), item('Chocolate con frambuesa', '$60'), item('Zanahoria con betún de queso crema', '$58'), item('Pastel entero de tres leches para diez personas', '$480')]),
        section('GALLETAS', [item('Avena con pasas', '$25'), item('Chispas de chocolate', '$25'), item('Polvorones', '$20')]),
        section('BEBIDAS', [item('Café americano', '$35'), item('Chocolate caliente', '$45')]),
      ],
    }),
  },
  {
    busy: 'busy',
    patio: devPatio('demo-dev-5', {
      name: 'Mariscos y Cocteles Dev Cinco',
      categories: ['Mariscos'],
      price: '$150',
      rating: '4.4',
      ratingCount: 61,
      reason: 'Comida corrida de mariscos con caldo, plato fuerte y agua',
      latitude: 19.3931,
      longitude: -99.1572,
      weeklyHours: week('12:00', '19:00', [2]),
      menu: [
        section('CALDOS', [item('Caldo de camarón seco con verduras y chile guajillo'), item('Sopa de mariscos de la casa con pulpo, camarón y almeja')], '$150'),
        section('COCTELES', [item('Coctel de camarón grande con aguacate y salsa de la casa'), item('Campechana de camarón, pulpo y ostión'), item('Vuelve a la vida')]),
        section('TOSTADAS', [item('Tostada de ceviche de pescado'), item('Tostada de pulpo en su tinta con mayonesa de chipotle'), item('Tostada de atún fresco')]),
        section('PLATOS', [item('Filete de pescado empapelado con mantequilla de ajo, champiñones y epazote'), item('Camarones a la diabla'), item('Pescado zarandeado al carbón')]),
      ],
    }),
  },
];


// Cocina Grande Dev 6: menú verdaderamente extenso (24 secciones, ~150
// platillos) para probar el índice lateral de secciones en el celular.
const BIG_MENU: [string, string[]][] = [
  ['DESAYUNOS', ['Chilaquiles rojos con huevo', 'Chilaquiles verdes con pollo', 'Enfrijoladas de queso', 'Enmoladas de pollo', 'Molletes con chorizo', 'Hot cakes con miel de maple', 'Avena con fruta de temporada']],
  ['HUEVOS AL GUSTO', ['Huevos a la mexicana', 'Huevos rancheros', 'Huevos divorciados', 'Huevos con jamón', 'Omelette de champiñones y queso', 'Huevos motuleños']],
  ['JUGOS Y LICUADOS', ['Jugo de naranja', 'Jugo verde', 'Licuado de plátano', 'Licuado de fresa', 'Licuado de mamey', 'Jugo de zanahoria']],
  ['PAN DULCE', ['Concha', 'Cuernito', 'Oreja', 'Dona de chocolate', 'Polvorón', 'Garibaldi']],
  ['ENTRADAS', ['Guacamole con totopos', 'Queso fundido', 'Sopes de chorizo', 'Tostadas de tinga', 'Flautas de pollo', 'Chicharrón de queso']],
  ['ENSALADAS', ['Ensalada César', 'Ensalada de nopales', 'Ensalada de la casa', 'Ensalada de atún', 'Ensalada de quinoa y aguacate', 'Ensalada de betabel con queso de cabra']],
  ['SOPAS Y CREMAS', ['Sopa de fideo', 'Sopa de tortilla', 'Crema de elote', 'Crema de champiñones', 'Sopa de lentejas', 'Sopa de verduras']],
  ['CALDOS', ['Caldo tlalpeño', 'Caldo de res', 'Caldo de gallina', 'Pozole rojo', 'Pozole verde', 'Menudo']],
  ['ARROCES Y PASTAS', ['Arroz rojo', 'Arroz blanco con elote', 'Espagueti rojo', 'Espagueti a la crema', 'Macarrones con queso', 'Lasaña de carne']],
  ['AVES', ['Mole poblano con pollo', 'Pollo en pipián', 'Pechuga empanizada', 'Pollo a la naranja', 'Pechuga rellena de espinaca', 'Tinga de pollo']],
  ['RES', ['Bistec a la mexicana', 'Carne asada', 'Chamorro en adobo', 'Albóndigas en chipotle', 'Puntas de res al albañil', 'Milanesa de res']],
  ['CERDO', ['Costillas en salsa verde', 'Chuleta ahumada', 'Cochinita pibil', 'Carnitas', 'Lomo en ciruela', 'Chicharrón en salsa roja']],
  ['PESCADOS', ['Filete empapelado', 'Pescado a la veracruzana', 'Filete empanizado', 'Pescado al mojo de ajo', 'Tilapia a la plancha', 'Robalo a la talla']],
  ['MARISCOS', ['Camarones al ajillo', 'Camarones a la diabla', 'Coctel de camarón', 'Pulpo a la gallega', 'Ceviche de pescado', 'Aguachile verde']],
  ['ESPECIALIDADES', ['Chiles en nogada', 'Mixiote de carnero', 'Barbacoa de borrego', 'Enchiladas suizas', 'Pescado zarandeado', 'Pato en mole negro']],
  ['TACOS', ['Al pastor', 'Suadero', 'Bistec', 'Campechanos', 'Longaniza', 'Cabeza']],
  ['TORTAS', ['Torta de milanesa', 'Torta cubana', 'Torta de pierna', 'Torta ahogada', 'Torta de jamón', 'Pambazo']],
  ['ANTOJITOS', ['Quesadillas', 'Sopes', 'Huaraches', 'Tlacoyos', 'Gorditas de chicharrón', 'Tlayudas']],
  ['VEGETARIANO', ['Tacos de coliflor', 'Bowl de quinoa', 'Enchiladas de verduras', 'Hamburguesa de lenteja', 'Chiles rellenos de queso', 'Nopales asados con queso']],
  ['INFANTIL', ['Nuggets con papas', 'Mini hamburguesa', 'Quesadilla sincronizada', 'Espagueti a la mantequilla', 'Hot dog', 'Sándwich de jamón']],
  ['GUARNICIONES', ['Frijoles refritos', 'Papas a la francesa', 'Puré de papa', 'Verduras al vapor', 'Plátanos fritos', 'Tortillas hechas a mano']],
  ['BEBIDAS', ['Agua de horchata', 'Agua de jamaica', 'Agua de tamarindo', 'Limonada', 'Refresco', 'Agua mineral']],
  ['CAFÉ Y TÉ', ['Café de olla', 'Americano', 'Capuchino', 'Latte', 'Té de manzanilla', 'Chocolate caliente']],
  ['POSTRES', ['Pastel de tres leches', 'Flan napolitano', 'Arroz con leche', 'Pay de queso', 'Gelatina de mosaico', 'Churros con cajeta']],
];

const bigMenuPrice = (sectionIndex: number, dishIndex: number) => String(25 + ((sectionIndex * 37 + dishIndex * 23) % 235));

DEV_QA.push({
  busy: 'usual',
  notice: 'Hoy pozole rojo o verde a $85.',
  featured: 'Chiles en nogada',
  patio: devPatio('demo-dev-6', {
    name: 'Cocina Grande Dev 6',
    categories: ['Restaurante', 'Fondita'],
    price: '$25–$260',
    rating: '4.5',
    ratingCount: 312,
    isVerifiedBusiness: true,
    reason: 'Menú completo del desayuno a la cena',
    latitude: 19.3999,
    longitude: -99.1546,
    businessOpenedAt: '2004-06-01',
    weeklyHours: week('07:00', '23:00'),
    menu: BIG_MENU.map(([title, dishes], sectionIndex) => section(title, dishes.map((name, dishIndex) => item(
      name,
      '$' + bigMenuPrice(sectionIndex, dishIndex),
      dishIndex === 0 ? 'La favorita de la casa' : undefined,
    )))),
  }),
});

export const DEV_QA_PATIOS: Patio[] = DEV_QA.map((entry) => entry.patio);

/** Aviso especial y platillo recomendado de los lugares «Dev». */
export function demoHighlights(id: string): { notice: string | null; featuredDishName: string | null } | null {
  const entry = DEV_QA.find((candidate) => candidate.patio.id === id);
  return entry ? { notice: entry.notice ?? null, featuredDishName: entry.featured ?? null } : null;
}

/**
 * «Qué tan lleno» sintético: desayuno ligero, pico a la comida y otro menor en
 * la cena (fines de semana, más tarde). En la hora actual, según el caso:
 * lleno, menos gente, como de costumbre o sin visitas suficientes.
 */
export function demoBusynessRows(id: string, now = new Date()) {
  const busy: DevBusy = DEV_QA.find((entry) => entry.patio.id === id)?.busy ?? 'usual';
  if (busy === 'none') return [];
  const { dia, minutos } = ahoraCDMX(now);
  const hourNow = Math.floor(minutos / 60);
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const raw: { weekday: number; hour_of_day: number; value: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const weekend = weekday === 0 || weekday === 6;
    const lunch = weekend ? 15 : 14;
    for (let hour = 7; hour <= 23; hour++) {
      const value = 0.3 * Math.exp(-((hour - 9) ** 2) / 2)
        + Math.exp(-((hour - lunch) ** 2) / 3)
        + (0.4 + (seed % 3) * 0.1) * Math.exp(-((hour - 19.5) ** 2) / 2)
        + 0.06;
      raw.push({ weekday, hour_of_day: hour, value: value * (weekend ? 1.15 : 1) });
    }
  }
  const top = Math.max(...raw.map((row) => row.value));
  const present = { busy: 9, quiet: 2, usual: 4 }[busy];
  return raw.map((row) => {
    const current = row.weekday === dia && row.hour_of_day === hourNow;
    return {
      weekday: row.weekday,
      hour_of_day: row.hour_of_day,
      level: Math.max(1, Math.round((100 * row.value) / top)),
      present_now: current ? present : null,
      usual_present: current ? 4 : null,
    };
  });
}

export const DEMO_PATIOS: Patio[] = [
  ...DEV_QA_PATIOS,
  {
    id: 'demo-patio-4',
    name: 'Café Patio de Siempre',
    categories: ['Bebidas'],
    area: 'Irrigación',
    price: '$75–$165',
    address: 'Presa Las Pilas 18',
    open: '8am-8pm',
    rating: '4.5',
    ratingCount: 2,
    isVerifiedBusiness: true,
    reason: '',
    latitude: 19.4446,
    longitude: -99.2068,
    x: 46,
    y: 37,
    menu: menuToSections(makeDemoMenu()),
    payments: ['Efectivo', 'Tarjeta', 'Transferencia'],
    patioJoinedAt: '2024-03-15',
    businessOpenedAt: '2026-07-20',
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
    categories: ['Fondita'],
    area: 'San Rafael',
    price: '$165–$230',
    address: 'Francisco Pimentel 74',
    open: '8am-7pm',
    rating: '4.7',
    ratingCount: 3,
    isVerifiedBusiness: true,
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
    categories: ['Restaurante'],
    area: 'Anzures',
    price: '$145–$185',
    address: 'Calle Darwin 18',
    open: '12pm-6pm · lun-vie',
    rating: '2.0',
    ratingCount: 4,
    isVerifiedBusiness: true,
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
    categories: ['Antojitos'],
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
    categories: ['Restaurante'],
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
    categories: ['Mariscos'],
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
    categories: ['Fondita'],
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
    categories: ['Restaurante'],
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
    categories: ['Postres'],
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
    categories: ['Bebidas'],
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

// Laboratorio local de densidad. Usa únicamente la gramática normal de lugares:
// sirve para estresar el mapa sin introducir todavía reparto, zonas o tianguis.
// Mismas categorías atómicas reales que PATIO_CATEGORIES en lib/patio-categories.ts —
// nunca inventar otras aquí, o los chips de categoría del mapa se contaminan.
const DENSITY_CATEGORIES = [
  'Fondita', 'Tacos', 'Antojitos', 'Elotes', 'Botanas',
  'Postres', 'Café', 'Mariscos', 'Bebidas', 'Jugos y fruta', 'Restaurante',
];

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

// Nombres y colonias verosímiles: el mapa de prueba debe verse como en vivo.
const DENSITY_NAME_KINDS: Record<string, string> = {
  Fondita: 'Fonda', Tacos: 'Tacos', Antojitos: 'Antojitos', Elotes: 'Elotes', Botanas: 'Botanas',
  Postres: 'Postres', 'Café': 'Café', Mariscos: 'Mariscos', Bebidas: 'Bebidas', 'Jugos y fruta': 'Jugos', Restaurante: 'Cocina',
};
const DENSITY_OWNERS = ['Doña Mary', 'Don Chucho', 'La Güera', 'El Güero', 'Lupita', 'Don Beto', 'La Esquina', 'Doña Toña', 'El Chino', 'Carmelita', 'La Abuela', 'Don Pepe', 'Marisol', 'El Paisa', 'Las Tías', 'Don Rafa', 'La Morena'];
const DENSITY_AREAS = ['Polanco', 'Granada', 'Anzures', 'Verónica Anzures', 'Pensil', 'Anáhuac', 'Irrigación', 'Lomas de Sotelo'];

export const DENSITY_DEMO_PATIOS: Patio[] = Array.from({ length: 400 }, (_, index) => {
  const source = DEMO_PATIOS[index % DEMO_PATIOS.length];
  const radius = Math.sqrt(seededUnit(index + 1));
  const angle = seededUnit(index + 401) * Math.PI * 2;
  // Da variedad real de prueba al filtro multi-tag: uno de cada tres lugares
  // sintéticos trae dos etiquetas en vez de una sola.
  const primary = DENSITY_CATEGORIES[index % DENSITY_CATEGORIES.length];
  const secondary = DENSITY_CATEGORIES[(index + 4) % DENSITY_CATEGORIES.length];
  const categories = index % 3 === 0 && secondary !== primary ? [primary, secondary] : [primary];
  return {
    ...source,
    id: `density-lab-${index + 1}`,
    name: `${DENSITY_NAME_KINDS[primary]} ${DENSITY_OWNERS[index % DENSITY_OWNERS.length]}`,
    categories,
    area: DENSITY_AREAS[index % DENSITY_AREAS.length],
    latitude: 19.4429 + Math.sin(angle) * radius * 0.012,
    longitude: -99.2044 + Math.cos(angle) * radius * 0.015,
    ratingCount: (index * 7) % 93,
  };
});

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
