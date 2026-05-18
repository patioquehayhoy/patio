# Próxima sesión — empieza aquí

> Última actualización: 2026-05-17 — handoff QA + Claude Design.

## Dónde estamos

El repo tiene el MVP funcional de Foodie + Fondero y está en fase de **QA en dispositivo + handoff a Claude Design**.

No asumir que existe un paquete nuevo de screenshots en `docs/design/screenshots/`: actualmente la fuente vigente es `assets/screenshots/` + `docs/design/SCREENSHOT_INDEX.md`.

## Lo que el usuario va a hacer

1. Pasar a Claude Design screenshots reales del flujo actual en orden de navegación.
2. Pasar el flujo escrito Foodie/Fondero en 2 líneas.
3. Pasar definición exacta de Fondero.
4. Pasar referencias de spinner/radar.
5. Volver con mockups o dirección visual.

## Lo que TÚ (Claude) debes hacer si te invocan sin contexto

### Si el usuario regresa con mockups de Claude Design
→ Implementar pantalla por pantalla siguiendo el orden en `docs/TASKS.md` sección "POST-CLAUDE-DESIGN"
→ Empezar siempre por `explorar.tsx` (más crítica del Foodie)
→ Validar cada cambio con `npx tsc --noEmit` antes de commitear

### Si el usuario pide preparar contexto para Claude Design
→ Usar `docs/STATE.md`, `docs/design/FLOW_V2.md`, `docs/design/SCREENSHOT_INDEX.md` y `docs/PATIO_PRD.md`
→ Aclarar que screenshots son evidencia de flujo, no referencia estética
→ Aclarar que no existe reserva ni ficha individual de platillo todavía

### Si el usuario reporta bug del magic link Fondero
→ Pedirle screenshot del texto de diagnóstico que ahora aparece en `/login-callback`
→ Con ese texto investigar — ver `~/.claude/.../memory/supabase_magic_link.md`

### Si el usuario quiere agregar AGENTE_VOZ
→ Recordarle: gating Pro decidido. Ver `~/.claude/.../memory/monetization_strategy.md`
→ Arrancar con MVP texto primero (sin captura de audio)

## Lo que NO debes hacer sin permiso explícito

- Tocar el bloque de precio en `menu.tsx`
- Modificar/parafrasear `"Saaaaaaabes."`
- Borrar `onboarding.tsx` (sigue huérfano pero útil)
- Lanzar EAS build (cuesta cuota, siempre confirmar antes)
- Hacer commit con cuentas/secrets
- Revertir capturas o carpetas nuevas del usuario en `docs/design/references/`

## Estado de cuentas y servicios

Ver `~/.claude/.../memory/patio_accounts.md`:
- `quehayhoy.patio@gmail.com` → soporte público
- `contacto.parco@gmail.com` → admin Supabase/Vercel
- `dubzon@live.com.mx` → Apple ID (Team JK2N262L7X)

## Agentes Patio disponibles

En `.claude/agents/`:
- `design-system` — validar/proponer UI
- `fondero-ops` — bugs/features del flujo Fondero
- `content-cdmx` — copy, voz, assets (Higgsfield MCP)
- `qa-patio` — QA estático antes de builds
