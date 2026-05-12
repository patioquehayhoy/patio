# Patio — Flujo de app v2

> Contrato de flujo antes del rediseño visual.
> Objetivo: limpiar navegación, estados y decisiones de producto antes de volver a pedir screenshots o propuestas de estilo.

Este documento debe leerse junto con `docs/design/PRODUCT_PRINCIPLES.md`.

## Principio

Patio tiene dos trabajos principales:

- **Foodie:** encontrar comida local hoy.
- **Fondero:** publicar el menú de hoy rápido y compartirlo.

Todo lo que no ayude a uno de esos trabajos debe ser secundario, contextual o desaparecer del camino principal.

## Diagnóstico del flujo actual

### 1. Búsqueda duplicada

Hoy existen dos maneras principales de buscar:

- `app/explorar.tsx`: búsqueda inline sobre el mapa.
- `app/buscar.tsx`: pantalla dedicada de búsqueda.

Esto crea dos experiencias para la misma intención. La búsqueda debe sentirse como una sola herramienta.

**Decisión v2/MVP:** la búsqueda vive dentro de `Explorar`, porque el mapa es la pantalla heroica del lado Foodie. La ruta `/buscar` no forma parte del flujo visible del MVP; si alguien llega directo, debe recuperar al usuario llevándolo al mapa.

**Decisión de interacción:** Explorar no debe abrir mostrando una lista completa de negocios. Debe abrir como **radar de antojo**: buscador protagonista, mapa tenue/vivo y señales cercanas sutiles. La lista aparece cuando el usuario busca, toca un punto o muestra intención.

### 2. Onboarding e inicio repiten narrativa

`app/onboarding.tsx` y `app/index.tsx` repiten marca, tagline y promesa. La app vuelve a explicar lo mismo antes de permitir actuar.

**Decisión v2/MVP:** el onboarding explica una vez y queda como entrada beta/dev hasta decidir first-run. El inicio no debe sentirse como segmentación pesada: la acción principal es **Explorar comida** y la entrada fondera queda secundaria como **Publicar mi menú**.

### 3. Cuenta repite navegación principal

`app/cuenta.tsx` incluye accesos a Buscar y Favoritos, que también existen desde `Explorar`.

**Decisión v2:** Cuenta queda como panel de ajustes y accesos secundarios. El camino principal de Foodie ocurre en el mapa.

### 4. Crear menú tiene demasiadas entradas

El fondero puede llegar a crear menú desde:

- Estado vacío en `app/menu.tsx`.
- `app/foto-menu.tsx`.
- Sheet de plantillas.
- Acciones extra de menú.
- Hint sheet.

La intención es una sola: crear el menú de hoy.

**Decisión v2:** toda creación de menú entra por una sola acción: **Crear menú**. Esa acción abre una hoja con cuatro opciones:

- Tomar foto.
- Elegir imagen.
- Usar plantilla.
- Empezar desde cero.

### 5. Compartir aparece antes de tener contenido

El tab `Compartir` abre `app/preview.tsx`, pero si no hay menú muestra un estado vacío. Eso hace que "Compartir" parezca una tarea disponible aunque todavía no exista nada que compartir.

**Decisión v2:** si no hay menú, `Compartir` dirige a crear menú. Si hay menú, muestra preview y botón de compartir.

## Flujo v2 propuesto

## Foodie

```text
Inicio
  -> Explorar comida
    -> Explorar mapa
      -> Estado inicial: radar de antojo
        -> Buscar comida inline
          -> Puntos relevantes se encienden
          -> Bottom sheet compacto con coincidencias
        -> Tocar punto cercano
          -> Resumen de fondita
          -> Ver negocio
            -> Detalle fondita
          -> Guardar
          -> Compartir
          -> Cómo llegar
      -> Favoritos
      -> Cuenta
```

### Pantallas Foodie

| Pantalla | Ruta actual | Rol v2 |
|---|---|---|
| Inicio | `/` | Entrada Foodie-first con acceso secundario fondero |
| Explorar | `/explorar` | Home real del Foodie |
| Detalle fondita | `/patio/[id]` | Ficha completa de lugar y menú |
| Favoritos | `/favoritos` | Colección guardada |
| Cuenta | `/cuenta` | Ajustes y soporte |
| Buscar | `/buscar` | Fuera del MVP visible; redirige a Explorar |
| Manifiesto | `/manifiesto` | Contenido secundario |

### Reglas Foodie

- El mapa no debe competir con otra home.
- Explorar no debe mostrar inventario completo al abrir; debe revelar opciones por intención.
- El buscador es la navegación principal del lado Foodie.
- El estado inicial debe sentirse vivo: mapa tenue, puntos/radar sutiles y cero lista abrumadora.
- Buscar no debe duplicarse como dos experiencias equivalentes.
- Favoritos es una utilidad; no debe ser parte obligatoria del flujo.
- Cuenta no debe ser un hub de navegación principal.

## Fondero

```text
Inicio
  -> Publicar mi menú
    -> Login negocio
      -> Perfil negocio
        -> Tab Perfil
        -> Tab Menú
          -> Sin menú
            -> Crear menú
              -> Tomar foto
              -> Elegir imagen
              -> Usar plantilla
              -> Empezar desde cero
          -> Con menú
            -> Editar menú
            -> Más opciones
        -> Tab Compartir
          -> Si no hay menú: Crear menú
          -> Si hay menú: Preview + compartir imagen
```

### Pantallas Fondero

| Pantalla | Ruta actual | Rol v2 |
|---|---|---|
| Login negocio | `/?intent=business` | Autenticación OTP |
| Perfil negocio | `/perfil` | Datos del negocio |
| Editor menú | `/menu` | Crear y editar menú |
| Foto menú | `/foto-menu` | Captura/galería y procesamiento |
| Preview/Compartir | `/preview` | Vista final para compartir |
| Share | `/share` | Revisar si todavía es necesaria |

### Reglas Fondero

- El botón principal en estado vacío debe ser **Crear menú**, no múltiples CTAs sueltos.
- Foto, galería, plantilla y manual son métodos dentro de Crear menú.
- Compartir no debe ser una pantalla vacía pasiva.
- El tab bar debe reflejar tareas reales: Perfil, Menú, Compartir.

## Cambios de implementación sugeridos

### Prioridad 1 — Unificar creación de menú

Archivo principal: `app/menu.tsx`

- Cambiar el estado vacío para mostrar un solo CTA: **Crear menú**.
- Reusar o reemplazar `menuActionsVisible` como `createMenuSheetVisible`.
- La hoja debe incluir:
  - Tomar foto -> `router.push('/foto-menu')`.
  - Elegir imagen -> `router.push('/foto-menu?source=gallery')` o estado equivalente.
  - Usar plantilla -> abrir sheet de plantillas.
  - Empezar desde cero -> crear primera sección vacía.
- Mantener `foto-menu` y plantillas como rutas/estados internos, no como caminos separados desde varios lugares.

### Prioridad 2 — Compartir con guard clause

Archivo principal: `app/preview.tsx`

- Si `hasAnything` es falso, mostrar CTA principal **Crear menú**.
- Ese CTA debe navegar a `/menu` y abrir el flujo de Crear menú si es posible.
- Mantener el estado vacío, pero convertirlo en acción, no solo mensaje.

### Prioridad 3 — Búsqueda Foodie

Archivos: `app/explorar.tsx`, `app/buscar.tsx`, `app/cuenta.tsx`

- Mantener búsqueda inline en `Explorar`.
- Cambiar el estado inicial de `Explorar` a search-first:
  - buscador protagonista,
  - mapa como ambient state,
  - puntos cercanos sutiles,
  - sin lista grande hasta que haya intención.
- Al escribir, encender puntos relevantes y abrir resultados progresivamente.
- Al tocar un punto, mostrar resumen antes de detalle completo.
- Para MVP, `/buscar` sale del flujo principal y recupera al usuario hacia `Explorar`.
- En `Cuenta`, quitar "Buscar" del camino principal si ya está disponible y visible en mapa.

### Prioridad 4 — Onboarding e inicio

Archivos: `app/onboarding.tsx`, `app/index.tsx`

- Onboarding debe aparecer solo una vez o solo como entrada dev/beta.
- Inicio debe ser breve: marca + camino principal Foodie + acceso secundario Fondero.
- Pendiente visual: animación de flying logo para splash/intro.

## Pendientes visuales para fase 2

Estos puntos NO bloquean el flujo v2:

- Flying logo en splash/intro.
- Rediseño visual de perfil fondero.
- Rediseño visual de mapa y bottom sheet.
- Rediseño visual de preview de menú para compartir.
- Prompt maestro para ChatGPT con screenshots del flujo ya limpio.
- Motion/ambient state del radar de antojo.

## Prompt maestro futuro para ChatGPT

Cuando el flujo v2 esté implementado y se saquen nuevos screenshots, usar un prompt base como:

```text
Rediseña el estilo visual de estas pantallas de Patio sin cambiar el flujo, jerarquía funcional, navegación ni contenido.

Patio es una app móvil para dos usuarios:
1. Foodie: encuentra comida local disponible hoy.
2. Fondero: publica su menú del día rápido y lo comparte.

Mantén:
- CTAs y tareas de cada pantalla.
- Orden de navegación.
- Estados vacíos, loading y procesamiento.
- Contenido textual base.
- Estructura funcional: mapa, lista, detalle, perfil, menú, preview.

Puedes cambiar:
- Dirección de arte.
- Composición visual.
- Color, tipografía, iconografía, textura, imagen y profundidad.
- Estilo de cards, botones, sheets y tabs.

No inventes nuevas funciones ni nuevas rutas. No cambies el flujo. Propón un sistema visual consistente, cálido, local, premium pero operativo.
```

## Criterio de éxito

- Un usuario Foodie entiende que empieza en el mapa.
- Explorar invita a buscar antes de mostrar inventario.
- Un fondero entiende que su tarea principal es crear el menú de hoy.
- No hay dos CTAs equivalentes compitiendo por la misma intención.
- Compartir solo aparece como tarea cuando hay algo para compartir.
- El rediseño visual puede trabajar sobre screenshots nuevos sin tener que corregir navegación.
