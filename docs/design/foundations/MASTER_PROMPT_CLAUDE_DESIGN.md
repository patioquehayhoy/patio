# Master Prompt para Claude Design

> Este archivo es el **único texto** que necesitas pegar en Claude Design para arrancar la sesión.
> Es autocontenido — no requiere acceso a los otros docs del repo.
> Adjunta los screenshots por separado como **referencia de pantallas existentes, NO como base de diseño** (instrucción explícita está adentro).

---

## ⬇️ COPIA DESDE AQUÍ HACIA ABAJO ⬇️

---

# Rediseño visual de Patio — Brief de sesión

Hola. Soy Alejandro, dueño de Patio — una app móvil mexicana (iOS, React Native + Expo) que conecta **fonditas de barrio** con **personas buscando dónde comer hoy**. Vamos a rediseñar el lenguaje visual de la app.

Te paso todo el contexto necesario abajo. **Lee el documento completo antes de proponer nada.**

---

## 1. Reglas de la sesión (LEER PRIMERO)

1. **Los screenshots adjuntos NO son la referencia a respetar.** Muestran lo que existe hoy, sus pantallas, su lógica, y sus dolores. **No estamos atados al look actual** — paleta, radios, pesos tipográficos, blur, tipografía, todo es replanteable. Solo respeta lo que está marcado como "regla dura" en este documento.

2. **Estás diseñando para humanos, no para "usuarios".** Los humanos necesitan: sentirse seguros, entender, lograr, y experimentar belleza. Apégate a esto.

3. **Tu trabajo es proponer un sistema visual nuevo + mockups por pantalla** que respete los principios fundacionales y el dominio — no validar lo que ya existe.

4. **Cuando justifiques una decisión, hazlo contra los principios fundacionales (sección 4), nunca contra "es lo que la app hace hoy".**

---

## 2. Qué es Patio (en una frase)

App móvil que conecta **fonditas de barrio de CDMX** con **gente buscando qué hay hoy de comer**, elevando lo cotidiano sin perder su carácter local.

**Tagline oficial (intocable):** `Saaaaaaabes.`

**Filosofía visual:** *"Lo cotidiano elevado."* Fonditas de barrio con la dignidad de un restaurante de autor. El diseño no grita — insinúa. **Orgánico por dentro, sofisticado por fuera.**

**Metáfora central:** una planta del mercado vista a través de **vidrio esmerilado**. Lo local, rugoso y real, filtrado por algo cuidado y contemporáneo.

---

## 3. Dos roles, dos JTBDs

### Foodie (descubre)
**La pregunta NO es "tengo hambre, dónde como".** Eso es genérico y compite contra Google Maps. Patio NO compite contra Maps.

**La pregunta real es la incertidumbre del menú del día:**
- "¿Qué hay hoy de comer cerca?"
- "¿Qué habrá hecho doña Tita?"
- "Ah, ese puestecito está bueno — pasé ayer pero se acabó. ¿Hoy se pondrá?"
- "¿Qué habrá traído hoy?"

Patio compite contra **la incertidumbre**. El Foodie decide en segundos, no en minutos. Confía en curaduría humana, no en estrellas frías.

### Fondero (publica)
- **JTBD:** "Tengo una fondita. Quiero publicar el menú de hoy en 30 segundos sin saber de tecnología."
- Su menú suele estar escrito a mano o en pizarrón. La app debe respetar eso (foto > formulario).
- Su éxito: **más gente sabe qué cocina hoy.**

**Regla dura:** los dos flujos viven **separados**. Foodie nunca ve UI de Fondero y viceversa. Estilo Uber: el pasajero no ve el modo conductor.

---

## 4. Principios fundacionales (WWDC17 — Apple Design)

Tu trabajo respeta estos 12 principios. Justifica cada decisión de diseño contra ellos:

### 4.1 Premisas
- **Humano, no usuario.** Las personas necesitan: sentirse seguras, entender, lograr, experimentar belleza.
- **Apps ofrecen:** predictibilidad, claridad, flujos simples, deleite.
- **Why, not How.** Los principios son razones, no recetas.
- **Profound simplicity.** La simpleza real es resultado de decisiones difíciles.

### 4.2 Los 12 principios

1. **Wayfinding** — cada pantalla responde: ¿dónde estoy? ¿a dónde voy? ¿qué hay allá? ¿qué hay cerca? ¿cómo salgo?
2. **Feedback** — el sistema dice: ¿qué puedo hacer? ¿qué pasó? ¿qué está pasando? ¿qué pasará? (Status / Completion / Warning / Errors. Lenguaje humano, no técnico).
3. **Visibility** — visible = usable. Pero con límite (sobreexponer satura).
4. **Consistency** — patrones repetidos reducen carga cognitiva. Cohesión interna + externa con la plataforma.
5. **Mental Model > System Model** — el Interaction Model debe alinearse al modelo del usuario, no al técnico. El Fondero piensa "publico mi menú", no "creo un objeto carta".
6. **Proximity** — relacionado va junto, distinto va separado.
7. **Grouping** — contenedores visuales refuerzan unidades semánticas.
8. **Mapping** — controles deben mapear su función intuitivamente (corazón = favorito, no compartir).
9. **Affordance** — lo tappeable se ve tappeable; lo pasivo se ve pasivo.
10. **Progressive Disclosure** — simple primero, complejo después. Reduce decisión.
11. **80/20 Rule** — el 80% del beneficio viene del 20% de las acciones. Optimiza el flujo recurrente, no el raro.
12. **Symmetry** — orden visual (reflexión / rotación / traslación) comunica estabilidad.

---

## 5. Mapa de pantallas (no romper esta arquitectura)

```
app/
├── index.tsx              Inicio + role-picker
├── onboarding.tsx         3 slides de intro (huérfano hoy — hay que engancharlo)
├── explorar.tsx           [FOODIE] mapa + buscador "¿qué hay hoy?"
├── patio/[id].tsx         [FOODIE] ficha pública de fondita
├── favoritos.tsx          [FOODIE] lista guardada
├── cuenta.tsx             [FOODIE] settings y soporte
├── manifiesto.tsx         manifiesto de marca
├── foto-menu.tsx          [FONDERO] capturar/subir menú por foto
├── menu.tsx               [FONDERO] editor "Revisa y ajusta"
├── preview.tsx            [FONDERO] preview antes de compartir
├── share.tsx              [FONDERO] cartel exportable (Story)
└── perfil.tsx             [FONDERO] datos del negocio
```

**Bottom tab bar (solo Fondero):** Perfil · Capturar · Menú · Compartir

---

## 5.1 Flujo navegacional completo (cómo se conectan las pantallas)

No diseñes pantallas aisladas: cada una es un paso de un recorrido. Aquí el panorama de ambos lados.

### Recorrido Foodie (descubrir)
```text
Inicio (role-picker, Foodie-first)
  → Explorar comida
    → Mapa en estado "radar de antojo" (buscador protagonista, mapa tenue, señales sutiles, SIN lista completa al abrir)
      → Busca inline → puntos relevantes se encienden → bottom sheet compacto con coincidencias
      → Toca un punto → resumen de fondita (mini) → Ver negocio → Detalle fondita (/patio/[id])
                                                  → Guardar (favorito) · Compartir · Cómo llegar
      → Favoritos (utilidad, no obligatorio)
      → Cuenta (ajustes y soporte, NO hub de navegación)
```

### Recorrido Fondero (publicar)
```text
Inicio → Publicar mi menú → Login negocio (OTP)
  → Perfil negocio → [Tab bar: Perfil · Menú · Compartir]
    → Tab Menú
        → Sin menú → un solo CTA "Crear menú" → hoja con 4 métodos:
              Tomar foto · Elegir imagen · Usar plantilla · Empezar desde cero
        → Con menú → Editar menú · Más opciones
    → Tab Compartir
        → Sin menú → redirige a "Crear menú" (no pantalla vacía pasiva)
        → Con menú → Preview + compartir imagen (cartel/story)
```

### Reglas de flujo (decisiones de producto ya tomadas)
- **Una sola búsqueda:** vive dentro de Explorar. `/buscar` queda fuera del MVP visible; si alguien llega, se le regresa al mapa.
- **Explorar abre como radar**, no como lista de inventario. La lista se revela por intención (buscar / tocar punto).
- **Una sola entrada a crear menú:** el CTA "Crear menú" es el único origen; foto/galería/plantilla/manual son métodos *dentro* de él, no caminos sueltos.
- **Compartir nunca es pantalla vacía:** si no hay menú, su trabajo es llevar a crear uno.
- **Inicio Foodie-first:** acción principal "Explorar comida", entrada fondera secundaria "Publicar mi menú".
- **Onboarding** explica una vez (first-run/beta), no repite la narrativa del inicio.

---

## 6. Pain points actuales (lo que está feo hoy)

### Globales
- Sin continuidad tipográfica entre pantallas.
- Padding inconsistente.
- Jerarquía visual débil — todo "compite" por la mirada.
- Botones primarios, secundarios y dev pills no comparten lenguaje.

### Por pantalla (resumen)
- **explorar:** la animación de radar dots se siente amateur. Buscador glass cuadrado no dialoga con el resto. El sheet se tapa con el teclado.
- **patio/[id]:** hero plano, sin jerarquía. Menú y resumen compiten visualmente. "Cómo llegar" saca a Apple Maps en vez de ruta interna.
- **foto-menu:** el contenedor dashed no se siente premium. Falta sensación de "hub Fondero".
- **menu (editor):** lista densa sin respiro. Swipe actions toscas.
- **preview / share:** el cartel se siente "PowerPoint", no editorial.
- **perfil / cuenta:** settings tradicionales, sin personalidad.
- **onboarding:** existe pero está desconectado del flujo real.

---

## 7. Reglas duras (NO tocar)

1. Tagline `Saaaaaaabes.` — literal, sin parafrasear.
2. Roles Foodie y Fondero **separados** — no contaminar flujos.
3. Tono **humano y local** — nunca corporativo ni genérico.
4. Progressive Disclosure transversal.
5. IA discreta y operativa — no editorial ("Patio leyó tu menú ✓", no "Bienvenido a tu inteligencia culinaria").

---

## 8. Dirección de exploración geométrica

Sin imponerlo, vale la pena explorar el lenguaje geométrico de **macOS Tahoe / iOS 26**:

- **Squircle corners** (curvatura continua) en vez de radios simples.
- **Stacked surfaces** — cards dentro de cards, sutil diferencia de profundidad.
- **Glassy depth** — más cercano al material Tahoe que al frosted opaco genérico.
- **Compactness con respiro** — densidad informativa sin sentirse apretado.

Si propones algo distinto, justifica contra los 12 principios.

---

## 9. Restricciones técnicas

- **React Native + Expo SDK 54** (no es web, no es Next.js).
- **Fuentes:** SF Pro nativo + `PlusJakartaSans_800ExtraBold` cargada.
- **Animaciones:** API `Animated` de RN (no Framer Motion, no CSS keyframes).
- **Glass:** `BlurView` de expo-blur (intensity 0-100 + tint light/dark).
- **Mapas:** `react-native-maps` con customMapStyle.

---

## 10. Referencias visuales aspiracionales

Slugs funcionales (te pasaré las imágenes por separado):

| Slug                 | Aplicación                                       |
|----------------------|--------------------------------------------------|
| `GLASS_ORGANICO`     | Sistema transversal — glass + botánica CDMX      |
| `FICHA_EDITORIAL`    | Ficha de fondita estilo Hanbut (serif sangrado)  |
| `GRID_PLATILLOS`     | Catálogo visual de platillos (v04, requiere fotos) |
| `DASHBOARD_FONDERO`  | Dashboard oscuro tech con métricas (v04+)        |
| `AGENTE_VOZ`         | Orbe + lenguaje natural estilo Serena (v05+)     |
| `REDES_LANZAMIENTO`  | Posts IG, dos modos visuales                     |

---

## 11. Glosario

- **Fondita:** pequeño negocio de comida casera/corrida en CDMX, típicamente operado por una familia.
- **Menú del día:** lo que la fondita cocina ESE día (cambia diario). Núcleo del JTBD Foodie.
- **Carta:** menú permanente (raro en fonditas).
- **Foodie:** persona que busca dónde comer hoy.
- **Fondero:** dueño/cocinero de la fondita que publica.

---

## 12. Qué quiero de vuelta de ti (entregables)

**Por iteración:**
1. Mockup de la pantalla (estado idle + estados clave).
2. Justificación corta — 3 oraciones citando qué principios fundacionales aplicaste.
3. Si propones cambiar el sistema (paleta, tipografía, geometría), justifícalo contra los principios — no contra la app actual.

**Al final de la sesión:**
- Sistema de tokens completo (color, spacing, radii, tipografía, blur intensities).
- Catálogo de componentes reutilizables (botón, card, sheet, pill, input, top-bar).
- Guidelines de animación.
- Documento de handoff con specs para implementar en RN + Expo SDK 54.

---

## 13. Orden propuesto de la sesión

1. **explorar.tsx** primero — es la pantalla más crítica del Foodie y la cara de la app.
2. **patio/[id].tsx** — ficha de fondita (probablemente estilo `FICHA_EDITORIAL`).
3. **foto-menu.tsx** — hub del Fondero, momento "wow" de la IA.
4. **menu.tsx** — editor con respiro.
5. **preview + share** — cartel editorial exportable.
6. **cuenta + perfil** — settings con personalidad.
7. **onboarding** — enganchar como first-launch.
8. **index** — role-picker limpio (sin grid DEV).
9. **Consolidación final** — sistema de tokens + componentes.

---

## 14. Primer paso

Léete todo lo de arriba. Luego confírmame: **¿qué entendiste del dominio y de la filosofía?** Quiero asegurarme de que estás alineado antes de que propongas el primer mockup.

Después de tu confirmación, empezamos por `explorar.tsx` con su mockup + justificación contra principios.

---

## ⬆️ COPIA HASTA AQUÍ ⬆️
