# STATE

## Estado actual (2026-05-11 — cierre de sesión)

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
| `perfil.tsx` | ✅ Rediseñado + lat/lng — pills, card operacional, botón "Marcar en el mapa" |
| `menu.tsx` | ✅ Auditado — fontWeight y letterSpacing corregidos |
| `foto-menu.tsx` | ✅ Auditado — fontWeight y letterSpacing corregidos |
| `preview.tsx` | ✅ Auditado — fontWeight y letterSpacing corregidos |
| `share.tsx` | ✅ Auditado |
| `explorar.tsx` | ✅ Auditado + Supabase — fontWeight corregido, lista usa fonditas reales |
| `buscar.tsx` | ✅ Supabase — busca fonditas reales por nombre/categoría + platillos MOCK |
| `cuenta.tsx` | ✅ Auditado |
| `patio/[id].tsx` | ✅ Supabase fallback — loading state, fetch por ID si no está en MOCK |

### Supabase — estado de conexión
- `explorar.tsx`: lista muestra fonditas reales de DB + MOCK_PATIOS para pins del mapa ✅
- `perfil.tsx`: lee/escribe `latitude` y `longitude` en `fonditas` ✅
- `buscar.tsx`: carga fonditas reales + búsqueda por nombre/categoría ✅
- `patio/[id].tsx`: fallback a Supabase por ID si no está en MOCK_PATIOS ✅; mapa oculto si lat=0 ✅
- **Migración pendiente**: ejecutar en Supabase dashboard antes de que el botón de ubicación funcione:
  ```sql
  ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS latitude float8;
  ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS longitude float8;
  ```

### Hints contextuales — IMPLEMENTADOS ✅
- `lib/hints.ts` — AsyncStorage, check one-time por key
- `components/hint-sheet.tsx` — Modal bottom sheet con spring animation
- Wired en: `perfil.tsx` (fondero 🏪), `menu.tsx` (fondero 📋), `share.tsx` (fondero ✉️), `explorar.tsx` (foodie 🍽️)

### Assets nativos — pendientes de build
- `app.json`: icon/splash con P transparente + plugin `expo-location` agregado
- **Requiere `npx expo run:ios`** para que GPS funcione (nueva dependencia nativa)

### TypeScript
- `npx tsc --noEmit` en verde ✅

## Próximos pasos
1. **Supabase migration** — correr el ALTER TABLE en dashboard para habilitar lat/lng
2. **`npx expo run:ios`** — rebuild nativo por expo-location + ver icono/splash
3. **Dev Fondero** — si da "Unmatched Route", presionar `r` en Metro para recargar bundle
3. **Verificar agente de hints** — revisar commit en GitHub
4. **patio/[id].tsx real data** — cuando se toca fondita real sin coords, navegar a pantalla con fetch de Supabase
5. **buscar.tsx** — extender búsqueda a fonditas reales por nombre/categoría

### Pendiente estructural
- Menu data en Supabase (tabla fonditas no tiene menú → búsqueda por platillo solo en MOCK)
- API key Google Maps para Android
- Conectar buscar.tsx y favoritos a Supabase
