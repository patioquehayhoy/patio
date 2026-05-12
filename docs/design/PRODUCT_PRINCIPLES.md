# Patio — Product Principles

> Biblia de decisiones para flujo, búsqueda, feedback y rediseño.
> Estos principios tienen prioridad antes de discutir estilo visual.
> Inspirado en patrones modernos de producto móvil: claridad de intención, decisiones obvias, feedback cerrado, búsqueda contextual y optimización en tiempo real. No pertenece a una marca o framework externo.

## Norte

Patio debe sentirse rápido, claro y local. La app no debe pedirle al usuario que entienda la estructura interna del producto; debe llevarlo a la siguiente acción obvia.

## Glosario vivo

Estos conceptos deben usarse como vocabulario común entre producto, diseño, código y agentes externos.

- **Progressive disclosure:** mostrar solo la información necesaria en cada momento y revelar más detalles únicamente cuando el usuario interactúa. Reduce ruido visual y acelera decisiones.
- **Search-first interface:** la búsqueda es el elemento principal de navegación y descubrimiento. El usuario encuentra contenido escribiendo antes de navegar múltiples capas o categorías.
- **Ambient state:** estado visual pasivo pero útil que comunica contexto sin exigir atención. Ejemplo: mapa vivo, horarios activos o cercanía funcionando en segundo plano.
- **Empty state activo:** pantalla vacía que no termina en “no hay contenido”, sino que guía al usuario hacia una acción clara para continuar, crear o descubrir algo.
- **Radar de antojo:** modo inicial de Explorar donde Patio espera la intención del usuario. El mapa se siente vivo, pero no muestra inventario completo; los puntos y resultados aparecen cuando el usuario busca, toca o muestra intención.

## Principios

## 1. Progressive disclosure

No mostramos todo desde el inicio. Mostramos lo mínimo necesario y revelamos más detalles únicamente cuando el usuario interactúa.

### En Patio

- Foodie: primero mapa y búsqueda. Después filtros, detalle, guardar o compartir.
- Explorar no debe abrir con una lista grande de negocios; debe iniciar en modo espera viva.
- Fondero: primero crear menú. Después método: foto, imagen, plantilla o manual.
- Perfil negocio: primero lo público y útil. Ajustes avanzados después.

### Regla

Si una pantalla necesita explicar demasiado, probablemente está mostrando decisiones antes de tiempo.

## 2. Structured feedback

Cuando algo sale mal o falta información, no damos una caja abierta. Damos opciones concretas.

### En Patio

- Si no hay menú: `Crear menú`, no solo “Llena tu menú”.
- Si no hay favoritos: `Ver mapa`, no solo un estado vacío.
- Si OCR falla: `Reintentar foto`, `Elegir imagen`, `Escribir manualmente`.
- Si búsqueda no encuentra: sugerir categorías o platillos cercanos.

### Regla

Todo estado vacío o error debe responder: “¿qué hago ahora?”.

## 3. Closed-loop feedback

Cada acción de feedback debe alimentar una mejora accionable, no solo registrar una opinión.

### En Patio

- Calificar una fondita debe mejorar ranking, señales de confianza o recomendaciones.
- Guardar favoritos debe acelerar futuras decisiones.
- Compartir un menú puede alimentar “muy activo hoy” o señales de popularidad.
- Correcciones del fondero al OCR deben mejorar el menú final antes de compartir.

### Regla

Si pedimos feedback, debe volver al usuario como mejor experiencia.

## 4. Choice architecture

La decisión correcta debe sentirse obvia, no pesada.

### En Patio

- Inicio no debe sentirse como formulario de segmentación: el MVP es Foodie-first con `Explorar comida` como acción principal y `Publicar mi menú` como entrada secundaria.
- Foodie no debe decidir entre “buscar” y “explorar” como si fueran dos productos.
- Fondero no debe ver cuatro CTAs compitiendo; debe ver “Crear menú” y luego escoger método.

### Regla

Una intención principal por pantalla. Las opciones secundarias existen, pero no compiten.

## 5. Real-time search optimization

La búsqueda debe responder mientras el usuario piensa, no después de terminar de formular perfecto.

### En Patio

- Buscar “mole”, “enchiladas”, “agua” debe filtrar resultados en el mapa/lista.
- Antes de buscar, el mapa puede mostrar señales ambientales sutiles; no debe mostrar una lista completa que abrume.
- Al escribir, los puntos relevantes deben encenderse y los resultados aparecer progresivamente.
- Los resultados deben priorizar disponibilidad, cercanía, precio y coincidencia del platillo.
- Si el usuario está en mapa, la búsqueda debe mantener contexto espacial.
- La pantalla dedicada de búsqueda solo tiene sentido si ofrece más poder que el input del mapa.

### Regla

Buscar es un estado del mapa antes que una pantalla separada.

## 6. Intent-first navigation

La navegación debe partir de la intención del usuario, no de la arquitectura técnica.

### En Patio

- Foodie: “quiero comer algo hoy”.
- Fondero: “quiero publicar mi menú de hoy”.
- Secundario: cuenta, soporte, manifiesto, modo oscuro.

### Regla

Si una ruta existe por conveniencia técnica pero no por intención del usuario, no debe estar en el camino principal.

## 7. Recovery over dead ends

No debe haber pantallas que solo digan que falta algo. Deben recuperar al usuario.

### En Patio

- `Compartir` sin menú debe mandar a crear menú.
- `Favoritos` sin favoritos debe mandar al mapa.
- `Buscar` sin query debe orientar con ejemplos o vivir dentro del mapa.

### Regla

Todo callejón sin salida necesita una puerta clara.

## 8. Ambient state

Un estado pasivo puede comunicar que Patio está vivo sin exigir atención ni meter listas completas.

### En Patio

- Explorar puede abrir con mapa tenue, búsqueda protagonista y puntos cercanos sutiles.
- Horarios, cercanía y actividad pueden vivir en segundo plano como señales suaves.
- El usuario no debe sentir que tiene que leer una lista antes de decidir qué quiere.

### Regla

El estado inicial debe invitar a expresar intención, no obligar a revisar inventario.

## 9. One job per surface

Cada superficie debe tener un trabajo principal.

### En Patio

- Mapa: descubrir.
- Detalle: decidir si ir/guardar/compartir.
- Menú editor: crear o corregir menú.
- Preview: revisar y compartir.
- Cuenta: ajustes y soporte.

### Regla

Si una pantalla intenta ser home, ajustes, búsqueda y onboarding al mismo tiempo, se divide o se simplifica.

## 10. Contextual assistance

La ayuda debe aparecer donde reduce trabajo, no como otra decisión global.

### En Patio

- OCR y limpieza de menú.
- Sugerencias de secciones.
- Corrección de precios raros.
- Captions para compartir.
- Búsqueda natural más adelante.

### Regla

El agente de Patio debe ser contextual y silencioso. No debe convertirse en una pestaña ni competir con el flujo.

## 11. Local trust

Patio debe optimizar confianza local, no solo estética.

### En Patio

- Horario claro.
- Dirección clara.
- Precio visible.
- Menú de hoy actualizado.
- Pagos visibles.
- Señales de actividad útiles, no decorativas.

### Regla

La belleza visual no compensa falta de confianza operativa.

## Checklist antes de rediseñar una pantalla

- ¿Cuál es la intención principal?
- ¿Hay más de un CTA compitiendo por la misma intención?
- ¿La pantalla muestra opciones antes de que hagan falta?
- ¿El estado vacío tiene una acción concreta?
- ¿La pantalla revela información por intención o muestra inventario de golpe?
- ¿Hay un ambient state útil antes de pedir una decisión?
- ¿El feedback del usuario mejora algo después?
- ¿La búsqueda conserva contexto?
- ¿La pantalla se puede explicar con una frase?
- ¿El diseño visual está resolviendo confianza, velocidad o claridad?
