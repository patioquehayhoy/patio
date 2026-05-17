# Próxima sesión — empieza aquí

> Última actualización: 2026-05-17 — después de cerrar el ciclo de fixes pre-Claude Design.

## Dónde estamos

El repo está **listo para entregar a Claude Design**. Código limpio, sin bugs conocidos críticos, TypeScript y lint OK. Build 1.0.0 (45) en proceso de submit a TestFlight.

## Lo que el usuario va a hacer

1. Tomar 13 screenshots de la app desde TestFlight (lista en `docs/TASKS.md`)
2. Abrir sesión en Claude Design (claude.ai web)
3. Usar los **Prompts copy-paste** que están en `docs/PATIO_PRD.md` sección 12
4. Volver con mockups

## Lo que TÚ (Claude) debes hacer si te invocan sin contexto

### Si el usuario regresa con mockups de Claude Design
→ Implementar pantalla por pantalla siguiendo el orden en `docs/TASKS.md` sección "POST-CLAUDE-DESIGN"
→ Empezar siempre por `explorar.tsx` (más crítica del Foodie)
→ Validar cada cambio con `npx tsc --noEmit` antes de commitear

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
