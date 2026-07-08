# Foodie Search Flow - 2026-07-08

## Problema

La pantalla de Mapa estaba acumulando parches:

- Un panel "Cerca de ti" se abría al entrar aunque el usuario no lo pidiera.
- Había dos entradas de búsqueda: una central y una lupa superior.
- Los botones flotantes competían visualmente con el mapa, la ficha, el teclado y la tab bar.
- Buscar comida y explorar categorías no tenían un modelo claro.

## Principio

Mapa debe iniciar limpio. La acción principal es buscar comida de hoy.

El usuario no debe entender estados internos como "nearby", "saved" o "filtering". Debe sentir:

1. Abro Mapa.
2. Escribo lo que quiero comer.
3. El mapa prende los patios que lo tienen.
4. Toco una opción o un pin.
5. Veo detalle / guardo / llego.

## Flujo propuesto

### Estado inicial

- Mapa full-screen.
- Campo central: "¿Qué hay hoy?"
- Botones pequeños:
  - Cerca / categorías: abre exploración de patios cercanos o categorías.
  - Guardados: abre patios guardados.
  - Ubicación: pendiente, debe recentrar al usuario cuando tengamos permiso GPS estable.
- Sin panel inferior abierto por defecto.

### Buscar platillo

Al escribir `elotes`, `mole`, `hamburguesa`, etc:

- Se consultan menús vivos del día.
- Los pins con match se prenden.
- Los pins sin match se apagan o bajan opacidad, pero el mapa sigue dando contexto.
- La lista inferior aparece solo cuando hay query real.
- Cada resultado muestra primero el platillo y debajo el patio.
- Los botones flotantes desaparecen mientras el usuario está buscando.
- Hacer scroll en resultados debe cerrar el teclado.
- Tocar un resultado selecciona el patio y abre una ficha breve de confirmación.
- La ficha de confirmación no debe duplicar la lista: lista = platillo encontrado; ficha = patio, distancia aproximada y acción.

### Categorías

Categoría no debe competir con búsqueda textual.

Ejemplos:

- "Eloterías"
- "Mariscos"
- "Comida corrida"
- "Taquerías"
- "Jugos"
- "Postres"

La categoría filtra patios por tipo de lugar. La búsqueda filtra por comida servida hoy.

Ejemplo: categoría "Eloterías" muestra patios tipo elotería. Buscar "elotes" muestra cualquier patio que hoy sirva elotes, aunque no sea una elotería.

### Guardados

Guardados no debe ser solo una lista plana cuando crezca.

Estados deseables:

- Guardados cerca de mí.
- Guardados abiertos hoy.
- Guardados con menú publicado hoy.
- Guardados por categoría.

## Ajuste aplicado ahora

- `useFoodieExploreController` inicia con `sheetMode = null`.
- `app/explorar.tsx` ya no muestra la lupa superior derecha.
- Botones flotantes reducidos de `58x58` a `44x44`.
- Botones flotantes ocultos durante búsqueda.
- Scroll de resultados cierra teclado.
- Resultados de búsqueda vuelven a seleccionar patio antes de entrar al detalle.
- La ficha superior durante búsqueda muestra patio + distancia aproximada + acción, evitando repetir la misma tarjeta del resultado.

## Siguiente diseño

Pedir a Figma Make una pantalla nueva desde cero, sin copiar los bloques actuales:

> Diseña una app móvil de búsqueda de comida local servida hoy. Primer viewport: mapa full-screen, búsqueda principal "¿Qué hay hoy?", pins que se activan al buscar platillos, navegación inferior Mapa / Guardados / Perfil, acceso compacto a categorías, botón de ubicación, lista inferior solo cuando el usuario busca o abre guardados/categorías. Debe sentirse simple, operativo y premium; no uses paneles abiertos por defecto.
