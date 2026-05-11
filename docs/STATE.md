# STATE

## Estado actual (2026-05-11 — sesión diseño completo)

### Sistema de diseño — CONSOLIDADO ✅
- **fontWeight**: solo `'900'` / `'300'` en todo el codebase (auditoría completa)
- **letterSpacing**: cero en todos los archivos, sin excepción
- **Fonts.brand** (Plus Jakarta Sans 800ExtraBold): aplicada en onboarding, index y toda tipografía de marca
- **Paleta y tokens**: todos via `makeStyles(t: Theme)`, ningún color hardcodeado fuera de paleta

### Pantallas — estado por pantalla
| Pantalla | Estado |
|----------|--------|
| `index.tsx` | ✅ Rediseñado — layout centrado, tagline 900/300 en dos líneas |
| `onboarding.tsx` | ✅ Rediseñado — Fonts.brand, tagline canónico, sin letterSpacing |
| `perfil.tsx` | ✅ Rediseñado — pills, un card operacional, labels secundarios |
| `menu.tsx` | ✅ Auditado — fontWeight y letterSpacing corregidos |
| `foto-menu.tsx` | ✅ Auditado — fontWeight y letterSpacing corregidos |
| `preview.tsx` | ✅ Auditado — fontWeight y letterSpacing corregidos |
| `share.tsx` | ✅ Auditado |
| `explorar.tsx` | ✅ Auditado (letterSpacing) — visual pendiente de revisión profunda |
| `buscar.tsx` | ✅ Auditado (letterSpacing) |
| `cuenta.tsx` | ✅ Auditado |
| `patio/[id].tsx` | ✅ Auditado (letterSpacing) |

### En vuelo — agente programado (corre 2am / 08:00 UTC 2026-05-11)
- **Hints contextuales**: `lib/hints.ts` + `components/hint-sheet.tsx`
- Bottom sheets one-time en: perfil (fondero), menú (fondero), share (fondero), explorar (foodie)
- Verificar mañana: commit `feat: contextual onboarding hints` en GitHub

### Assets nativos — pendientes de build
- `app.json` actualizado: icon y splash con P transparente
- Requiere `npx expo run:ios` o EAS build para verse (cambio nativo)

### TypeScript
- `npx tsc --noEmit` en verde ✅

## Próximos 2–3 pasos
1. Verificar commit del agente de hints en GitHub (mañana ~2am)
2. `npx expo run:ios` — ver icono/splash nuevo + validar hints visualmente
3. Push a `origin/v2-menu-vivo`

### Pendiente estructural
- Conectar Patios/Buscar/Favoritos a Supabase (datos reales foodie)
- API key Google Maps para Android
- Revisión visual profunda de `explorar.tsx` (mapa, pins, bottom sheet)

## Estado actual (2026-05-08 — actualizado cierre)
- Dos features nuevos listos y commiteados en `v2-menu-vivo`, pendientes de validar en simulador y pushear:
  - **Share de lugar**: botón en `patio/[id].tsx` (top bar) y en `explorar.tsx` (bottom sheet). Genera mensaje nativo con nombre, categoría, horario, dirección y link de Maps.
  - **Rating 5 estrellas**: estrellas interactivas en `patio/[id].tsx`. 5 → guarda directo (AsyncStorage). < 5 → modal bottom sheet con 7 razones estructuradas. `lib/ratings.ts` creado para persistencia.
- **Fuente de marca**: Plus Jakarta Sans 800ExtraBold activa en index, explorar, patio detail y manifiesto via `Fonts.brand` en `lib/theme.tsx`.
- **Viewport filtering**: ya estaba implementado en `explorar.tsx` (descubierto en auditoría) — quitado de pendientes.
- `npx tsc --noEmit` pasa en verde.

## Próximos 2–3 pasos
1. Abrir simulador (`npx expo start --ios`) y validar fuente, share y rating.
2. Push a `origin/v2-menu-vivo` una vez validado.
3. Siguiente bloque: conectar datos reales (Supabase) o avanzar en onboarding/auth real.

## Estado actual (2026-04-28 — actualizado cierre)
- Se hizo push de pulido UI en `v2-menu-vivo` (`36fb33c`).
- `Compartir` en estado vacío quedó sin botones/CTAs: solo icono + leyenda, como pidió producto.
- Se compactó layout vertical en `app/preview.tsx` (menos padding/alto mínimo), pero sigue pendiente microajuste visual fino en simulador para dejarlo “pixel-perfect”.
- Se confirmó que el perfil Foodie no se borró: `app/cuenta.tsx` mantiene `Explorador / Patio Foodie`, `Manifiesto` y `Modo oscuro`.

## Próximos 2–3 pasos
1. Abrir simulador y validar centrado óptico final del empty state en `Compartir`.
2. Si hace falta, ajustar `4–8px` vertical/horizontal en `preview.tsx` y volver a push.
3. Cerrar bloque de UI y preparar siguiente ciclo (QA + build).

## Estado actual (2026-04-26 — actualizado)
La app entró en V3 Foodie/Fondero: ya existe flujo fondero para perfil/menú/preview y una base Foodie con mapa mock, búsqueda por platillo, ficha pública de Patio, favoritos y cuenta Foodie. Sigue siendo MVP con datos mock en la parte Foodie; falta mapa real, Supabase para Patios públicos y pruebas en dispositivo.

## Qué ya funciona
- Estructura de navegación principal con Expo Router.
- Pantalla de acceso por correo (magic link) y acceso dev.
- Callback de login robustecido para múltiples formatos de deep link (`code`, `token_hash`, `token`) con inicialización centralizada de usuario.
- Edición de perfil de negocio con guardado en Supabase.
- Edición de menú manual con secciones/platillos y guardado de menú del día.
- Lectura de menú por foto usando Anthropic + flujo de revisión.
- Vista previa para compartir contenido en formato visual.
- Estado vacío de compartir mejorado: solo aparece cuando no hay platillos reales, con CTA directo a Menú.
- Tema claro/oscuro persistido en AsyncStorage.
- `npx tsc --noEmit` ya pasa en verde.
- Botón de foto en Menú migrado a botón redondo centrado estilo HIG (se quitó el ícono inline en la primera sección).
- En `menu` y `foto-menu` los inputs de precio (sección y platillo) muestran prefijo visual `$` fijo para mejorar claridad.
- En cards de bebidas el call-to-action ya muestra `+ agregar bebidas`.
- En `foto-menu` (review) se quitó el ícono de cámara dentro de la primera sección y se eliminó el badge `IA` para reducir ruido visual.
- Cards de platillo en `menu` y `foto-menu` regresaron a fondo blanco (`surface`) y se mejoró legibilidad del separador `/`.
- En `preview` ya no se fuerza el título naranja de `MENÚ DEL DÍA`; además, limpia precios embebidos en descripción y los muestra como precio de item.
- Se reforzó la alineación del bloque de precios (`$` + valor + `×`) al extremo derecho en sección y platillo.
- En `menu` se agregó estado de onboarding vacío cuando no hay secciones, con CTA para crear secciones sugeridas.
- En `foto-menu` (idle) se reemplazó el emoji/fallback por icono de cámara consistente y color accent.
- En `menu` y `foto-menu` el CTA `+ agregar platillo` ya está alineado a la izquierda y ahora usa feedback gris al presionar (estilo touch nativo).
- En `foto-menu` (idle) el ícono principal de cámara se homologó en color accent y posición centrada para consistencia con el estilo general.
- En `menu` se cambió el estado inicial para arrancar en onboarding vacío (`{ secciones: [] }`) cuando no hay menú guardado, en vez de pre-crear secciones.
- En `menu` el CTA `Crear secciones sugeridas` ahora abre un selector de secciones tipo “widgets” (pills seleccionables en modal) antes de crear el menú.
- En `menu` se ajustó el bloque de precio (`$ + número + ×`) para quedar más pegado al borde derecho y con menor separación visual.
- El texto `+ agregar platillo / + agregar bebidas` ahora se muestra con transparencia (opacidad) para verse más ligero.
- En `menu`, el selector fue refinado a estilo HIG: copy más limpio, grabber de sheet, selección no invertida y plantillas por giro (Fondita, Taquería, Repostería, Mariscos, Personalizado).
- En `menu` se compactó aún más el layout del precio para evitar hueco entre símbolo y valor (`$0x`), removiendo anchos fijos que generaban separación visual.
- En `menu` se alineó el header de sección a baseline inferior (título, `$`, precio y `×`) y se eliminó el kerning en títulos para una lectura más limpia estilo HIG.
- En `menu` las cards de platillo se rediseñaron al estilo referencia: bloque izquierdo (nombre + descripción), icono visual a la izquierda, y precio pegado a la izquierda de `×` con mismo color.
- En `preview` (Compartir) se homologó el look para mostrar platillos en filas limpias sin subtítulos pesados de sección, con precio en el extremo derecho.
- En `menu` y `foto-menu` los botones `×` se movieron a variante circular para mejorar tocabilidad (tap target) y reducir errores al editar precio.
- Se ajustó interlineado/jerarquía tipográfica de nombre y descripción de platillos para un ritmo visual más cercano a HIG.
- En `menu` se retiró el círculo de `×`; ahora las `×` son limpias y la de platillo queda en esquina superior derecha para reducir ruido visual.
- En `menu` y `foto-menu` se adoptó layout compacto tipo lista (menos caja interna), con nombre+descripción a la izquierda y bloque `precio + ×` alineado a la derecha.
- En `menu` se rediseñó el modal de plantillas: selección estable por checklist (las secciones no desaparecen al deseleccionar), CTA deshabilitado si no hay selección y visual más coherente.
- En `preview` se restauró la jerarquía visual por grupos y secciones: vuelve a mostrar encabezado de grupo (`MENÚ DEL DÍA` / `CARTA`) y encabezado de sección con precio alineado a la derecha.
- En `preview` se homogeneizó la columna de precios con el mismo ancho visual para sección y platillo, reduciendo brincos entre filas.
- En `foto-menu` la normalización de Vision limpia ruido textual como `menu/menú` en nombre y descripción antes de guardar en store.
- En `preview` las descripciones con variantes separadas se muestran como sub-bullets cuando aplica, para que un platillo con varias opciones se lea mejor.
- `npx tsc --noEmit` volvió a pasar después de corregir refs de `Swipeable` en `foto-menu`.
- Arrancó V3 MVP de ubicación: en `perfil` ya existe control para `Mostrar ubicación`.
- En `preview` la dirección solo se muestra si está habilitada y aparece CTA `Abrir en Maps`.
- El enlace de ubicación usa Apple Maps en iOS y búsqueda de Google Maps en Android.
- En `perfil` se refinó la sección de negocio y se reemplazó el selector de giro por una ruleta vertical tipo picker con snap al centro.
- En `perfil` se reestructuró `Operación` como bloque minimalista tipo Settings: apertura, cierre y métodos de pago en una sola jerarquía.
- `app/perfil.tsx` quedó sin warnings de lint; persiste solo el warning conocido de `app/onboarding.tsx`.
- Arrancó base V3 Foodie: `app/explorar.tsx` funciona como home de exploración con mapa liviano, pins seleccionables, filtros simples y Top 10 curado.
- `app/explorar.tsx` se rediseñó siguiendo referencias de dashboard logístico: mapa full-bleed, controles flotantes y bottom sheet con selección/lista.
- `app/index.tsx` ahora separa intención inicial: `Busco comida` lleva a Explorar y `Tengo un negocio` revela el acceso de fondero.
- Se quitó el reset forzado de `app/onboarding.tsx`; `npm run lint` queda sin warnings.
- En `perfil` se quitó el toggle visible de `Mostrar ubicación`; la ubicación pasa a ser dato operativo esperado. Si hay dirección, `preview` puede mostrarla y abrir Maps.
- `Explorar` ahora usa 5 Patios mock reales de Irrigación/Miguel Hidalgo: Cochitacos, Cíntora Taquería, Don Bonachón, AAATTACO y Restaurante Vianca.
- El bottom sheet de `Explorar` fue refinado hacia la nueva referencia: cápsula glass de lugar seleccionado y lista más contenida.
- La lista de `Explorar` se simplificó de `Top 10` a `Cerca de ti`, con rating fake 5.0 y horarios fake para el mock.
- `Explorar` ahora tiene controles mínimos: menú/cuenta, búsqueda, expandir mapa/lista y favoritos; se quitaron zoom fake y switch visible de fondero.
- Se creó `lib/patios.ts` como mock compartido con Patios reales de Irrigación/Miguel Hidalgo y menú estructurado por platillos/tags.
- Se creó `app/patio/[id].tsx` como `Ficha de Patio`: encabezado, mapa mock, menú de hoy y detalles mínimos.
- Se creó `app/buscar.tsx`: búsqueda por platillo dentro del menú (`mole`, `enchiladas`, `anis`, `tacos`) con resultados por platillo, negocio, sección, horario y precio.
- Se creó `lib/favorites.ts` con favoritos persistidos en AsyncStorage.
- Se creó `app/favoritos.tsx`: lista/empty state de lugares guardados.
- Se creó `app/cuenta.tsx`: cuenta Foodie minimalista con accesos a buscar/favoritos, soporte y sesión.
- Se agregó `components/agent-spinner.tsx` y se reemplazaron `ActivityIndicator` principales por spinners tipo terminal/agent.
- Se instaló `react-native-maps@1.20.1` con Expo y `Explorar` ahora usa `MapView` real con markers custom de Patio.
- Los 5 Patios mock ya tienen coordenadas aproximadas (`latitude`, `longitude`) además de datos de menú.
- Decisión de costo/mapa MVP: usar mapa nativo simple + pines propios; evitar Places, Directions, geocoding repetido y tracking fino. Navegación externa queda para Apple/Google Maps.

## Cambios recientes (2026-04-26 sesión 2)
- `explorar.tsx`: búsqueda inline sin salir del mapa. Pins: punto small accent (neutro) → ring blanco+dot oscuro (seleccionado). `showHeader` separado de `selectedId` — header solo al tocar. `tracksViewChanges={true}` con keys estables resuelve crash al escribir. `MapView.onPress` deselecciona.
- `cuenta.tsx`: rediseño como sheet modal transparente — BlurView backdrop muestra el mapa detrás, identidad compacta, "Cerrar sesión" neutral, "Tengo un negocio →" discreto al fondo.
- `buscar.tsx`: texto de estado vacío generalizado (elimina "platillo").

## Cambios recientes (2026-04-26)
- `patio/[id].tsx`: mapa fake (grid dibujado) reemplazado por `MapView` real con pin y pill de dirección. Botón corazón conectado a favoritos (`AsyncStorage`).
- `explorar.tsx`: botones flotantes y sheet usan `BlurView` (`expo-blur`). Velo del mapa migrado a `LinearGradient` (`expo-linear-gradient`). Bordes y sombras afinados a valores minimalistas.
- `CLAUDE.md`: nuevas secciones de Glass, Gradientes, Líneas y Tipografía con valores concretos de implementación.
- `lib/map-style.ts`: estilo JSON muted gris claro/oscuro para Google Maps provider.

## Qué está incompleto o frágil
- Falta validación manual del flujo de callback en dispositivo real (deep links iOS/Android).
- Falta aterrizar el rediseño de “grupo grande de secciones” (MENÚ DEL DÍA/CARTA) en `app/menu.tsx`; hoy siguen cards por sección sueltas.
- No hay suite de tests automatizados.
- El mapa/listado de Foodie usa datos mock; falta conectarlo a Supabase, ubicación real y ficha pública.
- El mapa ya usa `react-native-maps`, pero sigue alimentado por datos mock y coordenadas aproximadas; falta geolocalización real, backend y configuración final de API keys para Android/Google si se requiere.
- Favoritos son locales (`AsyncStorage`), no sincronizados.
- Search es local/determinístico sobre mock; falta backend/indexado real de platillos.

## Próximos 3 pasos
1. Probar en simulador: búsqueda inline en mapa ("mole", "tacos", "agua"), tap en dot → header, tap en mapa → deselección, sheet modal de cuenta con blur backdrop.
2. Agregar viewport filtering en `explorar.tsx` (`onRegionChangeComplete` filtra PATIOS al bounding box visible) — base para escalar a cientos de patios sin degradar rendimiento.
3. Conectar búsqueda/favoritos/Patios a Supabase con menú estructurado por platillo + API key de Google Maps restringida para Android.
