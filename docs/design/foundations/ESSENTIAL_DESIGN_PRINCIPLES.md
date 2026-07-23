# Essential Design Principles — Biblia de diseño de Patio

> Fuente: WWDC17 Session 802 — Mike Stern, Apple Design Evangelism
> Este documento es **ley de diseño** para Patio. Antes de cualquier decisión de UX/UI,
> consultarlo. Aplica en conjunto con `DESIGN_SYSTEM.md`, `PATIO_DESIGN_PRINCIPLES.md`
> e `IDENTITY_AND_TYPE.md`.

> ⚠️ **Importante para exploración de diseño:** los principios aquí son **generales y duraderos**.
> Las secciones "Pregunta al dominio Patio" son **preguntas** que se le hacen al diseño,
> no recetas que validen la implementación actual de la app. Cuando se trabaje con Claude Design
> u otra exploración, la app vigente NO es la referencia — solo los principios y el dominio
> (Foodie / Fondero / fondita / menú / "Saaaaaaabes." / lo cotidiano elevado).
> Los detalles de implementación (radios, blur, pesos, paleta) viven en `DESIGN_SYSTEM.md`
> y pueden cambiar; estos principios no.

**Fuentes primarias verificadas:** [transcripción y video completos de WWDC17
Session 802](https://developer.apple.com/videos/play/wwdc2017/802/),
[HIG · Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles),
[HIG · Layout](https://developer.apple.com/design/human-interface-guidelines/layout) y
[HIG · Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers).
Este texto separa deliberadamente tres cosas que antes se mezclaban: lo que Stern
explica en la charla, la guía vigente de plataforma y la decisión particular de Patio.

---

## 1. Premisa — Humano, no Usuario

No diseñamos para "usuarios" — diseñamos para **humanos**. Y los humanos siempre necesitan:

1. **Sentirse seguros** (feel safe)
2. **Entender** (understand)
3. **Lograr** (achieve)
4. **Experimentar belleza** (experience beauty)

Las apps deben ofrecer:
- **Predictibilidad y estabilidad**
- **Información clara y útil**
- **Flujos simples y sin fricción**
- **Una experiencia deliciosa**

> Diseñar es un acto de **humanidad** — no de usabilidad técnica.

---

## 2. Filosofía base

- **Why, not How** — los principios explican *por qué* algo funciona, no recetas.
- **Profound simplicity** — la simpleza real es resultado de decisiones difíciles, no de quitar features al azar.

---

## 3. Los 12 principios

> Cada principio trae tres capas: la idea, **el mecanismo real** (cómo lo explicó Mike Stern
> en la charla, parafraseado — no la app actual) y la pregunta de dominio para Patio.

### 3.1 Wayfinding (Orientación)
Toda pantalla debe responder cinco preguntas:
- **¿Dónde estoy?** (título, breadcrumb, contexto visual)
- **¿A dónde puedo ir?** (acciones disponibles, navegación)
- **¿Qué voy a encontrar al llegar?** (preview, labels descriptivos)
- **¿Qué hay cerca?** (relacionados, sugerencias)
- **¿Cómo salgo?** (botón de cierre, back, exit claro)

**Mecanismo real:** el ejemplo es un aeropuerto — el nivel de detalle del letrero aumenta
según te acercas (letrero general de terminales → letrero de aerolínea → letrero de rango
de gates → letrero del gate exacto). Nunca se salta un nivel ni se da todo el detalle de
golpe. La navegación de una app (nav bar, tab bar, contenido) no es decoración: **es**
el sistema de wayfinding.

**Pregunta al dominio Patio:** cuando un Foodie está viendo una fondita, ¿la pantalla responde claramente dónde está, qué va a encontrar, qué hay cerca y cómo regresar? Cuando un Fondero está en mitad de capturar su menú, ¿sabe en qué paso va? ¿El nivel de detalle sube gradual (mapa → ficha → menú), o salta de golpe? (La respuesta NO debe asumir la implementación actual — puede ser otra solución radicalmente distinta).

### 3.2 Feedback
El sistema debe contestar:
- **¿Qué puedo hacer?** (affordances visibles)
- **¿Qué acaba de pasar?** (confirmación de acción)
- **¿Qué está pasando?** (loading, progreso)
- **¿Qué va a pasar?** (preview, advertencia)

Tipos: **Status, Completion, Warning, Errors.**

Regla de oro: *"What would you say? Then say it!"* — si dirías algo a un amigo en esa situación, decirlo en la UI con el mismo tono.

**Mecanismo real:** el tablero de un coche separa los cuatro tipos con claridad. Status
es lo que siempre está a la vista sin que nadie lo pida (velocidad, gasolina). Completion
es la confirmación sensorial de que algo terminó (el sonido del seguro al cerrar, la
vibración al cambiar de velocidad) — no hace falta texto si el gesto ya se siente completo.
Warning avisa ANTES de que sea grave (gasolina baja, no gasolina en cero). Y el mejor error
es el que nunca se muestra: el ejemplo citado es una app de calendario que corrige sola
"31 de junio" a "1 de julio" en vez de bloquear con un mensaje de error — prevenir vale
más que anunciar la falla.

**Pregunta al dominio Patio:** el lenguaje de feedback de Patio debe sonar humano y local — no técnico. Si la fondita acaba de publicar su menú, ¿qué le diría una persona real en ese momento? Esa es la frase que va en pantalla. Antes de mostrar un error, ¿se pudo prevenir corrigiendo solo (como la fecha del calendario)? Aplica igual para advertencias: humanas antes que sistémicas.

### 3.3 Visibility (Visibilidad)
- **Mejora la usabilidad** — lo visible es más usable que lo oculto.
- **Tiene límites** — demasiada visibilidad satura.

**Mecanismo real:** es un costo-beneficio explícito, no una preferencia estética. Esconder
los badges de no-leídos en Mail "reduciría el desorden visual" pero también la usabilidad
de forma directa — la gente pierde la señal que vino a buscar. Enterrar la navegación de
una app de reloj en un menú hamburguesa hace más difícil saber qué más ofrece la app. La
regla no es "menos es más" a ciegas: es visible lo que la persona necesita decidir algo,
oculto lo que no.

**Pregunta al dominio Patio:** ¿la acción más importante de esta pantalla (para el rol que la está usando) se nota al primer vistazo? Para el Fondero la acción cambia según el paso del flujo; para el Foodie suele ser "saber qué hay hoy cerca". ¿Esconder algo en un menú de "···" le cuesta a la persona una señal que realmente necesitaba ver? No asumir que la solución actual está bien — replantearla.

### 3.4 Consistency (Consistencia)
- **Mejora usabilidad** — patrones repetidos reducen carga cognitiva.
- **Inconsistencia mata usabilidad.**
- **Interna** (dentro de tu app) y **externa** (con la plataforma — HIG).
- **Provee cohesión** — la marca se siente coherente.

**Mecanismo real:** el ejemplo es el ícono de compartir en iOS (flecha saliendo de una
caja, apodado "sharrow" en la charla). Algunas apps usan otro ícono "para ser consistentes
con su propio sitio web" — decisión razonable en apariencia, pero incorrecta: la
consistencia externa gana. Lo que importa es qué símbolo reconoce la persona en la
plataforma donde está, no la identidad visual propia de la marca. Consistencia interna es
que los glifos, pesos y tamaños de texto de tu app compartan un mismo lenguaje: cuando todo
encaja, la gente asume (aunque no lo piense conscientemente) que el producto fue cuidado
con intención.

**Pregunta al dominio Patio:** las decisiones concretas (radios, blur, pesos tipográficos) viven en `DESIGN_SYSTEM.md` y pueden evolucionar. La regla aquí es: **una vez decidido un patrón, respetarlo en todas las pantallas** — y romperlo solo con justificación documentada. Para íconos y controles de sistema (compartir, cerrar, ubicación), ¿Patio usa el símbolo que la persona ya reconoce de iOS, o uno propio "de marca" que rompe consistencia externa sin necesidad?

### 3.5 Mental Model vs Interaction Model
Tres modelos:
- **System Model** — cómo funciona el sistema por dentro (ej. agua caliente entra por la izquierda).
- **Mental Model** — cómo cree el usuario que funciona.
- **Interaction Model** — cómo lo expones en la interfaz.

**El Interaction Model debe alinearse al Mental Model, NO al System Model.**

**Mecanismo real:** la historia del "grifo de Mortimer" — un diseñador rediseña el grifo
para que una palanca controle temperatura y otra controle flujo (más "eficiente" desde el
sistema interno, que solo mezcla dos válvulas). El resultado es un grifo que la gente no
sabe usar: espera que una palanca sea agua caliente y otra agua fría, y cuando el sistema
no coincide con ese modelo mental preexistente, lo vive como roto aunque funcione
perfecto por dentro. La conclusión explícita: cambiar el modelo mental de algo que la
gente ya conoce es una apuesta de alto riesgo — solo se justifica con evidencia clara de
que la mejora es real, no solo "más limpia" desde la arquitectura.

**Pregunta al dominio Patio:** ¿qué palabras y secuencia de acciones usaría el Fondero / Foodie real al explicarle a un amigo lo que va a hacer? Esa es la base del Interaction Model. Las estructuras técnicas (tablas, objetos, estados) jamás deben filtrarse a la UI ni al copy. Antes de cambiar un flujo que la gente ya aprendió a usar (ej. cómo se publica un menú), ¿hay evidencia real de que la mejora vale el riesgo de romper su modelo mental?

### 3.6 Proximity (Proximidad)
Cosas relacionadas se ven cerca. Cosas no relacionadas, separadas.

**Mecanismo real:** el switch de luz del baño está en el baño, el del pasillo en el
pasillo — nadie lo piensa dos veces porque la cercanía física ya comunica la relación.
Entre más cerca esté un control de lo que afecta, más se asume la conexión sin necesidad
de explicarla.

**Pregunta al dominio Patio:** ¿qué información pertenece a la misma "unidad semántica" para el rol que lee la pantalla? (Ejemplo: el nombre de un platillo, su descripción y su precio son una unidad — deben sentirse así visualmente, sin importar cómo se implemente).

### 3.7 Grouping (Agrupación)
Agrupar es dar estructura haciendo que elementos relacionados se perciban como una
unidad y que los no relacionados se perciban aparte. **Una card es solo una técnica
posible**, no la definición del principio. Espacio, alineación, repetición, separadores,
un encabezado común o un contenedor pueden agrupar; sumar cajas sin necesidad puede
crear más ruido que estructura.

**Mecanismo real:** en herramientas de creación como Keynote o Sketch, las herramientas de
crear objetos viven pegadas al lienzo (porque ahí es donde el objeto va a aparecer), y los
controles relacionados (transformar, ordenar capas) se agrupan entre sí aunque estén lejos
de otros grupos. La agrupación no es solo estética — le dice a la persona qué controles
pertenecen al mismo trabajo.

**Pregunta al dominio Patio:** ¿qué jerarquía de agrupación tiene sentido para el dominio? Platillo dentro de sección, sección dentro de menú, menú dentro de fondita. La forma visual de comunicar esa jerarquía es decisión de diseño abierta — no fijar el método aquí.

**Prueba operativa:** tapa títulos y bordes. ¿Todavía se entiende qué elementos hacen
el mismo trabajo? Después tapa el espacio. ¿La jerarquía sobrevive con alineación y
repetición? Si solo se entiende gracias a muchas cajas, la agrupación es débil.

### 3.8 Mapping (Mapeo)
Los controles deben reflejar intuitivamente la propiedad, dirección o disposición que
modifican. Una persiana que sube y baja se entiende mejor con un control vertical; tres
interruptores se recuerdan mejor si su orden reproduce el de las tres luces.

> **Corrección de fuente:** Mortimer pertenece al principio de *mental model*, no al
> ejemplo de mapping. Stern explica mapping con una persiana cuyo control refleja el
> movimiento arriba/abajo y con interruptores cuyo orden refleja la posición de las
> luces. No volver a usar el grifo como evidencia de mapping.

**Mecanismo real:** una cortina que sube y baja se controla mejor con algo que también
"sube y baja" — no hay ambigüedad. Switches de luz acomodados en el mismo layout físico
que las luces que controlan (izquierda-centro-derecha = luz izquierda-centro-derecha) se
memorizan solos. La señal de alarma explícita: **si un control necesita una etiqueta de
texto para explicarse, el mapping ya falló** — la etiqueta es un parche, leer toma tiempo y
no ayuda a memorizar la ubicación. La mejor manipulación siempre es la más directa
(arrastrar con el dedo/puntero el objeto mismo, no un proxy abstracto).

**Pregunta al dominio Patio:** ¿el símbolo, gesto o ubicación de un control coincide con lo que el rol espera que haga? Si un control de Patio necesita texto explicativo para entenderse, ¿el problema real es de copy o de mapping? Si dudas, valida con una persona real fuera del equipo — no con tu memoria de la app actual.

### 3.9 Affordance (Afordancia)
**Real affordance:** lo que el objeto permite físicamente (un plato sostiene comida).
**Perceived affordance:** lo que el usuario percibe que puede hacer.

**La diseñada en software es siempre percibida.** Un botón debe verse tappeable. Un slider debe verse arrastrable.

**Mecanismo real:** la afordancia no es una propiedad fija del objeto — depende de quién lo
mira (un frisbee te afforda lanzar Y atrapar; a un perro, solo atrapar). En software, señales
muy sutiles ya bastan: una sombra ligera bajo el knob de un slider lo separa visualmente del
riel y sugiere que se puede arrastrar, sin necesidad de instrucciones. Una esquina redondeada
en un botón ya crea suficiente conexión visual con la idea de "esto se toca". La animación
también comunica afordancia: al abrir una pantalla, un contenido que rebota levemente hacia
arriba sugiere "esto se puede deslizar" antes de que la persona lo intente.

**Pregunta al dominio Patio:** ¿el elemento se ve como lo que es? Lo tappeable debe verse tappeable; lo de solo lectura debe verse pasivo. ¿Hay una señal visual sutil (sombra, forma, micro-movimiento) que ya comunique la interacción sin texto? La forma exacta de comunicar esa afordancia es decisión de diseño abierta.

### 3.10 Progressive Disclosure (Revelación progresiva)
Mostrar lo simple primero, revelar lo complejo conforme se necesita.
- Reduce clutter.
- Simplifica decisión.
- Permite que principiantes Y expertos coexistan.

**Mecanismo real:** el ejemplo es un mesero tomando una orden de hamburguesa — no pregunta
término de cocción, tipo de queso, extras y guarnición todo de golpe; pregunta un paso a
la vez, y cada respuesta puede eliminar preguntas futuras (si no pediste papas, nunca te
preguntan qué tipo de papa). Pedir todo de una vez sería agobiante; pedirlo paso a paso, con
cada decisión reduciendo las siguientes, se siente fácil. Este es exactamente el patrón que
ya usa el alta de negocio de Patio (nombre → ubicación → horario → pagos).

**Pregunta al dominio Patio:** ¿qué es lo mínimo que el rol necesita ver/decidir para avanzar? Eso se muestra primero. El resto aparece bajo demanda. ¿Una respuesta temprana en el flujo ya vuelve irrelevantes preguntas posteriores — y si es así, se están saltando? La división simple/avanzado se diseña fresco, no se hereda del flujo actual.

### 3.11 80/20 Rule (Pareto)
El 80% del beneficio viene del 20% de las acciones. Optimizar lo importante, no lo raro.

**Mecanismo real:** el diálogo de imprimir de macOS es el ejemplo citado — la mayoría de
la gente solo necesita elegir impresora, copias y rango de páginas (mucho menos del 20% de
las opciones totales que existen), y eso cubre más del 80% de los casos reales. El resto de
las opciones queda a un clic de distancia, no eliminado. El beneficio es doble: menos
desorden visual Y menos probabilidad de que alguien cambie sin querer una opción que no
entiende.

**Pregunta al dominio Patio:** para cada rol (Foodie / Fondero), ¿cuál es el flujo que se va a repetir 80% de las veces? Ese flujo debe ser excelente y usar el mínimo de opciones visibles. Los flujos raros pueden vivir "a un toque de distancia" sin estar eliminados. Identificar el 80% es ejercicio de producto, no asumirlo de la app actual.

### 3.12 Symmetry (Simetría)
Tres tipos:
- **Reflection** (espejo) — equilibrio izquierda/derecha sobre un eje compartido.
- **Rotation** (rotación) — equilibrio radial.
- **Translation** (traslación) — repetición rítmica de elementos iguales.

La simetría comunica orden, estabilidad, belleza.

**Mecanismo real:** el dato clave: **elementos
simétricos se perciben como una sola unidad conectada aunque no estén físicamente unidos.**
Dos corchetes enfrentados `[ ]` se leen como un objeto, no como dos trazos sueltos, solo
porque comparten eje. En Weather, la reflexión aparece en el contrapeso de elementos
alrededor de una mediana. En World Clock, la traslación aparece en la cadencia estable de
ciudades y horas.

La charla **no** dice que todo deba compartir el borde izquierdo ni que dos controles
deban empujarse mecánicamente hacia extremos opuestos. Alineación y simetría cooperan,
pero no son sinónimos. Forzar reflexión en una tabla puede empeorar su lectura; ahí suele
dominar la simetría traslacional: mismas columnas, alturas, intervalos y ritmo.

**Caso Patio corregido (2026-07-20):** quitar el `marginLeft: -8` eliminó una
desalineación local, pero no resolvió el sistema. ABRE/CIERRA seguían repitiéndose dentro
de cada día y cada fila estaba compuesta como dos bloques enfrentados. El editor definitivo
usa un único encabezado `DÍA · ABRE · CIERRA` y repite exactamente esos tres ejes en cada
fila. La unidad perceptiva ahora es el horario semanal completo, no cada par aislado.

**Pregunta al dominio Patio:** ¿qué tipo de simetría corresponde al contenido: reflexión
para contrapesar, rotación para un sistema radial o traslación para listas/tablas? ¿La
repetición conserva ejes, altura y cadencia? No usar “simetría” como permiso para centrar
todo o reflejar elementos que semánticamente deben leerse en secuencia.

---

## 4. Retos al aplicar principios

1. **Pueden contradecirse entre sí** — ej. más visibilidad vs simplicidad. Se resuelve priorizando contexto.
2. **Demasiado de uno es malo** — demasiada consistencia mata creatividad; demasiada feedback satura.
3. **Su relevancia varía** — en una pantalla de loading, feedback domina. En una ficha editorial, simetría y proximidad dominan.

---

## 5. Cheat sheet para Patio (decisiones rápidas)

Antes de implementar una pantalla, pregúntate:

No aprobar por intuición con un “sí”. Para cada principio hay que identificar una señal
observable y tratar de romperla con la prueba indicada.

| Principio | Evidencia que debe existir | Falla típica | Prueba de diseño |
|---|---|---|---|
| Wayfinding | Contexto, opciones y salida legibles | Pantalla bonita pero huérfana | Entrar por deep link y explicar dónde estás |
| Feedback | Respuesta inmediata, proporcional y comprensible | Acción silenciosa o confirmación invasiva | Tocar cada control y narrar qué pasó |
| Visibility | Lo necesario para decidir está a la vista | Minimalismo que esconde estado o acción | Prueba de cinco segundos |
| Consistency | Patrones iguales se ven y actúan igual; iOS gana en controles comunes | Marca inventa un patrón para algo ya aprendido | Comparar con el resto de Patio y con iOS |
| Mental Model | Palabras y secuencia coinciden con la tarea real | La UI expone el modelo de datos | Pedir a una persona que anticipe el siguiente paso |
| Proximity | Control y objeto afectado están juntos | El control parece afectar otra cosa | Aislar cada pareja dato–control |
| Grouping | Las unidades semánticas se reconocen sin explicación | Una card por todo o separadores sin jerarquía | Tapa bordes y títulos; revisa si la estructura sobrevive |
| Mapping | Dirección, orden o gesto reflejan el resultado | Etiquetas intentan rescatar un control arbitrario | Oculta las etiquetas y predice el efecto |
| Affordance | Lo interactivo se reconoce y tiene blanco táctil suficiente | Texto que parece botón o botón que parece texto | Encontrar qué se puede tocar sin instrucciones |
| Progressive Disclosure | Complejidad aparece cuando se necesita | Todo visible o demasiados pasos para expertos | Completar caso básico y caso excepcional |
| 80/20 | El caso frecuente es directo; lo raro sigue disponible | Optimizar excepciones en la vista principal | Contar decisiones del recorrido habitual |
| Symmetry | Contrapeso o cadencia coherente según el contenido | Centrar/reflejar por decoración | Superponer ejes y comparar todas las filas |

### Regla de resolución

Los principios no se votan ni se aplican todos con el mismo peso. Primero se protege la
tarea y el modelo mental; después claridad y feedback; después jerarquía, agrupación y
visibilidad; finalmente balance y belleza. Si dos principios chocan, el documento debe
anotar cuál domina **en ese contexto** y qué costo se acepta. “Se ve más limpio” nunca es
evidencia suficiente.

---

## 6. Relación con otros documentos

- `DESIGN_SYSTEM.md` — implementa estos principios en tokens (color, tipo, spacing).
- `PATIO_DESIGN_PRINCIPLES.md` — adapta estos principios al dominio Foodie/Fondero.
- `IDENTITY_AND_TYPE.md` — sistema tipográfico que sirve a wayfinding, jerarquía, simetría.
- `HIG_REFERENCE.md` — referencia HIG complementaria.

### Este documento vs. lo más actualizado de Apple

Los 12 principios de este documento (WWDC17) son de **comportamiento e interacción** —
wayfinding, feedback, mapping, afordancia, etc. No expiran porque no dependen de qué
material visual esté de moda: describen cómo piensa una persona, no cómo se ve un botón
este año.

Lo que **sí** cambia cada ciclo de Apple es el lenguaje **visual/material** — eso vive en
el skill `apple-design` (`~/.claude/skills/apple-design/SKILL.md`), que ya incluye la
guía más reciente:

- **Liquid Glass** (WWDC25, el material vigente hoy en iOS/macOS "Tahoe") — material
  translúcido para controles y navegación que flota SOBRE el contenido; nunca en la capa
  de contenido. En Patio esto ya es la regla de `CLAUDE.md` → "Glass y superficies
  flotantes" (BlurView solo en sheets/overlays, nunca en cards de menú).
- **Corrección documentada 2026-07-06:** un "grid de 8pt" **no es una regla real de la
  HIG de Apple** — es convención de Material Design/Figma que se había colado como si
  fuera ley de Apple. Lo que Apple exige explícitamente es **alinear componentes entre sí**
  (ver 3.12 Symmetry arriba) — el múltiplo exacto de espaciado es libre siempre que el
  ritmo sea consistente y los elementos relacionados compartan eje. La regla de
  "múltiplos de 8" en `CLAUDE.md` → "Espaciado" es una convención propia de Patio (válida
  como decisión de proyecto), no una cita de Apple — vale la pena tenerlo claro para no
  perseguir el múltiplo exacto a costa de la alineación real cuando compitan.

Antes de cualquier pieza visual nueva (no solo de interacción), cargar el skill
`apple-design` además de este documento.

---

## 7. Patrón confirmado: altas y formularios Patio

> Decisión aprobada en producto el 2026-07-19. Es fundamento vigente para
> onboarding, alta de negocio y formularios secuenciales.

1. **Tinta neutra, acento naranja.** Las acciones primarias usan negro/blanco
   según el tema. El naranja comunica selección, progreso actual y navegación;
   no se extiende como bloque dominante de ancho completo.
2. **El control vive con el dato.** Una edición atómica se activa desde el campo
   que modifica. En horarios, la cápsula activa abre la misma ruleta nativa centrada
   para apertura y cierre; el título conserva el contexto día/campo. No se abre una
   segunda hoja inferior ni se deja que el popover compacto rompa la retícula.
3. **Etiqueta estable antes que ejemplo.** Un ejemplo o placeholder nunca carga
   por sí solo con el significado del campo. El nombre visible permanece aunque
   la persona empiece a escribir.
4. **Solo lo esencial para cumplir la promesa.** Nombre identifica; ubicación
   coloca el negocio en el mapa; horario permite saber cuándo abre; pagos aclara
   cómo comprar sin pedir datos financieros. Descripción y giro aparecen después.
5. **Jerarquía de identidad antes que jerarquía operativa.** En una celebración,
   el nombre del negocio ocupa el centro geométrico exacto de la pantalla. Las
   instrucciones y acciones se subordinan y viven abajo.
6. **Una acción gana.** La primaria es compacta, claramente tappeable y usa un
   verbo. La secundaria baja de peso y describe el alcance real, por ejemplo
   “Editar datos”, no un solo campo arbitrario.
7. **Plataforma primero.** Cuando iOS ya ofrece un control familiar, accesible y
   adaptativo, Patio lo usa y concentra su identidad en jerarquía, ritmo, voz,
   fotografía y acentos.
8. **Cero viudas.** Estas reglas se aplican junto con la ley tipográfica de
   `IDENTITY_VERBAL.md`; ningún refinamiento visual justifica romperla.
9. **Bienvenida antes que rol.** La introducción presenta el producto y después
   ofrece intenciones expresadas como resultados, nunca identidades internas.
   Los permisos aparecen únicamente en la rama donde explican un beneficio real.
10. **Un editor, dos momentos.** Alta inicial y edición posterior reutilizan los
    mismos controles de horario y pagos; cambiar de contexto no cambia el idioma
    de interacción.

---

## 8. Caso patrón — editor semanal de horarios

Esta auditoría es el ejemplo de cómo aplicar los principios como sistema, no como
adjetivos. Sirve de referencia para futuros formularios de Patio.

| Principio dominante | Decisión comprobable en horarios |
|---|---|
| Mental model | Primero se eligen los días que el negocio abre; después se ajusta de cuándo a cuándo. |
| 80/20 | `Lun–Vie`, `Fin de semana` y `Todos` resuelven configuraciones frecuentes sin impedir ajustes día por día. |
| Visibility | Días activos, apertura y cierre permanecen visibles; no se esconden en una pantalla por cada día. |
| Grouping + proximity | Los atajos forman un grupo; los siete días, otro; la tabla de horas aparece junto a los días activos que controla. |
| Mapping | El orden visual `DÍA → ABRE → CIERRA` coincide con la lectura temporal y con el resultado guardado. |
| Symmetry | Cada día usa reflexión bilateral: nombre en la mediana; ABRE y CIERRA en mitades idénticas; conector sobre el eje. Las filas repiten esa geometría por traslación. |
| Consistency | Se usa la ruleta nativa de iOS, centrada en un marco estable y con intervalos previsibles de 15 minutos. |
| Affordance | Chips seleccionables conservan forma y blanco táctil; la selección naranja y el check comunican estado. |
| Feedback | El cambio de día es inmediato, el conteo de abiertos se actualiza, hay respuesta háptica y la hora elegida queda visible con una transición breve. |
| Progressive disclosure | Solo aparecen filas de hora para días abiertos; cerrar un día conserva sus horas para poder recuperarlas. |
| Wayfinding | El título define la tarea, el progreso ubica el paso, volver ofrece salida y Continuar expresa el avance. |

**Criterio de aceptación visual:** el nombre de cada día y el conector ocupan la mediana.
ABRE y CIERRA tienen mitades, anchos y distancia al eje idénticos; sus etiquetas y cápsulas
comparten centro. Todas las filas repiten altura y geometría. Ningún estado seleccionado
puede desplazar el texto vecino. Martes y miércoles se distinguen sin depender de posición
(`MA`/`MI`). Las cápsulas conservan aire visible y nunca invaden el conector.

**Criterio de aceptación funcional:** cambiar un preset, alternar cualquier día y editar
ambas horas debe actualizar el estado de inmediato; cero días se comunica con el conteo
`0 abiertos`, sin una card redundante; reabrir un día recupera sus horas; el control mantiene etiquetas accesibles y blancos de
toque de al menos 44 pt. La prueba final se hace en simulador y en iPhone físico.

## 9. Caso patrón — homologación de menú, historial y color de botones (2026-07-22)

A diferencia de los casos 7 y 8 (contra el WWDC17 802), este caso se resolvió
contra la **HIG oficial vigente** (`developer.apple.com/design`, fuente cruda en
`apple-design/fuentes/color.txt`) porque el problema — qué color lleva un botón,
cuándo esconder una acción secundaria — no lo resuelve la charla de 2017, lo
resuelve la guía de Materials/Color actual.

| Principio dominante | Decisión comprobable |
|---|---|
| Progressive disclosure | Pills de "Agregar sección" en `menu-composer.tsx`: visibles siempre que el menú está vacío (es la acción esencial); detrás de un solo "+" reversible en cuanto ya existe una sección. Antes solo abría, nunca cerraba — revelación progresiva real exige las dos direcciones. |
| Consistency | Cita textual HIG: *"Avoid using the same color to mean different things. Use color consistently throughout your interface."* Antes: el botón de confirmación más importante de cada pantalla tenía tres tratamientos distintos (naranja en menú, blanco en perfil, negro en la ley escrita) — ninguno de acuerdo con los otros dos. |
| Affordance | Cita textual HIG: *"To emphasize primary actions, apply color to the background... the system applies the app accent color to the background in prominent buttons... Refrain from adding color to the background of multiple controls."* Regla resultante: la única acción de confirmación prominente por pantalla lleva el acento; el resto queda neutro. Nunca dos botones de color en la misma pantalla. |
| Mapping | Placeholder vs. contenido real: un campo de texto vacío debe *parecer* vacío. `addSection()`/`emptyMenu()` pre-llenaban el campo con `"SECCIÓN 6"` o `"MENÚ DE HOY"` como si fuera texto ya escrito por la persona — el placeholder (`color.txt`: *"Placeholder text"* es un rol de color semántico distinto de `Label`) existe justo para evitar esa ambigüedad. |
| Feedback | `saveDraft` (menú) tenía swap de texto sin haptic; `handleSaveAll` (perfil) no tenía ninguna confirmación. Homologado: haptic de éxito + check visual en los dos, mismo patrón. |
| Wayfinding | Un control debe comportarse igual en sus dos estados: el placeholder de un campo que fuerza mayúsculas al escribir (`.toUpperCase()`) debe mostrarse en mayúsculas también antes de escribir — si no, el primer toque de teclado produce un salto de caso que no anticipa nada. |

**Criterio de aceptación:** ningún botón de confirmación comparte pantalla con
otro botón de color. Ningún campo de texto nace con contenido simulado — vacío
real + placeholder, o valor real, nunca un intermedio. Todo guardado que se
presenta como exitoso fue verificado, no asumido.

---

**Última revisión:** 2026-07-22 — añadido el caso patrón de homologación de menú/
historial/botones contra la HIG oficial vigente (no solo WWDC17 802). Documento
fundacional, no expira.
