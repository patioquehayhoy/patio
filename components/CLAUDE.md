## Precio del día en menu-composer.tsx — NO TOCAR

> Corregido 2026-08-14 tras auditoría: `app/menu.tsx` dejó de ser el editor de
> precio hace tiempo (hoy es el selector "¿Cómo quieres empezar?"); la ley
> seguía apuntando a un archivo que ya no tenía ese bloque. El editor real de
> precio vive en `components/menu-composer.tsx` (`dayPriceField`/
> `dayPriceCurrency`/`dayPriceInput`, líneas ~364-366) — esta entrada ahora
> protege esa ubicación real.

El bloque del precio del día en `components/menu-composer.tsx` tiene esta
estructura exacta que NO debe modificarse sin decisión explícita:
- `dayPriceField`: contenedor `flexDirection row`, `alignItems center`, `justifyContent flex-end`, sin `paddingVertical`
- `dayPriceCurrency` (Text del signo `$`): `fontSize 15`, `fontWeight '700'`
- `dayPriceInput` (TextInput): `fontSize 17`, `fontWeight '700'`, `height 44`, `paddingVertical 0`

El precio por platillo (`dishPrice`/`inlinePrice`, mismo archivo) es un bloque
distinto y no está cubierto por esta ley — solo el precio del día.

Si se edita `menu-composer.tsx` por cualquier razón, verificar que este bloque
no haya cambiado antes de guardar.
