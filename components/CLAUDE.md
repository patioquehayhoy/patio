## Precio del menú del día en menu-composer.tsx

> Reescrito 2026-11-03 por decisión de Parco: el campo grande anterior
> (`dayPriceField`/`dayPriceCurrency`/`dayPriceInput`, 40–44 pt, texto 17)
> «está enorme». Se homologó con el precio de cada platillo.

- Fila `dayPriceRow` arriba de las secciones: es un dato, no una sección.
  Fila de lista de 44: «Precio del menú» (16, peso 400) a la izquierda y el
  chip a la derecha, sin nota visible (la explicación va en
  `accessibilityHint`).
- El valor usa el MISMO chip que el precio de un platillo (`priceChip`,
  `currency`, `dishPrice`); el chip abraza el número (sin ancho mínimo lleno)
  y vacío muestra solo «$». Al borde derecho, alineado con «···» y «×».
- Se muestra de entrada en los giros de comida corrida (`MENU_PRICE_TYPES`:
  fondita, venta en casa, restaurante) o si ya tiene precio; en los demás se
  ofrece como chip «PRECIO DEL MENÚ» junto a las sugerencias de sección.
- Vacío o «0» al salir del campo nunca se guarda.
- Se guarda en la primera sección (`setDayPrice`) y sale en el póster
  compartido (`app/preview.tsx`, a la derecha del nombre) y en la ficha.

El precio por platillo es el mismo chip; si se cambia uno, se cambia el otro.

## Retícula del editor (2026-11-03)

- Un solo borde izquierdo (20): nombre de sección, platillo, descripción,
  «Agregar platillo», «Agregar sección» y «Precio del menú».
- Ocultar/mostrar platillos (2026-11-08, Parco no lo encontraba en «···»): la
  flecha vuelve, pero en la columna derecha, junto al «···» (abajo = abierta,
  derecha = oculta, como Notas).
- Con 4 secciones o más, **barra de secciones** bajo la barra de navegación
  (`components/section-bar.tsx`, la misma de la ficha): cápsulas con el nombre
  completo, la sección en pantalla marcada, tocar lleva a ella. Se esconde con
  el teclado abierto. (El índice lateral tipo Contactos se probó el 8 nov y se
  quitó: con 24 secciones se saturaba y el dedo tapaba la burbuja.)
- Ocultar/mostrar: la flecha gira 90° (200 ms) en vez de cambiar de ícono; lo
  de abajo se recorre con resorte suave; oculta, la sección muestra debajo
  «6 platillos · Chilaquiles rojos, Molletes y 4 más» (tocar la abre).
- Un solo borde derecho: «···», «×» y los chips de precio en su columna.
- Toda acción «agregar»: ícono `add` 18 + texto 15/700 en acento.
- Cierre: «Publicar menú» cápsula naranja de 54 a todo el ancho del
  contenido; «Guardar sin publicar» texto 16/400 debajo.
