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

## Glass y superficies flotantes

Panels flotantes (sheets, bottom bars, overlays, controles sobre mapa) deben usar `BlurView` de `expo-blur`, nunca fondo sólido:
- `intensity`: `20` (claro) / `16` (oscuro)
- `tint`: `"light"` o `"dark"` según tema
- Borde encima del blur: `borderWidth StyleSheet.hairlineWidth`, `borderColor rgba(255,255,255,0.18)` en claro — `rgba(255,255,255,0.10)` en oscuro
- Sombra: `shadowOpacity 0.08` claro / `0.20` oscuro, `shadowRadius 32`, `shadowOffset { width:0, height:12 }`
- Cards de contenido (menú, lista) NO usan blur — fondo `t.surface` normal

## Gradientes

Usar `LinearGradient` de `expo-linear-gradient` para:
- Overlay de velo sobre mapa: de `rgba(0,0,0,0)` a `rgba(0,0,0,0.18)` (bottom-to-top)
- Fondos de hero/header en fichas: mismo color del bg ± 6% luminosidad
- Nunca gradiente visible en cards de contenido ni en inputs

## Líneas y separadores

- **Todos** los bordes internos: `StyleSheet.hairlineWidth` sin excepción
- Color de borde en claro: `rgba(0,0,0,0.08)` — en oscuro: `rgba(255,255,255,0.10)`
- `borderWidth 1` solo en botones de contorno primarios
- Separadores de lista: `StyleSheet.hairlineWidth`, nunca `height 1`

## Tipografía — jerarquía visual

- Títulos de pantalla: `fontSize 32`, `fontWeight '900'`, `letterSpacing -0.5`
- Labels de sección: `fontSize 11`, `fontWeight '900'`, `letterSpacing 1.8`, `UPPERCASE`
- Metadata/subtítulo: `fontSize 13`, `fontWeight '300'`, `opacity 0.6`
- El contraste 900 vs 300 es el mecanismo principal de jerarquía — evitar pesos intermedios

## Radios y geometría

- Sheets y panels grandes: `borderRadius 28-32` (solo esquinas superiores cuando están pegados al borde)
- Botones de acción flotantes (cuadrados): `borderRadius 16`
- Pills y cápsulas de estado: `borderRadius 100`
- Cards de contenido: `borderRadius 20`

## Convenciones de código

- Estilos en `makeStyles(t: Theme)` que recibe el tema — nunca hardcodear colores fuera de paleta
- Nombres de sección en `UPPERCASE` con `letterSpacing`
- Animaciones con `Animated` de React Native, duración estándar `200ms`
- Importar `BlurView` de `expo-blur` y `LinearGradient` de `expo-linear-gradient` cuando aplique
