# Patio - Auditoria de diff y rollback conservador

> Fecha: 2026-07-08.
> Objetivo: quitar cambios que estaban rompiendo sensacion/flujo y conservar solo fixes acotados.

## Veredicto corto

Se hizo rollback de cambios visuales/funcionales que metian comportamiento nuevo en pantallas core sin controlador previo.

Se conservaron cambios pequenos que corrigen estado, copy o persistencia sin redisenar pantallas completas.

Avance posterior: las pantallas principales y secundarias ya tienen primera capa de controllers en `lib/controllers/`: Foodie Explore, Patio Detail, Fondero Menu Draft, Fondero Profile, Foto Menu, Favoritos, Historial, Vistos, Cuenta y Preview.

## Rollback aplicado

- `app/explorar.tsx`: revertido.
  - Motivo: filtros por zona, auto-fit de mapa y pulsos vivos agregaban logica a una pantalla ya saturada.
  - Siguiente correcto: extraer `useFoodieExplore()` antes de tocar UI o busqueda.

- `app/foto-menu.tsx`: revertido.
  - Motivo: el nuevo estado de error y rail de lectura cambiaba mucho la experiencia de "Leyendo tu menu" y fue justo una pantalla reportada como rota.
  - Siguiente correcto: definir una maquina de estados simple para `idle -> picking -> processing -> review -> failed`.

- `app/patio/[id].tsx`: revertido.
  - Motivo: ruta dentro del mapa agregaba permisos nativos, ubicacion y polyline dentro del detalle.
  - Siguiente correcto: dejar "Como llegar" abriendo Maps hasta separar `usePatioDetail(id)`.

- `app/favoritos.tsx`: revertido.
  - Motivo: filtros Hoy/Cerca/Categoria y long-press delete cambiaban UX y agregaban ramas sin diseno validado.
  - Siguiente correcto: redisenar Guardados completo contra Make/Tahoe despues de estabilizar datos.

- `app/preview.tsx`: revertido.
  - Motivo: cambio visual de poster sin validacion completa.
  - Siguiente correcto: redisenar poster en una pasada dedicada y no junto con fixes de arquitectura.

- `docs/TASKS.md` y `docs/DESIGN_SYSTEM.md`: revertidos.
  - Motivo: estaban marcando como resuelto trabajo experimental que ya se saco.

## Cambios conservados

- `app/index.tsx`: botones DEV ahora guardan rol antes de navegar.
  - Motivo: evita estados cruzados Foodie/Fondero.

- `app/perfil.tsx` y `app/perfil-editar.tsx`: texto "Salir del modo Fondero" cuando no hay sesion.
  - Motivo: arregla confusion DEV sin tocar flujo visual.
  - Se revirtio el cambio visual del boton "Editar mi negocio".

- `app/onboarding.tsx`: copy sin comparativo prohibido y `noWidow()`.
  - Motivo: alinea con reglas de `CLAUDE.md`.

- `app/login-callback.tsx` y `lib/db.ts`: logs de debug solo en DEV.
  - Motivo: bajo riesgo, menos ruido.

- `app/historial.tsx` y `lib/menu-history.ts`: nombrar menus guardados.
  - Motivo: feature acotada, persistencia local, no toca pantallas core Foodie.

- `lib/favorites.ts`: helper `removeFavoritePatio`.
  - Motivo: bajo riesgo; queda disponible aunque la UI de borrado se saco.

- `docs/ARCHITECTURE_AUDIT_2026-07-08.md`: diagnostico de arquitectura.
  - Motivo: mapa funcional para no seguir parchando a ciegas.

## Donde esta el codigo completo

- App real Expo/RN: `app/`, `components/`, `lib/`.
- Pantallas: `app/*.tsx` y rutas dinamicas como `app/patio/[id].tsx`.
- Componentes compartidos: `components/*.tsx`.
- Datos/dominio: `lib/*.ts`.
- Make congelado: `design-source/figma-make/v02/src/app/`.
- Texto Tahoe pegado: referencia visual/producto, no codigo ejecutable.

## Orden correcto desde aqui

1. Congelar pantallas core: `explorar`, `patio/[id]`, `foto-menu`, `menu-composer`, `perfil-editar`.
2. Extraer controllers/hooks:
   - `useFoodieExploreController()` - creado
   - `usePatioDetailController(id)` - creado
   - `useFonderoMenuDraftController()` - creado
   - `useFonderoProfileController()` - creado
3. Comparar Make/Tahoe contra RN por pantalla, no copiar Make directo.
4. Rehacer visual solo despues de que datos, permisos y estados esten encapsulados.
