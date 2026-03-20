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
| ORANGE  | `#FF5E00` | Acento principal, CTAs, labels de sección |
| BONE    | `#FFF7E0` | Fondo claro, thumb del toggle            |
| DARK    | `#3D1F00` | Fondo oscuro (dark mode), texto principal |
| GRAY    | `#9E3F00` | Texto secundario, placeholders, iconos   |

## Componentes

- **Botones primarios**: `borderRadius 14`, fondo `ORANGE`, texto blanco `fontWeight '900'`
- **Botones de contorno**: `borderWidth 1.5`, `borderColor` blanco o ORANGE, fondo transparente
- **Segmented control**: `borderRadius 14`, `borderWidth 1`, `borderColor rgba(255,94,0,0.4)`, `overflow hidden`
- **Separadores**: `StyleSheet.hairlineWidth`, color `t.sep`
- **Placeholders**: `rgba(255,94,0,0.2)`

## Convenciones de código

- Estilos en `makeStyles(t: Theme)` que recibe el tema — nunca hardcodear colores fuera de paleta
- Nombres de sección en `UPPERCASE` con `letterSpacing`
- Animaciones con `Animated` de React Native, duración estándar `200ms`
