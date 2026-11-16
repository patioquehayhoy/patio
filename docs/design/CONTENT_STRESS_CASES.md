# Casos de contenido para diseñar (prueba de estrés)

Regla de Parco (2026-11-08): **ningún diseño se propone ni se construye con un
solo ejemplo corto.** «Narvarte» cabe en todo; «Jardines del Pedregal de San
Ángel» no. Cada pantalla, tarjeta o línea se revisa con el caso corto, el
típico, el largo y el límite, con letra grande y en oscuro, antes de
mostrarla.

## 1. El protocolo

1. **Identificar cada texto variable** de la pieza (nombre, colonia, precio,
   conteos, horario, platillo, descripción…).
2. **Ponerle sus cuatro casos** de la tabla de abajo: corto, típico, largo y
   límite (el límite sale de `lib/text-limits.ts` o del dato real más largo).
3. **Revisar la retícula con el límite:** márgenes de 20, columnas fijas a la
   derecha (precio, corazón, «Seguir» de 112), alineación al primer renglón.
4. **Decidir qué pasa cuando no cabe**, en este orden:
   - bajar a su propia línea a todo lo ancho (como `ViewThatFits` de Apple);
   - bajar el tamaño en pasos de la escala (`TITLE_STEPS`, flyers);
   - partir en dos renglones con `noWidow`.
   **Nunca** cortar con «…» un dato que la persona necesita para decidir.
5. **Letra grande y oscuro:** repetir con texto al 130 % y en tema oscuro.
6. **Mostrar el límite al proponer:** toda maqueta lleva al menos un caso
   largo junto al corto.

## 2. Casos por dato

| Dato | Corto | Típico | Largo | Límite |
|---|---|---|---|---|
| Nombre del negocio (30) | Lupita | Fonda Poblana | Cocina Económica Doña Mary | Mariscos y Cocteles Dev Cinco |
| Descripción del negocio (80) | — (vacía) | Comida corrida casera | Cocina de barrio de la mañana a la noche | Comida corrida de mariscos con caldo, plato fuerte y agua del día |
| Colonia | Roma | Narvarte | San Pedro de los Pinos | Jardines del Pedregal de San Ángel · Unidad Habitacional Vicente Guerrero |
| Distancia | 80 m | 450 m | 2.3 km | 24.8 km |
| Precio típico | $25 | $95 | $280 | $12,500 (un rango viejo: $1,250–2,950) |
| Seguidores | 0 | 240 | 3,215 | 12,480 |
| Calificación | sin reseñas | 4.6 (40) | 4.8 (126) | 4.5 (1,312) |
| Horario de hoy | Cerrado hoy | 1–5pm | 8am–10pm | 12:30pm–11:30pm |
| Sección (40) | Pan | Platos fuertes | Especialidades de la casa | Tacos de guisado, canasta y dorados |
| Platillo (60) | Mole | Agua de horchata | Chile relleno de queso en caldillo de jitomate | Milanesa de res empanizada con papas a la francesa y ensalada |
| Descripción de platillo (140) | — | Con ensalada de la casa | Con frijoles refritos, crema y queso | Hasta 140 letras: dos o tres renglones |
| Aviso (Pro) | Hoy abrimos a las 8 pm. | 2×1 en aguas frescas, hoy de 2 a 4 pm. | Hoy pozole rojo o verde con tostadas, crema y orégano hasta agotar. | 140 |
| Reseña (600) | ¡Rico! | Dos renglones | Un párrafo | 600 |
| Nombre de quien publica (40 + inicial) | Leo | Caro M. | María Guadalupe H. | María Guadalupe del Socorro Josefina H. |
| Fotos de un platillo | 1 (del lugar, sin número) | 3 («1/3» dentro de la foto) | 12 («3/12») | 40 («12/40»; «1/40» en el vistazo) |
| «Me gusta» de una foto | 0 | 3 | 128 | 12,480 |
| Fecha de una foto (como su reseña) | 1 nov 2026 | 15 nov 2026 | 30 sept 2026 | 31 dic 2025 |
| Pregunta «¿Es el mismo platillo?» (editor) | ¿Es el mismo platillo que «Mole»? | … Se juntan su foto y 3 fotos de clientes. | … «Chile relleno de queso en caldillo de jitomate»? … | nombre de 60 y «1,234 fotos de clientes»: baja de renglón, nunca se corta |

## 3. Dónde verlos en el teléfono

En desarrollo, los lugares «Dev» (`lib/demo.ts`) traen estos casos. Busca «dev»:

- **Fondita Dev:** caso típico (Narvarte, precio del menú $95, 240 seguidores).
- **Taquería Dev 2:** San Pedro de los Pinos, precio típico $45 (menú de $12 a $420), 14 secciones.
- **Café Dev 3:** Roma Norte, 0 seguidores, sin reseñas.
- **Pastelería Dev 4:** Santa María la Ribera, «Se acabó por hoy».
- **Mariscos y Cocteles Dev Cinco:** nombre de 29, Jardines del Pedregal de
  San Ángel, precio del menú $150, 12,480 seguidores, a más de 12 km.
- **Cocina Grande Dev 6:** Unidad Habitacional Vicente Guerrero, 24 secciones.
  «Chiles en nogada» trae 40 fotos de clientes (orden, carga y una con
  12,480 «me gusta»).
- **Fotos de clientes en Fondita Dev:** «Al pastor» con el nombre de 39,
  una foto de hace 200 días y la misma persona dos veces; «Suadero» con la reseña de 591 letras; «Campechanos» con una foto
  tuya para probar Corregir y Quitar.
- **Reseñas sin foto en Fondita Dev** (como serán la mayoría): «¡Rico!», una
  típica, una de 487 letras, una de 2 estrellas y una solo con estrellas.
- **Personas de prueba:** tocar su nombre (en la foto o en la reseña) abre un
  perfil de prueba; solo en desarrollo.

## 4. Qué nunca se corta y qué sí, a propósito

Barrido del 8 nov: ningún dato variable lleva `numberOfLines` que lo corte
ni un alto fijo que lo recorte. Nombres de lugares y personas, colonias,
platillos, secciones, precios, horarios, títulos de menús y listas, avisos,
reconocimientos y reseñas **bajan de renglón**.

Lo único que se limita, y por qué:

| Qué | Cómo | Por qué |
|---|---|---|
| Etiquetas fijas de la app (pestañas, «Filtros», «Seguir», botones) | una línea; algunas bajan de tamaño | texto nuestro y corto; cabe siempre |
| Título chico de la barra al hacer scroll | una línea | repite el título grande, que se ve completo |
| Vista previa de un comentario en Notificaciones | tres renglones | al tocarla se abre la ficha con el comentario completo |
| Push de comentarios (servidor) | 90 letras | aviso del sistema; el texto completo está en la app |
| Nombre en el cartel de «Vista previa» | baja de tamaño hasta 60 % | cabe en dos renglones con el máximo de 30 letras |
| Nombre del lugar sobre la foto de la ficha | baja de tamaño en tres pasos; solo con la letra de accesibilidad más grande se limita a tres renglones | la foto tiene alto propio |

Al agregar un `numberOfLines`, un `height` fijo con `overflow: 'hidden'` o un
`slice()` con «…», justificarlo en esta tabla.
