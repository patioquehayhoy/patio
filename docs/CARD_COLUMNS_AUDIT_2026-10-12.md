# Tarjetas: columnas estables y una línea por campo

Decisión posterior del usuario: concluir el ajuste de tarjetas con geometría
estable, sin saltos por longitud del texto ni sello que siga al nombre.

## Referencias consultadas

[Uber Base · List item](https://base.uber.com/6d2425e9f/p/96ccc3-list-item)
separa ilustración inicial, hasta tres etiquetas centrales y contenido lateral.
Recomienda alineación consistente para facilitar el escaneo, iconos sin fondo
si toda la fila es interactiva y limitar indicadores. Permite configurar sus
etiquetas con ajuste de línea o truncamiento. Sus posiciones laterales dan la
base para reservar una columna independiente al estado de verificación.

[Google Material · Lists](https://github.com/material-components/material-components-android/blob/master/docs/components/List.md)
define elementos principales, secundarios y laterales, variantes de una, dos
y tres líneas y presentación consistente. Es documentación del sistema de
diseño de Google; no una inspección de la versión actual de Google Maps.

**Conclusión aplicada a Patio:** elegir campos compactos de una línea y
columnas constantes. Estas fuentes ofrecen las variantes; no afirman que
todo contenido de Uber o Google deba truncarse. Nombre y datos completos
permanecen disponibles en accesibilidad y en la ficha.

## Cambios

- Nombre de una línea en lista y grid. Nombre largo con elipsis.
- Sello en columna de 16 pt al final del nombre, reservada con o sin sello.
  No depende de la longitud del nombre ni del importe.
- Precio de lista en columna de 112 pt × fontScale, una línea. Rangos
  extraordinarios muestran «Ver precios»; la ficha y accesibilidad mantienen
  el precio publicado completo. No redondear ni mostrar un rango parcial.
- Ubicación y métricas conservan su fila, incluso con datos ausentes. Sin
  flexWrap. Colonia y campos secundarios admiten elipsis.
- Con letra grande, la geometría sigue su breakpoint común para todas las
  tarjetas; no cambia según el nombre. La cuadrícula pasa a una columna.
- Estrella única, colonia · distancia, centrado de ubicación y swipe
  permanecen. La ficha conserva nombre e importe completos.

## Comprobaciones

`npm run check`: TypeScript y lint limpios, **177/177 pruebas**.
Release: 29 correctos, 0 errores, los dos pendientes Android anteriores.
Nueva regresión del precio: rango extraordinario sin cifra incompleta y
con valor exacto conservado en la ficha y accesibilidad.

[Ejemplos del componente real](design/previews/patio-cards-stable-columns-2026-10-12.html):
54 tarjetas, claro/oscuro, lista/grid, 320 pt y letra al 160%. Mismo nombre
con tres precios, nombres muy largos, colonia extensa, reseñas y ausencia
de datos. Medición DOM: una altura por variante, sello en la misma columna,
cada campo en una línea, ningún precio recortado ni información fuera del borde.
La medición web no certifica fuentes, mapas ni gestos nativos.

Evidencia: `docs/design/previews/patio-cards-stable-columns-2026-10-12.metrics.json`
y `/private/tmp/patio-stable-columns-check-20261012.log`.
QA física a cargo del usuario; sin EAS, commit ni publicación.

## Reversión

Estado previo y diff de este ajuste en
`docs/design/experiments/stable-card-columns-2026-10-12/`.

```sh
git apply --reverse --check docs/design/experiments/stable-card-columns-2026-10-12/change.patch
```

Si el usuario pide regresar y el check pasa, aplicar sin `--check`.
Conservar trabajo posterior si el parche requiere adaptación.
