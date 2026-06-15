# Patio — Menú flexible + componente de menú homologado + póster compartible

## Contexto

Hoy el publicador de menú (`FonderoPublish.tsx`) está cableado a "comida corrida":
secciones fijas Entrada / Guisado / Acompañante / Postre y un solo precio ($55). No
sirve para quien vende postres, tacos de guisado por pieza, elotes, etc. Además:

- **No existe** ningún componente de "menú como imagen" para compartir; el botón
  "Compartir en WhatsApp" de `FonderoSuccess` no lleva a ninguna tarjeta/póster.
- **Cada pantalla redibuja el menú por su cuenta** (FoodieDetail, FoodieDetailDark,
  FoodieSoldOut, FoodieSaved, FonderoHistory), así que lo que se publica y lo que ve
  el foodie pueden divergir.

Objetivo: que el publicador acepte **cualquier tipo de negocio** sin perder
homologación, y que **un solo componente de menú** se use en todos lados (publicar,
imagen compartida, historial, guardados, detalle del foodie), de modo que el foodie
vea exactamente lo que se publicó. Además fijar la regla **cero emojis**.

Decisiones ya tomadas con el usuario:
- Artículos **libres** (nombre + precio opcional).
- Secciones de **lista cerrada curada** (chips, nunca texto libre):
  `Entrada · Guisado · Acompañante · Postre · Bebida · Tacos · Antojito · Especial del día`.
  Los artículos también pueden ir **sin sección**.
- Precio: **único** para todo el menú (ej. comida corrida $55) **o por artículo**.
- Sin emojis. Sin "fonda/fondero/foodie" en pantalla (roles internos de código).

## Modelo de datos (nuevo archivo `src/app/data/menu.ts`)

```ts
export const MENU_SECTIONS = [
  "Entrada", "Guisado", "Acompañante", "Postre",
  "Bebida", "Tacos", "Antojito", "Especial del día",
] as const;
export type MenuSection = (typeof MENU_SECTIONS)[number];

export type PriceMode = "fixed" | "perItem";

export interface MenuItem {
  id: string;
  name: string;
  price?: number;          // solo en modo perItem
  section?: MenuSection;   // opcional (closed list)
  chooseOne?: boolean;     // hereda el viejo "Elige uno" a nivel sección
}

export interface MenuOfDay {
  businessName: string;    // nombre propio del negocio (Doña Mago, Tacos El Güero)
  businessType?: string;   // texto editorial ("Comida corrida", "Tacos al pastor")
  area?: string;           // "Roma Norte"
  dateLabel: string;       // "Martes · 7 de junio"
  priceMode: PriceMode;
  fixedPrice?: number;     // si priceMode === "fixed"
  items: MenuItem[];
  closingLabel?: string;   // "cierra 17:30"
  soldOut?: boolean;
}
```

También en este archivo: helpers `formatPrice`, `priceSummary(menu)`,
`groupBySection(items)` (respeta el orden de `MENU_SECTIONS`, los sin-sección al
final), `oneLineSummary(menu)` (para snippets de Saved/History); y mock data que
**reproduce el contenido actual** para que las pantallas se vean idénticas tras el
refactor: `LUPITA_MENU` (fixed $55), `TAQUERIA_MENU` (perItem $18 c/u),
`PAST_MENUS` (historial).

## Componente de menú homologado (`src/app/components/MenuCard.tsx`)

Único renderer del menú. Reemplaza los tres componentes duplicados:
`MenuSection` en FoodieDetail (l.238-305) y FoodieDetailDark (l.241-308), y `Row` en
FoodieSoldOut (l.302-335).

Props: `menu: MenuOfDay`, `theme: "light" | "dark"`,
`variant: "detail" | "thumb" | "poster"`, `soldOut?`, `showPrice?`,
`showHeader?`, `maxItemsPerSection?`. Internamente `SectionGroup` + `ItemRow`,
agrupando con `groupBySection`. El badge "Elige uno" se muestra cuando la sección
tiene `chooseOne`. Usa tokens de `theme.css` y constantes SF Pro existentes. Sin emojis.

## Póster compartible (`src/app/components/MenuPoster.tsx`)

Tarjeta vertical 9:16 autocontenida y de marca: `PatioMark` (respetando regla ink-on-light /
blanco-on-dark, nunca naranja), claim **"¿Qué hay hoy?"**, `businessName`, tipo/área,
`dateLabel`, `<MenuCard variant="poster">`, bloque de precio y pie "Patio". Es la
representación en-app de la imagen a compartir (no se exporta PNG real; es un
componente estilizado). Sin emojis.

Se muestra desde:
- `FonderoSuccess` — cablear el botón "Compartir en WhatsApp" (l.147-166) a un overlay
  con `MenuPoster` via `useState` local.
- `FonderoPublish` — la pastilla "Vista previa" (l.49-51) abre el mismo `MenuPoster`.

## Refactor del publicador (`FonderoPublish.tsx`)

- Reemplazar la tarjeta de precio fijo `$55` (l.103-145) por un **segmented toggle de
  modo de precio**: "Precio único" / "Precio por platillo".
- Reemplazar la lista cableada de `CourseRow` (l.148-151) por filas de artículo
  **editables y libres** (`ItemEditorRow`): nombre + chip de sección (de la lista
  cerrada, incluye opción "Sin sección") + campo de precio (solo visible en modo
  `perItem`).
- Botón "Añadir platillo".
- Todo con `useState` local, sin backend, estilos inline preservados. Borrar `CourseRow`.

## Pantallas que adoptan `MenuCard`

- `FoodieDetail.tsx` → `<MenuCard menu={LUPITA_MENU} theme="light" variant="detail"/>`, borrar `MenuSection` local.
- `FoodieDetailDark.tsx` → `MenuCard TAQUERIA_MENU theme="dark"`, borrar `MenuSection` local.
- `FoodieSoldOut.tsx` → `MenuCard variant="thumb" soldOut`, borrar `Row`, conservar badge "Agotado".
- `FoodieSaved.tsx` → `SavedCard` usa `oneLineSummary` / `MenuCard thumb showHeader={false} maxItemsPerSection={2}`.
- `FonderoHistory.tsx` → `PastMenu` alimentado por `PAST_MENUS`.

## Regla de copy

Agregar a la memoria de identidad verbal (`patio-verbal-identity.md`) la regla
**"Cero emojis en cualquier texto de pantalla"** (se hace al implementar, fuera de plan mode).

## Orden de implementación

1. Crear `src/app/data/menu.ts` (tipos + lista cerrada + helpers + mock).
2. Crear `src/app/components/MenuCard.tsx`.
3. Crear `src/app/components/MenuPoster.tsx`.
4. Refactor FoodieDetail, FoodieDetailDark, FoodieSoldOut, FoodieSaved, FonderoHistory.
5. Refactor FonderoPublish (modo precio + artículos libres + chips de sección).
6. Cablear FonderoSuccess "Compartir" → MenuPoster.
7. Agregar regla cero-emojis a la memoria.

## Verificación

- Servidor de dev ya corriendo; revisar visualmente en el harness (`InteractivePrototype`,
  `SpecSheet`, `AppStoreShots`, comparador día/noche).
- **Paridad**: detalle claro/oscuro, sold-out, guardados e historial se ven igual o
  mejor que antes (mismo contenido mock).
- **Publicar**: alternar modo precio; añadir/editar artículos; elegir sección de chips;
  "Vista previa" abre el póster.
- **Compartir**: en FonderoSuccess el botón abre el `MenuPoster` con el menú del día.
- Revisar el diff: sin emojis, sin "fonda/fondero/foodie" en texto visible (los props
  `variant="fondero|foodie"` del TabBar son internos y se quedan).
