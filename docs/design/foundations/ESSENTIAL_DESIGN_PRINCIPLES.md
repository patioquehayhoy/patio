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

### 3.1 Wayfinding (Orientación)
Toda pantalla debe responder cinco preguntas:
- **¿Dónde estoy?** (título, breadcrumb, contexto visual)
- **¿A dónde puedo ir?** (acciones disponibles, navegación)
- **¿Qué voy a encontrar al llegar?** (preview, labels descriptivos)
- **¿Qué hay cerca?** (relacionados, sugerencias)
- **¿Cómo salgo?** (botón de cierre, back, exit claro)

**Pregunta al dominio Patio:** cuando un Foodie está viendo una fondita, ¿la pantalla responde claramente dónde está, qué va a encontrar, qué hay cerca y cómo regresar? Cuando un Fondero está en mitad de capturar su menú, ¿sabe en qué paso va? (La respuesta NO debe asumir la implementación actual — puede ser otra solución radicalmente distinta).

### 3.2 Feedback
El sistema debe contestar:
- **¿Qué puedo hacer?** (affordances visibles)
- **¿Qué acaba de pasar?** (confirmación de acción)
- **¿Qué está pasando?** (loading, progreso)
- **¿Qué va a pasar?** (preview, advertencia)

Tipos: **Status, Completion, Warning, Errors.**

Regla de oro: *"What would you say? Then say it!"* — si dirías algo a un amigo en esa situación, decirlo en la UI con el mismo tono.

**Pregunta al dominio Patio:** el lenguaje de feedback de Patio debe sonar humano y local — no técnico. Si la fondita acaba de publicar su menú, ¿qué le diría una persona real en ese momento? Esa es la frase que va en pantalla. Aplica igual para errores y advertencias: humanos antes que sistémicos.

### 3.3 Visibility (Visibilidad)
- **Mejora la usabilidad** — lo visible es más usable que lo oculto.
- **Tiene límites** — demasiada visibilidad satura.

**Pregunta al dominio Patio:** ¿la acción más importante de esta pantalla (para el rol que la está usando) se nota al primer vistazo? Para el Fondero la acción cambia según el paso del flujo; para el Foodie suele ser "saber qué hay hoy cerca". No asumir que la solución actual está bien — replantearla.

### 3.4 Consistency (Consistencia)
- **Mejora usabilidad** — patrones repetidos reducen carga cognitiva.
- **Inconsistencia mata usabilidad.**
- **Interna** (dentro de tu app) y **externa** (con la plataforma — HIG).
- **Provee cohesión** — la marca se siente coherente.

**Pregunta al dominio Patio:** las decisiones concretas (radios, blur, pesos tipográficos) viven en `DESIGN_SYSTEM.md` y pueden evolucionar. La regla aquí es: **una vez decidido un patrón, respetarlo en todas las pantallas** — y romperlo solo con justificación documentada. La consistencia se aplica al lenguaje visual que esté vigente, no al que existe hoy en el código.

### 3.5 Mental Model vs Interaction Model
Tres modelos:
- **System Model** — cómo funciona el sistema por dentro (ej. agua caliente entra por la izquierda).
- **Mental Model** — cómo cree el usuario que funciona.
- **Interaction Model** — cómo lo expones en la interfaz.

**El Interaction Model debe alinearse al Mental Model, NO al System Model.**

Ejemplo del faucet: el usuario piensa "una manija sube/baja agua, otra cambia temperatura" — aunque internamente sean dos válvulas mezclando flujos. La interfaz debe reflejar el modelo mental.

**Pregunta al dominio Patio:** ¿qué palabras y secuencia de acciones usaría el Fondero / Foodie real al explicarle a un amigo lo que va a hacer? Esa es la base del Interaction Model. Las estructuras técnicas (tablas, objetos, estados) jamás deben filtrarse a la UI ni al copy.

### 3.6 Proximity (Proximidad)
Cosas relacionadas se ven cerca. Cosas no relacionadas, separadas.

**Pregunta al dominio Patio:** ¿qué información pertenece a la misma "unidad semántica" para el rol que lee la pantalla? (Ejemplo: el nombre de un platillo, su descripción y su precio son una unidad — deben sentirse así visualmente, sin importar cómo se implemente).

### 3.7 Grouping (Agrupación)
Contenedores visuales (cards, secciones, paneles) refuerzan la proximidad y crean unidades semánticas.

**Pregunta al dominio Patio:** ¿qué jerarquía de agrupación tiene sentido para el dominio? Platillo dentro de sección, sección dentro de menú, menú dentro de fondita. La forma visual de comunicar esa jerarquía es decisión de diseño abierta — no fijar el método aquí.

### 3.8 Mapping (Mapeo)
Los controles deben mapear su función de forma intuitiva. El "Morty Faucet" del WWDC (una manija sube y baja para temperatura) es ANTI-mapping — confunde porque el modelo físico real (dos manijas, dos válvulas) no se respeta.

**Pregunta al dominio Patio:** ¿el símbolo, gesto o ubicación de un control coincide con lo que el rol espera que haga? Si dudas, valida con una persona real fuera del equipo — no con tu memoria de la app actual.

### 3.9 Affordance (Afordancia)
**Real affordance:** lo que el objeto permite físicamente (un plato sostiene comida).
**Perceived affordance:** lo que el usuario percibe que puede hacer.

**La diseñada en software es siempre percibida.** Un botón debe verse tappeable. Un slider debe verse arrastrable.

**Pregunta al dominio Patio:** ¿el elemento se ve como lo que es? Lo tappeable debe verse tappeable; lo de solo lectura debe verse pasivo. La forma exacta de comunicar esa afordancia es decisión de diseño abierta.

### 3.10 Progressive Disclosure (Revelación progresiva)
Mostrar lo simple primero, revelar lo complejo conforme se necesita.
- Reduce clutter.
- Simplifica decisión.
- Permite que principiantes Y expertos coexistan.

**Pregunta al dominio Patio:** ¿qué es lo mínimo que el rol necesita ver/decidir para avanzar? Eso se muestra primero. El resto aparece bajo demanda. La división simple/avanzado se diseña fresco, no se hereda del flujo actual.

### 3.11 80/20 Rule (Pareto)
El 80% del beneficio viene del 20% de las acciones. Optimizar lo importante, no lo raro.

**Pregunta al dominio Patio:** para cada rol (Foodie / Fondero), ¿cuál es el flujo que se va a repetir 80% de las veces? Ese flujo debe ser excelente. Los flujos raros pueden ser funcionales sin ser perfectos. Identificar el 80% es ejercicio de producto, no asumirlo de la app actual.

### 3.12 Symmetry (Simetría)
Tres tipos:
- **Reflection** (espejo) — equilibrio izquierda/derecha.
- **Rotation** (rotación) — equilibrio radial.
- **Translation** (traslación) — repetición rítmica.

La simetría comunica orden, estabilidad, belleza.

**Pregunta al dominio Patio:** ¿la composición de la pantalla comunica orden y equilibrio? Tipo de simetría y su intensidad son decisión de diseño — pueden cambiar por completo entre versiones.

---

## 4. Retos al aplicar principios

1. **Pueden contradecirse entre sí** — ej. más visibilidad vs simplicidad. Se resuelve priorizando contexto.
2. **Demasiado de uno es malo** — demasiada consistencia mata creatividad; demasiada feedback satura.
3. **Su relevancia varía** — en una pantalla de loading, feedback domina. En una ficha editorial, simetría y proximidad dominan.

---

## 5. Cheat sheet para Patio (decisiones rápidas)

Antes de implementar una pantalla, pregúntate:

| Principio | Pregunta de verificación |
|-----------|--------------------------|
| Wayfinding | ¿Sé dónde estoy y cómo salir? |
| Feedback | Si tappeo algo, ¿la app me responde? |
| Visibility | ¿La acción principal está visible al primer vistazo? |
| Consistency | ¿Esto se ve y se comporta como el resto de Patio? |
| Mental Model | ¿Esto coincide con cómo el Foodie/Fondero piensa? |
| Proximity | ¿Lo relacionado está junto? ¿Lo distinto, separado? |
| Grouping | ¿Las secciones son unidades claras? |
| Mapping | ¿El icono/control significa lo que hace? |
| Affordance | ¿Se ve que es tappeable/arrastrable? |
| Progressive Disclosure | ¿Mostré primero lo simple? |
| 80/20 | ¿Optimicé el flujo principal, no el raro? |
| Symmetry | ¿Hay orden visual? |

---

## 6. Relación con otros documentos

- `DESIGN_SYSTEM.md` — implementa estos principios en tokens (color, tipo, spacing).
- `PATIO_DESIGN_PRINCIPLES.md` — adapta estos principios al dominio Foodie/Fondero.
- `IDENTITY_AND_TYPE.md` — sistema tipográfico que sirve a wayfinding, jerarquía, simetría.
- `HIG_REFERENCE.md` — referencia HIG complementaria.

---

**Última revisión:** 2026-05-17 — Documento fundacional, no expira.
