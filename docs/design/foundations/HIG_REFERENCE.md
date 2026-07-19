# Apple HIG — Referencia para Patio

> Extraído de Apple Human Interface Guidelines (developer.apple.com/design/human-interface-guidelines)
> Traducido a valores concretos para React Native / Expo.
> Solo incluye lo aplicable a Patio — app de descubrimiento de comida con mapa.

---

## Toque e interactividad

| Elemento | Tamaño mínimo | Nota |
|---|---|---|
| Touch target | 44×44 pt | Todo botón, pin de mapa, tab |
| Botón principal en sheet | minHeight 54 | Más aire = más confianza |
| Gap entre botones apilados | 12 pt | No juntar acciones críticas |
| Hit slop para iconos pequeños | +10 pt por lado | Usar `hitSlop` en RN |

---

## Navegación y estructura

- **Tab bar** fijo en fondo — no colapsa al hacer scroll salvo que haya contenido hero detrás
- **Sheets** en tres detents: 30% (preview), 50% (detalle), 100% (pantalla completa)
- **Back** siempre con chevron-back de 26pt, touch target 44×44
- **Modales** se presentan desde abajo, se cierran con drag down o botón X
- La acción más importante siempre en la parte inferior, dentro del pulgar (zona segura de interacción)

---

## Tipografía — escala HIG vs escala Patio

| Rol | HIG | Patio equivalente |
|---|---|---|
| Large Title | 34pt 700 | Nombre de patio: 28–32pt 900 Fonts.brand |
| Title 1 | 28pt 700 | Título de pantalla: 24pt 900 |
| Title 2 | 22pt 700 | Subtítulo de sección: 18pt 900 |
| Body | 17pt 400 | Cuerpo: 15–16pt 300 |
| Caption 1 | 12pt 400 | Labels de sección: 11pt 900 UPPERCASE |
| Caption 2 | 11pt 400 | Metadata: 13pt 300 opacity 0.6 |

**Regla Patio:** el sistema solo usa 900 (títulos) y 300 (cuerpo). El contraste de peso ES la jerarquía.

---

## Safe Area

```ts
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();

// Container principal
<View style={{ paddingTop: insets.top }}>

// Bottom sheet / tab bar
<View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>

// Botones flotantes sobre mapa
bottom: insets.bottom + 16
```

- Dynamic Island / notch: siempre `paddingTop: insets.top`
- Tab bar: `paddingBottom: insets.bottom` ya lo maneja expo-router
- Botones flotantes sobre mapa: `bottom: insets.bottom + 16`, `right: 16`

---

## Mapa y controles

- Controles de zoom/ubicación: esquina inferior-derecha, `bottom: insets.bottom + 80`
- Search bar sobre mapa: fijo en top con `paddingTop: insets.top + 8`
- Pin de mapa — tamaño visual 10–12pt, touch target 44×44 (padding invisible)
- Bottom sheet de resultados: empieza en ~35% de pantalla (detent 1)
- Al seleccionar un pin: sheet sube a ~55% (detent 2) mostrando detalle

---

## Sheets y bottom panels

| Propiedad | Valor HIG | Patio |
|---|---|---|
| Corner radius | 12pt | 28–32pt (más redondeado = más editorial) |
| Grab handle ancho | 36pt | 36pt ✓ |
| Grab handle alto | 4–5pt | 4pt ✓ |
| Grab handle color | rgba(0,0,0,0.18) | rgba(0,0,0,0.10) claro / rgba(255,255,255,0.16) oscuro ✓ |
| Padding horizontal | 16pt | 24pt (más aire) |
| Shadow | opacity 0.1 | opacity 0.08 claro / 0.20 oscuro ✓ |

---

## Empty states

HIG define: ilustración + título + descripción + acción primaria (opcional).

```
[ícono — 62–68pt en círculo hairline]
[Título — 19–21pt 900]
[Descripción — 14–15pt 300 textSecondary textAlign center]
[CTA — solo si hay una acción clara y útil]
```

- No poner más de una acción en empty state
- El texto describe qué va a pasar cuando haya contenido, no "no hay nada"
- Ejemplo Patio: "Cuando más fonderos publiquen menú, Patio lo va a encontrar aquí" ✓

---

## Colores y opacidades HIG útiles

| Token | HIG default | Patio equivalente |
|---|---|---|
| Separadores | rgba(0,0,0,0.10) | t.border (hairlineWidth) |
| Texto secundario | rgba(0,0,0,0.50) | t.textSecondary |
| Surface card | #FFFFFF / #1C1C1E | t.surface |
| Fondo de app | #F2F2F7 / #000000 | t.bg (`#F8F8F5` claro) |
| Tint/accent | #007AFF | t.accent (`#F2612F` light / `#FF6A3D` dark) |

---

## Gestos estándar esperados

- **Swipe down** en sheet → cierra
- **Swipe left** en lista → acción secundaria (favorito, eliminar)
- **Long press** en item → menú de contexto
- **Pull to refresh** en listas con contenido dinámico
- **Tap outside modal** → cierra

Implementar al menos swipe-down en sheets. Los otros son deseables cuando el contenido sea real.

---

## Anti-patrones HIG a evitar en Patio

- ❌ Botones debajo del 70% de pantalla en landscape (no aplica — Patio es portrait-only)
- ❌ Más de 5 tabs (Patio tiene 4: Explorar, Buscar, Favoritos, Perfil — ok)
- ❌ Texto menor a 11pt
- ❌ Contraste texto/fondo menor a 4.5:1 (verificar con `textSecondary` en modo oscuro)
- ❌ Touch targets menores a 44×44 — revisar pins de mapa y botones de share/rating
- ❌ Animaciones mayores a 400ms (estándar Patio: 200ms)
- ❌ Scroll horizontal sin indicador visible de que hay más contenido

---

## Alta y formularios secuenciales — contrato Patio

- Navegación superior: back/cierre con hit target mínimo de 44×44; el icono y el
  indicador del paso actual pueden usar `t.accent` como tinta de orientación.
- Botón primario: compacto, neutral y reconocible. El naranja se reserva para
  selección/progreso; no usar un rectángulo naranja dominante como salida por
  defecto de cada paso.
- Campos: label persistente + control. El placeholder ayuda a dar formato, pero
  nunca sustituye el nombre del campo.
- Hora: `DateTimePicker` con `display="compact"` en iOS, montado junto al día y al
  valor que modifica. El popover del sistema sustituye cualquier sheet manual y
  se remonta tras una pausa breve para confirmar el valor y cerrarse.
- Ubicación: pedirla en el paso donde se explica que coloca el negocio en el mapa;
  ofrecer ubicación actual y dirección manual.
- Celebración: la identidad dinámica principal (nombre del negocio) se centra con
  `StyleSheet.absoluteFillObject + alignItems/justifyContent: center`, sin offsets
  derivados del bloque inferior. El contenido operativo se ancla abajo.
- Introducción: presenta el valor compartido y termina en una puerta de intención.
  Notificaciones se solicitan solo después de elegir explorar; publicar omite el
  permiso y continúa al acceso/alta del negocio.
- Consistencia: alta y perfil importan el mismo editor de horario y pagos.
