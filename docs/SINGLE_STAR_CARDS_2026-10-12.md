# Estrella única y cuadrícula compacta

Cambio solicitado el 2026-10-10 y cerrado localmente el 2026-10-12.

Este corte es histórico. La decisión posterior elimina nombres de dos líneas
en lista y separa el sello en una columna fija. Contrato vigente:
[columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).

## Aplicado

- Una estrella: naranja con calificación propia válida, neutra sin ella.
  El número conserva el promedio público. El voto propio sigue almacenado y
  se anuncia en accesibilidad; no hay segundo número ni segunda estrella.
- «Colonia · distancia» sin flecha, compartido por lista, cuadrícula,
  resultados de Mapa y cabecera de ficha. Sin uno de los datos, no hay
  separador huérfano; colonia extensa con elipsis y distancia intacta.
- La ficha obtiene distancia desde una posición del usuario y permiso ya
  concedido; no abre una solicitud de permiso al entrar. El mismo hook se
  comparte con Guardados. Sin ubicación válida, la información se omite.
  La distancia en resultados de Mapa sigue teniendo como referencia el centro
  del mapa, según el contrato de búsqueda existente; no se cambió el orden.
- Cuadrícula A aplicada: nombre de una línea, colonia/distancia en otra,
  promedio/cierre en la tercera. Verificación acompaña el nombre. El precio
  y caja de icono permanecen en la fila superior.
- Lista conserva hasta dos líneas de nombre y el conteo de reseñas.
  En grid, el conteo completo permanece accesible y en la ficha.
- La alternativa B de dos líneas está disponible solo en los ejemplos.
  Se conservaron respaldos previos. La futura fotografía no se agregó;
  podrá usar la zona superior de la cuadrícula cuando existan fotos reales.

## Comparación y comprobaciones

[Ejemplos del componente real](design/previews/patio-cards-single-star-2026-10-10.html):
A y B con los mismos seis lugares, lista, oscuro, 320 pt y letra al 160%.
Incluyen nombre corto, muy largo, verificación, colonia larga, distancia,
precio extenso, voto propio y datos ausentes. Las 36 cards mantienen
calificación/cierre en una línea y ninguna métrica fuera del borde.

Evidencia:

- `docs/design/previews/patio-cards-single-star-2026-10-10.metrics.json`
- `docs/design/previews/patio-cards-single-star-2026-10-12.jpg`
- `/private/tmp/patio-single-star-check-20261012.log`
- `npm run check`: TypeScript y lint limpios, **176/176 pruebas**.
- Release: 29 correctos, 0 errores; Maps/Firebase Android siguen pendientes.
- Pruebas del componente real: una estrella, promedio intacto, voto inválido,
  nombre de una línea y ubicación sin separador huérfano. Hook de ubicación:
  permiso contextual previo, coordenadas inválidas y desmontaje sin GPS tardío.

La revisión de navegador estuvo bloqueada inicialmente por un límite de uso;
se pudo completar el 2026-10-12. La vista web y las pruebas locales no
certifican mapas, gestos, fuentes nativas ni el cierre previo de iPhone.
El usuario hará QA en su celular. Sin EAS, operación del dispositivo,
commit ni publicación en este ajuste.

## Reversión

Respaldos y parche de este cambio:
`docs/design/experiments/single-star-2026-10-10/`.
El estado previo conserva el botón de ubicación y el arreglo del swipe.

Para comprobar que aún puede revertirse sin tocar cambios posteriores:

```sh
git apply --reverse --check docs/design/experiments/single-star-2026-10-10/change.patch
```

Aplicar sin `--check` únicamente si el usuario solicita regresar. Si hubo
cambios posteriores en estos archivos, adaptar el parche a ese trabajo.
