## Precio del menú del día en menu-composer.tsx

> Reescrito 2026-11-03 por decisión de Parco: el campo grande anterior
> (`dayPriceField`/`dayPriceCurrency`/`dayPriceInput`, 40–44 pt, texto 17)
> «está enorme». Se homologó con el precio de cada platillo.

- Fila `dayPriceRow` arriba de las secciones: se lee como un encabezado más
  («PRECIO DEL MENÚ», misma letra, alto 44 y columna de 30 que el nombre de
  cada sección), sin nota visible (la explicación va en `accessibilityHint`).
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
