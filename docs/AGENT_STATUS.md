# AGENT STATUS — Bitácora de ciclos

> **Corte vigente — 2026-10-25:** iconos originales conservados; solo Tacos
> y Elotes cambian a taco/corn. Mapa: puntos sin números de lejos/medio e
> iconos cerca; búsqueda conserva consulta y excluye no coincidentes.
> Menús = libro; Listas Foodie = líneas/puntos; Listas Fondero = marcadores.
> Precio por platillo sin `+`; Nuevo menú sincroniza fondo y desplazamiento;
> Elegir de Fotos abre solo la fototeca; cámara con pellizco para zoom.
> `npm run check`: TypeScript/lint y **195 pruebas** aprobados; 29 controles
> de release correctos, dos configuraciones Android pendientes. Auditoría npm
> aparte: ocho paquetes afectados (5 altos/3 moderados), cierre pendiente.
> iPhone: cliente DEV restaurado por USB tras una prueba Release local;
> no confundir esa instalación con un candidato de tienda ni producción.
> QA física integral y aceptación final de los últimos ajustes pendientes.
> [Continuidad](HEADS_UP_2026-10-12.md) · [Pendientes](PENDING_LAUNCH_2026-10-12.md).


> **Corte histórico — 2026-10-12:** auditoría de diseño aplicada a tarjetas,
> iconos, pills, listas, formularios, tipografía, feedback y copy. Contrato:
> [DESIGN_SYSTEM](DESIGN_SYSTEM.md). Evidencia y checklist físico:
> [DESIGN_AUDIT_2026-10-10](DESIGN_AUDIT_2026-10-10.md).
> Ajuste de distribución con referencia Uber: precio a la derecha, tarjetas
> compactas, paneles sin sombra y margen inferior medido. Ver
> [UBER_LAYOUT_REFINEMENT](UBER_LAYOUT_REFINEMENT_2026-10-10.md).
> Tarjetas compactas concluidas (2026-10-12): nombre de una línea en lista
> y grid, columna fija para el sello, precio y metadata sin saltos por texto.
> Estrella única y «colonia · distancia» conservadas. Fuentes Uber Base/Material,
> ejemplos y medidas en [columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).
> Búsqueda: swipe devuelve la navegación y conserva término/pines; una
> sola salida, reapertura y callbacks de cierre protegidos. Ver
> [SEARCH_SWIPE_FIX](SEARCH_SWIPE_FIX_2026-10-10.md). Cierre nativo reportado
> en iPhone aún sin confirmar. El usuario hará QA física; diagnóstico de
> dispositivo y auditoría amplia/EAS detenidos por su petición.
> TypeScript y lint limpios; **177/177 tests**. Exportaciones nativas del
> corte previo completas; este ajuste se verificó localmente sin EAS.
> El backend ya fue promovido tras staging: no repetir migraciones ni pedir login.
> Pendientes vigentes: [checklist/roadmap](PENDING_LAUNCH_2026-10-12.md).
> Auditoría npm actualizada: 32 paquetes afectados (24 altos, 8 moderados,
> 0 críticos). Heads-up: [continuidad](HEADS_UP_2026-10-12.md).
> Los cortes anteriores siguientes son históricos; sus pendientes no sustituyen
> este estado. Checkpoint en rebuild/patio-final; no implica envío a tiendas.

> **Producción actualizada (2026-10-09):** siete migraciones aplicadas y registradas; cinco funciones ACTIVE con JWT. Datos existentes conservados; correos protegidos. Evidencia: [PRODUCTION_PROMOTION_2026-10-09.md](PRODUCTION_PROMOTION_2026-10-09.md). Lanzamiento aún pendiente de QA móvil y requisitos de distribución.

> **Staging preparado (2026-10-09):** patio-staging creado; siete migraciones
> y cinco funciones instaladas. **15 pruebas reales Auth/RLS/Storage/Edge**
> aprobadas; posteriormente promovidas a producción con autorización explícita. Ver
> [STAGING_REHEARSAL_2026-10-09.md](STAGING_REHEARSAL_2026-10-09.md).


> **Corte histórico — 2026-10-09:** lanzamiento solicitado para iPhone y Android.
> Homologación de bibliotecas implementada; 149 pruebas y 19 comprobaciones SQL
> aisladas aprobadas; exportaciones de ambas plataformas completas. Backend real,
> seguridad restante, configuración Android, QA visual y tiendas siguen abiertos.
> Checklist y contrato: [LAUNCH_CLOSEOUT_2026-10-09.md](LAUNCH_CLOSEOUT_2026-10-09.md).
> Los cortes anteriores se conservan como historial, no como estado de lanzamiento.


## Corte histórico — auditoría 2026-10-01

Trabajo parcial: cards y mover implementados; etapa 1 pendiente de inventario,
contrato, degradado de scroll y QA en iPhone físico. Etapas 2 y 3 sin cierre.
TypeScript, lint y 133 tests aprobados hoy. Release estricto falla por Maps y
Firebase Android; Supabase real y bloqueos de lanzamiento siguen sin certificar.
Siguiente: cerrar pendientes de etapa 1 y después continuar etapa 2.
Evidencia y límites: [PENDING_AUDIT_2026-10-01.md](PENDING_AUDIT_2026-10-01.md).
Los cortes históricos siguientes no sustituyen este estado.


> El agente escribe aquí después de cada ciclo. Formato: fecha, qué hizo, qué encontró, qué sigue.

---

## Ciclo 13 — 2026-08-24 (decisión de fondo: Menús ES Guardados, se deroga ley de no-mezcla)

**Qué hizo:**
- Alejandro concluyó que Menús debe ser literalmente Guardados (mismo
  lenguaje visual/interacción, no una versión parecida) y pidió derogar la
  ley de `CLAUDE.md` que prohibía mezclar flujos de Fondero/Foodie —
  "nos está haciendo daño". Se marcó derogada con fecha, preservando la
  distinción de contenido/JTBD.
- Reescribió `historial.tsx` para calcar `favoritos.tsx` punto por punto:
  tarjetas individuales (antes lista continua con hairlines), estado vacío
  completo con CTA (antes solo texto), estado "sin resultados de filtro"
  separado del vacío real, header oculto por completo cuando no hay ningún
  menú (antes siempre visible).
- Movió el "+" de crear menú DE NUEVO — de la navegación al header propio
  de `historial.tsx`, arriba a la izquierda, ícono plano sin fondo
  ("como Instagram", ícono de cámara/crear en esquina superior izquierda
  del feed, no un tab). `bottom-tab-bar.tsx` volvió a ser el archivo
  original sin lógica de Fondero. Pill de "Listas" ahora idéntico (34×34,
  glass, badge) al de `foodie-filter-bar.tsx`.

**Qué encontró:**
- Este es el 3er ajuste del mismo botón en el mismo día (naranja en nav →
  nav neutro → dentro de pantalla → nav neutro con "+" → header propio).
  Patrón real: cuando una corrección de Alejandro llega en varias frases
  cortas seguidas, vale más confirmar el entendimiento completo antes de
  ejecutar que iterar a ciegas — el turno anterior donde se preguntó "dime
  qué entiendes antes de que hagas nada" evitó una 4ª vuelta equivocada.

**Qué sigue:**
- QA de Alejandro en su iPhone.
- Decisión abierta, no pedida explícitamente: ¿unificar también la capa de
  datos (`lib/menu-collections.ts` sigue siendo tabla separada de
  `lib/collections.ts`, mismo shape pero no la misma fuente)?

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅.

---

## Ciclo 12 — 2026-08-24 (corrección: "+" sí va en navegación + 2 bugs reales)

**Qué hizo:**
- Corrigió sobreinterpretación del ciclo anterior: Alejandro aclaró que el
  botón de crear menú SÍ debe vivir en la barra de navegación (como el "+"
  de Instagram/apps de Apple) — el problema nunca fue DÓNDE vivía, sino que
  era un botón grande y naranja. Se revirtió a vivir en
  `bottom-tab-bar.tsx`, ahora como ícono "+" plano homologado a los otros
  tabs (mismo tamaño, color neutro, sin tinte de "activo"), primer ítem de
  la barra. `historial.tsx` perdió el botón "Nuevo menú" que se le había
  agregado; "Listas" se quedó solo.
- Arregló bug real: el checkmark de selección en `historial.tsx` no
  registraba el toque si caía justo sobre el círculo (vivía fuera del
  `TouchableOpacity` de la fila). Copiado 1:1 el patrón de
  `renderPatio` en `favoritos.tsx` — un solo touchable para toda la fila.
  De paso homologó `actionBar`/`actionButtons`/`actionBtn` a los valores
  exactos de `favoritos.tsx` en vez de los inventados en el ciclo anterior.
- Arregló bug real: nombrar una lista de menús no aceptaba espacios
  (reusaba la normalización de Guardados, que los quita a propósito para
  pills compactas). Nueva `normalizeMenuListTitle` en
  `lib/menu-collections.ts` que sí permite espacios.

**Qué encontró:**
- Lección: cuando el usuario dice "el botón X no debería verse/comportarse
  así", verificar primero si la corrección es solo visual/de escala antes
  de asumir que hay que reubicar el elemento a otra pantalla — la pasada
  anterior resolvió correctamente el color pero sobre-corrigió la posición.

**Qué sigue:**
- Decisión pendiente de Alejandro: nombre de "listas" para menús (¿"listas"
  vs "carpetas"?) — ver `docs/TASKS.md`.
- QA de Alejandro en su iPhone de los tres ajustes.

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅.

---

## Ciclo 11 — 2026-08-24 (botón de cámara neutro, entrada de Menús sin cámara forzada, listas de menús)

**Qué hizo:**
- Quitó el botón de cámara naranja de `bottom-tab-bar.tsx` (chrome de
  navegación repetido en 3 pantallas de Fondero, violaba la ley de acento
  "naranja = la acción prominente de UNA pantalla"). El aviso de "falta
  publicar hoy" ahora es un badge sobre el ícono del tab "Menús" (patrón
  real de iOS), no un botón de acción aparte.
- Movió "Nuevo menú" a `historial.tsx` como botón prominente propio
  (naranja, siempre visible, no solo en el vacío) — ahí sí es LA acción de
  esa pantalla. Sigue yendo a `foto-menu.tsx` (Cámara/Fotos/Escribir ya
  integrados desde antes); solo cambió dónde vive el disparador.
- Preguntó a Alejandro qué problema real resolver con "listas de menús"
  (los menús son 1/día, sin categorías previas) antes de construir — eligió
  listas personalizadas estilo Guardados.
- Construyó `lib/menu-collections.ts` (mismo modelo que `lib/collections.ts`,
  puramente local) y `components/menu-lists-sheet.tsx` (sheet con modos
  filtrar/asignar). Renombrar/Eliminar lista reutilizan el patrón nativo
  (`Alert.prompt`/diálogo Android) validado en el ciclo anterior — no se
  repitió el editor inline roto.
- `historial.tsx`: botón "Listas" con badge, filtro por lista, "Añadir a
  lista" en "···" y en selección en lote. Borrar un menú limpia su fecha de
  todas las listas (`useMenuHistoryController.ts`).

**Qué encontró:**
- Deliberadamente NO se extrajo un sheet compartido con
  `foodie-filter-bar.tsx` pese a la semejanza visual: ese archivo se acababa
  de estabilizar en el ciclo anterior (mismo día) y forzar una abstracción
  ahí habría arriesgado una regresión para ahorrar código en un componente
  con un modo (`assign`) que Foodie no necesita.

**Qué sigue:**
- QA de Alejandro en su iPhone de las tres piezas (botón, flujo, listas).
- Resto del backlog sin cambios — ver `docs/TASKS.md`.

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅.

---

## Ciclo 10 — 2026-08-24 (bug de renombrar resuelto: alert nativo en vez de scroll manual)

**Qué hizo:**
- Alejandro reportó (con video + captura) que renombrar una lista en el
  sheet "Tus listas" dejaba el campo tapado por el teclado. Se extrajeron
  frames del video con `ffmpeg` para diagnosticar con evidencia real en vez
  de adivinar a la 5ª vez.
- Diagnóstico: `TextInput.measureLayout` contra el `ScrollView` devuelve la
  posición relativa al viewport YA visible (post-scroll), no absoluta al
  contenido. El código la usaba como absoluta en `scrollTo`, así que en
  listas largas el scroll se quedaba corto por casi el offset ya acumulado
  de un renombrado previo — coincide exactamente con los 4 intentos
  fallidos documentados en `docs/TASKS.md`.
- Se abandonó el editor inline (scroll + measureLayout + keyboard height) y
  se reemplazó por el patrón nativo de Apple para renombrar un ítem corto:
  `Alert.prompt` en iOS (simétrico con "Eliminar", que ya usaba
  `Alert.alert` en el mismo menú), diálogo propio centrado con `BlurView`
  en Android (`Alert.prompt` no existe ahí). Detalle en `docs/HANDOFF.md`.
- `components/foodie-filter-bar.tsx`. Confirmado por Alejandro en su iPhone.

**Qué encontró:**
- Root cause real distinto a la hipótesis que había quedado anotada en
  `docs/TASKS.md` (esa apuntaba a que `visibleSheetHeight` no se re-medía
  al cambiar de alto la fila) — fue la coordenada de `measureLayout`, no el
  alto del sheet. Lección: cuando algo "sigue roto" tras varios intentos,
  pedir grabación/evidencia real antes de seguir ajustando la misma
  hipótesis.

**Qué sigue:**
- QA de Android del diálogo de respaldo — no hay evidencia de que este
  proyecto pruebe activamente en esa plataforma todavía.
- El resto del backlog no cambió — ver `docs/TASKS.md`.

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅.

---

## Ciclo 9 — 2026-08-18 (pin del mapa rediseñado + fixes de búsqueda sin resultados)

**Qué hizo:**
- Sesión larga de iteración en vivo con Alejandro probando en su iPhone,
  con varias rondas de mockups en Artifact (comparación visual antes de
  tocar código). Detalle completo en `docs/HANDOFF.md`, entrada
  2026-08-18.
- `app/explorar.tsx`: pin de patio individual rediseñado a gota invertida
  como una sola pieza (técnica del pin de Google Maps), con contorno de
  selección pegado + degradado vertical de acento + pop de escala, timing
  asimétrico validado contra HIG Motion/`UIButton.highlighted`. Mismo
  tratamiento para el borde de match de búsqueda. Cluster ahora círculo
  completo (deliberadamente distinto a la gota).
- Sheet de "sin resultados" ya no se corta contra el borde; sugerencias de
  búsqueda salen de categorías reales cercanas en vez de una lista fija.
- Commit `6705c49` en `rebuild/patio-final`. `git push` intentado, falla
  con 403 (permiso denegado a T1Alejandro) — mismo bloqueo ya documentado,
  Alejandro debe subirlo él.

**Qué encontró:**
- Tres bugs reales de `tracksViewChanges` en `react-native-maps`: snapshot
  final perdido al terminar la animación de selección, snapshot viejo
  nunca invalidado al cambiar match/oculto durante la búsqueda, y estado
  de selección que no se resetea al agrupar en cluster. Los tres
  corregidos — detalle en HANDOFF.md.
- Bug de color: el literal `'transparent'` es `rgba(0,0,0,0)`, no "este
  color con alpha 0" — interpolar hacia él ensucia el degradado con
  tonos grises/negruzcos. Corregido calculando el rgba real del acento.
- Se evaluó y llegó a compilar en device una versión con
  `@react-native-masked-view/masked-view` (dependencia nativa nueva); se
  revirtió a una técnica con capas de `expo-linear-gradient` (ya
  instalado) que logra el mismo resultado sin dependencia nueva ni build.
- Reincidencia de la regla "no probar en simulador/device por iniciativa
  propia" (ver memoria `feedback_no_self_testing`) — se corrigió en el
  momento, reforzada en memoria para que no se repita.

**Qué sigue:**
- QA de Alejandro en su iPhone de todo lo de esta sesión (ya fue
  probando en vivo cada iteración, pero vale confirmar el estado final
  completo de un tirón).
- `git push` pendiente de que Alejandro lo suba desde una cuenta con
  permiso de escritura.
- El resto del backlog no cambió — ver `docs/TASKS.md`.

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅, en cada paso.

---

## Ciclo 8 — 2026-08-15 (nombres de lista a una palabra + renombrar)

**Qué hizo:**
- `lib/collections.ts`: `normalizeCollectionTitle()` (una palabra, máx. 18
  caracteres), aplicada en `createCollection` y como autocorrección al
  leer en `getCollections()` (listas viejas con nombre largo se arreglan
  solas, sin migración manual). Nueva `renameCollection(id, title)`.
- Renombrar lista: mantener presionada la fila en `save-to-list-sheet.tsx`
  la convierte en campo de texto editable con el mismo límite.
- Ambos campos de creación de lista (barra de filtros + hoja de guardado)
  comparten ahora la misma función de normalización en vivo.

**Qué sigue:**
- Ver `docs/TASKS.md` para la cola vigente — sigue pendiente el barrido
  de ~15 pantallas con título grande sin auditar (categoría distinta,
  contenido dinámico real en varias de ellas).

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅.

---

## Ciclo 7 — 2026-08-14 tarde (feedback en vivo: filtros, listas, títulos)

**Qué hizo:**
- Sesión larga de iteración en vivo con Alejandro sobre `components/foodie-filter-bar.tsx`
  y el patrón de títulos fijos en toda la app. Detalle completo en
  `docs/HANDOFF.md` (entrada "Barra de filtros rediseñada + limpieza
  panorámica de títulos").
- Reescribió la barra de filtros: categorías visibles (no más rueda
  oculta), rueda conservada solo para Listas, "Nueva lista" agregada,
  modo de vista Por lista/Por categoría en Guardados.
- Quitó títulos/kickers fijos de 12 pantallas tras varias rondas de
  corrección directa del usuario — el criterio final fue "sin excepciones"
  para chrome redundante con la tab bar, no el juicio caso-por-caso que
  el agente intentó aplicar al inicio.

**Qué encontró:**
- El crash real del fade NO era por nombres largos ni por crear
  `Animated.Value` en cada render (ambas fueron correcciones válidas pero
  no la causa raíz) — era usar `Animated.event(useNativeDriver:true)`
  sobre un `ScrollView` normal en vez de `Animated.ScrollView`. Solo se
  encontró leyendo el log real de Metro (`ERROR onScroll is not a
  function`), no adivinando. Lección para la próxima vez que algo "sigue
  roto" después de un fix: pedir o revisar el log real antes de la
  tercera iteración a ciegas.
- Segundo bug independiente en el mismo componente: gatear un estilo
  animado detrás de un `ref` mutable no funciona — el ref no dispara
  re-render, así que el estilo calculado en ese render queda congelado.
- El agente intentó aplicar juicio de diseño (HIG, "el título es dato no
  chrome") para conservar selectivamente algunos títulos (nombre de
  negocio, "Actividad") — el usuario corrigió esto varias veces y pidió
  remoción total sin excepciones. Quedó como decisión de producto, no
  como error de ejecución.

**Qué sigue:**
- QA humano en iPhone del fade + categorías (el fix de código no se probó
  en dispositivo todavía).
- ~15 pantallas más con el mismo patrón de título grande sin auditar —
  ver `docs/TASKS.md`.

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅, en cada paso
  de la sesión.

---

## Ciclo 6 — 2026-08-14 (auditoría integral: QA estático + consistencia visual)

**Qué hizo:**
- Dos agentes en paralelo (`qa-patio`, `design-system`) auditaron el repo
  completo (`app/`, `components/`, `lib/`, `supabase/functions/`), a petición
  directa de Alejandro ("audita toda la app").
- Corrigió lo accionable de bajo riesgo encontrado: ley huérfana de precio en
  `CLAUDE.md` (ver detalle en `docs/HANDOFF.md` 2026-08-14), dos guardados sin
  try/catch (`perfil-comunidad.tsx`, `resena/[id].tsx`), dos promesas sin
  `.catch()` en `usePatioDetailController.ts`, una API deprecada de
  ImagePicker, una key duplicada a mano (`'@patio_user_role'` → `USER_ROLE_KEY`),
  y borró `lib/notifications.ts` (huérfano, confirmado cero referencias).
- `npx tsc --noEmit` y `npx expo lint` verdes tras los cambios.

**Qué encontró:**
- La auditoría de QA no halló nada crítico más allá de lo corregido: sin
  botones zombi, sin imports rotos, sin violaciones de marca en copy visible.
- La auditoría visual encontró **deriva sistémica**, no puntual: los pesos de
  fuente reales en producción (`'400'`, `'600'`, `'800'`, `'500'`) no
  coinciden con la tríada documentada (900/700/300); las intensidades de
  `BlurView` no siguen la tabla de `DESIGN_SYSTEM.md`; hay paleta hardcodeada
  a mano en 5 archivos de alto tráfico en vez de leer los tokens del theme.
  Esto no se corrigió en masa — es un cambio de alto volumen (decenas de
  archivos) que requiere que Alejandro decida primero si el documento se
  actualiza a lo real o el código se corrige a lo documentado.

**Qué sigue:**
- Decisión de Alejandro sobre la deriva tipográfica/glass/paleta sistémica
  (ver `docs/TASKS.md`, sección nueva de esta auditoría, para el detalle
  archivo:línea completo).
- El resto del backlog no cambió — ver `docs/TASKS.md` para la cola vigente.

**Validación:**
- `npx tsc --noEmit` — verde ✅. `npx expo lint` — verde ✅.

---

## Ciclo 5 — 2026-06-14 (identidad verbal + control de costos + cierre de menú en código)

**Qué hizo:**
- Creó **`docs/design/foundations/IDENTITY_VERBAL.md`**: identidad verbal de Patio. Modelo de nombres estilo Uber/Rappi (nadie se renombra; verbo "publicar en Patio"; genérico = "lo de hoy"/"lugares", nunca "fonda/fondero/cocina" como etiqueta paraguas), tono calibrado por pantalla, lista anti-IA, par de marca **"¿Qué hay hoy? Saaaaaaabes."** (claim + tagline), glosario JTBD, §8 brief para pegar en Figma.
- Creó **`docs/COSTOS.md`**: burn tracker de inversión (suscripciones, créditos, tiempo, ROI). Burn rate ~$68.25/mes (Figma $20 + ChatGPT $20 + Claude $20 + Apple $8.25).
- Importó **v02** a `design-source/figma-make/v02/` (ajustes de menú). Comparó v01 vs v02 (registro en VERSIONS.md): v02 aporta arquitectura de datos del menú (`data/menu.ts`, `MenuCard`, `MenuPoster`).
- **Reescribió el modelo de precio del menú** en v02: de `priceMode` excluyente a **`dayPrice` + `price` por item coexistiendo** (precio del día + extras a la carta). Editor del Fondero simplificado (sin toggle).

**Qué encontró:**
- **Figma Make es malo/carísimo para AJUSTAR** (bueno solo para generar de cero). Alejandro compró 1,000 créditos extra ($9.20, recurrente) y se vaciaron en ajustes de menú fallidos. Decisión: cerrar el diseño en código, no en Figma.
- El defecto del menú no era visual sino de **modelo de datos**: el precio excluyente no representaba a las fonditas reales (comida corrida + a la carta). Se arregló en minutos, gratis, en código.

**Qué sigue:**
- Cancelar la suscripción de créditos Figma **antes del 7 jul** (recordatorio cloud + alarma personal de Alejandro programados).
- Cerrar "compartir" (`MenuPoster.tsx`) y limpiar copy "fondero/a" en v02.
- Luego: traducir a React Native y actualizar la versión de TestFlight.

**Validación:**
- Verificado: cero referencias rotas a campos viejos en v02. (v02 está fuera de TS del repo, no entra a `tsc`.)

---

## Ciclo 4 — 2026-06-12 (diseño rediseñado en Figma Make + sistema de versiones)

**Qué hizo:**
- Alejandro rediseñó Patio en **Figma Make** (Claude componiendo el UI completo en lienzo web). Esto **resuelve y reemplaza** el handoff pendiente a "Claude Design" del Ciclo 3.
- Importó el export (`High Fidelity Design for Patio.zip`, 116 archivos) a `design-source/figma-make/v01/`, **aislado del build**: Metro lo ignora (`metro.config.js` nuevo → `resolver.blockList`), TypeScript lo excluye (`tsconfig.json` → `exclude`), ESLint también (`eslint.config.js`). `.gitignore` excluye `node_modules`/`dist` internos.
- Montó **sistema de versiones de diseño**: `design-source/README.md` (flujo) + `design-source/figma-make/VERSIONS.md` (registro). Regla: Figma Make en la nube = doc vivo; el repo = snapshots fechados congelados, no se sincronizan, se reemplazan.

**Qué encontró:**
- El export es **web (Vite/React/Tailwind/Radix/MUI), no React Native**. No se pega en `app/` — es blueprint para **traducir** pantalla por pantalla.
- Decisión de producto: el diseño **NO está cerrado** (~90%); se sigue iterando visual + estructura + copy en Figma Make. Falta sobre todo **lenguaje textual**, no visual.
- **No traducir a React Native aún** — sería trabajo desperdiciado hasta declarar el diseño cerrado.

**Qué sigue:**
- Alejandro sigue iterando en Figma Make. En cada hito: exportar ZIP → `vNN/` → anotar fila en `VERSIONS.md`.
- Cuando el diseño quede **cerrado**: traducir pantalla por pantalla a `.tsx` (orden de `TASKS.md`), empezando por conciliar tokens de `theme.css` con `lib/colors.ts` / `DESIGN_SYSTEM.md`.

**Validación:**
- `npx tsc --noEmit` — verde ✅ (confirma que el código web quedó fuera de TypeScript).

---

## Ciclo 3 — 2026-06-06 (handoff a Claude Design + fórmula de imágenes de inicio)

**Qué hizo:**
- Confirmó que **Claude Design** es un producto web real de Anthropic Labs (claude.ai/design, Research Preview, modos Wireframe / High fidelity + Design System). El flujo acordado: rediseñar primero en Claude Design web → traer mockups/tokens aquí para implementar en `.tsx`.
- Amplió `docs/design/foundations/MASTER_PROMPT_CLAUDE_DESIGN.md` con nueva **sección 5.1 — Flujo navegacional completo** (recorridos Foodie y Fondero + reglas de flujo) para que el brief tenga panorama 100% sin depender de FLOW_V2.md.
- Produjo `docs/design/references/FLORES_ENDEMICAS_PROMPT.md`: fórmula validada para imágenes de inicio/hero — botánica mexicana endémica sobre fondo negro monolítico con degradado horizontal que se tiñe del color dominante de la flor (look "perfume de alta gama"). Reutilizable cambiando solo la flor.

**Qué encontró:**
- El brief para Claude Design ya estaba listo y es autocontenido; solo le faltaba el flujo navegacional explícito.
- Formato de imágenes de inicio decidido: **estática por ahora** (no animada). Peso no es problema; si se anima a futuro, mp4 corto en loop o Lottie, nunca GIF.

**Qué sigue:**
- Alejandro abre Claude Design (High fidelity), pega el MASTER_PROMPT, adjunta los 22 screenshots de `assets/screenshots/`, diseña empezando por `explorar`.
- Sacar imágenes de inicio en ChatGPT/Higgsfield con la fórmula de FLORES_ENDEMICAS_PROMPT.md.
- Al volver con mockups + tokens de Claude Design → implementar pantalla por pantalla en código.

**Validación:**
- Solo documentación. No se corrió `npx tsc --noEmit`.

---

## Ciclo 2 — 2026-06-03 (rediseño editorial — Claude in-session)

**Qué hizo:**
- Decisión de usuario confirmada: el rediseño se hace **aquí** (no en sesión externa de Claude Design) y se **mantiene la paleta actual de la app**, incluido el naranja (`#F2612F` / `#FF6A3D`), sin adoptar amarillo ni segundo acento.
- Leyó los 6 screenshots reales prioritarios del brief (`explorar`, `detalle/ficha`, `foto-menu`, `menu`, `perfil`, `cuenta`) desde `assets/screenshots/`.
- Produjo `docs/design/EDITORIAL_REDESIGN.md`: dirección editorial pantalla por pantalla (tipografía, jerarquía, glass, color, copy), cada una justificada contra los 12 principios WWDC17. **No** toca flujo ni estructura.

**Qué encontró:**
- Desalineación de color sistémica: algunos documentos proponían un segundo acento, pero producto cerró la paleta actual de la app. El trabajo visual debe concentrarse en jerarquía, glass, geometría y composición.
- Ratings `★ 5.0` repetidos en cada fila de explorar = ruido (contradice "curaduría humana, no estrellas frías").
- `menu.tsx` ya logra bien la densidad Apple Music; le falta respiro entre secciones.
- `share.tsx` posiblemente absorbible por `preview.tsx` — marcado para decisión de estructura (fuera del alcance editorial).

**Qué sigue:**
- Aprobación humana del documento editorial.
- Implementar pantalla por pantalla en el orden de `EDITORIAL_REDESIGN.md §8` (empezar por la regla de color a nivel token).
- QA en dispositivo (magic link, cámara, GPS) sigue pendiente y es independiente de esto.

**Validación:**
- Solo documentación. No se corrió `npx tsc --noEmit`.

---

## Ciclo 1 — 2026-05-17 (higiene documental)

**Qué hizo:**
- Actualizó `docs/GOAL.md` para reflejar que el flujo base Foodie/Fondero ya existe y que el foco actual es QA + handoff de diseño.
- Reescribió `docs/STATE.md` como fuente vigente de estado, pendientes reales y no pendientes.
- Reescribió `docs/TASKS.md` con la cola actual: QA humano, Claude Design handoff, auditoría visual y post-mockups.
- Actualizó `docs/NEXT_SESSION.md`, `docs/PATIO_PRD.md`, `docs/design/SCREENSHOT_INDEX.md`, `docs/design/foundations/CLAUDE_DESIGN_BRIEF.md` e `IDENTITY_AND_TYPE.md`.
- Añadió sección "Estado vigente" al inicio de `docs/HANDOFF.md` para que el historial viejo no se confunda con pendientes actuales.

**Qué encontró:**
- `docs/design/screenshots/` ya no existe en el worktree.
- Los screenshots vigentes siguen siendo `assets/screenshots/` + `docs/design/SCREENSHOT_INDEX.md`.
- Los paquetes bajo `docs/design/screenshots/` no deben usarse como fuente hasta que existan físicamente.
- Hay cambios no propios ya presentes: capturas borradas bajo `docs/design/screenshots/` y carpetas nuevas en `docs/design/references/Glass/` y `docs/design/references/Post redes/`.
- Paleta cerrada por producto: conservar `#F2612F` / `#FF6A3D` como accent naranja de la app; no introducir `#F5C842` ni amarillo como decisión pendiente.

**Qué sigue:**
- QA en dispositivo: magic link, cámara/galería, GPS y Fondero -> Foodie.
- Pasar a Claude Design screenshots reales, flujo escrito, definición de Fondero y referencias de spinner.
- Auditar `explorar.tsx` y `patio/[id].tsx` contra `VISUAL_SYSTEM.md`.

**Validación:**
- Solo cambios de documentación. No se corrió `npx tsc --noEmit`.

---

## Ciclo 0 — 2026-05-15 (sesión manual)

**Qué hizo:**
- Eliminó 7 componentes boilerplate de Expo sin uso real en el proyecto:
  - `components/hello-wave.tsx`
  - `components/parallax-scroll-view.tsx`
  - `components/external-link.tsx`
  - `components/loading-indicator.tsx`
  - `components/themed-text.tsx`
  - `components/themed-view.tsx`
  - `components/ui/collapsible.tsx`
- Migró `app/share.tsx` de ThemedText/ThemedView a Text/View nativo con `useTheme()`

**Validación:** `npx tsc --noEmit` — verde ✅

**Qué encontró:**
- `lib/navigation-state.ts` — exporta `setUserNavigatedFromLogin` pero no se detectó uso en app/. Requiere verificación manual.
- `lib/colors.ts` — posiblemente duplicado con `lib/theme.ts`. Verificar si Colors se sigue usando.
- `components/haptic-tab.tsx` — exporta `HapticTab` pero no se detectó uso en app/. Posible residual de Expo boilerplate.

**Qué sigue (próximas tareas en TASKS.md):**
- Auditar navigation-state.ts, colors.ts, haptic-tab.tsx
- Esperar brief de rediseño de Alejandro para desbloquear esa sección

---
