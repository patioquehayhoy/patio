# Patio — PRD para rediseño visual con Claude Design

> Documento de entrega. Copy/paste a Claude Design + adjunta screenshots de cada pantalla.
> Última actualización: 2026-05-17

> ⚠️ **Lectura previa obligatoria para la sesión:**
> 1. [`design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`](design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md) — biblia fundacional (12 principios WWDC17)
> 2. [`design/foundations/CLAUDE_DESIGN_BRIEF.md`](design/foundations/CLAUDE_DESIGN_BRIEF.md) — brief limpio del dominio
> 3. Este PRD (detalle de pantallas + pain points)
>
> **Separación importante:** la **paleta, radios, pesos y blur actuales** documentados aquí
> son **decisiones vigentes y cambiables**. Una propuesta de rediseño puede modificarlos
> siempre que respete los 12 principios fundacionales y las reglas duras de marca
> (`Saaaaaaabes.`, Foodie/Fondero separados, "lo cotidiano elevado"). La app vigente
> NO es la referencia — solo el dominio.

---

## 0. Cómo usar este documento

Este PRD es para una sesión de **Claude Design** (claude.ai/design o similar). Le da contexto suficiente para que proponga un rediseño visual coherente sin romper la lógica de la app.

**Lo que Claude Design debe hacer:**
- Proponer un nuevo lenguaje visual respetando filosofía y paleta
- Generar mockups por pantalla
- Mantener la arquitectura de navegación actual
- Resolver las inconsistencias identificadas (pesos tipográficos, padding, jerarquía)

**Lo que Claude Design NO debe hacer:**
- Cambiar la lógica de negocio
- Mover el tagline `"Saaaaaaabes."` ni el nombre Patio
- Romper la separación Foodie vs Fondero
- Tocar el bloque de precio en `menu.tsx` (documentado en CLAUDE.md)

---

## 1. Qué es Patio

**Patio** es una app móvil (iOS, React Native + Expo) para descubrir y publicar menús de fonditas (comida casera/local de CDMX).

- **Tagline oficial:** `Saaaaaaabes.` (no modificar nunca)
- **Filosofía:** *Lo cotidiano elevado.* Fonditas de barrio con dignidad de restaurante de autor. Diseño que no grita — insinúa. Orgánico por dentro, sofisticado por fuera.
- **Metáfora central:** una planta del mercado vista a través de vidrio esmerilado — lo local, rugoso y real, filtrado por algo cuidado y contemporáneo.

---

## 2. Las dos personas

### Foodie (descubrir)
- **JTBD:** "Tengo hambre, no sé qué comer cerca, quiero algo bueno hoy mismo."
- **Entrada:** sin login obligatorio
- **Pantalla principal:** `/explorar` — mapa + buscador
- **Acciones:** buscar platillo, ver ficha de fondita, guardar favoritos
- **Tono:** humano, antojo, descubrimiento

### Fondero (publicar)
- **JTBD:** "Tengo una fondita, quiero publicar mi menú de hoy en 30 segundos."
- **Entrada:** login con magic link a su email
- **Pantalla principal:** `/foto-menu` — botón gigante "Toma foto de tu menú"
- **Acciones:** capturar/subir foto del menú → revisar → publicar → compartir
- **Tono:** operativo, claro, sin fricción

**Regla dura:** los dos flujos viven separados. Foodie nunca ve UI de Fondero y viceversa.

---

## 3. Arquitectura de pantallas (no romper)

```
app/
├── index.tsx              → Role-picker + login email (entrada)
├── explorar.tsx           → [FOODIE] mapa + buscador
├── patio/[id].tsx         → [FOODIE] ficha de fondita
├── favoritos.tsx          → [FOODIE] lista de fonditas guardadas
├── cuenta.tsx             → [FOODIE] settings y soporte
├── foto-menu.tsx          → [FONDERO] capturar/subir menú
├── menu.tsx               → [FONDERO] editor de menú
├── preview.tsx            → [FONDERO] preview antes de compartir
├── share.tsx              → [FONDERO] exportar como imagen
├── perfil.tsx             → [FONDERO] settings del negocio
├── manifiesto.tsx         → manifiesto de marca
├── login-callback.tsx     → callback magic link
└── onboarding.tsx         → 3-slide intro (no enganchado actualmente)
```

**Bottom tab bar (solo Fondero):** `Perfil · Capturar · Menú · Compartir`

---

## 4. Sistema de diseño actual

Ver `docs/DESIGN_SYSTEM.md` para detalle completo. Resumen ejecutivo:

### Paleta core
| Token   | Hex                  | Uso                                     |
|---------|----------------------|-----------------------------------------|
| BG      | `#EFEFEF`            | Fondo principal                         |
| BLACK   | `#292929`            | Texto principal, botones primarios      |
| WHITE   | `#FFFFFF`            | Superficie, cards, inputs               |
| BLACK60 | `rgba(41,41,41,0.5)` | Texto secundario, placeholders          |
| ACCENT  | Naranja tierra       | CTAs, dots activos                      |

### Paleta orgánica (assets `GLASS_ORGANICO`)
- Olive `#6B7255` — exteriores
- Taupe `#C4AFA0` — superficies neutras
- Lavender `#B8C4D4` — overlays, agente
- Rose-burgundy `#8B3A52` — acento cálido

### Tipografía (regla dura)
- **SF Pro Display** ≥20pt
- **SF Pro Text** ≤19pt
- **Pesos permitidos:** solo `'900'` (énfasis) y `'300'` (cuerpo)
- **`Fonts.brand`** (Plus Jakarta ExtraBold) en nombres de fondita
- El contraste 900 vs 300 es el mecanismo principal de jerarquía

### Glass
Toda superficie flotante usa `BlurView` de expo-blur, nunca fondo sólido. Tabla de intensities por contexto en DESIGN_SYSTEM.md.

### Geometría
- Spacing en múltiplos de 8: `8 | 16 | 24 | 32 | 40 | 48`
- borderRadius: botones 14, sheets 28-32, pills 100, cards 20
- Separadores: `StyleSheet.hairlineWidth` siempre

---

## 4b. Dirección de exploración geométrica — "Tahoe-style corners"

Sin imponerlo, vale la pena explorar el lenguaje geométrico de **macOS Tahoe / iOS 26**: corners continuos (squircle), radios más grandes y suaves, jerarquía por profundidad sutil (no por sombras pesadas), y un sentido de **superficie unificada** entre cards, sheets, botones y contenedores.

- **Squircle corners** (curvatura continua tipo SF Symbols) en vez de radios geométricos simples
- **Stacked surfaces** — cards dentro de cards, con sutil diferencia de profundidad
- **Glassy depth** — más cercano al material de Tahoe que al frosted opaco actual
- **Compactness con respiro** — más densidad informativa sin sentirse apretado

Claude Design puede tomar esto como dirección o proponer algo distinto, siempre justificando contra los 12 principios fundacionales.

---

## 5. Referencias visuales aspiracionales

Estilos a los que queremos llegar. Cada uno tiene slug funcional:

| Slug                  | Aplicación                                | Versión |
|-----------------------|-------------------------------------------|---------|
| `GRID_PLATILLOS`      | Grid catálogo de platillos con foto       | v04     |
| `TINDER_PLATILLO`     | Swipe sí/no sobre platillos cercanos      | v03     |
| `AGENTE_VOZ`          | Orbe + lenguaje natural ("Serena style")  | v05+    |
| `DASHBOARD_FONDERO`   | Dark tech metrics (Momentum)              | v04+    |
| `FICHA_EDITORIAL`     | Ficha fondita Hanbut (serif sangrado)     | v03+    |
| `REDES_LANZAMIENTO`   | Grid de posts IG, dos modos               | pre-launch |
| `GLASS_ORGANICO`      | Texturas glass + botánica CDMX (sistema)  | activo  |

---

## 6. Pain points UX actuales (lo feo que Claude Design debe resolver)

> Lista honesta de qué chirría hoy. Las screenshots adjuntas muestran cada uno.

### Globales
1. **Sin continuidad tipográfica** entre pantallas — pesos `'500'` o `'700'` cuelan en lugares random
2. **Padding inconsistente** entre pantallas — algunas usan 20, otras 24, sin criterio
3. **Jerarquía visual débil** — todo "compite" por la mirada
4. **Botones con pesos visuales distintos** — primarios, secundarios y dev pills no comparten lenguaje

### Pantalla por pantalla

#### `/explorar` (Foodie)
- Animación de radar dots (puntos pulsantes) se siente **fea, amateur**. Aspiración: spinner tech tipo Tesla / Linear / glow minimalista
- Buscador y micrófono son glass cuadrados que no dialogan con el resto
- Sheet de resultados puede taparse cuando el teclado se abre
- Top bar con iconos sueltos sin contenedor unificado

#### `/patio/[id]` (Foodie — ficha de fondita)
- Hero plano sin jerarquía
- Resumen y menú compiten visualmente, no respiran
- "Cómo llegar" saca al usuario a Apple Maps (queremos ruta dentro de la app)
- Falta resumen rápido + menú con menos jerarquía + botones circulares de acción

#### `/foto-menu` (Fondero)
- El botón "Toma foto" funciona pero el contenedor dashed no se siente premium
- Divider "o" entre primario y galería es genérico
- No hay sensación de "este es tu hub" — se siente transaccional

#### `/menu` (Fondero — editor)
- Lista de secciones/platillos densa, sin respiro
- Swipe actions visualmente toscas (rojo/naranja sin elegancia)

#### `/preview` y `/share`
- Composición del cartel exportable se siente "PowerPoint", no editorial

#### `/perfil` y `/cuenta`
- Lista de settings tradicional, sin personalidad
- Avatar + identidad sin presencia

---

## 7. Lo que SÍ funciona y no se debe romper

- **Glass general** — la dirección de BlurView + transparencia es correcta, solo falta consistencia
- **Tagline `Saaaaaaabes.`** — intocable
- **Tabla de pesos 900/300** — buena regla, falla en ejecución
- **Paleta** — el `#EFEFEF` + `#292929` + naranja funciona
- **Flujo Fondero E2E** — la lógica capturar→revisar→publicar es sólida
- **Role picker en entrada** — funciona, persiste rol en AsyncStorage

---

## 8. Limitaciones técnicas a respetar

- **React Native + Expo SDK 54** — no se puede usar todo CSS web
- **Fuentes:** solo las cargadas (`PlusJakartaSans_800ExtraBold`) + SF Pro nativo
- **Animaciones:** API `Animated` de RN (no Framer Motion ni CSS keyframes)
- **Mapas:** `react-native-maps` con `customMapStyle` (estilo ya definido en `lib/map-style.ts`)
- **Glass:** `BlurView` de expo-blur — `intensity` (0-100) + `tint` (light/dark)

---

## 9. Entregables esperados de Claude Design

1. **Sistema de diseño visual** consolidado (paleta extendida, sistema de spacing, tokens completos)
2. **Mockups por pantalla** (las 13 pantallas listadas en sección 3)
3. **Componentes reutilizables** propuestos (botón, card, sheet, pill, input, top-bar)
4. **Animaciones clave** descritas (radar dots → algo tech glow, transiciones entre pantallas, loading)
5. **Guidelines de implementación** — qué tokens, qué fuentes, qué intensidades de BlurView

---

## 10. Anexos a adjuntar a Claude Design

- [x] **Screenshots build 1.0.0 (45)** — en [`design/screenshots/v1.0.0-build45/`](design/screenshots/v1.0.0-build45/) con mapeo completo en su README
- [ ] Pendiente: capturar `share` (cartel final exportable)
- [ ] Imágenes de las 7 referencias aspiracionales (`GRID_PLATILLOS`, `TINDER_PLATILLO`, `AGENTE_VOZ`, `DASHBOARD_FONDERO`, `FICHA_EDITORIAL`, `REDES_LANZAMIENTO`, `GLASS_ORGANICO`)
- [ ] Logo de Patio (`assets/images/logo-negro.png` y `logo-blanco.png`)
- [x] Documentos fundacionales (lectura previa obligatoria — ver disclaimer al inicio del PRD)
- [x] Este PRD + `docs/DESIGN_SYSTEM.md` (decisiones actuales, cambiables)

---

## 11. Glosario

- **Fondita:** pequeño negocio de comida casera/corrida en CDMX, típicamente operado por una familia
- **Menú del día:** lo que la fondita cocina ese día (cambia diario)
- **Carta:** menú permanente (raro en fonditas, común en taquerías)
- **Foodie:** usuario que descubre dónde comer
- **Fondero:** dueño/cocinero de la fondita que publica

---

## 12. Prompts copy-paste para Claude Design

Usa estos mensajes en la sesión de Claude Design en orden:

### Prompt 1 — Setup
```
Soy Alejandro, dueño de Patio (app de fonditas CDMX, React Native + Expo).
Te paso 3 cosas:
1. PRD completo (debajo)
2. Sistema de diseño actual (DESIGN_SYSTEM.md)
3. 13 screenshots del estado actual (TestFlight build 1.0.0 (45))
+ 7 imágenes de referencias aspiracionales

Tu trabajo: rediseñar pantalla por pantalla respetando el PRD,
proponiendo un sistema visual coherente que resuelva los pain points
identificados sin romper la lógica.

Empezamos por explorar.tsx (la pantalla más crítica del Foodie).
Tu primer entregable: mockup + tokens visuales propuestos.
```

### Prompt 2 — Pantalla por pantalla
```
Siguiente pantalla: [nombre].tsx
Pain points específicos (de la sección 6 del PRD): [...]
Mostrame mockup + lista de componentes nuevos/modificados.
```

### Prompt 3 — Consolidar sistema
```
Ya cubrimos todas las pantallas. Ahora consolida:
1. Sistema de tokens completo (colores extendidos, spacing, radii, shadows)
2. Catálogo de componentes reutilizables (botones, cards, sheets, pills)
3. Guidelines de animación (entrada/salida, loading, transiciones)
4. Versión markdown actualizada de DESIGN_SYSTEM.md
```

### Prompt 4 — Handoff a implementación
```
Listo. Generame un documento `docs/DESIGN_SYSTEM_V03.md` con:
- Tokens en formato copy-paste (TypeScript objects)
- Specs de cada componente con valores exactos
- Mapeo: "pantalla X usa componentes A, B, C con tokens T1, T2"

Esto va a ser implementado en React Native + Expo SDK 54.
Usa Animated nativo (no Framer Motion), BlurView de expo-blur.
```
