# STATE

> Fuente de verdad operativa. Última actualización: 2026-05-17.

## Estado ejecutivo

Patio ya tiene un MVP funcional de dos lados:

- **Foodie:** abrir sin login -> explorar mapa -> buscar platillo -> seleccionar fondita -> ver ficha/menu -> guardar/compartir/calificar/como llegar.
- **Fondero:** login magic link -> perfil negocio -> marcar ubicación -> crear/editar menú -> guardar en Supabase -> preview/share.
- **Puente real:** lo que publica Fondero en Supabase puede verse desde la ficha Foodie.

El foco actual es **QA en dispositivo + paquete para Claude Design + auditoría visual Foodie**, no construir el flujo base desde cero.

## Hecho

### Producto / flujo

- Entrada Foodie-first con acceso secundario Fondero.
- Foodie y Fondero separados por intención y navegación.
- `/explorar` es la home real del Foodie.
- `/buscar` no es flujo visible del MVP; recupera hacia `/explorar`.
- Explorar abre como radar de antojo: mapa vivo, buscador protagonista, sugerencias ambient y sheet solo con intención.
- Favoritos, cuenta y manifiesto existen como utilidades/secundarios.
- Rating de 5 estrellas implementado con razones estructuradas cuando baja de 5.
- Share nativo de ficha/lugar implementado.

### Fondero

- Login por magic link.
- Perfil de negocio rediseñado con categoría, horario, pagos y ubicación.
- GPS/lat-lng en `perfil.tsx`.
- `menu.tsx` guarda menú del día y carta permanente.
- `foto-menu.tsx`, `preview.tsx` y `share.tsx` existen y fueron auditados en ciclos previos.
- Hints contextuales one-time implementados en Fondero y Foodie.

### Supabase

| Tabla | Estado |
|---|---|
| `fonditas` | ✅ lat/lng aplicado, lectura/escritura desde perfil |
| `menus` | ✅ menú del día desde `menu.tsx` |
| `cartas` | ✅ carta permanente desde `menu.tsx` |
| `menu_sections` | ✅ creada para migración estructurada futura |
| `menu_items` | ✅ creada para migración estructurada futura |

### Foodie data

- `fetchPublicFonditas()` carga fonditas reales.
- `fetchFonditaById()` permite fallback cuando un ID no está en mocks.
- `fetchMenuForFondita()` lee `cartas` primero y hace fallback a `menus` del día.
- `favoritos.tsx` combina mocks + Supabase.
- `explorar.tsx` combina búsqueda de mocks con `searchLiveMenus()` para cartas/menús reales.

### Sistema de diseño implementado

- `Fonts.brand` = Plus Jakarta Sans 800ExtraBold.
- `fontWeight` permitido: `'900'` / `'300'`, con excepciones documentadas.
- Separadores deben usar `StyleSheet.hairlineWidth`.
- Glass usa `expo-blur`; velos de mapa usan `expo-linear-gradient`.
- Tema actual en código usa naranja `#F2612F` light / `#FF6A3D` dark como `theme.accent`.
- `VISUAL_SYSTEM.md` propone `#F5C842` como warm accent específico de mapa/horarios; todavía debe reconciliarse con el theme antes de implementarse globalmente.

## Pendiente ahora

### QA humano / dispositivo

1. Verificar build iOS/TestFlight o preview en dispositivo real.
2. Probar magic link Fondero con diagnóstico visible si falla.
3. Probar cámara/galería y permisos nativos.
4. Probar GPS real en `perfil.tsx`.
5. Registrar UDID de iPhone para builds internos si aplica.
6. Configurar API key Google Maps restringida antes de builds Android reales.

### Claude Design

1. Pasar screenshots reales del flujo actual como evidencia, no como referencia visual final.
2. Pasar flujo escrito Foodie/Fondero en 2 líneas.
3. Pasar definición exacta de Fondero.
4. Pasar referencias de spinner/radar: Linear/Tesla/Apple system activity, tech glow silencioso.
5. Aclarar que no existe reserva ni ficha individual de platillo todavía.

### Auditoría visual de implementación

1. `app/explorar.tsx`: glass, pins, bottom sheet, velo, pills y radar contra `VISUAL_SYSTEM.md`.
2. `app/patio/[id].tsx`: título brand, rating, mapa inline, pin, botón "Cómo llegar" glass, separadores hairline.
3. `app/index.tsx`: entrada limpia/editorial sin depender de grid DEV.
4. `app/favoritos.tsx`: empty state y filas.
5. Reconciliar `docs/DESIGN_SYSTEM.md`, `docs/design/VISUAL_SYSTEM.md` y `lib/colors.ts` antes de hacer cambios grandes de paleta.

## No pendiente

- Migración lat/lng en `fonditas`.
- Creación de tablas `menu_sections` / `menu_items`.
- Conectar ficha Foodie a menú real.
- Conectar favoritos a Supabase.
- Implementar sugerencias ambient en Explorar.
- Implementar ratings estructurados.
- Implementar fuente de marca activa.
- Implementar hints contextuales.

## Capturas

- Fuente vigente de screenshots históricos: `assets/screenshots/` y `docs/design/SCREENSHOT_INDEX.md`.
- `docs/design/screenshots/` no existe actualmente en el worktree.
- No documentar un paquete de screenshots nuevo hasta que los archivos existan físicamente.

## Validación

- Último estado documentado: `npx tsc --noEmit` en verde.
- Antes de cerrar cualquier ciclo de código: correr `npx tsc --noEmit`.
- Para cambios visuales sustanciales: validar en simulador primero; build EAS solo cuando el simulador no alcance.
