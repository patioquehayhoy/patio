# Patio — Identidad Verbal (Base v1)

> La **identidad verbal** es el equivalente textual de la identidad visual: cómo
> escribe Patio. Abarca tres capas:
> - **Voz** — la personalidad estable (Patio siempre suena a Patio).
> - **Tono** — cómo esa voz se ajusta por pantalla y momento (variable).
> - **Vocabulario** — qué palabras usamos, cuáles prohibimos, y cómo nombramos
>   las cosas (negocios, personas, lo de hoy).
>
> Hermano de `IDENTITY_AND_TYPE.md`. Si la tipografía define cómo se *ve* el
> texto, este documento define qué *dice* y cómo suena.

---

## 1) Dirección de voz

Patio escribe como un **vecino con buen gusto que conoce su barrio**. No como
una marca, no como una app, no como un folleto.

Patio suena:
- **humano** — como lo diría una persona, no un sistema
- **local** — chilango, de barrio, real (sin caricaturizar)
- **directo** — dice lo necesario y se calla
- **cálido sin ser cursi** — cariño, no azúcar
- **editorial** — con criterio y ritmo, no "template app"

Patio **nunca** suena:
- a marketing ("¡Descubre los mejores sabores cerca de ti!")
- a IA genérica (ver §5)
- a corporativo ("Estimado usuario", "Nuestra plataforma")
- a startup gringa traducida ("¡Vamos! 🚀 Optimiza tu experiencia")

**Par de marca oficial (no negociable):**

> **¿Qué hay hoy? Saaaaaaabes.**

Son dos piezas con funciones distintas:
- **`¿Qué hay hoy?`** — el **claim / eslogan**. La promesa: plantea la pregunta
  que Patio responde. Conecta directo con el JTBD (§7).
- **`Saaaaaaabes.`** — el **tagline / firma**. El remate emocional, la voz
  chilanga. No explica; sella. Es el techo de coloquialidad de la marca.

Reglas: no se modifican, no se parafrasean, no se "mejoran". `Saaaaaaabes.` se
escribe siempre con sus 7 letras "a" y punto final. Cuando van juntos, el orden
es siempre pregunta → firma: **¿Qué hay hoy? Saaaaaaabes.**

---

## 2) El modelo de nombres — estilo Uber / Rappi

**Regla madre:** Patio es la plataforma. **Nadie se renombra.** La gente y los
negocios se nombran por lo que *ya son*; su relación con Patio es un **verbo**,
no una etiqueta.

Nadie dice "soy uberista" ni "tengo un Uber". Dicen *"manejo en Uber"*,
*"reparto en Rappi"*, *"publico en Patio"*. Igual aquí.

**Por qué importa:** no todos cocinan. La fonda *cocina*, el de pasteles de
Costco *revende*, el de michis *prepara*, el de elotes *vende en la calle*.
Forzar una etiqueta única ("fonda", "cocina", "fondero") sobre todos **miente**
— y en CDMX la gente sabe la diferencia. El modelo Uber esquiva el problema:
no etiquetamos al actor, describimos su relación con la plataforma.

### Verbo de marca
> **"Publicar en Patio"** — describe la acción real (subir el menú del día).

- "Publica tu menú en Patio."
- "Lo de hoy ya está en Patio."

### El protagonista es el nombre propio
Siempre que se pueda, el héroe es el **nombre real del negocio**:
**"Doña Mago"**, **"Tacos El Güero"**, **"Michis La Esquina"**, **"Fonda Lupita"**.
El genérico es plan B, no plan A.

### Cuando hace falta un genérico
No se nombra **quiénes son** (no "cocina", no "fondero"). Se nombra **lo que
ofrecen** o **dónde están**:

- **"lo de hoy" / "el menú de hoy"** → el genérico preferido. Conecta con el
  JTBD: la gente quiere saber *qué hay hoy*, no *qué cocinas hay*.
- **"lugares"** → cuando se necesita el sitio físico ("lugares abiertos ahora").
- **Mix por contexto:** novedad y contadores → *menú / lo de hoy*; ubicación y
  mapa → *lugares*.

### Tabla de traducción

| Situación | ❌ Antes (suena falso) | ✅ Patio |
|---|---|---|
| Contador de novedad | "3 fonditas publicaron" | **"3 menús nuevos cerca"** |
| Cercanía / mapa | "fondas activas" | **"lugares abiertos ahora"** |
| Quién publica | "La fondera escribe el menú" | **"Lo escribe quien cocina"** o nombre propio |
| Invitación al negocio | "Únete como fondero" | **"Publica tu menú en Patio"** |
| Guardados | "tus fonditas guardadas" | **"lo que sigues"** / "tus guardados" |
| Héroe del card | "una fonda cerca" | **el nombre real**: "Doña Mago", "Tacos El Güero" |

### Reglas de oro de nombres
1. El **nombre propio** del negocio es siempre el protagonista.
2. El genérico describe **lo que ofrecen** (menú / lo de hoy) o **dónde están**
   (lugares) — nunca **quiénes son**.
3. **Fondero y Foodie viven SOLO en el código** (rol técnico, ver `CLAUDE.md`).
   Jamás aparecen en pantalla.

---

## 3) Tono calibrado por pantalla

La voz es constante; el **tono** sube o baja según el momento. Patio es más
"barrio" donde hay marca y emoción, y más **sobrio** donde el usuario necesita
claridad funcional.

| Zona | Tono | Por qué |
|---|---|---|
| **Hero, onboarding, marca, momentos de deleite** | Barrio con criterio. Coloquial, cálido, con personalidad. `Saaaaaaabes.` vive aquí. | Es donde se siente Patio; el riesgo de "frío/genérico" es mayor que el de "demasiado". |
| **Cards, listas, detalle del menú** | Editorial neutro. El protagonista es el contenido (el menú, el nombre), no la voz. | El copy no debe competir con el platillo. Menos voz, más respeto al contenido. |
| **Botones, formularios, ajustes** | Sobrio y funcional. Verbo claro, sin chiste. | Aquí la gente actúa; la personalidad estorba. "Guardar", "Publicar", "Continuar". |
| **Errores y estados vacíos** | Sobrio + un toque humano al final. Primero claridad, luego calor. | Frustración no se cura con chistes; se cura con claridad y un cierre amable. |

**Ejemplo de la misma idea en dos tonos:**
- Hero (barrio): *"Saber qué hay hoy. Sin asomarte, sin preguntar."*

> **Nota anti-cursi:** evitar el giro "...en su voz" / "...con su sazón" y
> remates poéticos que personifican de más. Suenan a IA poetizando. Patio dice
> qué pasa, no lo adorna. Ver §5.
- Botón (sobrio): *"Ver el menú de hoy"*

---

## 4) Reglas de redacción

- **Frases cortas.** Si una frase necesita coma para respirar dos veces, pártela.
- **Verbos concretos.** "Publica", "guarda", "avísame" — no "gestiona",
  "optimiza", "explora tu experiencia".
- **Una idea por línea.** El espacio en blanco es parte de la voz.
- **Habla de tú.** Nunca "usted", nunca "el usuario".
- **Emoji con cuentagotas.** Permitido en momentos de marca/sabor (🌿 en un
  platillo). Prohibido en UI funcional, errores y botones.
- **Mayúsculas:** solo en labels utilitarios cortos (ver `IDENTITY_AND_TYPE.md`).
  Nunca frases enteras en mayúsculas para "dar énfasis".
- **Cifras y horarios** como los diría la gente: "13–16 h", "a 2 cuadras",
  "hace 12 min".
- **Cero viudas, sin excepción.** Ningún título, subtítulo, párrafo, ayuda,
  alerta o CTA de varias palabras termina con una palabra aislada. Todo copy
  estático de interfaz pasa por `noWidow()`; el contenido dinámico se protege
  cuando funciona como bloque editorial. La composición se valida en el ancho
  real del dispositivo, no solo leyendo el código.
- **La pantalla debe entenderse sola.** Nunca trasladar al producto el contexto
  de una conversación, una decisión interna o una lista de datos que se
  completarán después. Cada texto explica únicamente la acción visible y su
  beneficio inmediato.

---

## 5) Anti-IA — lista de bloqueo

El síntoma de "suena a IA" tiene patrones concretos. **Prohibidos:**

**Palabras y frases muletilla:**
- "Descubre", "Explora", "Sumérgete en"
- "los mejores", "increíbles", "deliciosos", "auténticos sabores"
- "tu experiencia", "experiencia culinaria", "experiencia gastronómica"
- "en un solo lugar", "todo lo que necesitas", "a tu alcance"
- "fácil, rápido y seguro" (el tríptico clásico de IA)
- "¡No te lo pierdas!", "¡Vamos!", "¡Empecemos!"

**Patrones estructurales:**
- **El tres perfecto:** "fresco, rápido y delicioso". Tres adjetivos en
  paralelo perfecto = bandera roja. Rómpelo o usa uno bueno.
- **Adjetivo vacío + sustantivo:** "comida deliciosa", "sabor único". Si el
  adjetivo no aporta dato, bórralo.
- **Entusiasmo de folleto:** signos de exclamación de relleno.
- **Explicar lo obvio:** "Aquí podrás ver el menú del día de las fondas" — la
  gente ya lo ve, no lo narres.
- **El remate poético / personificación de más:** "...en su voz", "...con su
  sazón", "donde el sabor cobra vida". Suena a IA poetizando. Patio dice qué
  pasa, no lo adorna con un cierre lírico.

**El test rápido:** ¿lo diría una persona real en una conversación, o solo
una marca tratando de venderte? Si es lo segundo, reescríbelo.

---

## 6) Antes / Después (sacado del copy real de Figma)

| ❌ | ✅ | Por qué |
|---|---|---|
| "Únete como fondero" | "Publica tu menú en Patio" | No etiquetamos al actor; usamos el verbo de marca. |
| "fondas activas" | "lugares abiertos ahora" | No todos son fondas; describimos estado, no tipo. |
| "3 fonditas guardadas publicaron" | "3 menús nuevos de lo que sigues" | Genérico = lo que ofrecen, no quiénes son. |
| "La fondera escribe el menú como lo diría en persona" | "Lo de hoy, escrito como te lo diría en persona" | Quitamos la etiqueta de oficio, conservamos el calor. |

**Copy que YA está bien (conservar — esto es voz Patio):**
- "Como lo diría tu mamá."
- "Sin spam, sin notificaciones inútiles."
- "Esto no es delivery."
- "Tu ubicación nunca sale del teléfono."
- `Saaaaaaabes.`

**Copy que parecía bien pero NO lo está (corregir):**
- ❌ "Lo que se cocina, en su voz." → el remate "en su voz" personifica de más
  y suena a IA poetizando. Mejor: **"Lo que se cocina hoy."** (directo, sin adorno).

---

## 7) Glosario — JTBD

**JTBD = Jobs To Be Done** ("trabajos por hacer"). Marco para entender *para qué
te contrata la gente*: no qué eres, sino qué problema resuelves en su vida.
Nadie quiere un taladro; quiere el hoyo en la pared.

**El JTBD del Foodie en Patio NO es "tengo hambre"** (eso lo resuelve cualquier
delivery). **Es la incertidumbre del menú del día:** *"¿qué hay hoy cerca?"*.
La fonda de Doña Mago cambia de guisado cada día; Patio quita esa incógnita sin
que la persona tenga que asomarse o preguntar. Por eso el genérico de marca es
**"lo de hoy"** — apunta directo al trabajo que la gente le pide a Patio.

---

## 8) Brief para pegar en Figma Make

> Copia este bloque al iterar pantallas en Figma, para que el copy salga ya
> alineado a la identidad verbal y no haya que corregirlo después.

```
IDENTIDAD VERBAL DE PATIO — reglas de copy (obligatorias):

1. PAR DE MARCA: claim + tagline = "¿Qué hay hoy? Saaaaaaabes."
   - "¿Qué hay hoy?" es el claim (la promesa).
   - "Saaaaaaabes." es el tagline (la firma) — escríbelo con sus 7 letras "a"
     y el punto final. NUNCA lo acortes ("Sabes."), parafrasees ni le quites
     el punto. Cuando van juntos, el orden es siempre pregunta → firma.

2. NOMBRES (modelo Uber/Rappi): nadie se renombra. NO uses "fonda" ni
   "fondero/a" como término general — miente para puestos de tacos, postres,
   michis, elotes o revendedores. El verbo de marca es "publicar en Patio".
   - Protagonista = nombre propio del negocio (Doña Mago, Tacos El Güero).
   - Genérico = lo que ofrecen ("lo de hoy", "el menú de hoy") o dónde están
     ("lugares"). Nunca "quiénes son".
   - "Fondero"/"Foodie" son roles internos de código: jamás en pantalla.

3. TONO POR PANTALLA: barrio cálido en hero/marca/onboarding; neutro en
   cards/listas; sobrio y funcional en botones/formularios/ajustes; claridad
   primero en errores.

4. PROHIBIDO (suena a IA): "descubre", "explora", "experiencia culinaria",
   "los mejores", "auténticos sabores", "fácil rápido y seguro", el "tres
   perfecto" de adjetivos, exclamaciones de relleno, y remates poéticos que
   personifican de más ("...en su voz", "...con su sazón").

5. TEST: ¿lo diría una persona real, o solo una marca vendiéndote? Si es lo
   segundo, reescríbelo. Habla de tú, frases cortas, una idea por línea.
```

---

## 9) Criterio de calidad

Antes de cerrar cualquier copy:
1. ¿Lo diría una persona real, o solo una marca? (test anti-IA, §5)
2. ¿El tono corresponde a la pantalla? (§3 — barrio en marca, sobrio en función)
3. ¿Respeta el modelo de nombres? (§2 — nombre propio primero, sin etiquetar al actor)
4. ¿Se entiende en 2 segundos?
5. ¿Pasaría junto a `Saaaaaaabes.` sin desentonar?
6. ¿La pantalla se entiende sin haber leído una conversación previa?
7. ¿Quedó alguna palabra sola en la última línea, incluido al cambiar el tamaño
   de texto?
