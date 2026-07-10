# Patio — Handoff para Figma Make v03

Este directorio no es todavía el export `v03`. Es el paquete de arranque para
producirlo sin modificar `v01`, `v02` ni la aplicación React Native actual.

## Objetivo

Crear la versión visual final y aprobable de Patio a partir de tres fuentes:

1. **Patio Vivo** (`app/`, `components/`, `lib/`): verdad funcional.
2. **Figma Make v01**: amplitud visual, motion, marca y cobertura.
3. **Figma Make v02**: base preferida y arquitectura compartida del menú.

Figma Make no debe reinventar el producto ni reconstruir backend. Debe cerrar el
sistema visual y cubrir correctamente las tareas que ya existen.

## Secuencia obligatoria

1. Abrir el proyecto actual de Figma Make basado en `v02`.
2. Adjuntar o poner a disposición los archivos de la lista siguiente.
3. Pegar completo `MASTER_PROMPT.md`.
4. Figma Make debe producir **solo cuatro pantallas maestras**:
   - Entrada.
   - Explorar / mapa.
   - Detalle de Patio.
   - Publicar / editar menú.
5. Detenerse y esperar aprobación de Alejandro.
6. Solo después de la aprobación, ejecutar la Fase 2 incluida en el prompt.
7. Exportar el resultado aprobado como `design-source/figma-make/v03/`.

## Archivos que debe estudiar

### Adjuntar primero — contrato esencial

- `MASTER_PROMPT.md`
- `docs/GOAL.md`
- `docs/design/PRODUCT_PRINCIPLES.md`
- `docs/design/FLOW_V2.md`
- `docs/design/foundations/IDENTITY_VERBAL.md`
- `docs/design/foundations/IDENTITY_AND_TYPE.md`
- `lib/colors.ts`
- `constants/design-tokens.ts`
- `design-source/figma-make/v02/src/app/data/menu.ts`

### Código funcional de las cuatro pantallas maestras

- `app/index.tsx`
- `app/explorar.tsx`
- `lib/controllers/useFoodieExploreController.ts`
- `app/patio/[id].tsx`
- `lib/controllers/usePatioDetailController.ts`
- `app/menu.tsx`
- `app/menu-editar.tsx`
- `components/menu-composer.tsx`
- `lib/controllers/useFonderoMenuDraftController.ts`

### Componentes Make que deben conservarse/evaluarse

- `design-source/figma-make/v02/src/app/components/FoodieMap.tsx`
- `design-source/figma-make/v02/src/app/components/FoodieDetail.tsx`
- `design-source/figma-make/v02/src/app/components/FonderoPublish.tsx`
- `design-source/figma-make/v02/src/app/components/MenuCard.tsx`
- `design-source/figma-make/v02/src/app/components/MenuPoster.tsx`
- `design-source/figma-make/v02/src/app/components/TabBar.tsx`
- `design-source/figma-make/v02/src/app/components/PatioMark.tsx`
- `design-source/figma-make/v02/src/styles/theme.css`

### Fase 2 — adjuntar solo después de aprobar las maestras

- `app/onboarding.tsx`
- `app/fondero-acceso.tsx`
- `app/login-callback.tsx`
- `app/favoritos.tsx`
- `app/vistos.tsx`
- `app/cuenta.tsx`
- `app/resena/[id].tsx`
- `app/foto-menu.tsx`
- `app/historial.tsx`
- `app/menu-publicado.tsx`
- `app/preview.tsx`
- `app/perfil.tsx`
- `app/perfil-editar.tsx`
- `app/manifiesto.tsx`
- los controllers correspondientes de `lib/controllers/`

## Precedencia cuando haya contradicciones

1. `MASTER_PROMPT.md` y decisiones no negociables.
2. Comportamiento de Patio Vivo.
3. Identidad verbal y principios de producto.
4. Arquitectura de menú de `v02`.
5. Composición visual de `v02`.
6. Recursos rescatables de `v01`.

Una solución visual de Make nunca puede borrar un comportamiento real de Patio
Vivo. Una implementación visual vieja tampoco tiene prioridad sobre la identidad
verbal vigente.

## Definición del futuro export

El `v03` aprobado deberá contener:

- código ejecutable del prototipo;
- inventario de pantallas y estados;
- tokens y componentes reutilizables;
- navegación demostrable;
- light/dark donde corresponda;
- decisiones aprobadas;
- lista explícita de estados no representables en web;
- cero cambios a `v01`, `v02` o Patio Vivo.

