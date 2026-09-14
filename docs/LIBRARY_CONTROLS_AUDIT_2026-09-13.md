# Mapa y Guardados — organización y navegación

> **Decisión final posterior:** se eligió la alternativa de dos accesos directos
> y permanentes. Mapa y Guardados muestran **Filtros** y **Tus listas**; Mostrar
> y su menú intermedio fueron eliminados. Guardados conserva Vista/Orden como
> control iconográfico separado. Las limpiezas de filtros y listas ya no se
> afectan entre sí. Validación: 112/112 pruebas, TypeScript y lint.

> **Resolución posterior:** Mapa y Guardados comparten ahora **Mostrar** con
> las mismas entradas Filtros/Tus listas. Guardados presenta **Organizar** por
> separado para Vista/Orden. Los símbolos de menú están al borde izquierdo y
> el mapa conserva 8 pt bajo el buscador. Validación: 112/112 pruebas, TypeScript
> y lint; falta visto bueno visual en iPhone físico.

> **Corrección posterior de Alejandro — versión no aprobada:** un botón por
> pantalla no basta. Mapa y Guardados deben compartir el mismo menú. La variante
> Filtrar/Opciones descrita abajo diverge en su comportamiento y sigue pendiente
> de corregir. Esta auditoría documenta la implementación, no su aceptación.
> Ver el checklist prioritario en [HANDOFF](HANDOFF.md). El índice A–Z tampoco
> sustituye la unificación del menú. Último cierre: documentación únicamente.

Revisión del 13 de septiembre de 2026, tras feedback de Alejandro: conservar
«Menú hoy» y «Abiertos» fuera del menú seguía haciendo competir controles.
Alcance de este corte: Mapa, Guardados y sus componentes compartidos.

## Fundamentos y hallazgos

- Apple recomienda escoger deliberadamente las acciones de una barra y hacer
  claro su significado. La cápsula anterior mostraba dos símbolos y un divisor,
  pero tenía una sola acción. Se sustituyó por una entrada con nombre:
  **Filtrar** en Mapa, **Opciones** en Guardados.
  [HIG: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars).
- Apple recomienda agrupar comandos relacionados y separar los grupos.
  «Menú hoy» y «Abiertos ahora» pertenecen a Disponibilidad dentro de Filtros;
  las preferencias Lista/Cuadrícula y de orden pertenecen a grupos distintos.
  [HIG: Menus](https://developer.apple.com/design/human-interface-guidelines/menus).
- Un índice alfabético navega a secciones, no filtra los resultados. Apple
  advierte de conflictos con controles al final de las filas: el índice de
  Guardados tiene una franja propia y las flechas de las filas se ocultan
  mientras aparece. [HIG: Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).

Las etiquetas visibles, el umbral del índice y el resumen de filtros son
decisiones de Patio fundamentadas en estas guías, no exigencias literales de Apple.

## Resultado

- Mapa: un solo botón Filtrar abre directamente el panel. Disponibilidad,
  categorías, pagos y listas permanecen disponibles. El resumen es texto
  discreto; el contador incluye todos los criterios activos.
- El filtro histórico por categorías guardadas ya no se dibuja encima del
  buscador. Se muestra y se limpia dentro del mismo panel.
- Mapa mantiene una instancia de la barra al cambiar entre búsqueda y reposo.
  Los criterios también se aplican a la lista de lugares del panel del mapa.
- Guardados: Opciones queda fuera del scroll. El menú separa Vista, Orden y
  Mostrar. Las preferencias se conservan; una lectura tardía no pisa una
  elección reciente y las escrituras se serializan.
- En Lista + Alfabético A–Z, los lugares se agrupan por inicial. El índice
  lateral aparece con al menos 12 lugares y tres iniciales distintas. Es un
  umbral provisional de producto. Solo incluye letras con resultados,
  admite toque/arrastre y es ajustable mediante VoiceOver.
- Se normalizan acentos y se conserva la Ñ. Nombres numéricos/símbolos van
  al grupo # final. La cuadrícula conserva el mismo orden alfabético.
- El índice desaparece al seleccionar o cambiar a cuadrícula; los menús y
  herramientas siguen siendo accesibles en colecciones pequeñas o vacías.
- Filtros y Tus listas son páginas del mismo panel, con regreso y limpieza
  contextual. El cambio no necesita presentar dos modales consecutivos.
- Cuando Opciones abre un panel, se espera al cierre nativo del menú en iOS
  mediante onDismiss, sustituyendo el retraso arbitrario de 180 ms. Los menús
  se acotan al área segura y permiten scroll cuando no cabe su contenido.

## Verificación

- `npm run check`: TypeScript y lint aprobados, **111/111 pruebas**.
- Seis pruebas nuevas cubren la barra única, disponibilidad/listas combinadas,
  limpieza, grupos del menú, cierre nativo simulado, navegación A–Z, Ñ/acentos,
  límites del índice y preferencias leídas tarde.
- `check:release`: 29 verificaciones, 0 errores; siguen dos pendientes externos
  de Android que ya existían.
- No se inició simulador ni se operó el teléfono. Falta validar visualmente en
  el iPhone de Alejandro: apertura de paneles, teclado, texto grande, scroll
  del índice y tema claro/oscuro. Las pruebas de handlers no acreditan UIKit.
