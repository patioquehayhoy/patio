# ROADCONTROLLER — Patio

> Estado: v1 · 2026-07-07
> Uso: mapa operativo superior de `/Users/parco/Patio`.
> Función: decidir qué frente leer, qué carpeta tocar, qué está activo, qué está pausado y cómo no mezclar sistemas.
> Inspirado en `~/T1all/ROADCONTROLLER.md` (solo el formato; los sistemas no se mezclan).

## 1. Lectura obligatoria

Al iniciar trabajo en Patio:

```txt
1. CLAUDE.md                  (reglas de diseño + marca, raíz del repo)
2. docs/ROADCONTROLLER.md     (este archivo — mapa y estado de frentes)
3. docs/HANDOFF.md            (estado vigente de la última sesión)
4. docs/STATE.md              (fuente de verdad operativa de features)
5. Doc específico del frente activo (ver §6)
```

## 2. Función de Patio

App móvil (Expo / React Native) de dos lados:

- **Foodie:** resolver "¿qué hay hoy?" — explorar mapa, buscar platillo, ver ficha, guardar.
- **Fondero:** publicar el menú del día en segundos — foto o captura, preview, compartir.

Tagline oficial: `"Saaaaaaabes."` — intocable. Identidad verbal manda sobre cualquier copy de Figma.

## 3. Mapa del repo

```txt
Patio/
├── app/               ← pantallas Expo Router (el producto real)
│   ├── explorar.tsx      home Foodie (mapa)
│   ├── patio/[id].tsx    ficha pública
│   ├── menu.tsx          Hoy (Fondero) — bloque de precio INTOCABLE
│   ├── menu-editar.tsx / foto-menu.tsx / preview.tsx   pipeline publicar
│   ├── perfil.tsx / perfil-editar.tsx   Mi Patio + horario semanal
│   └── historial / favoritos / vistos / cuenta / resena / onboarding
├── components/        ← bottom-tab-bar, menu-composer, collapsing-header, glass-button…
├── lib/               ← theme, colors, fondero-palette, db (Supabase), menu-store,
│                        horario, stats, favorites, vision, patios (mocks)
├── docs/              ← GOAL, STATE, HANDOFF, TASKS, DESIGN_SYSTEM, COSTOS, design/
├── design-source/     ← exports congelados de Figma Make (NO es código de la app)
│   └── figma-make/v01, v02 + VERSIONS.md
└── assets/screenshots/  ← evidencia visual histórica
```

## 4. Frentes activos y estado

| Frente | Dónde | Estado | Siguiente útil |
|---|---|---|---|
| Código RN (producto) | `app/` `components/` `lib/` | **Activo — va ADELANTE del diseño** | Cerrar pendientes de diseño jun-21 (ver §9) |
| Rama de trabajo | `v2-look-figma` | Limpia, **sin push** (no existe en origin) | `git push -u origin v2-look-figma` (auth GitHub pendiente, lo corre Alejandro) |
| Figma Make | nube + `design-source/figma-make/` | v02 congelado (2026-06-14) · **créditos disponibles de nuevo** | Flujo inverso: subir estado actual del código a Make y pedir ajustes puntuales (ver §7) |
| Docs de estado | `docs/HANDOFF.md` `STATE.md` `TASKS.md` | **Desactualizados** — reflejan 2026-06-21/22; el commit `b8b810b` (4 jul) no está documentado | Escribir HANDOFF de la sesión del 4 jul |
| QA dispositivo | iPhone 15 Pro "Parco" | Dev build instalada, itera por WiFi | Magic link, cámara/galería, GPS real |
| TestFlight | build 1.0.0 (45+) | Congelado en versión vieja | Build nuevo solo al cerrar bloque de cambios (economía EAS) |
| Supabase | proyecto `lafondita` (org Parco Apps) | Funcional; plan Free se pausa solo → dar Resume | No migrar correo todavía |
| EAS Update (OTA) | — | **No configurado** | Decisión pendiente: lo resolvería "última versión sin build" fuera de casa |

## 5. Cómo abrir Patio en el iPhone (las 3 formas)

| Quiero… | Forma | Requiere |
|---|---|---|
| Ver los cambios de HOY | **Dev build + Metro por WiFi**: en la Mac `npx expo start --dev-client --host lan`; en el iPhone abrir la app Patio (dev) y elegir el servidor `http://<IP-de-la-Mac>:8081` | Mac prendida, misma red WiFi. IP cambia por red: `ipconfig getifaddr en0` |
| Probar como usuario final, fuera de casa | **TestFlight** (o build preview EAS) | Nada, pero está congelado en la versión del último build |
| Última versión sin build y sin Mac | **EAS Update (OTA)** | No configurado aún — pendiente en radar |

Gotchas conocidos:
- Si el **simulador** también está conectado a Metro, el Fast Refresh se va al simulador → en el iPhone cerrar/abrir la app para ver cambios.
- Deep-links en simulador: solo `patio://explorar` funciona (ver memoria `sim_deeplink_fragile`).
- Signing Xcode ya configurado una vez (dubzon@live.com.mx, team JK2N262L7X) — no se vuelve a tocar.

## 6. Fuentes de verdad

| Tema | Fuente |
|---|---|
| Estado vivo de la última sesión | `docs/HANDOFF.md` (sección superior) |
| Features y pendientes operativos | `docs/STATE.md` |
| Cola de tareas | `docs/TASKS.md` |
| Reglas de diseño (paleta, tipo, glass) | `CLAUDE.md` + `docs/DESIGN_SYSTEM.md` |
| Identidad verbal (mata copy de Figma) | `docs/design/foundations/IDENTITY_VERBAL.md` |
| Filosofía de producto | `docs/GOAL.md` + `docs/PATIO_DESIGN_PRINCIPLES.md` |
| Diseño Figma Make (snapshot) | `design-source/figma-make/v02/` + `VERSIONS.md` |
| Tokens reales de la app | `lib/colors.ts` + `lib/theme.tsx` + `lib/fondero-palette.ts` |
| Costos / burn | `docs/COSTOS.md` |
| Bitácora de ciclos de agente | `docs/AGENT_STATUS.md` |

## 7. Comparativa código ↔ Figma Make (v02, panorama 2026-07-07)

**Conclusión: el código ya tradujo v02 casi completo y lo superó.** Los commits del 17–22 jun ("look Figma") + `b8b810b` (4 jul) aterrizaron el diseño y siguieron construyendo encima. Mapa:

| Figma Make v02 | Código RN | Estado |
|---|---|---|
| FoodieMap / MapDark | `app/explorar.tsx` | ✅ traducido |
| FoodieDetail / Dark | `app/patio/[id].tsx` | ✅ traducido |
| FoodieOnboarding | `app/onboarding.tsx` | ✅ traducido (fotos botánicas reales) |
| FoodieSaved / Me / Review | `favoritos` / `cuenta` / `resena` | ✅ traducido |
| FonderoLanding / MagicLink | `fondero-acceso` / `login-callback` | ✅ traducido |
| FonderoPublish | `menu-editar` + `components/menu-composer.tsx` | ✅ traducido y rediseñado después (4 jul) |
| FonderoFonda / History / Success | `perfil` / `historial` / `menu-publicado` | ✅ traducido |
| MenuCard / MenuPoster | `app/preview.tsx` (póster compartible) | ✅ traducido |
| TabBar | `components/bottom-tab-bar.tsx` | ✅ traducido y evolucionado (estilo Instagram, auto-hide) |
| data/menu.ts (dayPrice + extras) | `lib/menu-store.ts` | ✅ modelo aplicado |
| theme.css (tokens) | `lib/colors.ts` / `fondero-palette.ts` | ✅ conciliado |

**Lo que existe en código y Make NO conoce** (si se retoma Make, hay que alimentárselo con capturas, no al revés):
horario semanal por día · stats vivas + `vistos.tsx` · collapsing-header (Large Title) · modo claro Fondero · navegación pestañas-puras · manifiesto · hints one-time · menu-composer nuevo.

**Regla de dirección:** con créditos nuevos, Figma Make sirve para **explorar look de pantallas específicas** partiendo de capturas del estado actual — NO para rediseñar flujos que el código ya resolvió. Recordar: Make es bueno generando de cero, malo/caro ajustando (learning Ciclo 5).

## 8. Reglas de no mezcla

- `design-source/` **no se pega** en `app/` — es web (Vite/Tailwind), se traduce a RN.
- Identidad verbal (`IDENTITY_VERBAL.md`) mata al copy de Figma, siempre.
- El bloque de precio en `menu.tsx` no se toca (regla CLAUDE.md).
- `"Saaaaaaabes."` no se modifica ni parafrasea.
- Build EAS solo cuando el simulador no alcanza; agrupar cambios (economía de builds).
- Naranja = marca, negro = interfaz; no introducir segundos acentos.
- No documentar screenshots que no existan físicamente.
- No mezclar archivos con T1all/T1brand — solo se comparte el formato de este controller.

## 9. Prioridades actuales

```txt
1. Documentar b8b810b (4 jul): escribir el HANDOFF que falta + validar qué
   pendientes de jun-21 cerró (horarios ✅ aparente, menú ✅ aparente).
2. Push de v2-look-figma a origin (Alejandro; auth GitHub pendiente).
3. Validar en iPhone los pendientes de diseño restantes:
   header system (propagar o no) · "usar menú anterior" con preview ·
   onboarding sheet "Ponle nombre".
4. QA dispositivo: magic link, cámara, GPS.
5. Decidir EAS Update (OTA) para "última versión sin build".
6. Datos falsos hardcoded (312 vistas, +18%, etc.): conectar o quitar
   antes de usuarios reales.
7. Radar: organización de Guardados a escala (~70 items → filtros).
```

## 10. Callgraph raíz

```txt
Solicitud de Alejandro
→ ROADCONTROLLER (este archivo: detectar frente)
→ HANDOFF + STATE (estado vigente)
→ doc/fuente del frente (§6)
→ trabajo (simulador primero; tsc antes de cerrar)
→ actualizar HANDOFF (+ STATE si cambió el panorama)
```
