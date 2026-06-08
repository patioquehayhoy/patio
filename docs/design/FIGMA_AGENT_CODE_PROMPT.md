# Patio — Prompt para Figma Agent con contexto de código

> Última actualización: 2026-06-07
> Uso: pegar en Figma Agent cuando se quiera que construya/rediseñe Patio usando contexto del código sin perderse en todo el repo.

---

## Prompt

```text
Quiero que diseñes una app iOS llamada Patio usando el contexto de código y producto que te voy a pasar.

Importante:
No quiero que copies el código visual actual.
No quiero que conviertas screenshots en Figma.
No quiero wireframes genéricos.
Quiero que entiendas el producto, sus pantallas, componentes, datos y restricciones, y diseñes una versión high fidelity desde cero.

Nombre de la línea de diseño:
Patio Tahoe.

Dirección visual:
Apple Tahoe + glass orgánico + ficha editorial + operación Fondero premium.

Producto:
Patio conecta fonditas de CDMX con personas que quieren saber qué hay hoy de comer.
No es delivery.
No es app de restaurantes.
No es marketplace.
Compite contra la incertidumbre: “qué habrá hoy, dónde vale la pena ir, y si alcanzo antes de que se acabe”.

Marca:
Lockup principal:
¿Qué hay hoy?
Saaaaaaabes.

Regla:
“Saaaaaaabes.” no se modifica.

Roles:
1. Foodie: descubre qué hay hoy cerca. No requiere login.
2. Fondero: publica su menú de hoy en 30 segundos. Entra con magic link.

Regla:
Foodie y Fondero viven separados.

Paleta cerrada desde código:
Light:
bg #F8F8F5
surface #FFFFFF
surface2 #F6F4EE
text #1C1C1E
textSecondary #70757F
accent #F2612F
border #E9E5DD
button #1C1C1E

Dark:
bg #111214
surface #1B1C20
surface2 #24262C
text #F5F5F0
textSecondary #9A9CA3
accent #FF6A3D
border #2C2F36
button #F5F5F0

No uses amarillo.
No inventes otro acento.

Principios Apple/HIG:
- Clarity: cada pantalla se entiende en 1 segundo.
- Deference: la UI recede; contenido y mapa mandan.
- Depth: capas, glass y sheets orientan.
- Consistency: mismos patrones para mismas acciones.
- Direct manipulation: controles claros y tocables.
- Feedback: loading, processing, guardado, error y cambios pendientes visibles.
- Forgiveness: edición y publicación reversibles.
- Aesthetic integrity: Foodie exploratorio/editorial; Fondero operativo/premium.

Principios Patio:
- Lo cotidiano elevado.
- Ruido cero.
- Jerarquía por peso, escala y proximidad.
- Glass como profundidad, no decoración.
- Mapa como superficie heroica para Foodie.
- Menú del día como contenido principal.
- Fondita local, no restaurante genérico.
- Premium sin frialdad.
- Compacto con respiro.
- Implementable en React Native + Expo.

Restricciones técnicas:
- React Native + Expo.
- Glass con BlurView.
- Animación con Animated.
- Mapas con react-native-maps.
- No CSS web-only.
- No efectos imposibles de implementar.

Archivos de código/documentación relevantes:

1. app/index.tsx
   - Entrada y role picker.
   - Lockup actual: “¿Qué hay hoy?” + “Saaaaaaabes.”
   - Foodie sin login, Fondero con email/magic link.

2. app/explorar.tsx
   - Home Foodie.
   - Mapa, buscador, pins, radar, sheet de resultados.
   - Debe rediseñarse como mapa heroico con SearchGlass y BottomSheet.

3. app/patio/[id].tsx
   - Ficha de fondita.
   - Debe priorizar nombre, menú del día, precio/estado y acciones.

4. app/foto-menu.tsx
   - Home Fondero.
   - Capturar/subir foto del menú.
   - Debe sentirse como hub operativo premium.

5. app/menu.tsx
   - Editor de menú.
   - No romper el bloque de precio.
   - Debe ser denso, claro y editable.

6. app/preview.tsx
   - Preview antes de compartir.

7. app/share.tsx
   - Exportar/compartir cartel.
   - Debe sentirse como cartel editorial, no screenshot.

8. app/favoritos.tsx
   - Lista de fonditas guardadas.

9. app/cuenta.tsx
   - Settings Foodie.

10. app/perfil.tsx
   - Perfil Fondero: negocio, horario, pagos, ubicación.

11. lib/colors.ts
   - Paleta cerrada.

12. lib/theme.tsx
   - Theme runtime.

13. docs/PATIO_PRD.md
   - Fuente factual de producto.

14. docs/design/REDESIGN_BLUEPRINT_V1.md
   - Dirección y estructura del rediseño.

Pantallas a crear:
- Index / role picker
- Explorar / default
- Explorar / búsqueda activa
- Explorar / fondita seleccionada
- Patio Detail
- Favoritos
- Cuenta Foodie
- Foto Menu / idle
- Foto Menu / processing
- Menu Editor
- Menu Editor / cambios pendientes
- Preview / poster
- Share / export
- Perfil Fondero
- Login Callback / éxito-error

Componentes a crear:
- AppFrame
- GlassTopBar
- SearchGlass
- BottomSheet
- PatioRow
- ActionCircle
- PrimaryButton
- Pill
- FonderoTabBar
- CaptureHero
- MenuSection
- EditableMenuItem
- SharePoster
- StatusBadge
- EmptyState
- ProcessingState

Requisitos:
1. Diseña high fidelity, no wireframe.
2. Todo debe estar en frames iPhone completos y movibles.
3. Crea component library con nombres claros.
4. Crea variants principales.
5. Conecta prototipo:
   Index -> Explorar -> Patio Detail
   Index -> Foto Menu -> Processing -> Menu Editor -> Preview -> Share
   Fondero tabs -> Perfil / Capturar / Menú / Compartir
6. No hagas app de food delivery.
7. No uses fotos stock.
8. No uses gradientes genéricos.
9. No cambies la paleta.
10. No cambies el flujo.

Antes de diseñar, responde con 5 bullets:
qué dirección visual tomarás y por qué.
```

---

## Cómo darle código sin contaminar

No pegar todo el repo. Pegar solo:

1. `docs/PATIO_PRD.md`
2. `docs/design/REDESIGN_BLUEPRINT_V1.md`
3. `lib/colors.ts`
4. `lib/theme.tsx`
5. Los archivos de `app/` de las pantallas clave.

Orden recomendado:

1. Primero prompt completo.
2. Luego `docs/PATIO_PRD.md`.
3. Luego `REDESIGN_BLUEPRINT_V1.md`.
4. Luego `lib/colors.ts`.
5. Luego solo 2-4 pantallas al inicio: `index`, `explorar`, `patio/[id]`, `foto-menu`.

Si el agente responde bien, pasar después `menu`, `preview`, `share`, `perfil`, `cuenta`, `favoritos`.

