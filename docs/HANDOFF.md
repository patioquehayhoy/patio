# HANDOFF

## Estado vigente — 2026-06-17 (recorrido completo + limpieza + login/mailing)

Leer esta sección antes del historial. Las secciones antiguas abajo son bitácora y pueden contener pendientes ya resueltos.

### Sesión 2026-06-17 (tarde) — Recorrido completo de pantallas + cierre login/mailing

**SIN COMMIT todavía** (working tree con cambios sin commitear, encima de los 3 commits + handoff ya locales). Todo en local, nada de push.

**Recorrido completo de las 19 pantallas** (auditoría por código + 2 capturas en simulador). Veredicto: la mayoría ya estaba look Figma. Lo suelto se arregló. **Ninguna huérfana, ninguna ruta rota, tsc verde, lint sin errores.**

**Limpieza verbal + bugs (hecho):**
- **HintSheet** (`components/hint-sheet.tsx`): el `icon` era emoji (🗺️) renderizado como `<Text>` → sin glyph salían cuadros `?`. Cambiado a **Ionicons** en badge naranja (`accentSoft`). El prop `icon` ahora es `keyof Ionicons.glyphMap`. **Confirmado en simulador.**
- **explorar**: copy genérico del hint de bienvenida ("Patio / Descubre qué hay de comer cerca") → **"¿Qué hay hoy?"** + tono verbal. Ambos hints (`foodie_welcome`, `foodie_explorar`) alineados.
- **manifiesto**: quitado "Para fonderos" + copy marketing → "Si tienes una cocina", humano, cierre `Saaaaaaabes.`
- **push-prompt**: "cuando tu fonda publica" → "cuando publiquen el menú de hoy".
- Dato semilla **"Fonda Lupita" → "Cocina de Lupita"** (perfil, preview, menu-editar). Quita la palabra paraguas "Fonda" de pantalla.
- **foto-menu** registrado en el `Stack` de `_layout` (estaba sin registrar, funcionaba por archivo).
- **menu-publicado**: quitado un `LinearGradient` transparente muerto + su import.

**Login + Mailing (lo que faltaba — hecho):**
- **`login-callback.tsx`** ("Verificando link…"): era beige viejo `#F5E9D9` → ahora oscuro `#111214` + glow naranja, consistente con flujo Fondero. **Lógica de auth intacta** (solo el render).
- **Template de email**: NO existía en el repo (Supabase mandaba su default en inglés). Creado **`supabase/templates/magic-link.html`** con marca Patio (botón naranja, P, `Saaaaaaabes.`, variables `{{ .ConfirmationURL }}` / `{{ .Email }}`) + `supabase/templates/README.md`. ⚠️ **NO se instala solo — Alejandro lo pega en Supabase Dashboard → Auth → Email Templates → Magic Link Y Confirm signup** (signInWithOtp con shouldCreateUser:true manda el de signup la 1ª vez).
- **Pantalla FonderoMagicLink**: creada **`app/fondero-acceso.tsx`** (captura de correo oscura + botánica, 3 beneficios, estado "revisa tu correo"). Enganchada desde index ("Publicar mi menú") y cuenta ("¿Tienes una cocina?"). Registrada en `_layout`.
- **`index.tsx` limpiado**: borrado ~110 líneas de código muerto (el formCard de login viejo, el estado `intent='business'`, `showAuthError`, imports y estilos huérfanos). Ahora index solo es la pantalla de elección.

**PENDIENTE (próxima sesión):**
1. **PUSH**: ya son 3 commits + handoff + estos cambios sin commitear. `git push origin v2-look-figma` (la rama NI EXISTE en origin todavía → primer push con `-u`). Solo Alejandro (credenciales).
2. **Instalar el template de email en Supabase** (ver `supabase/templates/README.md`). Sin esto, el correo magic-link sigue saliendo genérico en inglés.
3. **Ojo humano sobre `fondero-acceso` y `login-callback`** en simulador — NO se pudieron capturar por la fragilidad del deep-link del dev client a rutas Fondero. Compilan bien; falta verlas navegando a mano (tocar "Publicar mi menú" desde el inicio).
4. **Warnings de lint preexistentes** (no de esta sesión): `useMemo` sin usar en menu-editar, `SUPPORT_PHONE` sin usar en perfil. Menores.

---

### Sesión 2026-06-17 — Cierre Fondero (3 commits locales, SIN PUSH)

**Commits locales en `v2-look-figma` (falta `git push origin v2-look-figma` — entorno sin credenciales):**
- `8e2372f` Reconstrucción flujo Fondero look Figma + features Foodie
- `342b287` foto-menu idle look Figma + limpiar share huérfana
- `b19f515` preview → MenuPoster look Figma (póster compartible)

**Cerrado esta sesión:**
- **foto-menu (idle)** redISeñado: header back→Hoy, eyebrow, card foto héroe degradado naranja (consistente con "Hoy"), galería discreta. Estados processing/review/saved quedaron oscuros OK.
- **share.tsx BORRADA** (huérfana confirmada, nadie la navegaba) + quitada de `_layout`.
- **preview.tsx → MenuPoster**: póster vertical de marca (P + "¿Qué hay hoy?" + fecha + nombre negocio + menú + "Saaaaaaabes."), chrome oscuro, botón verde "Compartir en WhatsApp", captura como imagen (captureRef + Sharing). Back→Hoy. Lo usa `menu-publicado`.
- **Rutas rotas: NINGUNA** (verificado). tsc verde en todos los commits.

**PENDIENTE (próxima sesión):**
1. **PUSH**: `git push origin v2-look-figma` (3 commits esperando). Solo Alejandro (credenciales).
2. **Recorrido visual de TODAS las pantallas** en simulador — cazar viejas voladas. Método: Alejandro navega, Claude arregla. (Claude verifica tsc, no el look — por eso se cuelan viejas.)
3. **Lado Foodie se siente parchado** — aplicar criterio limpio+verbal. Sospechoso: el buscador de inicio (explorar) con los puntos cargando. Revisar explorar/favoritos/cuenta/ficha a fondo.
4. **Simulador se apaga solo seguido** — molesto pero no bloqueante; rebootear con `xcrun simctl boot` + abrir con URL localhost (la IP de WiFi cambia, usar localhost siempre).

### Sesión 2026-06-16 — Reconstrucción look Figma

**Aprendizaje clave (ver memoria `figma_exact_not_maquillaje` + `verbal_overrides_figma`):**
Alejandro detestó el primer intento porque MAQUILLÉ las pantallas viejas (fondo oscuro encima) en vez de reconstruir. Se sentía "Frankenstein". Decisión: **reconstruir desde cero, no parchar.** Y: **el lenguaje verbal (IDENTITY_VERBAL.md) MANDA sobre el copy de Figma** — Figma usa "Fonda"/"Fondero" que VIOLAN las reglas. NUNCA esas palabras en pantalla.

**Flujo Fondero reconstruido limpio:**
- TabBar = pill flotante glass: **Hoy / Historial / Mi Patio** (NO "Fonda").
- **`menu.tsx` = pantalla "Hoy"** (elección): foto HÉROE (card naranja "Patio lo lee por ti") + Escribir + Menú anterior.
- **`menu-editar.tsx`** = editor de platillos (toggle precio único/por platillo, $55 ±, pills sección, datos Lupita). Back → Hoy. Publicar → `menu-publicado`.
- **`historial.tsx`** = 312 foodies + chart + menús pasados.
- **`perfil.tsx`** = "Mi Patio" (hero foto + racha 14 días + filas). Filas → `perfil-editar.tsx` (editor rediseñado).
- **`menu-publicado.tsx`** = Success ("Tu menú está vivo" + 3 viendo).

**Estado por pantalla (inventario):**
- 🆕 reconstruidas look Figma oscuro: menu (Hoy), menu-editar, historial, perfil, perfil-editar, preview, foto-menu*, menu-publicado.
- ✳️ Foodie con tokens nuevos: explorar, favoritos, cuenta, patio/[id], onboarding, push-prompt, resena/[id].
- ⚠️ **VIEJAS / por revisar:** `foto-menu.tsx` (es la vieja con fondo oscuro — NO tiene look Figma, "Toma foto/Elegir galería" es legacy), `share.tsx` (HUÉRFANA, ya no se navega), `preview.tsx` (compartir viejo, sacado del flujo).

**PENDIENTE INMEDIATO (próxima sesión):**
1. **foto-menu.tsx**: rediseñar exacto a Figma (hoy es la pantalla vieja parchada que Alejandro detectó).
2. **Probar el flujo completo de TODAS las pantallas** en simulador — cazar más pantallas viejas voladas.
3. **Borrar huérfanas**: `share.tsx`, y decidir `preview.tsx` (¿se usa para compartir póster o se reemplaza por MenuPoster?).
4. **Lado Foodie se siente parchado** (buscador inicio con puntos cargando) — aplicar mismo criterio limpio+verbal.
5. **PUSH pendiente**: commit 8e2372f está local, falta `git push origin v2-look-figma` (el entorno no tiene credenciales).

---

## Estado previo — 2026-06-14

Leer esta sección antes del historial. Las secciones antiguas abajo son bitácora y pueden contener pendientes ya resueltos.

### Diseño — Figma Make (Ciclo 5, activo)

- El rediseño visual de Patio se hace en **Figma Make** (lienzo web, Claude compone el UI). Reemplaza el handoff a "Claude Design".
- Exports congelados en `design-source/figma-make/`: **v01** (2026-06-12, base) y **v02** (2026-06-14, ajustes de menú). Conviven, no se reemplazan. Registro en `VERSIONS.md`. **Aislados del build** (Metro/TS/ESLint los ignoran).
- El export es **web (Vite/React/Tailwind), NO React Native** → se **traduce** a `.tsx`, no se pega.
- **DECISIÓN 2026-06-14: dejar de iterar en Figma Make, cerrar el diseño AQUÍ (en código).** Figma es bueno para GENERAR, malo y carísimo para AJUSTAR (1,000 créditos comprados se vaciaron en ajustes de menú que ni quedaron bien). El pulido fino se hace sobre el export/código, gratis. Ver `cost_tracking` en memoria + `docs/COSTOS.md`.
- **Identidad verbal documentada:** `docs/design/foundations/IDENTITY_VERBAL.md` — modelo de nombres estilo Uber (no "fonda/fondero" paraguas), anti-IA, tono por pantalla, par de marca "¿Qué hay hoy? Saaaaaaabes.". Incluye §8 brief para pegar en Figma.
- **Estado del diseño: ~90%.** Falta cerrar menú + compartir + limpiar copy "fondero/a". Se cierra en código, no en Figma.

### Trabajo de esta sesión (2026-06-14) en v02 — sin commitear

- **Modelo de precio del menú reescrito** en `v02/src/app/data/menu.ts`: antes `priceMode: "fixed"|"perItem"` (excluyente). Ahora **`dayPrice` (precio del día, opcional) + `price` por item (extra a la carta) coexisten** — refleja fonditas reales (comida corrida $55 + extras a la carta). Decisión de producto de Alejandro.
- **Editor del Fondero** (`FonderoPublish.tsx`): quitado el toggle de modo de precio; precio del día opcional + precio por platillo siempre disponible. Borrado código muerto (`PriceModeTab`). UX "lo más simple posible".
- **`MenuCard.tsx`**: compatible con el nuevo modelo (muestra precio solo en extras).
- Verificado: cero referencias rotas a campos viejos en todo v02.
- **Pendiente inmediato:** cerrar "compartir" (`MenuPoster.tsx`) y limpiar copy "fondero/a".

### Decisiones visuales 2026-06-15 (tras revisar v02 corriendo en navegador)

Alejandro revisó TODAS las pantallas de v02 (levantadas como web local con `npm run dev` en `design-source/figma-make/v02/`). Veredicto: **le encanta el diseño tal cual.** Decisiones:

- **Meta:** la app real (ya en TestFlight, builds 42–45) debe **VERSE como Figma v02**. La función del menú YA existe en código (`app/menu.tsx` + `lib/menu-store.ts`, con precio por sección + por platillo + Supabase). NO se reconstruye — solo se aplica el look. Trabajar en **rama nueva**.
- **Prioridad de traducción: el LOOK GENERAL** — glass, degradados, hero con flores botánicas, tipografía editorial extrema (SF Pro 800/400), naranja con intención.
- **Naranja confirmado:** `#F2612F` light / `#FF6A3D` dark (ya es el oficial en `lib/colors.ts` y la biblia; lo que se ve "raro" es por degradados encima, no el token).
- **Fix del editor de menú (`menu.tsx`):** Alejandro tiene TOC con el scroll largo del editor "Menú de hoy". Solución acordada: **agrupar platillos por sección** (Entrada/Guisado/etc.) en filas compactas en vez de tarjeta gigante por platillo → menos scroll. (La barra de scroll fea que vio es del navegador/Vite, NO de iOS real — en RN no se ve así.)
- **Recurso clave en v02:** `TokenExport.tsx` trae tokens listos para RN/NativeWind (paleta, espaciado base-4, radios chip14/card18/sheet28/phone44, motion specs) + lista de **11 componentes base que cubren el 90% de la app** (ButtonAccent, ButtonInk, ButtonGlass, ChipFilter, GlassCard, MenuRow, CourseInput, PinPrice, BottomSheet, StatusDot, EyebrowLabel). Usar como puente Figma→código.

### Sesión de código 2026-06-15 — rama `v2-look-figma`

Rama nueva desde `v2-menu-vivo`. Trabajo: aplicar el look de Figma v02 a la app real, recorriendo el **flujo Foodie en orden** (no pantallas sueltas). App corre en simulador iOS (Expo Go, puerto 8081, bundle `com.parcomx.patio`).

**Hecho y commiteado:**
- **Fase 1 tokens** (`lib/colors.ts` + `lib/theme.tsx`): paleta homologada a Figma (ink #111214, ink-soft #4A4A47, borde translúcido, bgDark #0A0B0D, glass, accentSoft #FBE7DD). Escalas nuevas exportadas: `Radius`, `Spacing`, `Type`, `Motion`. Sin colores hardcodeados sueltos → se propaga a toda la app.
- **index.tsx**: quitada la grid DEV (entrada limpia) + botón con presencia.
- **patio/[id].tsx (ficha Foodie)**: rediseño completo tal cual Figma — hero 300px con degradado (placeholder), nav glass, card traslapada, estado dot verde, título 36, meta row, **menú agrupado por sección** (resuelve TOC), CTA sticky. Lógica intacta (Supabase, favoritos, rating, mapa).
- **explorar.tsx**: ajustes (sheet radius 28, precio en naranja).
- **onboarding.tsx**: reescrito tal cual Figma `FoodieOnboarding` — 3 slides, hero botánico REAL (imágenes en `assets/hero/botanica-N.png`, copiadas de `assets/artes/`), eyebrow naranja, título 36, dots animados spring, botón. Copy corregido por identidad verbal (slide 2 = "Lo que se cocina hoy", sin "en su voz"; "cocinas/lugares" no "fonditas").

**Imágenes:** 8 fotos botánicas (dahlias sobre fondo oscuro, formato vertical) en `assets/hero/botanica-1..8.png`. Sirven para heros de onboarding, ficha y estados.

**Reglas de trabajo acordadas con Alejandro (2026-06-15):**
1. **Replicar Figma TAL CUAL**, sin mezclar lo viejo con lo nuevo.
2. **Si una pantalla difiere de Figma o no existe igual → PREGUNTAR**, no inventar/mezclar.
3. El **copy se rige por `IDENTITY_VERBAL.md`**, no por el copy viejo de Figma (que tiene anti-IA como "en su voz").

**PENDIENTE (próxima sesión, en orden del flujo Foodie):**
1. **Enganchar onboarding como first-launch real** — hoy NO se muestra solo (ningún check de `ONBOARDING_KEY` en el arranque; `_layout` o `index` debe redirigir a `/onboarding` si no está visto). Verificar antes de dar por cerrado.
2. **Enchufar foto botánica real** en el hero de `patio/[id]` (hoy es degradado placeholder).
3. **index.tsx (inicio/login) tal cual Figma** — OJO: la app mezcla inicio+login en un archivo; Figma los tiene separados (FonderoLanding oscuro, FonderoMagicLink, MagicLinkEmail). Decidir estructura con Alejandro.
4. **favoritos.tsx** (guardados) y **cuenta.tsx** tal cual Figma → cierran el flujo Foodie.
5. Luego flujo Fondero: foto-menu, menu (fix TOC agrupar), preview/share (MenuPoster), perfil.

### Hecho

- Supabase está conectado para `fonditas`, `menus` y `cartas`.
- Fondero puede crear/editar menú y publicarlo en Supabase.
- Foodie puede ver menú real desde `patio/[id]` vía `fetchMenuForFondita()`.
- `favoritos.tsx` y fallback de fonditas reales ya usan Supabase.
- `explorar.tsx` tiene radar de antojo, búsqueda inline, suggestion pills y sheet solo con intención.
- `buscar.tsx` no es flujo visible del MVP; recupera hacia `/explorar`.
- Migración `lat/lng` y tablas `menu_sections` / `menu_items` ya fueron aplicadas.
- Fuente activa de marca: Plus Jakarta Sans 800ExtraBold vía `Fonts.brand`.

### Pendiente real

1. **Cerrar el diseño en Figma Make** (Alejandro, en progreso) → luego traducir pantalla por pantalla a `.tsx`.
2. QA en dispositivo: magic link, cámara/galería, GPS y flujo Fondero -> Foodie completo.
3. Registrar UDID de iPhone si se requieren builds internos.
4. API key Google Maps restringida antes de builds Android reales.
5. Paleta cerrada: conservar `lib/colors.ts` (`#F2612F`/`#FF6A3D` como accent naranja). No introducir amarillo ni un segundo acento cálido — conciliar con tokens de `theme.css` al traducir.

### Screenshots

- Fuente vigente: `assets/screenshots/` + `docs/design/SCREENSHOT_INDEX.md`.
- `docs/design/screenshots/` no existe actualmente en el worktree.
- No usar paquetes de screenshots que no existan físicamente.

---

## 2026-05-15 (cierre — Supabase completo + búsqueda real + EAS build en progreso)

### Qué se hizo hoy

**Supabase schema completo:**
- `supabase/migrations/20260512_add_lat_lng.sql` — corrida en dashboard ✅
- `supabase/migrations/20260512_create_menu_tables.sql` — corrida en dashboard ✅

**lib/menu.ts — fetchMenuForFondita:**
- Lee `cartas` (carta permanente) primero, fallback a `menus` del día
- Convierte `MenuData` → `PatioMenuSection[]`

**patio/[id].tsx — menú real:**
- Al abrir ficha, llama `fetchMenuForFondita(patioId)`
- Si hay menú en Supabase, lo muestra sobre el MOCK vacío
- Fondero publica → Foodie lo ve inmediatamente

**favoritos.tsx — fonditas reales:**
- IDs no encontrados en MOCK_PATIOS se fetchean de Supabase via `fetchFonditaById`
- MOCK + Supabase mergeados en una sola lista

**explorar.tsx — organismo vivo:**
- Suggestion pills ("mole", "tacos", "agua de jamaica") aparecen a los 800ms con fade-in
- Desaparecen al buscar o seleccionar pin
- Tocar pill activa búsqueda con ese query

### Estado del flujo completo
- **Fondero**: escribe menú → guarda en Supabase (`menus`/`cartas`) ✅
- **Foodie**: abre ficha → ve menú real del fondero ✅
- **Explorar**: mapa limpio al inicio, suggestions ambient, sheet solo con intención ✅

### EAS Build histórico al cierre
- `eas build --platform ios --profile preview` corriendo en EAS cloud
- Credenciales: `dubzon@live.com.mx`, Team `JK2N262L7X`
- Device registrado: MacBook Pro UDID `00006000-000248482121801E`
- Cuando termine: link de instalación en expo.dev/accounts/parcomx/builds
- Instalar en iPhone via link o QR — probar flujo Fondero → Foodie completo

### Pendiente para mañana
1. **Verificar build** en iPhone — flujo completo: fondero sube menú → foodie lo busca y ve
2. **GPS en perfil** — probar "Marcar en el mapa" en dispositivo real (ya funciona con expo run:ios)
3. **API key Google Maps** para Android (no bloqueante para iOS)
4. **Registrar iPhone real** en EAS para próximos builds (ahorita solo está el Mac)

---

## 2026-05-11 (cierre — hints + Supabase completo)

### Qué se hizo hoy

**Sistema de hints contextuales** — implementado desde cero (los agentes nocturnos no commitaron):
- `lib/hints.ts` — AsyncStorage, `shouldShowHint` / `markHintSeen`, one-time por key
- `components/hint-sheet.tsx` — Modal bottom sheet con spring animation, backdrop dismiss, X button
- Wired en 4 pantallas: `perfil.tsx` (🏪 enfoca el TextInput de nombre), `menu.tsx` (📋 navega a foto-menu), `share.tsx` (✉️ dismiss simple), `explorar.tsx` (🍽️ dismiss simple)

**buscar.tsx — fonditas reales de Supabase**:
- Carga fonditas reales al montar con `fetchPublicFonditas()`
- Búsqueda por nombre/categoría normalizada (parallel a búsqueda de platillos en MOCK_PATIOS)
- Resultados mergeados sin duplicados, ordenados por score

**patio/[id].tsx — Supabase fallback**:
- `getPatioById` → si null → `fetchFonditaById` (nueva función en `lib/patios.ts`)
- Loading state con `AgentSpinner` mientras fetchea
- MapView oculto si `patio.latitude === 0`
- `fetchFonditaById` intenta con lat/lng; fallback sin ellos si migración no corrió

### ⚠️ Problema en Dev Fondero (Unmatched Route)
- Al presionar Dev Fondero puede aparecer "Unmatched Route" en `patio:///`
- **Causa**: hot reload de Metro confundido por los nuevos archivos añadidos
- **Fix**: presionar `r` en la terminal de Metro para forzar reload completo del bundle

### ⚠️ Migración Supabase — histórico, ya resuelta
```sql
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS latitude float8;
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS longitude float8;
```

### Decisiones importantes
- Hints son one-time via AsyncStorage — `markHintSeen` se llama síncronamente en el callback, el write a AsyncStorage es fire-and-forget (async, no bloqueante)
- `fetchFonditaById` tiene doble fallback: primero con lat/lng, si falla sin ellos — robusto vs migración pendiente

### Siguiente paso exacto
1. Reload Metro (`r`) para resolver Unmatched Route
2. Ejecutar migración Supabase (ALTER TABLE) para habilitar lat/lng
3. `npx expo run:ios` — rebuild nativo por expo-location

---

## 2026-05-10 (cierre — sesión Supabase + ubicación)

### Qué se hizo hoy

**explorar.tsx — auditoría tipográfica completa**:
- `fontWeight: '300'` agregado a: `selectedMeta`, `priceCaption`, `searchInput`, `listMeta`, `patioMeta`, `patioOpen`
- Inline `fontWeight: '900'` en número de índice movido a `s.indexNum` dentro de `makeStyles`

**explorar.tsx + lib/patios.ts — conexión Supabase (lista)**:
- `fetchPublicFonditas()` en `lib/patios.ts` — query a tabla `fonditas`, mapea a `Patio[]`
- `allPatios` state en explorar: empieza con MOCK_PATIOS, se expande con fonditas reales al montar
- Lista muestra `allPatios` (todos los fonditas registrados)
- Mapa usa solo patios con `latitude > 0` en viewport — MOCK_PATIOS por ahora
- Botón "Ver" visible solo para patios con coordenadas

**perfil.tsx — captura de ubicación GPS**:
- `expo-location` instalado y registrado en `app.json` (plugin)
- Botón "Marcar en el mapa" en campo de dirección
- `handleMarkLocation()`: pide permiso → GPS → guarda `latitude`/`longitude` en `fonditas`
- Estado persiste: si DB ya tiene coords, muestra "En el mapa" al cargar

### ⚠️ Migración Supabase — histórico, ya resuelta
```sql
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS latitude float8;
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS longitude float8;
```
Sin esta migración, el botón de ubicación falla al guardar.

### Decisiones importantes
- **Lat/lng por registro**: cada fondita marca su ubicación desde su propio dispositivo — no geocoding
- **MOCK_PATIOS para mapa**: quedan como referencia visual hasta que fonditas reales tengan coords
- **expo-location**: requiere `npx expo run:ios` para rebuild nativo antes de poder probar GPS

### Siguiente paso exacto
1. Ejecutar migración Supabase (ALTER TABLE)
2. `npx expo run:ios` — rebuild por expo-location + ver icono/splash
3. Verificar commit agente de hints en GitHub (`feat: contextual onboarding hints`)
4. Probar GPS en simulador (lat/lng ficticio) o dispositivo real

---

## 2026-05-10/11 (cierre — sesión diseño completo)

### Qué se hizo hoy

**Auditoría tipográfica global** — limpieza de todo el codebase:
- `fontWeight`: solo `'900'` y `'300'` en todos los archivos (excepción documentada: `'500'` en `itemName` de preview, `'700'` en botón WhatsApp)
- `letterSpacing`: eliminado de todos los archivos sin excepción
- Archivos corregidos: `menu.tsx`, `foto-menu.tsx`, `preview.tsx`, `explorar.tsx`, `buscar.tsx`, `cuenta.tsx`, `share.tsx`, `patio/[id].tsx`, `loading-indicator.tsx`

**Onboarding rediseñado** (`app/onboarding.tsx`):
- Tagline canónico en dos elementos separados: `"¿Qué hay hoy?"` (900) + `"Saaaaaaabes."` (300) — contraste de peso
- Toda la tipografía migrada a `Fonts.brand` (Plus Jakarta Sans)
- Sin letterSpacing en ningún texto

**Index rediseñado** (`app/index.tsx`):
- Layout centrado verticalmente (HIG optical centering) — ya no pegado al fondo
- Tagline en dos líneas separadas con peso diferenciado
- Botones en zona óptica natural, `paddingBottom: insets.bottom + 32`
- DevBar sigue presente (se eliminará en release)

**Perfil fondero rediseñado** (`app/perfil.tsx`):
- Ruleta de categoría eliminada → **pills horizontales** tapables
- `TU NEGOCIO` label eliminado — nombre editable directo (placeholder: "Nombre de tu negocio")
- Horario simplificado: Apertura/Cierre sin hints de texto
- TIPO + HORARIO + PAGOS fusionados en **un solo card** (Apple HIG)
- Block labels → `textSecondary` (gris, rol organizador)
- Guardar aparece solo cuando hay cambios pendientes

**Assets y app.json**:
- Añadidos: `p-icon-transparent.png`, `p-icon-transparent-blanco.png`, android variants
- `app.json` actualizado: icon y splash usan la P transparente

**Agente scheduled programado** — corre a las 2am (08:00 UTC 2026-05-11):
- Implementa sistema de hints contextuales (bottom sheets, one-time, AsyncStorage)
- Fondero: perfil → menú → share
- Foodie: explorar
- Archivos a crear: `lib/hints.ts`, `components/hint-sheet.tsx`
- URL: https://claude.ai/code/routines/trig_01GactQsWZuPYcVwPesNq4Gh

### Decisiones importantes
- **No letterSpacing en ningún texto** — ley absoluta, sin excepciones
- **fontWeight solo '900' / '300'** — contraste tipográfico como mecanismo de jerarquía
- **Perfil fondero**: un solo card operacional (tipo + horario + pagos) — más limpio que 3 cards
- **Hints onboarding**: bottom sheet (Apple HIG), no spotlight/coach marks
- **Repo público**: `patioquehayhoy/patio` hecho público para acceso de agentes remotos

### Siguiente paso exacto
1. Mañana verificar commit del agente de hints en GitHub (`feat: contextual onboarding hints`)
2. `npx expo run:ios` para ver icono/splash con P transparente (requiere build nativo)
3. Validar visualmente hints en simulador
4. Push a `origin/v2-menu-vivo`

### Pendiente estructural de ese momento (resuelto después)
- Datos Foodie en Supabase: resuelto el 2026-05-15
- API key Google Maps para Android
- EAS build para release

## 2026-05-08 (cierre — sesión 2)

### Qué se hizo hoy
- **Share de lugar sin fricción**: botón de compartir en `app/patio/[id].tsx` (top bar junto al corazón) y en `app/explorar.tsx` (bottom sheet cuando hay lugar seleccionado). Usa `Share.share()` nativo de React Native — abre el share sheet del SO con mensaje pre-compuesto: nombre, categoría, zona, horario, dirección y link a Apple Maps.
- **Rating 5 estrellas con feedback estructurado**: en `app/patio/[id].tsx` se reemplazó el rating estático por estrellas interactivas. 5 estrellas → guarda directo. Menos de 5 → abre `Modal` bottom sheet con pills de razones estructuradas (Horario incorrecto, Ubicación confusa, Menú no disponible, Precio distinto, Atención, Estaba cerrado, Otro).
- **`lib/ratings.ts`** creado: `PatioRating`, `getPatioRating`, `savePatioRating` — mismo patrón que `lib/favorites.ts`, persiste en AsyncStorage.
- `npx tsc --noEmit` en verde al cierre.

### Qué se hizo hoy (sesión 1)
- Instalado `@expo-google-fonts/plus-jakarta-sans` como fuente de marca (alternativa a Stabil Grotesk, que es comercial)
- `app/_layout.tsx`: carga de `PlusJakartaSans_800ExtraBold` con `useFonts` + `SplashScreen.preventAutoHideAsync`
- `lib/theme.tsx`: exportado `Fonts.brand = 'PlusJakartaSans_800ExtraBold'` como token de fuente de marca
- Aplicado `fontFamily: Fonts.brand` en: `app/index.tsx`, `app/manifiesto.tsx`, `app/explorar.tsx`, `app/patio/[id].tsx`
- Viewport filtering en `explorar.tsx` ya estaba implementado (descubierto durante auditoría): `useMemo` + `onRegionChangeComplete={setVisibleRegion}` — quitado de pendientes.

### Decisiones importantes hoy
- **Plus Jakarta Sans** en lugar de Stabil Grotesk — editorial grotesca moderna, libre, feel similar al spec original
- **Share nativo**: usar `Share.share()` de React Native (sin deps extra) — cero fricción, mensaje pre-compuesto con Maps link
- **Ratings estructurados**: feedback por categorías concretas en lugar de texto libre — más accionable, menor fricción para el usuario

### Siguiente paso exacto
Abrir simulador y validar:
1. Fuente carga en index, explorar, patio detail y manifiesto
2. Botón de share en patio detail y en bottom sheet de explorar → abre share sheet nativo
3. 5 estrellas → guarda sin abrir modal; 1–4 → abre modal con pills; seleccionar razones y enviar; re-abrir patio y confirmar que rating persistió

Comando: `npx expo start --ios`

Una vez validado → push a `origin/v2-menu-vivo`.

### Pendiente que venía del historial
- Permisos de cámara/galería (requieren build — no sirve hot reload)
- Datos Foodie en Supabase: resuelto el 2026-05-15
- API key Google Maps para Android

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

### Pendiente que venía del historial
- Viewport filtering en `explorar.tsx` (`onRegionChangeComplete`)
- Permisos de cámara/galería (requieren build — no sirve hot reload)
- Datos Foodie en Supabase: resuelto el 2026-05-15
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
