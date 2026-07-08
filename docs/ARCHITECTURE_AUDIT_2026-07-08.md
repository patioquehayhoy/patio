# Patio — Diagnostico de arquitectura

> Fecha: 2026-07-08.
> Objetivo: parar ajustes sueltos y entender como funciona Patio antes de tocar mas UI.

## Conclusión

Patio se esta rompiendo porque las pantallas RN mezclan demasiadas capas:

- UI visual.
- navegacion.
- permisos nativos.
- Supabase.
- AsyncStorage.
- mocks/demo.
- estado in-memory.
- animaciones.
- fallback de datos.

Figma Make/Tahoe es una referencia de composicion visual. No tiene esas capas. Traducir Make directo a RN sin separar funciones rompe flujos.

## Codigo completo

- Producto real: `app/`, `components/`, `lib/`.
- Pantallas Expo Router: `app/*.tsx`.
- Componentes compartidos: `components/*.tsx`.
- Dominio/datos: `lib/*.ts`.
- Make/web congelado: `design-source/figma-make/v02/src/app/`.
- Texto Tahoe pegado: referencia de pantallas, no codigo ejecutable.

## Mapa funcional actual

### Entrada/auth

- `app/index.tsx`: decide onboarding, rol guardado y redireccion inicial.
- `app/fondero-acceso.tsx`: magic link.
- `app/login-callback.tsx`: exchange code / OTP y llama `initializeSignedInUser`.
- `lib/auth.ts`: crea/busca fondita y guarda id.
- `lib/db.ts`: guarda/carga menu/carta en Supabase.

Riesgo: rol local (`@patio_user_role`), sesion Supabase e id de fondita viven separados.

### Foodie

- `app/explorar.tsx`: mapa, busqueda, filtros, favoritos, sheet, demo seed, Supabase search.
- `app/patio/[id].tsx`: detalle, menu real, horarios, favoritos, rating, share, mapa, notificaciones.
- `app/favoritos.tsx`: guardados desde AsyncStorage + fetch por id.
- `app/vistos.tsx`: historial local de vistas.
- `app/cuenta.tsx`: stats, tema, acceso fondero/dev.

Riesgo principal: `explorar.tsx` y `patio/[id].tsx` eran pantallas-orquestador. Cualquier ajuste visual tocaba comportamiento.

Estado 2026-07-08:
- `app/explorar.tsx` delega busqueda, favoritos, seleccion y seed demo a `lib/controllers/useFoodieExploreController.ts`.
- `app/patio/[id].tsx` delega detalle, menú vivo, favorito, rating, Share, avisos y horarios a `lib/controllers/usePatioDetailController.ts`.
- `app/favoritos.tsx` delega ids guardados y fetch de patios a `lib/controllers/useFavoritePatiosController.ts`.
- `app/vistos.tsx` delega ids vistos y fetch de patios a `lib/controllers/useViewedPatiosController.ts`.
- `app/cuenta.tsx` delega stats, sesion y acciones de cuenta a `lib/controllers/useFoodieAccountController.ts`.

### Fondero

- `app/menu.tsx`: home operativa para publicar.
- `app/foto-menu.tsx`: permisos, picker, normalizacion, IA, estados de lectura, review.
- `components/menu-composer.tsx`: edicion y publicacion real.
- `app/menu-editar.tsx`: wrapper del composer.
- `app/historial.tsx`: mezcla historial local + Supabase.
- `app/preview.tsx`: poster compartible.
- `app/perfil.tsx`: resumen/ajustes.
- `app/perfil-editar.tsx`: perfil, horarios, pagos, GPS, Supabase.

Riesgo principal: el menu vive en tres lugares a la vez: in-memory `lib/menu-store.ts`, AsyncStorage historial y Supabase.

Estado 2026-07-08:
- `components/menu-composer.tsx` delega draft/publicacion a `lib/controllers/useFonderoMenuDraftController.ts`.
- `app/perfil-editar.tsx` delega perfil, horario, pagos, GPS, Supabase, logout y hint a `lib/controllers/useFonderoProfileController.ts`.
- `app/foto-menu.tsx` delega permisos, picker, normalizacion, vision y conversion a `MenuData` a `lib/controllers/useFotoMenuController.ts`.
- `app/historial.tsx` delega seed demo, merge local/Supabase, reuso y renombrado a `lib/controllers/useMenuHistoryController.ts`.
- `app/preview.tsx` delega carga de menu, negocio, fecha, secciones y compartir imagen a `lib/controllers/useMenuPreviewController.ts`.

Accion: cualquier cambio de perfil Fondero debe pasar por `useFonderoProfileController()`.

## Make/Tahoe vs RN

### Foodie Map

Make: composicion estable: search bar arriba, pins con precio, locate button, bottom sheet editorial.

RN: mapa search-first con estado idle, teclado, busqueda live, viewport filtering, demo seed, favoritos, area filter, auto-fit y sheet. Mucho mas complejo.

Estado 2026-07-08: primera capa extraida en `lib/controllers/useFoodieExploreController.ts`.

Accion: cualquier cambio de busqueda, favoritos, seleccion, seed demo, Share o viewport debe pasar por ese controller. `app/explorar.tsx` debe quedarse como render, animacion y layout.

### Foodie Detail

Make: detalle editorial con hero, meta row, menu card y CTA "Como llegar".

RN: agrega estado abierto/cerrado, menu Supabase, ratings locales, favoritos, share, notificaciones, mapa embebido, ruta local.

Estado 2026-07-08: primera capa extraida en `lib/controllers/usePatioDetailController.ts`.

Accion: cualquier cambio de menu vivo, favorito, rating, Share, avisos, horario, CTA o carga de patio debe pasar por ese controller. `app/patio/[id].tsx` debe quedarse como render, mapa y assets visuales.

### Fondero Publish

Make: una pantalla editor operativo con precio del dia, rows y preview overlay.

RN: `menu.tsx` + `foto-menu.tsx` + `menu-editar.tsx` + `MenuComposer` + `menu-publicado.tsx` + `preview.tsx`.

Estado 2026-07-08: primera capa del editor extraida en `lib/controllers/useFonderoMenuDraftController.ts`.

Accion: cualquier cambio de draft, secciones, platillos, validacion, publicar, persistencia local o Supabase debe pasar por ese controller. `components/menu-composer.tsx` debe quedarse como render del editor.

## Problemas de arquitectura

1. `lib/menu-store.ts` es in-memory global. Se pierde al reiniciar y se usa como puente entre rutas.
2. Las pantallas hacen fetch + transform + render + side effects.
3. Mocks/demo y datos reales se mezclan dentro de loaders de pantalla.
4. Figma Make se esta usando como si fuera implementacion, pero es referencia visual.
5. Los cambios recientes tocaron pantallas core sin una capa de contrato intermedia.

## Congelar ahora

- No tocar `app/explorar.tsx`, `app/patio/[id].tsx`, `app/foto-menu.tsx`, `components/menu-composer.tsx`, `app/perfil-editar.tsx` sin auditoria puntual.
- No agregar features nuevas sobre pantallas.
- No traducir mas Make directo a RN.

## Siguiente trabajo correcto

1. Crear contratos/hook por dominio:
   - `useFoodieExploreController()` - creado 2026-07-08
   - `usePatioDetailController(id)` - creado 2026-07-08
   - `useFonderoMenuDraftController()` - creado 2026-07-08
   - `useFonderoProfileController()` - creado 2026-07-08
   - `useFotoMenuController()` - creado 2026-07-08
2. Mover fetch/transforms fuera de pantallas.
3. Dejar pantallas como render + handlers simples.
4. Comparar visual contra Make solo despues de estabilizar contratos.
5. Decidir que cambios recientes se revierten antes de seguir.

## Pendientes bloqueados

- Magic link real, camara, galeria y GPS requieren iPhone.
- Supabase redirect URLs requieren dashboard.
- Figma Make requiere decision de Alejandro.
- Push inteligente requiere backend/background strategy.
