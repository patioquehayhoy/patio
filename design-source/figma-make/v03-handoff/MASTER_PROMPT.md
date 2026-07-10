# Prompt maestro — Patio Figma Make v03

Pega en Figma Make todo el bloque siguiente. No lo resumas.

```text
PATIO · FIGMA MAKE v03 · CIERRE DE PRODUCTO

Tu tarea no es inventar otra app de comida ni empezar Patio desde cero. Tu tarea
es estudiar el producto funcional y las versiones de diseño existentes, conservar
lo que ya está bien y producir la versión visual final, coherente e implementable.

Esta versión se llama Patio v03.

CONTEXTO Y FUENTES

Trabajas con tres fuentes distintas:

1. Patio Vivo: la app móvil React Native/Expo que ya funciona. Es la verdad de
   navegación, tareas, estados, datos e integraciones.
2. Figma Make v01: primera propuesta amplia. Contiene sistema visual, pantallas
   Foodie y negocio, light/dark, motion, momentos de marca, widgets y botánica.
3. Figma Make v02: base visual preferida. Añade un modelo MenuOfDay compartido,
   MenuCard y MenuPoster para que publicación, detalle, historial y compartir
   representen el mismo menú.

No copies ciegamente Patio Vivo: su UI es funcional pero no es la estética final.
No borres v01/v02: evalúalos y reutiliza sus mejores soluciones.
No diseñes un concepto alternativo: termina este producto.

OBJETIVO DEL PRODUCTO

Patio responde una pregunta cotidiana: qué hay hoy de comer cerca.

Tiene dos trabajos principales:

- Para quien busca comida: encontrar qué hay hoy, decidir con confianza y llegar.
- Para quien vende comida: convertir lo que ofrece hoy en un menú publicado y
  compartible con el menor esfuerzo posible.

Patio no es delivery, reservaciones, pedidos, e-commerce, red social, marketplace
de restaurantes ni catálogo de platillos con fotografía obligatoria. No inventes
carrito, checkout, entrega, reservación, chat, feed o fichas individuales de
platillos.

PRINCIPIO DE EXPERIENCIA

Una intención principal por superficie:

- Entrada: comenzar.
- Mapa: descubrir.
- Detalle: decidir.
- Editor: crear o corregir el menú.
- Preview: revisar y compartir.
- Cuenta/perfil: ajustar.

Usa progressive disclosure. No muestres inventario, controles o decisiones antes
de que hagan falta. Todo empty state o error debe ofrecer una recuperación clara.

MARCA Y COPY — NO NEGOCIABLE

Par oficial:

¿Qué hay hoy? Saaaaaaabes.

Conserva exactamente siete letras “a” en “Saaaaaaabes.” y el punto final. Cuando
aparezcan juntas, siempre van pregunta y luego firma. No modificar, abreviar,
parafrasear ni separar arbitrariamente en el póster.

Patio escribe como un vecino con buen gusto que conoce su barrio: humano, directo,
local y sobrio. No uses copy de marketing ni frases de IA.

“Foodie” y “Fondero” son nombres técnicos internos. Nunca pueden aparecer en la
interfaz. No digas “para fonderos”, “únete como fondero”, “fonditas activas” o
“experiencia gastronómica”.

Prefiere:

- “Publica tu menú en Patio”.
- “El menú de hoy”.
- “Lo de hoy”.
- “Lugares abiertos ahora”.
- El nombre real: Doña Mago, Tacos El Güero, Fonda Lupita.

Evita: “Descubre”, “los mejores”, “delicioso”, “auténticos sabores”, “todo en un
solo lugar”, entusiasmo publicitario, explicaciones obvias y remates poéticos.

REGLAS VISUALES

Patio debe sentirse contemporáneo, premium, sereno y local. No debe parecer un
restaurante caro genérico ni una plantilla de delivery.

Paleta cerrada:

Light
- background #F8F8F5
- surface #FFFFFF
- surfaceSecondary #F6F4EE
- text #1C1C1E
- textSecondary #70757F
- accent #F2612F
- border #E9E5DD

Dark
- background #111214
- surface #1B1C20
- surfaceSecondary #24262C
- text #F5F5F0
- textSecondary #9A9CA3
- accent #FF6A3D
- border #2C2F36

No introduzcas amarillo ni otro color de acento. La botánica puede vivir como
imagen de marca; no debe convertirse en una paleta nueva para controles.

Jerarquía mediante escala, proximidad, espacio y contraste tipográfico. El naranja
se usa con intención, no en todas las acciones. Usa glass para profundidad y
orientación, no como decoración constante. Usa hairlines sutiles, esquinas continuas
y superficies implementables con React Native, Expo BlurView y Animated.

No uses efectos CSS web imposibles de traducir, hover como interacción necesaria,
gradientes genéricos, fotos stock de restaurantes o interfaces llenas de pills.

ARQUITECTURA FUNCIONAL QUE DEBES RESPETAR

Entrada
  -> Explorar comida, sin login
  -> Publicar mi menú, acceso por magic link

Persona que busca comida
  -> Explorar: mapa + búsqueda inline
  -> Buscar activa puntos y resultados en el contexto del mapa
  -> Tocar punto/fila abre resumen
  -> Ver negocio abre detalle
  -> Guardar, compartir, calificar o abrir indicaciones
  -> Guardados, vistos y cuenta son utilidades secundarias

Persona que publica
  -> Inicio operativo
  -> Crear menú
     -> Tomar foto
     -> Elegir imagen
     -> Usar menú anterior/plantilla
     -> Empezar manualmente
  -> Procesamiento de imagen
  -> Revisión editable
  -> Publicar
  -> Confirmación
  -> Preview/póster y compartir
  -> Perfil del negocio: nombre, descripción, ubicación, horario y pagos

La búsqueda vive dentro del mapa. No crees otra home o una búsqueda principal
separada. Foto, galería, anterior y manual son métodos de una sola tarea “Crear
menú”; no deben competir como cuatro productos.

ARQUITECTURA DEL MENÚ

Conserva y perfecciona el modelo MenuOfDay de v02. Un mismo objeto alimenta:

- editor/publicación;
- detalle público;
- historial;
- preview/póster;
- miniaturas.

El modelo debe soportar simultáneamente:

- precio fijo del menú del día;
- artículos extras con precio propio;
- negocios completamente a la carta;
- secciones como entrada, guisado, acompañante, bebida, postre, tacos, antojito y
  especial del día;
- vendido/agotado;
- horario de cierre;
- nombre y tipo de negocio separados.

No diseñes representaciones incompatibles del mismo menú. MenuCard y MenuPoster
deben ser renderers del mismo contenido, adaptados al contexto.

FASE 1 — PRODUCE SOLO CUATRO PANTALLAS MAESTRAS

No construyas todavía toda la app. Primero genera estas cuatro pantallas completas,
high fidelity y en un prototipo navegable. Después detente y espera aprobación.

1. ENTRADA

Trabajo: permitir empezar en menos de un segundo.

Debe incluir marca, “Explorar comida” como acción principal y “Publicar mi menú”
como entrada secundaria. No debe parecer selector técnico de roles ni incluir
controles DEV. Decide cómo usar la botánica sin bloquear la acción.

Incluye light y dark si la composición cambia materialmente.

2. EXPLORAR / MAPA

Trabajo: expresar un antojo y descubrir lugares relevantes sin perder contexto
espacial.

Diseña dentro de una misma familia estos estados:

- radar inicial/ambient state;
- búsqueda activa escribiendo “mole”;
- resultados visibles;
- lugar seleccionado con resumen compacto;
- sheet oculto y expandido;
- ubicación denegada como recuperación no bloqueante.

No abras con una lista abrumadora. No preselecciones un lugar. El mapa debe seguir
siendo la superficie principal. Los pins relevantes se encienden a partir de la
intención.

3. DETALLE DE PATIO

Trabajo: decidir si vale la pena ir hoy.

Prioriza nombre propio, abierto/cerrado, distancia, horario, menú real, precio,
formas de pago y acciones guardar/compartir/cómo llegar. Incluye menú disponible,
agotado y sin menú de hoy. La confianza operativa importa más que decoración.

No inventes reserva, pedido, delivery ni fotos obligatorias.

4. PUBLICAR / EDITAR MENÚ

Trabajo: publicar lo de hoy con mínimo esfuerzo.

Debe cubrir:

- inicio sin menú con un solo CTA “Crear menú”;
- selector de método: foto, imagen, anterior y manual;
- borrador editable con secciones;
- precio fijo y precios por artículo coexistiendo;
- cambios pendientes;
- validación antes de publicar;
- estado listo para publicar.

No rediseñes cada método como una home distinta. No pierdas densidad operativa.
Conserva el significado del bloque de precio aunque mejores su integración visual.

ENTREGABLE DE FASE 1

Entrega:

- las cuatro pantallas maestras en frames de iPhone;
- sus estados y variantes esenciales;
- navegación clicable mínima;
- componentes compartidos utilizados;
- tokens usados;
- una pequeña vista comparativa light/dark;
- lista de decisiones tomadas;
- lista de elementos rescatados de v01/v02;
- lista de contradicciones encontradas contra Patio Vivo.

No produzcas App Store shots, widgets, materiales de marketing ni veinte pantallas
adicionales en esta fase.

Al terminar la Fase 1, escribe exactamente:

“Fase 1 lista para revisión. No continuaré con las demás pantallas hasta recibir
aprobación de estas cuatro maestras.”

CRITERIOS DE APROBACIÓN DE FASE 1

Cada pantalla debe:

- tener una intención entendible en un segundo;
- sentirse parte del mismo producto;
- usar contenido realista mexicano, no lorem ipsum;
- ser implementable en React Native/Expo;
- conservar todas las acciones funcionales existentes;
- cubrir los estados importantes sin crear pantallas innecesarias;
- respetar la identidad verbal;
- no parecer una app genérica de delivery.

FASE 2 — SOLO DESPUÉS DE APROBACIÓN EXPLÍCITA

Cuando recibas la frase “Maestras aprobadas, continúa con Fase 2”, deriva el resto
del sistema sin cambiar el ADN aprobado:

Entrada y sistema
- Splash/launch moment.
- Onboarding de primera vez.
- Solicitud contextual de notificaciones.
- Acceso por magic link.
- Callback: cargando, éxito, expirado y error.
- Sin conexión.

Comida
- Guardados: vacío, contenido y organización simple útil.
- Vistos recientemente.
- Cuenta y ajustes.
- Reseña de 5 estrellas con razones estructuradas para menos de 5.
- Manifiesto.

Publicación
- Captura/galería.
- Procesamiento progresivo de IA.
- Revisión de lectura imperfecta.
- Historial vacío y con contenido.
- Renombrar y reutilizar menú anterior.
- Publicación exitosa.
- Preview/póster.
- Compartir.
- Perfil del negocio.
- Editar negocio: ubicación, horario semanal y pagos.

Estados transversales
- loading, skeleton, empty, error, offline, permiso denegado, contenido parcial,
  agotado, cambios sin guardar, éxito y dark mode.

NAVEGACIÓN FINAL

Navegación de comida:
- Explorar
- Guardados
- Cuenta

Navegación de publicación:
- Publicar
- Historial
- Mi Patio

Los nombres técnicos “Foodie” y “Fondero” no aparecen.

DEFINICIÓN DE TERMINADO DE v03

v03 está terminada cuando:

- todas las rutas reales tienen representación;
- todos los estados críticos están diseñados;
- existe un sistema reutilizable, no pantallas aisladas;
- light/dark son coherentes;
- el mismo menú atraviesa publicación, historial, detalle y póster;
- la navegación completa puede recorrerse en prototipo;
- no quedan copies prohibidos;
- cada pantalla tiene una acción principal clara;
- no hay funciones inventadas fuera del MVP;
- el resultado puede implementarse sin reinterpretación visual importante.

FORMA DE TRABAJO

Antes de modificar, audita los archivos proporcionados y describe brevemente:

1. Qué conservarás de v02.
2. Qué recuperarás de v01.
3. Qué corregirás al contrastar con Patio Vivo.
4. Qué componentes compartirán las cuatro maestras.
5. Qué no diseñarás todavía.

Después ejecuta la Fase 1. No pidas decisiones menores de estilo: resuélvelas con
este contrato. Solo pregunta si encuentras una contradicción que altere una tarea
principal o requiera inventar funcionalidad.
```
