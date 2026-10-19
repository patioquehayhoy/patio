# ROADCONTROLLER — Patio

> **Corte vigente — 2026-10-18:** pulido de Filtros/Listas, botones,
> iconografía y paleta compartida entre Foodie/Fondero guardado en este corte.
> Tras corregir el error de apertura de Listas, Alejandro respondió «ya quedó
> me parece» y pidió cerrar con documentación, commit y push. Se registra como
> confirmación del ajuste reciente; no sustituye QA completa de ambos roles,
> Android, letra grande ni candidato de tienda.
> `npm run check`: TypeScript/lint, 189 pruebas y control de release aprobados
> (29 verificaciones, 0 errores, 2 configuraciones Android pendientes).
> Push bloqueado por credenciales: GitHub confirma que `T1Alejandro` tiene
> lectura y carece de permiso de escritura en `patioquehayhoy/patio`.
> Checklist vigente: [pendientes](PENDING_LAUNCH_2026-10-12.md).

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


> Estado: v5 · 2026-10-18
> Uso: mapa operativo superior de `/Users/parco/Patio`.
> Función: decidir qué frente leer, qué carpeta tocar, qué está activo, qué está pausado y cómo no mezclar sistemas.
> Inspirado en `~/T1all/ROADCONTROLLER.md` (solo el formato; los sistemas no se mezclan).

> **Frente histórico, 2026-09-14:** navegación, búsqueda y filtros compartidos
> refinados en Mapa/Guardados; accesos directos Filtros y Tus listas, filas
> agrupadas e información de menú de hoy verificada por fecha. Código y pruebas
> completos; aprobación visual en iPhone físico pendiente. Leer el corte superior
> de [HANDOFF](HANDOFF.md) y [STATE](STATE.md). Los bloqueos de lanzamiento
> documentados en la auditoría siguen vigentes.

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
│   ├── menu.tsx          selector hijo de Menú nuevo (foto/Fotos/escritura)
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
| Código RN (producto) | `app/` `components/` `lib/` | Pulido compartido cerrado; 189 pruebas; confirmación reciente del usuario, QA integral pendiente | Alejandro prueba y reporta fallos concretos |
| Rama de trabajo | `rebuild/patio-final` | Checkpoint de este corte; push a la misma rama | No mezclar ni forzar main/v2-menu-vivo |
| Backend | `supabase/` `scripts/backend/` | Siete migraciones y cinco funciones promovidas tras 15 ensayos reales, 2026-10-09 | Integraciones IA/SMTP/push y QA móvil pendientes |
| Figma Make | `design-source/figma-make/` | Cerrado como herramienta; v01/v02 históricos | No retomar |
| Docs de estado | `HANDOFF` `STATE` `TASKS` | Corte 2026-10-18 y checklist único | Actualizar resultados de QA y gates de release |
| QA dispositivo | iPhone y Android | El usuario realizará la prueba; cierre iPhone previo sin confirmar | Búsqueda/swipe, GPS, ambas bibliotecas y ambos roles |
| TestFlight/Google Play | Distribución | Candidato firmado actual pendiente; no se inició EAS | Resolver gates del checklist antes de construir/enviar |
| Supabase | `patio`, org Parco Apps | Cuenta Patio como único Owner, verificado 2026-10-09 | No repetir login/promoción ni reasignar datos sintéticos |
| EAS Update (OTA) | Radar posterior | Decisión pendiente; no bloquea este checkpoint Git | Evaluar después del candidato y QA |

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
| Red, arranque en frío y monetización | `docs/NETWORK_COLD_START_AND_MONETIZATION.md` |
| Menú inteligente, revisión y póster | `docs/MENU_INTELLIGENCE_AND_POSTER.md` |
| Esquema maestro: marca → producto → producción | `docs/PATIO_SYSTEM_MAP.md` |
| Arquitectura técnica vigente | `docs/ARCHITECTURE.md` |
| Evolución, IA, recurrencia y red | `docs/PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md` |
| Traducción Airbnb → Patio | `docs/AIRBNB_TO_PATIO_SYSTEM.md` |
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

**Regla de dirección (actualizada 2026-07-10):** Figma Make quedó **cerrado como herramienta de producción** — v01/v02 son solo referencia visual, v03 se descartó. No retomar Make para diseñar ni ajustar; la reconstrucción vive en React Native sobre `rebuild/patio-final`.

## 8. Reglas de no mezcla

- `design-source/` **no se pega** en `app/` — es web (Vite/Tailwind), se traduce a RN.
- Identidad verbal (`IDENTITY_VERBAL.md`) mata al copy de Figma, siempre.
- El precio del día en `components/menu-composer.tsx` se conserva (regla components/CLAUDE.md).
- `"Saaaaaaabes."` no se modifica ni parafrasea.
- Build EAS solo cuando el simulador no alcanza; agrupar cambios (economía de builds).
- Naranja = marca, negro = interfaz; no introducir segundos acentos.
- No documentar screenshots que no existan físicamente.
- No mezclar archivos con T1all/T1brand — solo se comparte el formato de este controller.

## 9. Prioridades actuales

1. QA del usuario: búsqueda → swipe → navegación, cards, ubicación y bibliotecas.
2. Resolver auditoría npm y Maps/Firebase Android; validar SMTP, IA y push reales.
3. Completar privacidad, eliminación web, moderación y operación de soporte.
4. Candidatos firmados, QA iPhone/Android y fichas de tiendas.
5. Después del candidato: miniatura real del local, piloto y radar de producto.

Criterios y responsables: [PENDING_LAUNCH_2026-10-12](PENDING_LAUNCH_2026-10-12.md).
No reabrir auditoría amplia, USB ni EAS automáticamente. El cierre nativo previo
no está certificado como resuelto por tests/exportaciones.

## 10. Callgraph raíz

```txt
Solicitud de Alejandro
→ ROADCONTROLLER (este archivo: detectar frente)
→ HANDOFF + STATE (estado vigente)
→ doc/fuente del frente (§6)
→ trabajo (simulador primero; tsc antes de cerrar)
→ actualizar HANDOFF (+ STATE si cambió el panorama)
```

## 11. Agentes especializados

| Agente | Territorio | Incluye |
|---|---|---|
| `foodie-ops` | Descubrir | explorar, ficha, favoritos, vistos, cuenta, reseña |
| `fondero-ops` | Publicar | foto-menú, Hoy, historial, Mi Patio, alta Patio Smart + **todo el backend real** (Edge Functions, migraciones) |
| `design-system` | Sistema visual | paleta, tipografía, glass, spacing, componentes compartidos |
| `content-cdmx` | Voz de marca | copy, campañas, naming |
| `qa-patio` | QA estático | typecheck, lint, botones zombi, copy legacy |

Auditoría de los 53 documentos del repo (vigente / revisar / archivo):
`docs/DOCS_AUDIT_2026-07-22.md`.
