# AGENT STATUS — Bitácora de ciclos

> El agente escribe aquí después de cada ciclo. Formato: fecha, qué hizo, qué encontró, qué sigue.

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
