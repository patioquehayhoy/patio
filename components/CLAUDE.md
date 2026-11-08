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
  derecha = oculta, como Notas). Oculta, muestra «N platillos» para abrirla.
- Con 4 secciones o más, índice lateral a la derecha (`components/section-index.tsx`),
  como las letras de Contactos: tocar o deslizar salta a la sección, burbuja
  con el nombre y vibración por sección. Letras únicas o tres letras si se
  repiten. Se esconde con el teclado abierto.
- Un solo borde derecho: «···», «×» y los chips de precio en su columna.
- Toda acción «agregar»: ícono `add` 18 + texto 15/700 en acento.
- Cierre: «Publicar menú» cápsula naranja de 54 a todo el ancho del
  contenido; «Guardar sin publicar» texto 16/400 debajo.
