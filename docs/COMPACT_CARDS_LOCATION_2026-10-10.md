# Agrupación compacta y centrar ubicación

Cambio puntual autorizado el 2026-10-10, posterior a la corrección del swipe.
El usuario probará en su celular y pidió conservar la versión previa.

## Resultado

- Precio alineado a la derecha; la verificación acompaña el nombre y se
  omite sin reservar espacio cuando falta.
- Calificación propia naranja junto al promedio público neutro. Sin dato
  propio, desaparece el grupo completo, incluida su estrella. Ambas métricas
  permanecen en la misma línea; accesibilidad distingue su significado.
- «Cierra HH:MM» según el turno publicado activo, incluyendo madrugada;
  «Abierto 24 h» para un turno de 24 h. Sin horario fiable o cerrado, se omite.
  La hora queda a la derecha y puede pasar debajo en cards estrechas.
- Mapa usa la casilla derecha de 40 pt para centrar ubicación. Guardados
  mantiene los tres puntos y las tres pills conservan sus posiciones.
- Permiso de ubicación contextual, indicador durante la consulta, deduplicación
  de toques, coordenadas validadas y espera máxima de 15 s después del permiso.
  Una posición reciente y suficientemente precisa evita una consulta GPS extra.
  La búsqueda se cancela al iniciar otra búsqueda o desmontar la pantalla;
  respuestas antiguas no cambian el mapa ni escriben estado.
- Al centrar, los resultados se ocultan y vuelve la navegación; término y
  pines permanecen. La cámara no sigue automáticamente la ubicación. El mapa
  nativo muestra el punto del usuario después de obtener el permiso/posición.
  Sin permiso en segundo plano ni suscripción adicional de Expo Location.

## Verificación local

- `npm run check`: TypeScript y lint limpios; **172/172 pruebas**.
- Release: 29 comprobaciones correctas, 0 errores; Maps/Firebase Android
  siguen siendo los dos pendientes anteriores.
- Seis pruebas del hook real cubren permiso, caché/GPS, múltiples toques,
  cancelación, timeout, posición inválida y desmontaje. La barra real conserva
  su geometría e informa progreso/deshabilitado. Horarios: día, madrugada,
  cerrado, ausente, 24 h y solapamiento de turnos.
- [Vista previa del componente real](design/previews/patio-cards-compact-2026-10-10.html):
  54 ejemplos entre lista/grid, claro/oscuro, 320 pt y letra al 160%.
  Calificaciones alineadas y separadas 8 pt, sin métricas fuera de la card.
  La vista web no certifica fuentes, mapas, blur ni gestos nativos.
- Log: `/private/tmp/patio-compact-location-check-20261010.log`.

No se inició EAS, nueva compilación nativa, operación del teléfono ni publicación.
El usuario decidió hacer la prueba física. El cierre a inicio del iPhone reportado
antes sigue pendiente de confirmación; no se atribuye al nuevo botón ni se declara
resuelto por estas pruebas. Diagnóstico de dispositivo detenido por su petición.

## Regresar a la versión anterior

Estado previo: `docs/design/experiments/compact-cards-2026-10-10/before/`;
archivos y alcance en `manifest.json`. El respaldo incluye la corrección del
swipe y todos los cambios que ya existían en estos archivos.

`change.patch` contiene únicamente este ajuste, calculado contra ese respaldo,
sin mezclarlo con el diff anterior del proyecto. Antes de revertirlo, comprobar:

```sh
git apply --reverse --check docs/design/experiments/compact-cards-2026-10-10/change.patch
```

Si el usuario pide regresar y la comprobación pasa, aplicar el mismo comando
sin `--check`. Si archivos cambiaron después, adaptar la reversión para
preservar ese trabajo. No usar `git restore` sobre el worktree completo.
