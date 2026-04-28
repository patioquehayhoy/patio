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
- `Stabil Grotesk` (Kometa) para marca, encabezados y acentos editoriales.

## Fuente de sistema (fallback multiplataforma)
- iOS: `SF Pro`
- Android: `Roboto`

## Regla operativa
- Si `Stabil Grotesk` no carga en runtime, caer automáticamente a fuente de sistema.
- Mantener métricas consistentes (line-height y tracking neutral) para evitar saltos entre iOS y Android.

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

