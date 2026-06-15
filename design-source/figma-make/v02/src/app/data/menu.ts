// Modelo de menú homologado de Patio.
// Un solo origen de datos para publicar, compartir (póster), historial,
// guardados y la vista del foodie — para que todos vean lo mismo.

// Lista CERRADA de secciones permitidas. Nunca texto libre.
export const MENU_SECTIONS = [
  "Entrada",
  "Guisado",
  "Acompañante",
  "Postre",
  "Bebida",
  "Tacos",
  "Antojito",
  "Especial del día",
] as const;

export type MenuSection = (typeof MENU_SECTIONS)[number];

export interface MenuItem {
  id: string;
  name: string;
  price?: number; // precio del item: extra "a la carta" o precio por pieza (tacos)
  section?: MenuSection; // opcional: artículos sin sección van al final
  chooseOne?: boolean; // marca la sección como "Elige uno"
}

// Modelo de precio de Patio (decisión de producto 2026-06-14):
// El menú del día puede tener SU precio fijo (comida corrida $55) y, ADEMÁS,
// items sueltos con su propio precio (a la carta). No son excluyentes: coexisten.
//   - Fonda con comida corrida:  dayPrice 55, algunos items con price (extras).
//   - Puesto de tacos:           sin dayPrice, cada item con su price.
// Así el modelo cubre ambos casos reales sin obligar a elegir un "modo".
export interface MenuOfDay {
  businessName: string; // nombre propio del negocio (Doña Mago, Tacos El Güero)
  businessType?: string; // editorial: "Comida corrida", "Tacos al pastor"
  area?: string; // "Roma Norte"
  dateLabel: string; // "Martes · 7 de junio"
  dayPrice?: number; // precio del menú del día (comida corrida). Ausente = a la carta.
  items: MenuItem[];
  closingLabel?: string; // "cierra 17:30"
  soldOut?: boolean;
}

export interface MenuGroup {
  section: MenuSection | null;
  chooseOne: boolean;
  items: MenuItem[];
}

// ----- Helpers -----

export function formatPrice(value: number): string {
  return `$${value}`;
}

// Precios presentes en artículos (extras a la carta / por pieza).
function itemPrices(menu: MenuOfDay): number[] {
  return menu.items
    .map((it) => it.price)
    .filter((p): p is number => typeof p === "number");
}

// ¿Todos los artículos con precio cuestan lo mismo? (ej. tacos $18 c/u)
export function isUniformPerItem(menu: MenuOfDay): boolean {
  const prices = itemPrices(menu);
  return prices.length > 0 && prices.every((p) => p === prices[0]);
}

// ¿Conviene mostrar el precio junto a cada artículo en la lista?
// Sí cuando hay precios por item y NO son todos iguales (precios mixtos a la carta).
export function showsPerItemPrices(menu: MenuOfDay): boolean {
  return itemPrices(menu).length > 0 && !isUniformPerItem(menu);
}

// Texto del precio para el encabezado del menú.
// Prioriza el precio del día (comida corrida). Si no hay, resume el de los items.
export function priceSummary(menu: MenuOfDay): string | null {
  if (typeof menu.dayPrice === "number") return formatPrice(menu.dayPrice);
  const prices = itemPrices(menu);
  if (prices.length === 0) return null;
  if (isUniformPerItem(menu)) return `${formatPrice(prices[0])} c/u`;
  return `desde ${formatPrice(Math.min(...prices))}`;
}

// ¿El menú tiene precio del día Y además items con precio propio (extras a la carta)?
// Útil para que la UI muestre el bloque "— a la carta —" bajo el menú fijo.
export function hasExtras(menu: MenuOfDay): boolean {
  return typeof menu.dayPrice === "number" && itemPrices(menu).length > 0;
}

// Agrupa artículos por sección, respetando el orden de MENU_SECTIONS.
// Los artículos sin sección quedan en un grupo final (section = null).
export function groupBySection(menu: MenuOfDay): MenuGroup[] {
  const groups: MenuGroup[] = [];

  for (const section of MENU_SECTIONS) {
    const items = menu.items.filter((it) => it.section === section);
    if (items.length === 0) continue;
    groups.push({
      section,
      chooseOne: items.some((it) => it.chooseOne),
      items,
    });
  }

  const loose = menu.items.filter((it) => !it.section);
  if (loose.length > 0) {
    groups.push({ section: null, chooseOne: false, items: loose });
  }

  return groups;
}

// Resumen de una línea para snippets (guardados / historial).
export function oneLineSummary(menu: MenuOfDay, max = 3): string {
  const names = menu.items.slice(0, max).map((it) => it.name.split(" · ")[0]);
  return names.join(" · ");
}

// ----- Mock data (reproduce el contenido actual de las pantallas) -----

export const LUPITA_MENU: MenuOfDay = {
  businessName: "Fonda Lupita",
  businessType: "Comida corrida",
  area: "Roma Norte",
  dateLabel: "Martes · 7 de junio",
  dayPrice: 55, // comida corrida del día
  closingLabel: "cierra 17:30",
  items: [
    { id: "l1", name: "Sopa de fideo aguada", section: "Entrada" },
    { id: "l2", name: "Tinga de pollo", section: "Guisado", chooseOne: true },
    { id: "l3", name: "Bistec a la mexicana", section: "Guisado", chooseOne: true },
    { id: "l4", name: "Chiles rellenos de queso", section: "Guisado", chooseOne: true },
    {
      id: "l5",
      name: "Arroz rojo · Frijoles refritos · Tortillas",
      section: "Acompañante",
    },
    { id: "l6", name: "Gelatina de mosaico", section: "Postre" },
    // Extras a la carta: conviven con el precio del día ($55).
    { id: "l7", name: "Orden extra de tortillas", price: 15, section: "Acompañante" },
    { id: "l8", name: "Agua de jamaica (1 L)", price: 35, section: "Bebida" },
  ],
};

export const TAQUERIA_MENU: MenuOfDay = {
  businessName: "Taquería El Patio",
  businessType: "Tacos al pastor",
  area: "Roma Sur",
  dateLabel: "Esta noche",
  // Sin dayPrice: puesto a la carta, cada item con su precio.
  closingLabel: "cierra 23:00",
  items: [
    { id: "t1", name: "Al pastor · trompo recién cortado", price: 18, section: "Tacos" },
    { id: "t2", name: "Suadero", price: 18, section: "Tacos" },
    { id: "t3", name: "Bistec", price: 18, section: "Tacos" },
    { id: "t4", name: "Tripa dorada", price: 18, section: "Tacos" },
    {
      id: "t5",
      name: "Cebollitas asadas · limones · salsas",
      section: "Acompañante",
    },
    { id: "t6", name: "Agua de jamaica del día", section: "Bebida" },
  ],
};

// Menú del día que se está publicando (semilla del editor).
export const TODAY_DRAFT: MenuOfDay = LUPITA_MENU;
