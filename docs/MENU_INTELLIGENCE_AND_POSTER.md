# Patio — inteligencia de menú y sistema de póster

> Decisión de producto y arquitectura · 2026-07-24.
> Fuente de verdad para la tríada perfil público, menú vigente y póster.

## 1. El núcleo

Patio se construye alrededor de un solo objeto de producto:

```txt
perfil público estable
→ menú vigente estructurado
→ póster canónico dentro de Patio
→ compartir abre ese mismo menú, sin crear otra pieza
→ seguir, guardar, reseñar o pedir cómo llegar
→ la siguiente publicación reactiva la relación
```

El perfil es la identidad. El menú es el contenido vivo. El póster es su expresión
publicada dentro de Patio. Los tres leen la misma fuente de datos y forman un solo
bucle.

Un menú publicado debe poder consumirse de tres maneras sin volver a capturarlo:

1. dentro del perfil público, con lectura cómoda e interacción;
2. como póster canónico compartible mediante enlace;
3. como datos estructurados para búsqueda, medición y recomendaciones futuras.

## 2. Auditoría del producto actual

### Lo que ya sirve

- `app/patio/[id].tsx` ya contiene la base de una ficha pública: identidad,
  estado, menú agrupado, ubicación, pagos, guardar, compartir y cómo llegar.
- `app/preview.tsx` ya convierte el menú en una imagen y la comparte.
- `supabase/functions/read-menu/index.ts` ya usa un modelo multimodal para leer
  una foto.
- `app/menu-editar.tsx` y sus controllers ya permiten corregir antes de publicar.
- `menus` y `cartas` ya conectan la publicación con la experiencia pública.

### Deudas que impiden prometer precisión

1. El prompt actual dice que los precios propios de platillos van dentro de la
   descripción, mientras el contrato JSON y la interfaz esperan `platillo.precio`.
   Es una contradicción directa entre instrucción y modelo de datos.
2. La salida se obtiene limpiando texto y ejecutando `JSON.parse`; todavía no usa
   una salida restringida por esquema.
3. Solo existen secciones y platillos. No hay tipos para ingrediente, opción,
   variante, complemento, nota, encabezado o precio.
4. No existen confianza, evidencia de origen ni coordenadas de la foto.
5. Las correcciones hechas por una persona no se registran como diferencias
   utilizables para evaluar o mejorar el sistema.
6. La ficha pública elimina la descripción de los platillos al convertir el menú
   a secciones.
7. El póster usa un solo ancho y una sola composición. Un menú largo termina como
   una pieza muy alta o con demasiada densidad.
8. La migración normalizada `menu_sections/menu_items` y la persistencia vigente
   en JSONB todavía representan dos modelos de datos que no se han reconciliado.

## 3. Lo que la IA debe devolver

La lectura de una foto necesita una ontología explícita. Cada fragmento detectado
debe tener al menos:

```ts
type MenuEntityType =
  | "section_heading"
  | "dish"
  | "ingredient"
  | "option"
  | "variant"
  | "add_on"
  | "price"
  | "description"
  | "note";

type MenuEntity = {
  id: string;
  type: MenuEntityType;
  rawText: string;
  normalizedText: string;
  sectionId?: string;
  parentId?: string;
  price?: number;
  currency?: "MXN";
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  needsReview: boolean;
  reviewReason?: string;
};
```

Las relaciones son tan importantes como los tipos:

- una descripción pertenece a un platillo;
- un ingrediente pertenece a una descripción o platillo;
- una variante u opción pertenece a un platillo;
- un precio puede pertenecer a un platillo, variante, complemento o sección;
- una nota puede afectar a una sección o al menú completo.

El modelo final que consume la app se deriva de estas entidades después de
validarlas. La foto, el texto original y las entidades permanecen como evidencia;
el menú publicado es una versión aprobada.

## 4. Pipeline de precisión

```txt
foto
→ orientar, recortar y normalizar
→ extracción multimodal con JSON Schema
→ entidades + relaciones + confianza + evidencia
→ validadores determinísticos
→ revisión enfocada solo en dudas
→ versión aprobada
→ perfil + póster + búsqueda
→ registro de correcciones
```

### Validadores determinísticos

La IA no debe resolver tareas que el código puede comprobar con mayor certeza:

- formato y rango de precios;
- secciones vacías;
- duplicados;
- nombre vacío o excesivamente largo;
- precio sin entidad asociada;
- ingrediente aislado marcado como platillo;
- variante sin platillo padre;
- moneda inconsistente;
- relación improbable entre texto y coordenadas;
- texto perdido respecto a la foto original.

La confianza declarada por el modelo es una señal inicial, no una probabilidad
garantizada. Patio la calibra contra el conjunto de evaluación y combina modelo,
validadores y tipo de error para decidir qué necesita revisión.

### Revisión humana

Patio nunca publica automáticamente un resultado incierto. La interfaz resalta
únicamente los elementos con baja confianza o una validación fallida y permite:

- confirmar;
- cambiar el tipo;
- asociar precio o descripción;
- mover de sección;
- unir o separar elementos;
- marcar texto como irrelevante.

La promesa correcta es **alta precisión con una revisión muy rápida**, no cero
errores.

## 5. Cómo mejora de verdad

El uso por sí solo no entrena al modelo. Patio debe guardar explícitamente, con
controles de privacidad:

- imagen o huella de la imagen;
- versión de modelo y prompt;
- respuesta original;
- resultado normalizado;
- edición aprobada;
- diferencia entre ambos;
- tipo de error;
- tiempo de revisión.

Ese registro crea un conjunto de evaluación. Antes de cada cambio de prompt o
modelo se ejecutan los mismos casos y se miden:

- precisión de platillo vs. ingrediente;
- asociación correcta de precios;
- recuperación de secciones;
- pérdida de texto;
- tasa de elementos que requieren revisión;
- tiempo mediano hasta publicar.

### Orden de mejora

1. corregir contrato y prompt;
2. usar salida estructurada;
3. añadir ontología, relaciones, confianza y validadores;
4. capturar correcciones;
5. formar un conjunto de evaluación representativo;
6. recuperar ejemplos similares ya corregidos;
7. considerar fine-tuning únicamente si quedan errores repetidos y estables.

Entrenar un modelo propio desde el inicio agrega costo y opacidad sin resolver un
contrato contradictorio. El fine-tuning se justifica cuando existe un volumen
significativo de ejemplos limpios y una falla que no mejora con esquema, contexto,
validadores o recuperación.

## 6. Qué hace el espacio vectorial

Los vectores representan cercanía semántica. En Patio sirven para:

- buscar “algo caldoso” y encontrar pozole o caldo de res;
- relacionar sinónimos y variaciones regionales;
- encontrar menús corregidos parecidos para ayudar a interpretar uno nuevo;
- crear recomendaciones conforme aparecen suficientes señales de consumo;
- agrupar negocios, platillos e intereses sin depender de palabras exactas.

Los vectores no son la fuente de verdad del menú y no deciden por sí solos si un
texto es ingrediente o platillo. Esa decisión nace de extracción estructurada,
contexto visual, reglas y confirmación.

La búsqueda futura debe ser híbrida:

```txt
filtros exactos        fecha, abierto, distancia, precio, disponibilidad
+ búsqueda textual     nombre exacto, frase o ingrediente
+ similitud vectorial  intención, sinónimos, antojo y ejemplos parecidos
+ ranking              vigencia, cercanía, calidad y relación previa
```

## 7. Sistema de póster

El póster es la vista canónica del menú publicado dentro de Patio. No existe una
familia de formatos por canal. Cada publicación incluye:

- identidad del negocio;
- fecha o señal de vigencia;
- secciones, platillos, descripciones y precios legibles;
- enlace compartible a ese menú dentro del perfil;
- atribución para medir apertura, seguimiento y cómo llegar.

### Motor de composición

La identidad visual es única. La composición interna responde a cantidad de
secciones, elementos y longitud de texto sin convertirse en plantillas distintas:

- menú corto: una pieza con más aire;
- menú medio: densidad intermedia;
- menú largo: vista desplazable dentro de Patio;
- texto extenso: jerarquía y expansión progresiva.

Nunca se reduce la tipografía hasta volverla ilegible para hacer caber todo. El
menú publicado conserva jerarquía, identidad y contexto.

Imprimir, exportar a tamaños especiales o crear materiales físicos queda fuera del
MVP. Solo se reconsidera como función Pro si existe demanda observada; no es una
apuesta actual.

### Interacción medible

```txt
generar póster
→ compartir enlace
→ abrir el menú publicado
→ abrir perfil
→ ver menú
→ seguir / guardar / reseñar / cómo llegar
→ atribuir resultado al canal y a la pieza
```

### Recompensa por publicar

Publicar debe producir una recompensa inmediata, visible y verdadera:

1. transición breve de borrador a “Menú vivo”;
2. aparición inmediata dentro del perfil;
3. póster canónico listo para abrir o compartir;
4. primera señal real de distribución: enlace abierto, seguimiento, guardado o
   cómo llegar;
5. al regresar, comparación simple contra la publicación anterior.

La recompensa empieza siendo funcional y luego social. Patio no inventa vistas,
puntos, rachas ni urgencia. Los avisos son transitorios; después de aprender el
flujo, la aplicación vuelve a quedar limpia y lista para trabajar.

La progresión se revela por uso:

- primera publicación: enseñar el resultado y la siguiente acción;
- publicaciones recurrentes: ahorrar pasos mediante reutilización;
- cuando existe audiencia: mostrar respuesta agregada;
- cuando existe suficiente historial: ofrecer estadísticas y automatización.

## 8. Secuencia de implementación

### Bloque 1 — verdad del menú

1. corregir el contrato de precio;
2. definir esquema de entidades y relaciones;
3. activar salida estructurada;
4. incorporar confianza, validadores y revisión dirigida;
5. conservar descripciones en la ficha pública;
6. registrar correcciones y eventos.

### Bloque 2 — menú vivo

1. unificar menú diario y estable como versiones de un menú vigente;
2. mostrar vigencia, descripciones, variantes y precios completos;
3. permitir que el negocio decida qué versiones quedan visibles;
4. añadir enlace estable por menú dentro del perfil.

### Bloque 3 — póster como distribución

1. consolidar una sola vista canónica;
2. resolver menús cortos, medios y largos dentro de esa vista;
3. compartir el enlace al menú publicado;
4. integrar deep link y atribución;
5. medir publicación → apertura → interacción.

### Bloque 4 — aprendizaje y descubrimiento

1. conjunto de evaluación;
2. búsqueda híbrida;
3. recuperación de casos corregidos similares;
4. recomendaciones cuando exista densidad real;
5. fine-tuning solo si los datos justifican su costo.

## 9. Criterios de salida

- 100% de respuestas cumplen el esquema técnico.
- 0 publicaciones automáticas con dudas sin revisar.
- asociación de platillo/precio y platillo/descripción medida sobre un conjunto
  real, no por impresión.
- tiempo mediano foto → publicación inferior a dos minutos en la cohorte inicial.
- póster legible con menús cortos y largos, sin tipografía microscópica.
- cada enlace compartido abre el perfil y conserva atribución.
- perfil, póster y búsqueda leen exactamente la misma versión aprobada.

## 10. Referencias técnicas

- Anthropic, [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- Anthropic, [Vision](https://platform.claude.com/docs/en/build-with-claude/vision).
- Supabase, [Semantic search](https://supabase.com/docs/guides/ai/semantic-search).
- Supabase, [Automatic embeddings](https://supabase.com/docs/guides/ai/automatic-embeddings).
