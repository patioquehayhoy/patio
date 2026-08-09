# Arquitectura de descubrimiento y búsqueda

## Vocabulario

- **Arquitectura:** qué fuentes, estados y etapas componen el sistema.
- **Algoritmo de ranking:** cómo se ordenan candidatos ya encontrados.
- **Método de producto:** reglas de interacción y feedback para que la búsqueda
  sea comprensible.
- **Casos de uso:** situaciones reales que el sistema debe resolver.

Patio necesita los cuatro; “algoritmo” por sí solo no describe la experiencia.

## Flujo

```txt
intención escrita
→ normalización semántica
→ recuperación de candidatos
→ restricciones duras
→ ranking
→ facetas opcionales
→ resultados explicables sobre el mapa
```

### 1. Intención

El foco vacío no es una búsqueda y no muestra una lista. El campo vacío conserva
el mapa como contexto. Al escribir, la búsqueda comienza mientras se teclea.

### 2. Recuperación

Buscar sobre:

- nombre y variantes del platillo;
- descripción canónica;
- sección del menú;
- giro del negocio;
- menú de hoy antes que carta permanente;
- futuros embeddings para frases como “algo tipo focaccia”.

### 3. Restricciones duras

Primero se excluye lo que no puede servir:

- sin coordenadas válidas;
- fuera del área relevante elegida;
- agotado, cuando la intención exige disponibilidad;
- filtros explícitos del usuario.

### 4. Ranking inicial

```txt
relevancia en niveles
→ distancia al centro visible del mapa
→ coincidencia exacta
→ disponibilidad de hoy
→ apertura actual
→ calidad/confianza
→ precio compatible
```

Patio ya aplica relevancia por niveles y usa la distancia al centro actual del
mapa para desempatar resultados equivalentes. La ubicación del dispositivo puede
reemplazar ese origen cuando exista consentimiento.

### 5. Filtros

No anticipar docenas de filtros. Mostrar facetas después de una consulta o cuando
la colección guardada sea suficientemente grande:

- Abierto ahora.
- Distancia.
- Precio.
- Giro: fondita, tacos, postres, bar, etc.
- Con menú hoy.

En Guardados sí tienen sentido orden y filtros de colección:

- Recientes.
- Cerca.
- Con menú hoy.
- Giro.
- Visitados/favoritos frecuentes.

## Casos de uso canónicos

- “mole”: coincidencia de platillo, cercanía en mapa.
- “bares”: filtro de giro, después distancia/apertura.
- “algo como focaccia cerca de Metro Xola”: agente semántico + restricción
  geográfica + ranking.
- “de mis guardados, qué publicó hoy”: alcance Guardados + disponibilidad.
- “barato y abierto”: restricciones precio/horario antes del ranking.

Cada nuevo caso se traduce en intención, restricciones, ranking y explicación;
no en una pantalla especial independiente.

## Patio Pro — búsqueda acompañada por IA

La búsqueda gratuita sigue siendo directa: nombre, platillo, descripción y
categoría. Pro acepta lenguaje natural y voz, por ejemplo:

> Hoy se me antoja algo caldoso, con buen sazón mexicano y que esté abierto.

La IA no responde con una lista inventada. Produce una intención estructurada:

```txt
textura = caldoso
cocina = mexicana
tiempo = hoy / abierto ahora
preferencia = reputación de sabor
ubicación = mapa o posición consentida
```

Después expande vocabulario culinario (`pozole`, `birria`, `consomé`, `caldo
tlalpeño`), recupera candidatos y aplica restricciones reales. Cada resultado
debe explicar su encaje con evidencia breve: `Pozole publicado hoy`, `4.7 (52)`
y `Abierto hasta las 17:00`.

### Fuentes y límites

Orden de autoridad:

1. Menú y horario publicados en Patio: disponibilidad operativa.
2. Perfil, carta y datos estructurados del negocio.
3. Reseñas de Patio: reputación y lenguaje comunitario, con volumen visible.
4. Fuentes externas permitidas: enriquecimiento culinario y contexto, nunca para
   afirmar que hoy existe un platillo que el negocio no publicó.

No conviene buscar toda internet en vivo para cada consulta: añade latencia,
costo, duplicados, datos viejos y problemas de atribución. Patio debe mantener
un índice enriquecido y usar consulta externa únicamente cuando falte contexto,
mostrando fuente y fecha. Internet amplía significado; Patio confirma existencia.

### Acompañamiento, no chat infinito

- Si hay resultados claros: mostrar tres opciones explicadas sobre el mapa.
- Si falta una restricción decisiva: hacer una sola pregunta, por ejemplo
  `¿Hasta cuánto quieres gastar?`.
- Si no hay coincidencia exacta: explicar qué condición se relajó.
- Conservar la consulta como contexto durante la sesión, no abrir una conversación
  separada de la experiencia de mapa.
- Aprender de aperturas, guardados, rutas y visitas confirmadas; no interpretar
  una impresión o un scroll como gusto definitivo.

### Separación comercial

- Foodie Pro: lenguaje natural, voz, preferencias persistentes, explicaciones y
  alertas por intención.
- Fondero Pro: verificación del negocio, analítica y automatización.
- Un Fondero no compra posición orgánica. Pro y verificación no alteran por sí
  mismos relevancia, calificación ni reputación.

## Referencia Airbnb Summer Release 2026

Airbnb integra IA dentro de objetos conocidos en vez de convertir la aplicación
completa en chat. Patio adopta el mismo principio en cuatro superficies:

1. **Buscar:** la frase natural produce resultados reales como tarjetas sobre el
   mapa, con acciones directas para abrir, guardar o llegar.
2. **Reseñas:** un resumen agrupa señales repetidas (`sazón`, `porción`, `tiempo
   de espera`) y siempre conserva conteos y acceso a las reseñas originales.
3. **Comparar guardados:** una vista contrasta 2–4 Patios con menú de hoy,
   distancia, horario, precio observado y reputación; la IA explica diferencias,
   no elige silenciosamente por la persona.
4. **Acompañamiento contextual:** las preguntas y acciones aparecen dentro de
   Buscar, Guardados o la ficha. No existe una pestaña de chatbot aislada.

Regla trasladada de Airbnb: la IA sintetiza y ayuda a actuar sobre el inventario
del producto. En Patio, mapa, menús, perfiles y reseñas siguen siendo la fuente y
la interfaz principal.

## Tipos de presencia y ubicación

Patio no debe representar toda oferta mediante una dirección puntual. El alta y
el mapa distinguirán al menos tres presencias:

1. **Lugar fijo:** exige una ubicación pública verificable y puede mostrarse con
   pin exacto.
2. **Sólo entrega / cocina privada:** no exige publicar el domicilio operativo.
   Sí exige una zona de servicio verificable, horarios y forma de entrega. El
   mapa representa cobertura o zona aproximada, nunca una coordenada privada
   disfrazada de local abierto al público.
3. **Tianguis:** entidad contenedora con nombre, perímetro/punto de acceso,
   calendario y horario. Los puestos de comida son unidades hijas con posición
   relativa, oferta y disponibilidad dentro del tianguis.

En vista metropolitana, un tianguis se presenta como conglomerado único con
conteo. Al acercarse o abrirlo revela sus puestos. Los clusters por densidad y
los tianguis comparten representación agregada, pero no significado: el cluster
es una optimización visual calculada; el tianguis es una entidad real y estable.

Pendiente de implementación: campos `presence_type`, `service_area`,
`market_id`, geometría/perímetro, calendario y políticas RLS; flujo de alta por
tipo; representación de zona y cluster; verificación que no exponga domicilios
privados. Estas presencias no reciben símbolos especiales en el mapa actual:
primero debe resolverse el sistema completo de jerarquía, zoom y operación para
400–20,000 lugares. Hasta entonces, Patio conserva una sola gramática visual de
lugares y no mezcla excepciones con categorías culinarias.
