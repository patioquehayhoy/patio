# Patio — Redesign Blueprint V1

> Última actualización: 2026-06-07
> Propósito: especificación previa a Figma para rediseñar Patio con criterio profesional, sin copiar screenshots ni producir wireframes genéricos.

---

## 1. Tesis

Patio no necesita una plantilla bonita. Necesita un **sistema de producto**:

- Foodie descubre qué hay hoy.
- Fondero publica qué hay hoy en 30 segundos.
- La app se siente premium, minimalista y humana.
- La fondita sigue siendo local, no restaurante aspiracional falso.

Dirección visual:

**Apple Tahoe + glass orgánico + ficha editorial + operación Fondero premium.**

Esto significa: superficies calmadas, esquinas continuas, profundidad sutil, tipografía con intención, mapa como protagonista, y contenido real por encima de chrome.

---

## 2. Qué hacer con screenshots y referencias

### Screenshots actuales

Uso correcto:

- Ver qué pantallas existen.
- Ver qué datos y acciones hay.
- Ver estados funcionales.
- Comparar antes/después.

Uso incorrecto:

- Copiar layout actual.
- Calcar UI actual.
- Importarlos como pantallas finales.

### Referencias visuales

Las referencias son para sintetizar criterio, no para pegarlas como collage.

Prioridad propuesta:

1. `GLASS_ORGANICO`: material, atmósfera, profundidad.
2. `FICHA_EDITORIAL`: jerarquía de ficha, nombre como titular, contenido primero.
3. `DASHBOARD_FONDERO`: precisión operativa, densidad premium, dark tech.

Secundarias:

- `AGENTE_VOZ`: futuro del buscador/orbe.
- `GRID_PLATILLOS`: futuro con fotos reales de platillos.
- `REDES_LANZAMIENTO`: share/export y marketing.

---

## 3. Plantilla Figma: criterios de selección

Si se usa una plantilla de comunidad, debe servir como **infraestructura**, no como estética final.

Una buena plantilla ayuda si trae:

- iPhone frames correctos.
- iOS status/nav bars editables.
- SF Symbols o icon set limpio.
- Auto-layout bien armado.
- Components con variants.
- Prototype links/states.
- Variables/tokens de color y spacing.

Una mala plantilla estorba si trae:

- Gradientes genéricos.
- Cards de SaaS/web.
- Paleta ajena.
- Componentes no agrupados.
- Screenshots o mockups decorativos.
- Estilos imposibles de implementar en React Native.

Query sugerida para buscar en Figma Community:

- `iOS 18 UI kit`
- `Apple design system mobile`
- `iOS app UI kit auto layout`
- `Liquid glass iOS UI kit`
- `mobile app design system`

No buscar primero "food app". Eso empuja a UI genérica de restaurantes/delivery, que Patio no es.

---

## 4. Estructura correcta del archivo Figma

El archivo no debe ser un flowchart con cajitas. Debe ser un sistema navegable.

### Página 00 — Direction

- Lockup de marca: `¿Qué hay hoy?` / `Saaaaaaabes.`
- Tesis visual.
- Paleta cerrada.
- Referencias sintetizadas en principios, no screenshots pegados.
- Reglas no negociables.

### Página 01 — Components

Componentes reales, agrupados y movibles:

- `AppFrame`
- `GlassTopBar`
- `SearchGlass`
- `BottomSheet`
- `PatioRow`
- `ActionCircle`
- `PrimaryButton`
- `Pill`
- `FonderoTabBar`
- `CaptureHero`
- `MenuSection`
- `EditableMenuItem`
- `SharePoster`

Cada componente debe tener variantes cuando aplique:

- default / active / disabled
- light / dark
- collapsed / expanded
- empty / filled

### Página 02 — Foodie Flow

Frames iPhone completos, en orden:

1. `index / role picker`
2. `explorar / default`
3. `explorar / search active`
4. `explorar / patio selected`
5. `patio detail`
6. `favoritos`
7. `cuenta`

### Página 03 — Fondero Flow

Frames iPhone completos, en orden:

1. `index / fondero login`
2. `foto-menu / idle`
3. `foto-menu / processing`
4. `menu / editor`
5. `preview / poster`
6. `share / export`
7. `perfil`

### Página 04 — Specs

- Tokens.
- Spacing.
- Blur intensities.
- Animation notes.
- Implementation mapping to React Native components.

---

## 5. Component rules

### AppFrame

- Size: iPhone 390x844 for main mockups.
- Background: `bg`.
- Safe areas visible but quiet.
- Everything inside grouped; moving a screen moves the whole screen.

### GlassTopBar

- Use when controls float above map or content.
- One unified glass container beats loose icons.
- Radius: 24-32.
- Border: hairline.
- Fill: translucent surface.
- Icons: monochrome, no orange unless active/brand moment.

### SearchGlass

- Primary affordance for Foodie.
- Height: 56.
- Radius: 28.
- Left: search text.
- Right: mic/action circle.
- Placeholder: "Buscar mole, tacos..."
- Future: can evolve into `AGENTE_VOZ`, but not yet.

### BottomSheet

- The sheet is the main surface for Foodie decisions.
- Collapsed and expanded states.
- Radius top: 32-36.
- Handle: tiny, subtle, not chunky.
- Content should begin with decision data, not decorative headings.

### PatioRow

One row equals one decision.

Structure:

- Name, `Fonts.brand`, 17-18, 900.
- Meta, 12-13, 300: `Tipo · zona/calle`.
- Price, right aligned, 14-15, 900.
- Optional state badge only if actionable: `Abierto`, `Nuevo hoy`, `Queda poco`.

Never:

- repeated rating stars in every row.
- numeric circles that compete with name.
- orange labels everywhere.

### ActionCircle

- For save/share/back/route secondary actions.
- 44-52 px.
- Glass/surface.
- Icon-only.
- Tooltip not needed in mobile mockup; label via context.

### PrimaryButton

- Solid dark in light mode.
- Solid light in dark mode.
- Radius 18-22.
- Text 15-16, 900.
- Used for the one action that advances the flow.

### CaptureHero

- Fondero's main action.
- It should feel like a premium operational hub, not dashed upload box.
- The camera gesture may use orange because it is a Patio/AI moment.
- Secondary actions are lower contrast.

### MenuSection

- Section card or grouped area.
- More spacing between sections, dense rows inside section.
- Preserve price block behavior during implementation.
- Drag handles hidden or quiet unless editing/reordering.

---

## 6. Screen blueprints

## 6.1 `/explorar` — Foodie map

Intent:

User asks: "Qué hay cerca hoy?"

Visual structure:

- Full-screen pale map.
- Top glass bar with location/context and account/favorites actions.
- SearchGlass floating near top.
- Minimal ambient suggestion pills.
- Radar/spinner centered on map only while idle/loading.
- BottomSheet with nearby results.

Hierarchy:

1. Search.
2. Map/pins.
3. Nearby sheet.
4. Secondary controls.

States:

- default idle.
- searching.
- results.
- patio selected.
- keyboard open.

Signature details:

- Pins are small, confident, orange.
- Radar is tech glow, not playful dots.
- Sheet rows are editorial and scannable.
- No ratings spam.

## 6.2 `/patio/[id]` — Foodie detail

Intent:

User decides whether to go.

Visual structure:

- Map still visible as spatial context.
- Expanded bottom sheet/card.
- Fondita name as hero.
- "Hoy hay" menu immediately after identity.
- Price block subordinated but clear.
- Action row: save/share as circles, route as primary.

Hierarchy:

1. Fondita name.
2. What is available today.
3. Price / viability.
4. Route / share / save.

Signature details:

- Editorial ficha, not restaurant profile.
- Name has dignity.
- Menu is the product.
- Route stays in-app as future direction, even if current implementation opens Maps.

## 6.3 `/foto-menu` — Fondero capture hub

Intent:

Fondero publishes today's menu with minimum effort.

Visual structure:

- Calm top identity: "Tu menú de hoy".
- CaptureHero as dominant gesture.
- Big camera action.
- Secondary gallery/manual options below.
- Bottom Fondero nav quiet, not orange-heavy.

Hierarchy:

1. Camera action.
2. Gallery upload.
3. Manual/template fallback.
4. Profile/nav.

Signature details:

- Orange may appear in the camera/AI gesture.
- No dashed upload box.
- Processing state should feel Linear/Tesla: precise, quiet, confident.

## 6.4 `/menu` — Fondero editor

Intent:

Fondero reviews and edits what will be public.

Visual structure:

- Header: "Menú" + status/date.
- Section cards or grouped bands.
- Menu items dense inside each section.
- Price aligned right.
- Add actions quiet.
- Save state explicit only when changed.

Hierarchy:

1. Sections.
2. Items.
3. Price.
4. Editing chrome.

Signature details:

- This screen can be denser, because it is operational.
- It should feel like Apple Music list editing, not admin form.
- Never break the price block implementation.

---

## 7. Prototype connections

Use prototype links for real flow, not decorative arrows.

Foodie:

`index / role picker` -> `explorar / default` -> `explorar / patio selected` -> `patio detail`

Secondary:

`explorar` -> `favoritos`
`explorar` -> `cuenta`

Fondero:

`index / fondero login` -> `foto-menu / idle` -> `foto-menu / processing` -> `menu / editor` -> `preview / poster` -> `share / export`

Secondary:

`foto-menu/menu/share` -> `perfil`

---

## 8. Implementation constraints

Everything designed must be plausible in React Native + Expo:

- Use `BlurView` for glass.
- Use `Animated` for radar/loading.
- Use `react-native-maps` custom style for map.
- Avoid CSS-only effects.
- Avoid complex masking that cannot be recreated.
- Use local fonts only: SF Pro native + Plus Jakarta ExtraBold.

---

## 9. What "good" looks like

The redesign is good when:

- A Foodie understands the screen in one second.
- A Fondero can publish without reading instructions.
- The app feels premium but not cold.
- The UI has fewer elements but more meaning.
- The orange feels intentional.
- The screens can be implemented without rewriting the whole app.

The redesign is not good if:

- It looks like a food delivery app.
- It looks like a SaaS dashboard.
- It relies on generic cards and gradients.
- It copies the current screenshots.
- It has beautiful static screens but no implementation path.

