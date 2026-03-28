# La Fondita — Reglas de diseño

## Tipografía

- **SF Pro Display** para textos ≥ 20pt (títulos, nombre de fondita, precios)
- **SF Pro Text** para textos ≤ 19pt (labels, inputs, botones, descripciones)
- **fontWeight permitidos**: `'900'` (títulos, énfasis) y `'300'` (cuerpo, secundario) únicamente
  - Excepciones documentadas: `'500'` en nombres de platillo en preview, `'700'` en botón WhatsApp

## Espaciado

- Múltiplos de 8px: `8 | 16 | 24 | 32 | 40 | 48`
- `gap` entre elementos: `4` (compacto) o `8` (normal)
- `borderRadius` estándar: `14` para botones y cápsulas

## Campos de texto agrupados
Cuando varios campos de texto forman un bloque semántico
(nombre + descripción + ubicación), tratarlos como unidad:
- marginBottom entre ellos: 2 máximo
- Sin separadores visuales dentro del bloque
- Referencia: densidad tipográfica de Apple Music (título/artista)

## Paleta

| Token   | Hex       | Uso                                      |
|---------|-----------|------------------------------------------|
| BG      | `#EFEFEF` | Fondo principal de la app                |
| BLACK   | `#292929` | Texto principal, botones primarios       |
| WHITE   | `#FFFFFF` | Superficie, cards, inputs                |
| BLACK60 | `rgba(41,41,41,0.5)` | Texto secundario, placeholders, iconos |

## Componentes

- **Botones primarios**: `borderRadius 14`, fondo `BLACK (#292929)`, texto blanco `fontWeight '600'`
- **Botones de contorno**: `borderWidth 1.5`, `borderColor BLACK`, fondo transparente
- **Segmented control**: `borderRadius 14`, `borderWidth 1`, `overflow hidden`
- **Separadores**: `StyleSheet.hairlineWidth`, color `t.sep`
- **Placeholders**: `BLACK60`
- **Cards / inputs**: fondo `WHITE`, `borderRadius 14`

## Precio en menu.tsx — NO TOCAR
El bloque del precio tiene esta estructura exacta que NO debe modificarse:
- Contenedor: `flexDirection row`, `alignItems center`, sin `paddingVertical`
- `$` (Text): `fontSize 22`, `fontWeight 900`, `lineHeight 22`, sin padding
- TextInput: `fontSize 22`, `fontWeight 900`, `height 44`, `paddingVertical 0`

Si se edita menu.tsx por cualquier razón, verificar que este bloque no haya cambiado antes de guardar.

## Convenciones de código

- Estilos en `makeStyles(t: Theme)` que recibe el tema — nunca hardcodear colores fuera de paleta
- Nombres de sección en `UPPERCASE` con `letterSpacing`
- Animaciones con `Animated` de React Native, duración estándar `200ms`
