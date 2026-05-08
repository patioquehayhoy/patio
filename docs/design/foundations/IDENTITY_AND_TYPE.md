# Patio — Identidad y Tipografía (Base v1)

## 1) Dirección de identidad

Patio debe sentirse:
- claro
- humano
- local pero premium
- editorial, no “template app”

Principio visual: limpiar ruido, priorizar jerarquía y ritmo.

## 2) Sistema tipográfico base

## Fuente primaria
- `Plus Jakarta Sans 800ExtraBold` — implementada via `@expo-google-fonts/plus-jakarta-sans`
- Token en código: `Fonts.brand` (exportado desde `lib/theme.tsx`)
- Cargada en `app/_layout.tsx` con `useFonts` + `SplashScreen.preventAutoHideAsync`

> **Nota:** Stabil Grotesk (Kometa) es la fuente de spec original pero es comercial y no está en Google Fonts. Plus Jakarta Sans 800ExtraBold es la alternativa activa — editorial grotesca moderna, carácter similar.

## Fuente de sistema (UI)
- iOS: `SF Pro` (automático, sin declarar)
- Android: `Roboto` (automático, sin declarar)
- No declarar fuente en elementos de UI — dejar caer al sistema.

## Regla operativa
- `Fonts.brand` → solo en elementos de identidad de marca: nombre de negocio, taglines, hero text, título de pantalla principal
- UI (labels, inputs, botones, metadata, body) → fuente de sistema, sin `fontFamily`
- Si `Fonts.brand` no carga en runtime, el splash se mantiene hasta que cargue (`SplashScreen.preventAutoHideAsync`)

## 3) Escala tipográfica recomendada (v1)

- Display (marca/pantallas clave): `40/44`, peso alto
- H1: `32/36`, peso alto
- H2: `24/28`, semibold
- H3: `20/24`, semibold
- Body: `16/22`, regular
- Body compact: `15/20`, regular
- Meta/labels: `13/16`, medium
- Caption: `12/15`, regular

## Notas
- Sin kerning forzado en UI general.
- Evitar todo en mayúsculas salvo labels utilitarios cortos.
- Misma familia y tono entre iOS y Android para conservar “feeling Patio”.

## 4) Uso por contexto

- Marca (`Patio`, nombre de negocio): Stabil Grotesk bold.
- Navegación/tab labels: sistema medium.
- Formularios: sistema regular/medium por legibilidad.
- Preview para compartir: mezcla editorial (titulares) + sistema (detalle operativo).

## 5) Tokens mínimos (a implementar en tema)

- `font.brand`: Stabil Grotesk
- `font.ui`: SF Pro / Roboto
- `font.display`: 40
- `font.h1`: 32
- `font.h2`: 24
- `font.h3`: 20
- `font.body`: 16
- `font.meta`: 13

## 6) Criterio de calidad

Antes de cerrar un ajuste de UI:
1. ¿Se entiende en 2 segundos?
2. ¿Mantiene la misma jerarquía en iPhone y Android?
3. ¿Se siente editorial/Patio, no genérico?

