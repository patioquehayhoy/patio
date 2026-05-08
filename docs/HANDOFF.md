# HANDOFF

## 2026-05-07 (cierre)

### Qué se hizo hoy
- `app.json`: permisos iOS de cámara/galería en `infoPlist` + plugins `expo-image-picker` y `expo-camera` — esto desbloqueará la función de foto en el próximo build
- `app/patio/[id].tsx`: botón "Cómo llegar" en pill del mapa (abre Apple Maps en iOS, Google Navigation en Android), back button robusto con `router.canGoBack()` + fallback a `/`
- `app/manifiesto.tsx`: botón de regreso propio (ya no dependía del header nativo que fallaba), `headerShown: false` en `_layout.tsx`, tagline `"Saaaaaaabes."` restaurado
- `CLAUDE.md`: bloque "Leer primero" con referencia a `docs/` y reglas de economía de builds EAS
- `lib/patios.ts` + `app/preview.tsx`: mejoras de búsqueda multi-token y limpieza de imports

### Decisiones importantes hoy
- **"Saaaaaaabes."** es el tagline oficial de Patio — posible registro de marca. No tocar
- **EAS builds son recurso limitado**: simulador primero, build solo cuando el sim no alcanza (permisos nativos, módulos nativos)
- **docs/ es la fuente de verdad del producto** — CLAUDE.md ahora lo referencia explícitamente

### Siguiente paso exacto — TAREA OVERNIGHT
Implementar fuente Stabil Grotesk como fuente de marca en toda la app.

Referencia: `docs/design/foundations/IDENTITY_AND_TYPE.md` (sección 2 y 4)
Fuente: Kometa — Stabil Grotesk (descargar o usar via expo-font si está disponible en Google Fonts / licencia libre; si no, buscar alternativa editorial de peso similar como DM Sans o Plus Jakarta Sans)

Regla operativa:
- Títulos de pantalla, nombre de negocio, hero text → Stabil Grotesk Bold
- UI general (labels, inputs, botones, metadata) → SF Pro (sistema, sin cambio)
- Fallback automático a SF Pro si la fuente no carga en runtime
- Implementar en `lib/theme.ts` como token `font.brand`
- Aplicar en: `app/explorar.tsx` (título selected), `app/patio/[id].tsx` (nombre del patio), `app/manifiesto.tsx` (intro), `app/index.tsx` (pantalla de entrada)
- NO aplicar en formularios, inputs ni metadata secundaria

Criterio de éxito: `npx tsc --noEmit` en verde, la fuente carga sin crash en simulador, fallback funciona si se comenta el import de la fuente.

### Pendiente que viene del historial
- Viewport filtering en `explorar.tsx` (`onRegionChangeComplete`)
- Permisos de cámara/galería (requieren build — no sirve hot reload)
- Conectar Patios/Buscar/Favoritos a Supabase
- API key Google Maps para Android

## 2026-04-28 (cierre)
- Push realizado a `origin/v2-menu-vivo` con commit `36fb33c`.
- `app/preview.tsx`: estado vacío de `Compartir` quedó sin CTAs (solo icono + leyenda), con composición más compacta.
- Se redujo alto/padding vertical para evitar card gigante.
- Verificación de perfiles: Foodie (`app/cuenta.tsx`) y Fondero (`app/perfil.tsx`) siguen activos.
- `npx tsc --noEmit` en verde al cierre.

## Siguiente paso exacto
- Abrir simulador en `Compartir` con menú vacío y hacer microajuste final si aún se percibe descentrado:
  - `shareCardEmpty.minHeight`
  - `scrollBodyEmpty.minHeight`
  - `emptyWrap.paddingVertical`
- Si hay ajuste, volver a correr `npx tsc --noEmit`, commit y push.

## 2026-04-26 (sesión 2)
- `app/explorar.tsx`: mapa vivo — búsqueda inline en topBar (sin navegación a pantalla separada), pins reactivos (punto pequeño neutral → ring completo al seleccionar), `showHeader`/`selectedId` desacoplados (header solo al tocar explícitamente), `tracksViewChanges={true}` con keys estables (resuelve crash al escribir), `MapView.onPress` deselecciona.
- `app/cuenta.tsx`: rediseño completo — sheet modal con `presentation: 'transparentModal'` + BlurView backdrop (mapa visible/blureado detrás), botón X circular, identidad compacta, sin labels de sección, rows 52pt, "Cerrar sesión" neutral, "Tengo un negocio →" ghost link.
- `app/buscar.tsx`: texto genérico ("lo que se te antoja") — elimina referencia a "platillo".
- Filosofía formalizada: 4 principios del producto completados (ver GOAL.md).
- Decisión de escala de mapa: viewport filtering para MVP → clusters cuando haya 50+ patios por zona.

## 2026-04-26
- `patio/[id].tsx`: mapa real con `MapView` + pin consistente con `explorar`. Corazón de favoritos funcional (carga estado al abrir, persiste en AsyncStorage).
- `explorar.tsx`: design pass — `BlurView` en botones flotantes y sheet, `LinearGradient` como velo del mapa, bordes `hairlineWidth` con opacidad baja, sombras reducidas.
- Instalados `expo-blur` y `expo-linear-gradient` (SDK 54 compatible).
- `CLAUDE.md` actualizado con specs de implementación: glass, gradientes, líneas finas, jerarquía tipográfica, radios.

## Hecho
- Se auditó el repo completo (rutas, librerías, stores, servicios y scripts).
- Se documentó objetivo, arquitectura y estado operativo real del proyecto.
- Se definió una operación de continuidad multi-agente basada en docs dentro del repo.
- Se refactorizó `app/login-callback.tsx` para soportar `code`, `token_hash` y `token`, con fallback de sesión e inicialización vía `initializeSignedInUser`.
- Se corrigió el error de typecheck en `app/_layout.tsx`; `npx tsc --noEmit` queda pasando.
- En `app/menu.tsx` se movió el acceso a foto a un botón redondo centrado estilo HIG (64px, `camera.fill`) y se retiró la cámara inline de la primera sección.
- En `app/preview.tsx` se corrigió la detección de vacío para basarse en platillos reales y se agregó empty state con icono `doc.text` + CTA “Ir al menú”.
- En `app/preview.tsx` se evitó mostrar subtítulo duplicado cuando una sección tiene el mismo nombre del grupo (ej. `MENÚ DEL DÍA`).
- En `app/menu.tsx` y `app/foto-menu.tsx` se agregó prefijo visual `$` en campos de precio de sección y platillo.
- El botón de agregar en secciones de bebidas ahora muestra `+ agregar bebidas`.
- En `app/foto-menu.tsx` se eliminó el ícono de cámara dentro de la primera sección en review y se removió el badge `IA`.
- En `app/menu.tsx` y `app/foto-menu.tsx` las cards de platillo regresaron a fondo blanco y se ajustó alineación visual de precios a la derecha.
- En `app/preview.tsx` se dejó de destacar `MENÚ DEL DÍA` en naranja y se migró parsing de precios desde descripción a precio de item visible.
- Se reforzó layout para anclar bloque de precio al extremo derecho y mantener consistencia con botón `×` en cards de sección/platillo.
- Se añadió empty onboarding state en `app/menu.tsx` para escenario sin secciones (evita pantalla vacía).
- Se reemplazó iconografía de cámara en `foto-menu` idle por icono de cámara consistente y color accent.
- Se homologó `+ agregar platillo` en `app/menu.tsx` y `app/foto-menu.tsx` con alineación izquierda y estado presionado gris.
- Se ajustó el ícono de cámara en `app/foto-menu.tsx` (idle) para usar color accent y mejor consistencia visual/posición.
- Se limpiaron imports no usados en `app/foto-menu.tsx` (lint).
- Se cambió `app/menu.tsx` para iniciar vacío/onboarding cuando no hay menú guardado (sin autogenerar secciones).
- En `app/menu.tsx`, `Crear secciones sugeridas` ahora abre modal de selección por pills (estilo “widgets”) antes de crear secciones.
- Se compactó el layout del bloque de precio en encabezado/platillo para pegar más el `$` al extremo derecho junto al valor y la `×`.
- Se aplicó transparencia al CTA `+ agregar platillo / + agregar bebidas`.
- Se refinó el modal de plantillas con heurística por tipo de negocio y UI HIG (sin copy literal de widgets): plantillas `Fondita`, `Taquería`, `Repostería`, `Mariscos`, `Personalizado`.
- Se corrigió la selección visual invertida: seleccionado ahora usa fondo accent y texto blanco.
- En `app/menu.tsx` se eliminó el espacio visual sobrante entre `$` y número, compactando el bloque de precio junto a la `×` (`$0x`).
- En `app/menu.tsx` el header de sección quedó alineado a base inferior y sin kerning en títulos; además se añadió separación tipo tab entre título y bloque de precio.
- En `app/menu.tsx` se aplicó rediseño de platillo card estilo referencia (sin slash, nombre+descripción en columna izquierda, precio junto a `×` con color homogéneo).
- En `app/preview.tsx` se simplificó render de compartir para filas limpias de platillo (sin encabezados de sección), manteniendo precio al lado derecho.
- En `app/menu.tsx` y `app/foto-menu.tsx` se migró `×` a botón circular para mejorar usabilidad táctil; se retiró la palomita en `menu` y se dejó handle discreto.
- Se refinó interlineado de tipografía en cards para reducir sensación de “texto suelto” y acercar ritmo visual a HIG.
- En `app/menu.tsx` se removió el estilo circular de `×` y se reubicó `×` de platillo a esquina superior derecha (clean look, menos ruido).
- En `app/menu.tsx` y `app/foto-menu.tsx` se compactó la composición de cards a patrón lista (separadores hairline, menos contenedor interno), manteniendo edición inline.
- En `app/menu.tsx` se reemplazó “secciones incluidas” por checklist estable con checkboxes (no desaparece al deseleccionar) y botón de crear con estado disabled cuando no hay selección.
- En `app/preview.tsx` se recuperó la jerarquía real de compartir: título de grupo, encabezado de sección y precio de sección visible/alineado a la derecha.
- En `app/preview.tsx` se dio ancho consistente a la columna de precios para que no salte entre sección y platillo.
- En `app/foto-menu.tsx` se limpió ruido textual de Vision (`menu/menú`) antes de persistir nombre/descripción.
- En `app/preview.tsx` se añadieron sub-bullets automáticos cuando la descripción de un platillo trae variantes separadas.
- Se corrigieron los refs tipados de `Swipeable` en `app/foto-menu.tsx`; `npx tsc --noEmit` vuelve a pasar.
- Arrancó V3 MVP de ubicación: `app/perfil.tsx` ya permite decidir si la dirección se muestra.
- En `app/preview.tsx` la dirección visible ahora tiene CTA `Abrir en Maps`.
- El deep link de Maps usa Apple Maps en iOS y Google Maps web search en Android.
- En `app/perfil.tsx` se pulió jerarquía/espaciado de la sección de negocio.
- En `app/perfil.tsx` el giro del negocio dejó de ser una fila de pastillas y ahora es una ruleta vertical tipo picker con snap al centro.
- En `app/perfil.tsx` la sección `Operación` quedó como bloque minimalista tipo Settings: apertura, cierre y métodos de pago agrupados.
- `app/perfil.tsx` quedó sin warnings de lint; queda pendiente solo el warning conocido de `app/onboarding.tsx`.
- Se actualizó `docs/GOAL.md` con filosofía V3: Patio debe hacer evidente la siguiente acción, no entregar datos para que el usuario piense de más.
- Dirección de producto V3: experiencia principal tipo foodie/exploración, con acceso de negocio discreto tipo Uber; evitar un switch visible permanente Foodie/Fondero.
- Ratings iniciales: 5 estrellas con feedback estructurado si baja de 5; no iniciar con reseñas abiertas ni señales complejas.
- Se añadió principio de eficiencia: IA por lote con salida estructurada, validaciones determinísticas en código/backend y cache cuando no cambió el input.
- Se añadió principio de mapa eficiente: evaluar H3/geohash/S2, usar celdas/zonas y precisión bajo demanda en vez de tracking fino permanente.
- Se creó `app/explorar.tsx`: home Foodie inicial con mapa liviano, pins seleccionables, filtros simples y Top 10 curado/mock.
- `app/explorar.tsx` fue rediseñado a estructura full-bleed tipo dashboard logístico: mapa como superficie principal, controles flotantes y bottom sheet inferior.
- Se actualizó `app/index.tsx`: `Busco comida` entra a Explorar; `Tengo un negocio` revela el login de fondero. Desde Explorar el acceso de negocio es discreto.
- Se limpió `app/onboarding.tsx`: fuera reset forzado de AsyncStorage y warning de hook. `npm run lint` queda limpio.
- Se quitó de `app/perfil.tsx` el toggle `Mostrar ubicación`; `app/preview.tsx` muestra dirección/Maps si existe dirección, sin depender de `direccion_visible`.
- `app/explorar.tsx` ahora usa 5 Patios mock reales de Irrigación/Miguel Hidalgo: Cochitacos, Cíntora Taquería, Don Bonachón, AAATTACO y Restaurante Vianca.
- Se refinó el bottom sheet de `Explorar` con cápsula glass de lugar seleccionado, tomando la nueva referencia visual.
- `Explorar` cambió `Top 10` por `Cerca de ti`, con ratings fake 5.0 y horarios fake; recomendaciones/top queda como apartado futuro.
- `Explorar` se simplificó: fuera zoom fake, fuera botón tienda/switch visible, fuera contador flotante; queda menú/cuenta, búsqueda, favoritos y expandir mapa/lista.
- Se creó `lib/patios.ts` con 5 Patios mock de Irrigación/Miguel Hidalgo y menú estructurado por platillos/tags.
- Se creó `app/patio/[id].tsx` como `Ficha de Patio`: menú de hoy como contenido principal, detalles mínimos y mapa mock.
- Se creó `app/buscar.tsx` con búsqueda por platillo dentro del menú, no por nombre de negocio. Ejemplos: `mole`, `enchiladas`, `anis`, `tacos`.
- Se creó `lib/favorites.ts` con persistencia local de favoritos en AsyncStorage.
- Se creó `app/favoritos.tsx` con lista y empty state.
- Se creó `app/cuenta.tsx` como cuenta Foodie minimalista: accesos a Buscar/Favoritos, Soporte y Sesión; se quitó `Tengo un negocio` de esta pantalla.
- Se agregó `components/agent-spinner.tsx` y se sustituyeron spinners principales de login/callback/foto-menú.
- Se instaló `react-native-maps@1.20.1` con Expo y `app/explorar.tsx` usa `MapView` real con markers custom.
- `lib/patios.ts` ahora incluye coordenadas aproximadas para los 5 Patios mock.
- Decisión vigente de costos/mapa: MVP con mapa nativo simple + pines propios, sin Places/Directions/Distance Matrix/geocoding repetido/tracking fino. Si se necesita ruta, abrir app externa de mapas.

## Pendiente
- Validar en simulador el flujo Foodie completo: mapa, búsqueda por platillo, ficha pública, favoritos y cuenta.
- Validar en dispositivo el flujo de ubicación (`perfil` -> `preview` -> `Abrir en Maps`).
- Conectar Explorar/Buscar/Favoritos a Supabase y ubicación real por zona/celda.
- Configurar API key de Google Maps restringida para Android/Google provider antes de builds Android reales; iOS puede probar con provider nativo.
- Definir estrategia de geoceldas (H3/geohash/S2) antes de tracking fino.

## Siguiente paso exacto
Probar en simulador `Busco comida -> Explorar` con `MapView` real; si el mapa no renderiza, revisar si el entorno necesita dev build por `react-native-maps`.

## Archivos tocados
- app/login-callback.tsx
- app/_layout.tsx
- app/menu.tsx
- app/perfil.tsx
- app/preview.tsx
- app/foto-menu.tsx
- app/explorar.tsx
- app/buscar.tsx
- app/cuenta.tsx
- app/favoritos.tsx
- app/patio/[id].tsx
- lib/patios.ts
- lib/favorites.ts
- components/agent-spinner.tsx
- docs/STATE.md
- docs/GOAL.md
- docs/ARCHITECTURE.md
- docs/HANDOFF.md
- docs/AGENT.md

## Decisiones vigentes
- Antes de cualquier tarea, leer: `docs/GOAL.md`, `docs/ARCHITECTURE.md`, `docs/STATE.md`, `docs/HANDOFF.md`.
- No depender del historial de chat para continuar trabajo.
- No rehacer código existente sin necesidad; extender y corregir de forma incremental.
- Al cerrar cualquier tarea, actualizar mínimo `docs/HANDOFF.md` y `docs/STATE.md` si cambió el panorama.

## Riesgos / dudas
- Aunque el callback es más robusto en código, aún falta prueba manual en dispositivo real.
- Hay cambios locales previos en el working tree que deben respetarse para no pisar trabajo en curso.
- Hay secretos/configuración sensible en el repo que conviene revisar antes de release.
