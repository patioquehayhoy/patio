# Claude Code Task — Explorar Radar de Antojo

> Objetivo: implementar la primera version de `Explorar` como search-first interface sin redisenar toda la app.
> Lee primero:
> 1. `docs/design/PRODUCT_PRINCIPLES.md`
> 2. `docs/design/FLOW_V2.md`
> 3. `docs/design/SCREENSHOT_INDEX.md`
> 4. `docs/design/VISUAL_SYSTEM.md`

## Decision de producto

Explorar no debe abrir con inventario completo de negocios. Debe abrir como **radar de antojo**:

- buscador protagonista,
- mapa vivo/ambiental,
- puntos cercanos sutiles,
- cero lista grande al inicio,
- resultados solo cuando hay intencion.

La intencion aparece cuando el usuario:

- escribe en el buscador,
- toca un punto cercano,
- toca una sugerencia/chip,
- vuelve desde detalle con contexto.

## Archivos principales

- `app/explorar.tsx`
- componentes que use `app/explorar.tsx` si existen
- `lib/theme.tsx` solo si falta un token ya existente; evitar agregar tokens si no hace falta

## Implementacion esperada

### 1. Estado inicial

- Mantener el mapa como superficie principal.
- Mostrar el buscador como accion principal.
- Ocultar la lista grande/bottom sheet expandido mientras no haya intencion.
- Mostrar 3-5 puntos cercanos sutiles o pins discretos si ya existen datos.
- Evitar imagenes de comida, emojis o pins caricaturescos.

### 2. Busqueda inline

- Al escribir query:
  - filtrar resultados en tiempo real,
  - resaltar/encender pins relevantes,
  - mostrar bottom sheet compacto con coincidencias.
- Si query no tiene resultados:
  - mostrar empty state activo con sugerencias concretas, no solo "sin resultados".

### 3. Toque en pin

- Tocar un pin no debe mandar directo al detalle completo.
- Primero debe mostrar un resumen compacto:
  - nombre del negocio,
  - platillo destacado o tipo,
  - precio/rango,
  - horario,
  - distancia o zona,
  - actualizado/abierto si existe.
- Accion principal: `Ver negocio` o equivalente actual hacia `/patio/[id]`.
- Accion secundaria: favorito si ya existe.

### 4. Bottom sheet

- El bottom sheet debe aparecer por intencion.
- Debe empezar compacto.
- Debe usar glass/BlurView si el patron actual ya existe.
- Evitar que el usuario vea una lista densa antes de buscar o tocar.

## Restricciones

- No cambiar rutas.
- No agregar features nuevas fuera de Explorar.
- No introducir fotos obligatorias.
- No meter emojis de comida como UI principal.
- No convertir Explorar en landing page.
- No romper `Favoritos`, `Cuenta` o detalle de fondita.
- Mantener TypeScript estricto.

## Verificacion

Ejecutar:

```bash
npx tsc --noEmit
npm run lint
```

Si hay development build disponible, revisar manualmente:

- abrir `/explorar`,
- confirmar que no aparece lista grande al inicio,
- buscar `mole`, `tacos` o `agua`,
- tocar un pin,
- navegar a detalle,
- volver.

## Criterio de exito

- Explorar se entiende sin instrucciones.
- El usuario ve primero el buscador, no un inventario.
- El mapa se siente vivo pero tranquilo.
- Los resultados aparecen por intencion.
- La implementacion es incremental y facil de revertir por partes.

