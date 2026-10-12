# Tarjetas, estrellas y borde inferior — 2026-10-10

Solicitud posterior al ajuste Uber: verificación móvil según precio, ejemplos
con nombres muy largos, calificaciones en una línea, retirar «Tu» y corregir
las franjas/cortes mostrados en las capturas claras y oscuras de Mapa.

## Cambios

- Precio de lista: columna fija de 92 pt × fontScale. Verificación en una
  casilla reservada de 16 pt; ni precio corto ni rango largo cambian su posición.
- Nombre máximo dos líneas; completo en accesibilidad y ficha. Grid mantiene
  dos líneas reservadas y pasa a una columna cuando el contenido no cabe.
- Promedio público neutro y calificación propia separados, en una línea.
  Casilla propia fija: estrella hueca sin valoración, estrella naranja y número
  con valoración. Retirado «Tu» visual; significado explícito en VoiceOver/TalkBack.
  Números conservan contraste neutro. Cuentas grandes compactas; accesibilidad
  mantiene el número exacto de reseñas. Datos inválidos no activan la estrella.
- Mapa filtrado termina en el borde físico, reservando el inset dentro del scroll.
  Antes terminaba en insets.bottom y dejaba una franja del mapa fuera del panel.
- Retirados degradados de scroll de Mapa, Guardados, Menús y paneles de listas:
  sobre vidrio agregaban una franja tintada distinta al fondo. Indicador nativo.
- Material protector compartido en paneles de Mapa, LibrarySheet y Guardar/Mover.
- Keyboard frame compartido: no descontar el teclado dos veces en Android.
- Detent medio mide y suma las primeras tres filas: una primera fila corta
  no recorta la tercera cuando otra tiene nombre de dos líneas.

## Criterio de referencia

[Google Maps: valoraciones y reseñas](https://support.google.com/maps/answer/6230175?hl=es)
separa el resumen público de reseñas de la acción de añadir una valoración.
Patio conserva esa distinción: una estrella compacta por dato en la tarjeta;
el control para valorar pertenece a la ficha. No añadir cinco miniestrellas
a cada card ni convertir la estrella informativa en una acción falsa.

Se aplicó la guía local [apple-design](</Users/parco/.claude/skills/apple-design/SKILL.md>)
para alineación, jerarquía, contraste y materiales. No es certificación de Apple
ni copia exacta de una tarjeta de Google Maps.

## Ejemplos y evidencia

[Vista completa de ejemplos](design/previews/patio-cards-2026-10-10.html),
[captura](design/previews/patio-cards-2026-10-10.jpg) y
[mediciones](design/previews/patio-cards-measurements-2026-10-10.json).
Se generan con `node scripts/design/card-preview.cjs` a partir de los componentes
reales PatioCardInfo/Price/IdentityIcon usando React Native Web y los glifos Ionicons
del proyecto. Temas y datos sintéticos de la vista son independientes del backend.
Escalado tipográfico simulado; mapa y BlurView nativos no forman parte del ejemplo.

Seis vistas: lista clara/oscura, grid claro/oscuro, ancho 320 y letra 160%.
Tres primeros ejemplos con mismo nombre y precios distintos; además nombres
de más de cien caracteres, precio ausente, reseñas numerosas y calificación ausente.
En las seis vistas, la verificación conserva el mismo eje relativo a la tarjeta,
la estrella propia conserva su eje incluso vacía, las calificaciones comparten
línea y ninguna calificación pública del ejemplo tiene desbordamiento horizontal.

## Comprobaciones

- 157/157 pruebas, TypeScript y lint aprobados. Prueba de independencia entre
  promedio/calificación propia, valoración inválida y cuenta accesible completa.
- 29 checks de release correctos; dos pendientes externos existentes de Android.
- Exportaciones JS/assets iOS/Android: /private/tmp/patio-card-stability-native-20261010.
- Logs: /private/tmp/patio-card-stability-check-20261010.log y
  /private/tmp/patio-card-stability-native-20261010.log.

Pendiente comprobar el panel nativo en iPhone/Android con scroll, teclado,
claro/oscuro y nombres largos. Los ejemplos en navegador no acreditan el
acabado de mapas, vidrio ni animaciones en dispositivo. Sin commit ni publicación.
