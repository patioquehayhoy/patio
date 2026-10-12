# Ajuste de distribución — 2026-10-10

Refinamiento posterior: [verificación estable, estrellas y borde de Mapa](CARD_STABILITY_2026-10-10.md).
Ese contrato sustituye la distribución flexible de verificación y las franjas de scroll.

Solicitud: ordenar precio, ubicación y feedback con una referencia comparable
a Uber, reducir espacio innecesario y corregir sombras y recorte inferior.

## Referencia y criterio

[Base de Uber: List item](https://base.uber.com/6d2425e9f/p/96ccc3-list-item)
separa identidad, información secundaria y contenido a la derecha; mantiene
iconos consistentes y recomienda un feedback de presión legible.
[States](https://base.uber.com/6d2425e9f/p/65ae6d) distingue interacción y estado;
[Transitions](https://base.uber.com/6d2425e9f/p/312fab-transitions) organiza
las transiciones según su relación con el contexto.

Adaptación de Patio: precio publicado a la derecha para comparar, colonia y
distancia próximas, calificaciones en un grupo secundario. No se infiere un
ticket promedio ni se afirma que Uber prescribe esta tarjeta exacta.

## Decisiones aplicadas

| Contexto | Composición e interacción |
| --- | --- |
| Mapa, Guardados en lista, Vistos y lista privada | Icono de 36 pt; nombre y precio en cabecera, ubicación y distancia juntas, calificaciones debajo. |
| Guardados en cuadrícula | Precio arriba a la derecha, icono/selección en casilla izquierda estable. Nombre dos líneas, colonia una; reservas compactas proporcionadas a la letra. |
| Ficha del lugar | Nombre completo; colonia y precio en lados opuestos debajo. Precio de platos mantiene alineación derecha. |
| Abierto | Toque directo; mantener presionado abre elección de horario. |
| Filtros y listas | Panel inferior conserva el contexto para combinar criterios o elegir listas; vistas iniciales sin título redundante. |
| Selección de listas | Feedback de superficie al presionar, marca izquierda para selección, cuenta a la derecha. |
| Barras inferiores | Scroll reserva su altura real y margen; incluye la barra de selección que puede crecer. Resultados de Mapa contemplan teclado, navegación y área segura. |
| Paneles y sombras | Sheets inferiores planos; controles separados usan una sombra negra suave compartida. Reducida la protección oscura de la navegación. |

El precio permite envolver para conservar el importe completo. Con letra grande
y ancho reducido pasa debajo del nombre, alineado a la derecha; la cuadrícula
se convierte en una columna. La altura no crece arbitrariamente por el nombre:
se conserva el límite de dos líneas y el nombre completo accesible/en ficha.

LibrarySheet y Guardar/Mover mantienen la cabecera y ponen el editor dentro del
scroll. Si el teclado deja poco espacio, cuerpo y footer siguen desplazables.
La altura disponible manda sobre mínimos de altura que antes podían recortar
contenido. Las condiciones extremas siguen necesitando revisión en dispositivo.

## Verificación

- TypeScript y lint aprobados; 156/156 tests.
- Regresiones: margen según altura real de acciones; viewport pequeño con
  teclado; editor y footer desplazables. Se ejercitan handlers y geometría,
  sin simular una aprobación visual de vistas nativas.
- Control de release: 29 verificaciones correctas, 0 errores, dos pendientes
  externos existentes (Maps y Firebase Android).
- Exportaciones JS/assets iOS y Android en
  /private/tmp/patio-uber-refinement-native-20261010.
- Logs: /private/tmp/patio-uber-refinement-check-20261010.log y
  /private/tmp/patio-uber-refinement-native-20261010.log.
- El intento inicial con todos los destinos incluyó Web y falló por
  react-native-maps nativo. Se verificaron los destinos solicitados
  iPhone/Android de forma explícita; Web no forma parte de este cierre.

No se ejecutó simulador ni QA en dispositivo, conforme al reparto de revisión
física vigente. Exportaciones de JavaScript/assets no son builds firmadas.

## Aceptación física pendiente

- [ ] iPhone y Android: última tarjeta completamente desplazable por encima de navegación y acciones de selección.
- [ ] Precio corto, rango largo, precio ausente y nombre de dos líneas: alineación clara en lista/cuadrícula/ficha.
- [ ] Letra grande: importes completos, ubicación legible y métricas sin desbordar.
- [ ] Filtros/listas/Guardar/Mover: cerrar, editar, seleccionar y confirmar con teclado; footer accesible en pantallas pequeñas.
- [ ] Claro/oscuro: sin halos extraños de sheets ni velo excesivo sobre tarjetas inferiores.
