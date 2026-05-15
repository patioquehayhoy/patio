# STATE

## Estado actual (2026-05-15 — cierre de sesión)

### Sistema de diseño — CONSOLIDADO ✅
- **fontWeight**: solo `'900'` / `'300'` en todo el codebase
- **letterSpacing**: cero en todos los archivos, sin excepción
- **Fonts.brand** (Plus Jakarta Sans 800ExtraBold): aplicada en onboarding, index y tipografía de marca
- **Paleta y tokens**: todos via `makeStyles(t: Theme)`, ningún color hardcodeado fuera de paleta

### Pantallas — estado por pantalla
| Pantalla | Estado |
|----------|--------|
| `index.tsx` | ✅ Rediseñado — layout centrado, tagline 900/300 en dos líneas |
| `onboarding.tsx` | ✅ Rediseñado — Fonts.brand, tagline canónico, sin letterSpacing |
| `perfil.tsx` | ✅ Rediseñado + lat/lng — pills, card operacional, botón "Marcar en el mapa" |
| `menu.tsx` | ✅ Guarda en Supabase (menus + cartas) |
| `foto-menu.tsx` | ✅ Auditado |
| `preview.tsx` | ✅ Auditado |
| `share.tsx` | ✅ Auditado |
| `explorar.tsx` | ✅ Radar de antojo — sheet solo con intención + suggestion pills ambient |
| `buscar.tsx` | ✅ Redirige a /explorar (pantalla unificada) |
| `cuenta.tsx` | ✅ Auditado |
| `favoritos.tsx` | ✅ Fallback a fonditas reales de Supabase |
| `patio/[id].tsx` | ✅ Menú real desde Supabase (cartas → menus del día) |

### Supabase — estado de conexión ✅ COMPLETO
| Tabla | Estado |
|-------|--------|
| `fonditas` | ✅ lat/lng aplicado, lectura/escritura desde perfil.tsx |
| `menus` | ✅ Fondero guarda menú del día desde menu.tsx |
| `cartas` | ✅ Fondero guarda carta permanente desde menu.tsx |
| `menu_sections` | ✅ Tabla creada (para uso futuro / migración estructurada) |
| `menu_items` | ✅ Tabla creada (para uso futuro / migración estructurada) |
| `favoritos` | ✅ fallback a Supabase en favoritos.tsx |

### lib/menu.ts — fetchMenuForFondita ✅
- Lee de `cartas` (carta permanente) primero
- Fallback a `menus` (menú del día de hoy)
- Convierte `MenuData` → `PatioMenuSection[]` para patio/[id].tsx

### Hints contextuales — IMPLEMENTADOS ✅
- `lib/hints.ts` — AsyncStorage, check one-time por key
- `components/hint-sheet.tsx` — Modal bottom sheet con spring animation
- Wired en: `perfil.tsx` (fondero), `menu.tsx` (fondero), `share.tsx` (fondero), `explorar.tsx` (foodie)

### TypeScript
- `npx tsc --noEmit` en verde ✅

## Búsqueda — estado
- MOCK_PATIOS: búsqueda por platillo/tags en memoria ✅
- Fonditas reales Supabase: `searchLiveMenus()` busca en `cartas` + `menus` del día via ilike ✅
- Resultados mergeados sin duplicados en `explorar.tsx` ✅

## EAS Build
- **Preview iOS** en progreso al cierre de sesión 2026-05-15
- Credenciales Apple: `dubzon@live.com.mx`, Team `JK2N262L7X`
- Ver estado: https://expo.dev/accounts/parcomx/builds

## Pendientes para mañana
1. Verificar build en iPhone — instalar via link de expo.dev
2. GPS en perfil — probar en dispositivo real
3. Registrar UDID del iPhone en EAS para builds internos
4. API key Google Maps para Android

## NO pendiente (resuelto esta sesión)
- ~~Migración lat/lng en fonditas~~ — corrida en Supabase dashboard ✅
- ~~Tablas menu_sections / menu_items~~ — creadas ✅
- ~~favoritos.tsx solo MOCK~~ — conectado a Supabase ✅
- ~~patio/[id].tsx sin menú real~~ — lee de cartas/menus ✅
- ~~explorar.tsx sin sugerencias~~ — pills ambient implementadas ✅
