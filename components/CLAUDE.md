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
- Sin ocultar secciones (2026-11-08, decisión de Parco): todas abiertas, como
  la ficha; para moverse en menús largos está la barra de secciones. (Se
  probaron la flecha en «···», la flecha visible y el índice lateral tipo
  Contactos: ninguno se sintió fácil.)
- Con 4 secciones o más, **barra de secciones** bajo la barra de navegación
  (`components/section-bar.tsx`, la misma de la ficha): nombre completo, la
  sección en pantalla marcada, tocar lleva a ella; se esconde con el teclado.
- Un solo borde derecho: «···», «×» y los chips de precio en su columna.
- Toda acción «agregar»: ícono `add` 18 + texto 15/700 en acento.
- Cierre: «Publicar menú» cápsula naranja de 54 a todo el ancho del
  contenido; «Guardar sin publicar» texto 16/400 debajo.
