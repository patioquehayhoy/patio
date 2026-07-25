# GOAL

## Filosofía de producto

No es entregar datos a las personas para que los usen — sino hacer que la acción correcta sea obvia antes de que la necesiten.

No es hacer que las personas piensen qué decidir — sino darles la siguiente acción directamente, ya resuelta.

No es ofrecer una solución clara — sino eliminar la necesidad de que la busquen.

Si algo no es evidente para las personas, no se asume que el usuario falló: se reduce fricción y se mejora la forma en que se comunica.

Patio no debe sentirse como una herramienta que le entrega datos a las personas para que ellas los interpreten. Debe convertir datos dispersos en una acción evidente.

La meta de Patio es hacer evidente el valor de cada paso:
- Para quien vende: menos captura, más negocio publicado.
- Para quien busca comida: menos comparación mental, más confianza para elegir.
- Para el sistema: menos pantallas que piden pensar, más decisiones guiadas por contexto.

## Principios de experiencia
- Decisión guiada sobre captura abierta.
- Progressive disclosure: preguntar más solo cuando sea necesario.
- Feedback estructurado: cuando algo sale mal, segmentar el problema en opciones claras en vez de pedir texto libre.
- Fricción mínima para el usuario casual; profundidad solo para quien realmente la necesita.
- La IA debe operar primero como reducción de fricción, no como adorno.
- Evitar IA editorial innecesaria: Patio no debe sonar como un generador de contenido ni empujar colecciones infladas. La curaduría debe sentirse humana, simple y útil.
- Evitar asistencia intrusiva tipo confirmaciones repetidas. La IA debe intervenir al final del flujo solo cuando detecte un problema real o una omisión importante.

## Objetivo actual del producto
Construir una app móvil (Patio) para negocios de comida y personas que buscan comer en México. Patio debe conectar dos experiencias:

1. Herramientas simples para que un negocio publique perfil, ubicación, horario y menú.
2. Una experiencia de descubrimiento para que una persona encuentre dónde comer con poca fricción.

## Núcleo de producto

Patio se termina alrededor de una tríada:

```txt
perfil público → menú vivo → póster → regreso al perfil
```

- El **perfil** es la identidad estable y el lugar donde vive la relación.
- El **menú** es el contenido vigente, estructurado y compartido por todo el
  producto.
- El **póster** es la expresión canónica del menú publicado dentro de Patio.
  Compartir distribuye su enlace y devuelve a las personas al mismo perfil.

La extracción, estructura, revisión y aprendizaje del menú se especifican en
`docs/MENU_INTELLIGENCE_AND_POSTER.md`.

## Filosofía de red y arranque

`The Cold Start Problem`, de Andrew Chen, es la ley de crecimiento de Patio.
La estrategia completa vive en `docs/NETWORK_COLD_START_AND_MONETIZATION.md`.

- La unidad de la red es el perfil público de cada Patio.
- El mapa descubre; el perfil concentra menú vigente, menús visibles, seguimiento,
  reseñas y actividad.
- El lado difícil son los negocios que crean y mantienen la oferta.
- La primera red atómica se construye en una microzona densa alrededor de Polanco
  con diez negocios incorporados personalmente.
- Publicar, seguir y avisar a seguidores forman el bucle gratuito esencial.
- La monetización llega después de demostrar recurrencia y combina suscripción,
  consumo de IA, promoción medible, servicios y transacción real por etapas.
- Perfil, menú vigente y póster canónico permanecen gratis porque forman la oferta y
  distribución que la red necesita.

El acceso de negocio debe existir sin contaminar la experiencia principal de exploración. Filosofía tipo Uber: la persona que busca comida no necesita ver ni entender el modo operador; quien tiene negocio encuentra una entrada discreta para registrar o administrar su Patio.

## Objetivo técnico actual
El MVP ya tiene el esqueleto funcional de ambos lados:

1. **Foodie:** entrada a `Explorar comida`, mapa como home real, búsqueda inline, pins, bottom sheet, ficha pública, favoritos, cuenta y ratings estructurados.
2. **Fondero:** login por magic link, perfil de negocio, ubicación GPS/lat-lng, creación/edición de menú, guardado en Supabase, preview/share y publicación visible para Foodie.
3. **Datos reales:** `fonditas`, `menus` y `cartas` conectan Fondero -> Foodie; favoritos y fallback de fonditas reales ya leen Supabase.

El objetivo inmediato es **validar el núcleo 1.0 con la primera red atómica y
conectar la interacción a datos compartidos**:

1. Probar en iPhone foto real → revisión → publicación → póster → perfil.
2. Incorporar personalmente los primeros diez negocios de la microzona Polanco.
3. Medir tiempo a primera publicación, retorno y conexiones por negocio.
4. Implementar el backend social mínimo para follows, reseñas, vistas agregadas,
   versiones visibles y avisos.
5. Mantener gratis perfil, menú vigente, póster y avisos que alimentan la red;
   validar disposición de pago antes de implementar suscripción.

## Criterio de éxito de corto plazo
Un fondero puede entrar, configurar su negocio, marcar ubicación, publicar menú y ver ese menú reflejado en la ficha Foodie sin pérdida de datos.

Un foodie puede abrir Patio sin login, buscar algo que se le antoja, ver resultados en el mapa, abrir una ficha con menú real, guardar/compartir y pedir cómo llegar sin entender el modo negocio.

Un diseñador externo puede rediseñar visualmente la app sin cambiar rutas, tareas, jerarquía funcional ni mezclar Foodie con Fondero.

## Notas para V3
- Mapa y Top 10 importan porque no solo muestran dónde comer: ayudan a decidir cuál lugar vale la pena.
- Top 10/Recomendaciones debe quedar como apartado futuro. El MVP de Foodie debe iniciar más minimalista: mapa, lugares cercanos y señales simples como 5 estrellas.
- Fotos no son requisito inicial para una ficha pública; primero debe funcionar con nombre, categoría, ubicación, horario, menú, pagos y preview.
- El sistema de calificación debe evitar texto libre al inicio. Si alguien pone menos de 5 estrellas, Patio debe preguntar una razón estructurada: horario incorrecto, ubicación confusa, menú no disponible, precio distinto, atención, cerrado, otro.
- IA-first para Patio significa: usar IA para reducir pasos, interpretar fotos/menús, sugerir estructura, detectar omisiones y hacer más evidente la siguiente acción.
- La IA no debe tomar el rol de curador público de forma visible en V3. Puede ayudar internamente a revisar calidad, pero Top 10 y colecciones deben mantenerse simples, legibles y no sobreproducidas.

## Eficiencia técnica y costos
- Priorizar llamadas IA por lote cuando el contexto sea el mismo: una llamada puede extraer menú, precios, secciones, dudas, confianza y omisiones.
- Mantener prompts compactos y estables. El costo de IA depende principalmente de tokens de entrada y salida, no del número de “instrucciones” como concepto abstracto.
- Pedir salida estructurada y corta. La app decide qué mostrar; la IA puede devolver señales internas que no se exponen al usuario.
- Evitar consultas IA para tareas determinísticas: validaciones simples, filtros, ordenamientos, horarios y checks de campos deben vivir en código/backend.
- Cachear resultados cuando el menú/foto/perfil no cambió.
- Usar IA al final de un flujo para detectar problemas reales, no como asistente permanente.

## El mapa como superficie principal de decisión

El mapa no es un directorio georeferenciado. Es la respuesta visual a la pregunta del usuario, renderizada en el espacio.

- El estado neutro del mapa es un campo abierto de puntos iguales — sin jerarquía impuesta, sin selección por defecto.
- La búsqueda colapsa el problema de zoom: escribir "mole" filtra pins directamente, sin necesidad de navegar niveles del mapa.
- La selección es siempre un acto explícito del usuario. El sistema no
  preselecciona ni asume intención.
- Tocar un pin, resultado o fila abre el perfil público canónico. El mapa no
  intercala otra ficha con la misma identidad y un botón “Ver”.

### Escala progresiva (MVP → producción)
1. **Viewport filtering** (inmediato): renderizar solo los patios visibles en la región actual del mapa. Costo mínimo, escalabilidad a miles de pins.
2. **Clusters** (cuando haya 50+ patios por zona): número de lugares agrupados → usuario hace zoom → pins individuales aparecen.
3. **H3/geohash por zona** (largo plazo): dividir la ciudad en celdas; zoom alejado muestra densidad por zona, zoom cercano muestra pins. Mismo principio que INEGI: agregar al nivel correcto, no volcar todo el dataset.

La búsqueda por platillo reemplaza la necesidad de navegar por zoom: el usuario no necesita explorar el mapa si ya sabe lo que quiere.

## Mapa y ubicación eficiente
- Inspiración tipo Uber: no mostrar ni procesar toda la precisión todo el tiempo. Agregar ubicaciones en celdas o zonas cuando baste.
- Evaluar H3/geohash/S2 para búsquedas por zona. H3 es un índice geoespacial jerárquico con celdas hexagonales; sirve para agrupar, buscar y cachear lugares cercanos sin recalcular todo por coordenadas crudas.
- Para Patio MVP, preferir consultas por bounding box/celdas cercanas y cache por zona antes de tracking fino en tiempo real.
- No trackear usuarios de forma continua si basta con ubicación aproximada o actualización bajo demanda.
- La precisión debe subir solo cuando el usuario pide una acción que la necesita: cómo llegar, confirmar dirección o ver lugares muy cercanos.
