# Auditoría de documentación — 22 julio 2026

> Los 53 archivos `.md` del repo (excluye `ios/Pods/` y `.expo/`, que son de
> terceros), uno por uno, para revisión humana. Marca `[x]` conforme los repases.
> Estado: `[ ]` vigente sin tocar · `[x]` revisado/resuelto · `[~]` en duda.
>
> Leyenda de estado real (no confundir con el checkbox de revisión):
> **VIGENTE** = manda hoy · **REVISAR** = ya no dice la verdad o compite con otro ·
> **ARCHIVO** = histórico a propósito, no se toca salvo limpieza.

## Gobernanza y estado (8)

- [ ] `CLAUDE.md` — VIGENTE. Reglas de marca, diseño y economía de builds; arranque obligatorio.
- [x] `docs/ROADCONTROLLER.md` — RESUELTO 2026-07-22. Tabla de `read-menu` corregida, prioridades actualizadas, sección §11 con los 2 agentes nuevos.
- [ ] `docs/HANDOFF.md` — VIGENTE. Bitácora viva, entrada superior = más reciente (100 KB).
- [ ] `docs/STATE.md` — VIGENTE. Estado de features, fuente operativa.
- [ ] `docs/TASKS.md` — VIGENTE. Cola de trabajo.
- [ ] `docs/NEXT_SESSION.md` — REVISAR (corregido tras auditoría de contenido). Sus pasos 3-4 dicen "rotar la clave Anthropic" y "desplegar read-menu" como pendientes; ambos ya están RESUELTOS en TASKS.md/ROADCONTROLLER.md desde el 18 jul, y rotar la clave quedó explícitamente despriorizada. Quien lo siga al pie de la letra repite trabajo cerrado.
- [ ] `docs/AGENT_STATUS.md` — REVISAR. 5 semanas sin nueva entrada (última: Ciclo 5, 14 jun); `/status` la lee como fuente primaria y da panorama viejo.
- [x] `docs/AGENT.md` — BORRADO 2026-07-22.

## Filosofía y producto (6)

- [ ] `docs/GOAL.md` — REVISAR (detalle confirmado). Línea 48 sigue listando "entregar a Claude Design screenshots + flujo escrito" como objetivo técnico activo; ese hand-off se cerró in-session (Ciclo 2) y todo el proceso de herramienta externa (Figma Make) quedó cerrado el 10 jul ("no retomar", ROADCONTROLLER §4). También abre con 4 oraciones seguidas en patrón "no es X, sino Y" — no es copy visible al usuario, pero es la misma estructura que la ley anti-comparativo prohíbe.
- [ ] `docs/PATIO_DESIGN_PRINCIPLES.md` — REVISAR (detalle confirmado). Además de estar en inglés y no incluir las leyes de mayo/julio, describe un patrón de UI ("Agregar sección" como acción persistente + utilidades bajo "Más opciones") que **no existe en el código real** — `components/menu-composer.tsx` solo tiene "Agregar platillo" y acciones inline Subir/Bajar/Eliminar por sección, sin "Más opciones".
- [ ] `docs/PATIO_SYSTEM_MAP.md` — VIGENTE. Esquema maestro marca → producto → producción, v7 canónico.
- [ ] `docs/PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md` — VIGENTE. Recurrencia, IA, incentivos, comunidades, gobernanza, privacidad.
- [ ] `docs/AIRBNB_TO_PATIO_SYSTEM.md` — VIGENTE. Guía de traducción para perfil, guardados y reseñas futuras.
- [x] `docs/PATIO_PRD.md` — RESUELTO 2026-07-22 (dos pasadas). Banner de archivo agregado; la auditoría de contenido encontró que el banner *decía* haber limpiado los links a `FLOW_V2.md`/`SCREENSHOT_INDEX.md` pero la sección 10 seguía enlazándolos en vivo — corregido de verdad ahora.

## Arquitectura técnica (5)

- [ ] `docs/ARCHITECTURE.md` — VIGENTE. Stack, capas, flujos críticos, riesgos que gobiernan cambios.
- [ ] `docs/ARCHITECTURE_AUDIT_2026-07-08.md` — ARCHIVO. Diagnóstico puntual, ya incorporado a ARCHITECTURE.md.
- [ ] `docs/APP_AUDIT_2026-07-08.md` — ARCHIVO. Auditoría integral de esa fecha.
- [ ] `docs/DIFF_AUDIT_2026-07-08.md` — ARCHIVO. Registro del rollback conservador de experimentos riesgosos.
- [ ] `docs/FOODIE_SEARCH_FLOW_2026-07-08.md` — ARCHIVO. Nota puntual del flujo de búsqueda Foodie.

## Diseño — sistema vigente (5)

- [x] `docs/DESIGN_SYSTEM.md` — RESUELTO 2026-07-22. Botón primario corregido de `'900'` a `'700'`; "Nombre fondita" con `Fonts.brand` ya estaba correcto (era CLAUDE.md el que decía SF Pro Display). Ver "Hallazgo mayor" — se corrigió CLAUDE.md, no este doc.
- [ ] `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md` — VIGENTE (confirmado). Sin contradicciones contra CLAUDE.md; incluso corrige una imprecisión del propio CLAUDE.md (el "grid de 8pt" no es regla real de Apple, es convención propia de Patio).
- [x] `docs/design/foundations/IDENTITY_VERBAL.md` — RESUELTO 2026-07-22. La auditoría encontró que aprobaba `"Esto no es delivery."` como "voz Patio a conservar" — es literalmente el ejemplo que CLAUDE.md cita como lenguaje comparativo prohibido (ley 2026-07-07), y este doc es del 19 jul, doce días *después* de esa ley. Línea retirada.
- [ ] `docs/design/foundations/IDENTITY_AND_TYPE.md` — REVISAR (detalle confirmado). §2 asigna `Fonts.brand` a nombre de negocio/títulos (CLAUDE.md dice SF Pro Display para lo mismo). §3 usa pesos intermedios explícitos (`semibold`, `medium`) contra la regla absoluta "solo 900 y 300" de CLAUDE.md.
- [x] `docs/design/foundations/HIG_REFERENCE.md` — RESUELTO 2026-07-22 (parcial). Su tabla de colores citaba la paleta anterior (`#F8F8F5`, `#F2612F`/`#FF6A3D` como hex fijos) — corregida para apuntar a CLAUDE.md en vez de hardcodear valores que quedaron atrás. Sigue huérfano: no está en la lista de lectura obligatoria de CLAUDE.md pese a ser de los docs más recientes.

## Proceso cerrado — Figma Make & Claude Design (15)

> Figma Make quedó cerrado como herramienta el 10 de julio. Se conservan como
> referencia histórica, no como fuente activa.

- [ ] `docs/design/foundations/CLAUDE_DESIGN_BRIEF.md` — ARCHIVO confirmado, con contenido rescatable (§1-5: resumen de dominio/JTBD/12 principios sigue siendo correcto). Link roto: línea 127 apunta a `SCREENSHOT_INDEX.md`, ya borrado.
- [ ] `docs/design/foundations/MASTER_PROMPT_CLAUDE_DESIGN.md` — ARCHIVO confirmado. Si se reutiliza sin editar, inyecta paleta muerta (`#F8F8F5`, `#1C1C1E`) y un tab bar de Fondero que ya no existe. Redundante con ESSENTIAL_DESIGN_PRINCIPLES.md.
- [ ] `docs/design/EDITORIAL_REDESIGN.md` — ARCHIVO, pero con contenido rescatable: reglas concretas (matar rating repetido por fila, menú del día inmediatamente después del nombre en ficha, horario como dato editorial grande) que no están capturadas en ningún doc vigente. Ojo: su regla "naranja nunca en tabs/chrome" contradice a la ley vigente de CLAUDE.md que sí permite naranja en navegación — si alguien lo lee sin saber que es histórico, se confunde.
- [ ] `docs/design/VISUAL_SYSTEM.md` — ARCHIVO confirmado, sin hallazgos nuevos (paleta obsoleta es la razón esperada de archivo).
- [ ] `docs/design/PLAN_VISUAL_V2.md` — ARCHIVO confirmado. La migración de tokens que proponía nunca ocurrió — evidencia de que el plan quedó abandonado, no hay riesgo de confusión (se lee como propuesta condicional).
- [ ] `docs/design/REDESIGN_BLUEPRINT_V1.md` — ARCHIVO confirmado, sin hallazgos.
- [ ] `docs/design/FIGMA_REDESIGN_BRIEF.md` — ARCHIVO confirmado, sin hallazgos nuevos más allá de la paleta ya superada.
- [ ] `docs/design/DESIGN_VERSION_REGISTRY.md` — ARCHIVO confirmado, sin links rotos, sin contenido rescatable (taxonomía "Patio Vivo/Tahoe/Agent" es puro artefacto de proceso).
- [ ] `docs/design/FIGMA_AGENT_CODE_PROMPT.md` — ARCHIVO confirmado. Contiene textualmente `"No es delivery. No es app de restaurantes. No es marketplace."` — el patrón que la ley anti-comparativo prohíbe. El doc es anterior a la ley (7 jun), pero si alguien reutiliza este prompt tal cual, reintroduce el patrón.
- [ ] `docs/design/PROMPT_MAESTRO_REDISENO_CHATGPT.md` — ARCHIVO confirmado. 1 link roto: referencia implementar `FLOW_V2.md`, ya borrado.
- [ ] `docs/design/AGENT_DESIGN_TASK.md` — ARCHIVO confirmado. 3 links rotos en su lista "Documentos que DEBES leer": `PRODUCT_PRINCIPLES.md`, `FLOW_V2.md`, `SCREENSHOT_INDEX.md`.
- [ ] `docs/design/CLAUDE_CODE_RADAR_TASK.md` — ARCHIVO confirmado. Mismos 3 links rotos que AGENT_DESIGN_TASK.md.
- [x] `docs/design/FLOW_V2.md` — BORRADO 2026-07-22.
- [x] `docs/design/PRODUCT_PRINCIPLES.md` — BORRADO 2026-07-22.
- [x] `docs/design/SCREENSHOT_INDEX.md` — BORRADO 2026-07-22.

## Referencias visuales (3)

- [ ] `docs/design/references/STYLE_INDEX.md` — ARCHIVO confirmado. Cede "precedencia" a `VISUAL_SYSTEM.md`, que también es archivo — la instrucción de autoridad ya no aplica (el sistema vigente es `DESIGN_SYSTEM.md`). Solo llega hasta REF-005; REF-006 y REF-007 (que DESIGN_SYSTEM.md dice cubrir) no existen en ningún lado.
- [ ] `docs/design/references/FLORES_ENDEMICAS_PROMPT.md` — VIGENTE confirmado, sin contradicción de marca. Nota abierta: propone una estética botánica (negro absoluto + rim-light) distinta de `GLASS_ORGANICO` en DESIGN_SYSTEM.md (frosted glass + olive/taupe/lavanda) — dos direcciones "botánica CDMX" activas sin que ningún doc diga cuál manda.
- [ ] `docs/design/references/README.md` — ARCHIVO confirmado, sin hallazgos.

## Infraestructura y operación (5)

- [x] `supabase/functions/README.md` — RESUELTO 2026-07-22. No documentaba `smart-setup` (solo `read-menu`) y describía el deploy como pendiente cuando ambas funciones están en producción desde el 18 jul. Corregido.
- [ ] `supabase/templates/README.md` — VIGENTE confirmado. La paleta del template de email (`#111214`/`#F2612F`/`#F8F8F5`) no coincide con la paleta vigente de CLAUDE.md — no es un error del doc (describe correctamente lo que hace `magic-link.html`), es una decisión pendiente: ¿el email debe migrar a `#EFEFEF`/`#292929`?
- [ ] `docs/COSTOS.md` — VIGENTE confirmado. Placeholders `⟨?⟩` son comportamiento esperado, no error.
- [x] `README.md` (raíz) — RESUELTO 2026-07-22. Reemplazado: ya no es boilerplate de Expo, apunta a CLAUDE.md/ROADCONTROLLER/HANDOFF/STATE/TASKS.

## Automatización — siempre vigente, no auditada por estado (8)

- [ ] `.claude/agents/design-system.md`
- [ ] `.claude/agents/fondero-ops.md` — ampliado 2026-07-22: dueño explícito de `supabase/functions/` y `supabase/migrations/`.
- [x] `.claude/agents/foodie-ops.md` — CREADO 2026-07-22: explorar, ficha, favoritos, vistos, cuenta, reseña. No existía dueño para el lado Foodie.
- [ ] `.claude/agents/content-cdmx.md`
- [ ] `.claude/agents/qa-patio.md`
- [ ] `.claude/commands/status.md`
- [ ] `.claude/commands/next-task.md`
- [ ] `.claude/commands/new-agent.md`

---

## Hallazgo mayor — RESUELTO 2026-07-22 (mientras Alejandro estaba fuera)

El sistema tipográfico documentado no coincidía con el real. Se resolvió en la
dirección de menor riesgo: **la documentación se corrigió para describir lo que
la app ya hace en producción — no se tocó ninguna pantalla ni comportamiento visible.**

- `lib/theme.tsx` — el export `Type` (escala `800`/`700`/`400`/`500`) estaba
  100% muerto (cero usos fuera de su propia definición, confirmado por grep y
  `tsc --noEmit` verde tras borrarlo). Eliminado.
- `CLAUDE.md` — sección Tipografía corregida: `Fonts.brand` (Plus Jakarta Sans
  800 ExtraBold) es el sistema real para identidad ≥20pt, no SF Pro Display.
  Pesos reales confirmados contra código: `900` (títulos) / `700` (eyebrows,
  labels, botón primario — verificado en `saveBtnText` de `perfil-editar.tsx`
  y en los `ctaText` de favoritos/preview/vistos) / `300` (cuerpo). También se
  corrigió "Botones primarios" (decía `'600'`) y "Labels de sección" (decía
  `'900'`, la realidad es `'700'`).
- `docs/DESIGN_SYSTEM.md` — línea de botón primario corregida de `'900'` a `'700'`.

**Quedó fuera, sigue abierto:** un `'600'` puntual en subtítulos de opción
(`optionTitle`) que no se generalizó a regla por falta de evidencia suficiente,
y la doble estética botánica (`FLORES_ENDEMICAS_PROMPT.md` vs. `GLASS_ORGANICO`)
y la paleta del email de magic link — esos si necesitan criterio de Alejandro,
no eran solo "documentar lo que ya existe".

---

## Resumen — corte original 2026-07-22 (antes de la limpieza)

| Estado | Cuenta |
|---|---|
| Vigente | 24 |
| Revisar | 6 (incluye 1 conflicto directo: `PATIO_PRD.md`) |
| Archivo | 23 (18 histórico a propósito + 5 candidatos a borrar) |
| **Total** | **53** |

## Limpieza ejecutada — misma sesión, 2026-07-22

- Borrados: `docs/AGENT.md`, `docs/design/FLOW_V2.md`, `docs/design/PRODUCT_PRINCIPLES.md`, `docs/design/SCREENSHOT_INDEX.md` (4 de los 5 candidatos).
- `README.md` (raíz): reemplazado, ya no es boilerplate.
- `docs/PATIO_PRD.md`: banner de archivo, deja de competir con `PATIO_SYSTEM_MAP.md`.
- `docs/ROADCONTROLLER.md`: tabla y prioridades corregidas + nueva §11 de agentes.
- `docs/STATE.md` y `docs/TASKS.md`: referencias rotas a los archivos borrados, corregidas.
- Agentes: `foodie-ops` creado, `fondero-ops` ampliado con el backend real (Edge Functions + migraciones).

**Total tras la limpieza: 49 documentos** (53 − 4 borrados).

## Auditoría de contenido — corte 2026-07-22 (3 agentes en paralelo, 42 docs leídos completos)

A diferencia del corte original (fechas + inferencia por nombre), esto es lectura
completa de cada archivo, cruzada contra CLAUDE.md y contra el código real.

- **Etiquetas corregidas de VIGENTE a REVISAR:** `docs/NEXT_SESSION.md`,
  `docs/DESIGN_SYSTEM.md`, `docs/design/foundations/HIG_REFERENCE.md` (huérfano →
  parcialmente resuelto).
- **Resuelto en el momento (bajo riesgo, sin ambigüedad):** `IDENTITY_VERBAL.md`
  (copy prohibido retirado), `HIG_REFERENCE.md` (paleta muerta corregida),
  `PATIO_PRD.md` (links realmente rotos, no solo el banner), `supabase/functions/README.md`
  (faltaba `smart-setup`, estado de deploy mentía).
- **Abierto para Alejandro, no se tocó:** el sistema tipográfico real vs. documentado
  (ver sección arriba — el hallazgo más grande de esta auditoría), la doble estética
  botánica (`FLORES_ENDEMICAS_PROMPT.md` vs. `GLASS_ORGANICO`), si el email de magic
  link debe migrar a la paleta vigente.
- **Pendientes de revisión humana, no automatizables:** `docs/GOAL.md`,
  `docs/PATIO_DESIGN_PRINCIPLES.md` (contenido desalineado con `menu-composer.tsx`
  real), `docs/design/foundations/IDENTITY_AND_TYPE.md` — los tres sin tocar desde
  mayo y ninguno se puede arreglar solo con un `sed`, necesitan reescritura de criterio.
- **8 links rotos encontrados y corregidos** en documentos activos (`PATIO_PRD.md` x2);
  **6 links rotos documentados sin corregir** en archivo histórico (no se edita
  historia, solo se anota) en `AGENT_DESIGN_TASK.md`, `CLAUDE_CODE_RADAR_TASK.md`,
  `PROMPT_MAESTRO_REDISENO_CHATGPT.md`, `CLAUDE_DESIGN_BRIEF.md`.
