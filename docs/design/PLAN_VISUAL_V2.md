# Plan visual — Aterrizar el look de Figma v02 en la app

> **Meta:** que la app real (ya en TestFlight) se VEA como el diseño de Figma v02.
> La función ya existe; esto es solo capa visual. Se trabaja en **rama nueva**.
> Decidido 2026-06-15. Fuente del look: `design-source/figma-make/v02/`.
>
> **Método:** simulador primero (gratis, en vivo), TestFlight solo al final con
> varias pantallas listas. Tokens base → luego pantalla por pantalla.

---

## Fase 0 — Rama y arranque

- Crear rama nueva desde `v2-menu-vivo` (ej. `v2-look-figma`). No tocar la app actual.
- Levantar simulador (`npx expo run:ios` la 1ª vez, luego `npx expo start --ios`).
- Alejandro ve los cambios en el simulador; es nuestros ojos.

---

## Fase 1 — Tokens base (el cimiento, mejora todas las pantallas de golpe)

Comparación real Figma v02 vs `lib/colors.ts` actual. **La mayoría ya coincide**
(bg, surface, accent). Solo hay que ajustar lo siguiente:

| Token | Hoy en app | Figma v02 | Acción |
|---|---|---|---|
| `text`/ink | `#1C1C1E` | `#111214` | Ajustar a `#111214` (negro más editorial) |
| `textSecondary`/ink-soft | `#70757F` | `#4A4A47` | Ajustar (gris más cálido, menos azulado) |
| `ink-mute` (captions) | — | `#8A8A85` | **Agregar** (no existe) |
| `border`/line | `#E9E5DD` | `rgba(17,18,20,0.08)` | Cambiar a línea translúcida (más fina/moderna) |
| `bgDark` | `#111214` | `#0a0b0d` | Oscurecer un punto |
| `accent` | `#F2612F` | `#F2612F` | ✅ ya correcto |
| `accent-soft` | — | `#FBE7DD` | **Agregar** (fondos tibios, chips "elige uno") |
| `glass` | — | `rgba(255,255,255,0.62)` | **Agregar** (capas glass) |

**Tokens nuevos que la app NO tiene y Figma sí** (agregar a `lib/theme`):
- **Radios:** chip `14` · card `18` · sheet `28` · phone `44`
- **Espaciado base-4:** 4 / 8 / 12 / 16 / 22 / 32 / 56
- **Tipografía editorial (SF Pro):** display 48/800 · title 36/800 · section 22/700 ·
  body 15/400 · eyebrow 11/700 UPPERCASE · caption 12/500
- **Motion:** sheet spring (stiffness 380, damping 32) · press scale 0.96/120ms ·
  enter editorial (opacity+y12, 320ms) · pin pulse (1.08, 1.8s loop)

> ⚠️ Conciliar con `CLAUDE.md` y `DESIGN_SYSTEM.md`: algunos valores ahí difieren
> (ej. border `hairlineWidth`, pesos 900/300). Resolver: actualizar la biblia a
> los tokens de v02, que es la fuente cerrada. Ajuste de regla, no improvisación.

**Resultado de la Fase 1:** sin tocar ninguna pantalla, toda la app adopta el
color, tipografía y geometría de Figma. Se valida en simulador antes de seguir.

---

## Fase 2 — Componentes base (11 primitivos = 90% de la app)

Crear/ajustar los primitivos que Figma identificó (`TokenExport.tsx`), en
`components/`. Cada pantalla luego se arma con estos:

`ButtonAccent` · `ButtonInk` · `ButtonGlass` · `ChipFilter` · `GlassCard` ·
`MenuRow` · `CourseInput` · `PinPrice` · `BottomSheet` · `StatusDot` · `EyebrowLabel`

Muchos ya existen parcialmente en la app — se homologan al look v02, no se duplican.

---

## Fase 3 — Pantalla por pantalla (orden por impacto)

Cada una: traducir layout/look de v02 manteniendo la lógica/Supabase intactos.

1. **`menu.tsx` (editor Fondero)** — aplicar look v02 + **FIX TOC: agrupar platillos
   por sección** (Entrada/Guisado/...) en filas compactas, no tarjeta gigante por
   platillo. Menos scroll. El bloque de precio del día arriba (ya arreglado en v02).
2. **`patio/[id].tsx` (ficha Foodie)** — hero con imagen botánica + degradado,
   menú compacto agrupado, trust signals, glass en sheet.
3. **`explorar.tsx`** — mapa con pins de precio, search glass, bottom sheet.
4. **`favoritos.tsx` (guardados)** — cards con miniatura + estado abierto/cerrado.
5. **`perfil.tsx` / `cuenta.tsx`** — settings con eyebrow labels y look editorial.
6. **`foto-menu.tsx`** — captura premium.
7. **`preview.tsx` / `share.tsx`** — el MenuPoster (tarjeta compartible WhatsApp).
8. **Estados:** vacío, agotado, sin internet, magic link caducado — con flores.

---

## Fase 4 — QA en simulador + build a TestFlight

- Probar flujo completo Fondero→Foodie en simulador.
- Cuando varias pantallas estén listas y probadas → **UN build EAS** → TestFlight.
- No quemar builds por pantalla; agrupar (regla de economía de builds, CLAUDE.md).

---

## Notas

- El export v02 corre como web local (`npm run dev` en `v02/`) para consultar el
  look exacto cuando haga falta.
- No se traduce el código web de Figma 1:1 (usa `<div>`/CSS); se **reescribe** en
  React Native tomando el look como referencia.
- Copy: limpiar "fondero/a" según `IDENTITY_VERBAL.md` al pasar cada pantalla.
