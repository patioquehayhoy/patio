# Patio — Brief de Rediseño en Figma

> Última actualización: 2026-06-07
> Objetivo: aterrizar una app premium, minimalista y funcional sin cambiar flujo ni paleta.
> Blueprint previo: `docs/design/REDESIGN_BLUEPRINT_V1.md`

---

## 1. Decisión de herramienta

**Recomendación:** Figma.

Motivo: Patio ya tiene flujo funcional y screenshots reales. Lo que falta no es inventar producto, sino homologar sistema visual: tokens, componentes, jerarquía, glass, spacing, estados y pantallas. Figma permite ver consistencia pantalla por pantalla antes de tocar React Native.

Claude Design o herramientas generativas pueden servir para exploración, pero el sistema final debe quedar en Figma o en este repositorio con specs exactas.

---

## 2. Reglas no negociables

- Mantener la paleta actual de `lib/colors.ts`.
- No introducir amarillo ni segundo acento cálido.
- Mantener `Saaaaaaabes.` literal.
- Mantener Foodie y Fondero separados.
- No tocar el bloque de precio de `menu.tsx` al implementar.
- Respetar React Native + Expo: `Animated`, `BlurView`, `react-native-maps`.

---

## 3. Paleta cerrada

| Token | Light | Dark | Uso |
|---|---|---|---|
| `bg` | `#F8F8F5` | `#111214` | Fondo principal |
| `surface` | `#FFFFFF` | `#1B1C20` | Cards, inputs, paneles |
| `surface2` | `#F6F4EE` | `#24262C` | Superficie secundaria |
| `text` | `#1C1C1E` | `#F5F5F0` | Texto principal |
| `textSecondary` | `#70757F` | `#9A9CA3` | Metadata |
| `accent` | `#F2612F` | `#FF6A3D` | Acento Patio |
| `border` | `#E9E5DD` | `#2C2F36` | Hairlines |
| `button` | `#1C1C1E` | `#F5F5F0` | Botones primarios |

---

## 4. Dirección visual

**Patio debe sentirse como Apple Tahoe aplicado a fonditas CDMX:** calmado, premium, legible, con profundidad sutil y humanidad local.

- Jerarquía por peso y escala, no por más colores.
- Corners continuos/squircle en sheets, cards y controles.
- Glass más integrado: superficies flotantes translúcidas con borde hairline.
- Menos ruido: eliminar ratings repetidos, pills sin función e iconos sueltos.
- Más densidad con respiro: listas compactas, pero con grupos claros.
- El menú del día debe subir en jerarquía: Patio responde "qué hay hoy".

---

## 5. Pantallas a diseñar primero

1. `/explorar`: mapa, buscador, top controls, spinner/radar, sheet de resultados.
2. `/patio/[id]`: ficha editorial, menú primero, acciones circulares/glass.
3. `/foto-menu`: hub Fondero premium, captura clara, galería secundaria.
4. `/menu`: editor con secciones respiradas, swipe actions elegantes.

Luego:

5. `/preview` + `/share`: cartel editorial, no PowerPoint.
6. `/index`: entrada Foodie/Fondero limpia.
7. `/cuenta`, `/perfil`, `/favoritos`: settings con personalidad, baja fricción.

---

## 6. Componentes base para Figma

- `AppFrame`: iPhone frame light/dark.
- `GlassTopBar`: contenedor unificado para navegación/acciones.
- `SearchGlass`: buscador + mic con affordance clara.
- `BottomSheet`: collapsed/expanded, blur, handle sutil.
- `PatioRow`: nombre, metadata, precio, estado opcional.
- `ActionCircle`: icon buttons para guardar/compartir/ruta.
- `PrimaryButton`: sólido, 14-16 radius o squircle equivalente.
- `Pill`: filtros/estados; activa con accent actual, no amarillo.
- `MenuSection`: título, items, precio, edición.
- `CaptureHero`: CTA grande para foto-menu.

---

## 7. QA que falta entender/probar

Esto sí requiere dispositivo real porque involucra sistema operativo, permisos o links:

1. Magic link Fondero: pedir link, abrirlo, confirmar que llega a `/login-callback` y entra.
2. Cámara: abrir `/foto-menu`, tomar foto, aceptar permisos y validar preview.
3. Galería: subir imagen existente y validar flujo de revisión/publicación.
4. GPS: en `/perfil`, usar "Marcar en el mapa" y confirmar lat/lng real.
5. Fondero -> Foodie: publicar menú y abrir ficha Foodie para ver que aparece.
6. Android futuro: restringir Google Maps API key antes de builds reales.

---

## 8. Criterio de éxito

La app se considera lista visualmente cuando:

- Todas las pantallas parecen parte del mismo sistema.
- El usuario entiende en 1 segundo qué hacer.
- La UI se siente premium sin parecer restaurante caro genérico.
- La fondita sigue sintiéndose local, humana y cotidiana.
- El naranja tiene intención y no grita en cada esquina.
- El diseño se puede implementar en React Native sin trucos imposibles.
