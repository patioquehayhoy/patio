# Patio — PRD (Product Requirements Document)

> ⚠️ **ARCHIVO — superado.** Este documento dejó de ser la fuente de verdad el
> 2026-06-07 y no se actualizó desde entonces. Para dominio, arquitectura y
> estado vigente usar:
> - [`PATIO_SYSTEM_MAP.md`](PATIO_SYSTEM_MAP.md) — esquema maestro de producto v7 canónico
> - [`ARCHITECTURE.md`](ARCHITECTURE.md) — stack, capas, flujos críticos
> - [`ROADCONTROLLER.md`](ROADCONTROLLER.md) — mapa de frentes y estado vigente
>
> Se conserva como snapshot histórico (dominio, personas, pain points de
> junio). Los links de "lectura complementaria" originales apuntaban a
> `FLOW_V2.md` y otros documentos del proceso Figma Make ya retirados —
> ver `docs/DOCS_AUDIT_2026-07-22.md` para el estado real de cada doc.
>
> **Reglas duras de marca (no negociables, estas sí vigentes):** `Saaaaaaabes.`
> (tagline literal), Foodie/Fondero separados, "lo cotidiano elevado", y el
> bloque de precio en `menu.tsx` (ver CLAUDE.md).

---

## 0. Alcance de este documento

PRD general de Patio: describe **qué es el producto, para quién, cómo está
estructurado y qué chirría hoy**. No prescribe una solución de diseño ni una
herramienta — es contexto factual para diseñar o desarrollar.

---

## 1. Qué es Patio

**Patio** es una app móvil (iOS, React Native + Expo) para descubrir y publicar menús de fonditas (comida casera/local de CDMX).

- **Tagline oficial:** `Saaaaaaabes.` (no modificar nunca)
- **Filosofía:** *Lo cotidiano elevado.* Fonditas de barrio con dignidad de restaurante de autor. Diseño que no grita — insinúa. Orgánico por dentro, sofisticado por fuera.
- **Metáfora central:** una planta del mercado vista a través de vidrio esmerilado — lo local, rugoso y real, filtrado por algo cuidado y contemporáneo.

---

## 2. Las dos personas

### Foodie (descubrir)
- **JTBD real (no es "tengo hambre"):** "¿Qué hay hoy de comer cerca? ¿Qué habrá hecho doña Tita? Ah, ese puestecito está bueno — pasé ayer pero se acabó. ¿Hoy se pondrá? ¿Qué habrá traído?"
- La pregunta central no es **dónde** comer, es **qué hay hoy** y **si vale la pena ir antes de que se acabe**.
- Patio compite contra la incertidumbre, no contra Google Maps.
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

### Paleta core (estado actual en código — `lib/colors.ts`)
| Token         | Hex (light) | Hex (dark) | Uso actual                              |
|---------------|-------------|------------|-----------------------------------------|
| bg            | `#F8F8F5`   | `#111214`  | Fondo principal                         |
| surface       | `#FFFFFF`   | `#1B1C20`  | Superficie, cards, inputs               |
| surface2      | `#F6F4EE`   | `#24262C`  | Superficie secundaria                   |
| text          | `#1C1C1E`   | `#F5F5F0`  | Texto principal                         |
| textSecondary | `#70757F`   | `#9A9CA3`  | Texto secundario, placeholders          |
| accent        | `#F2612F`   | `#FF6A3D`  | Naranja — hoy usado como accent de UI (CTAs, tabs activas, dots) |
| border        | `#E9E5DD`   | `#2C2F36`  | Bordes, separadores                     |
| button        | `#1C1C1E`   | `#F5F5F0`  | Botones primarios                       |

> Nota factual: el `accent` naranja se usa hoy como acento general de interfaz
> (tabs, CTAs, dots de radar, labels). Ver `docs/design/EDITORIAL_REDESIGN.md`
> y `docs/STATE.md` para la discusión sobre su rol.

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

Esto es una dirección de exploración posible, justificable contra los 12 principios fundacionales — no una obligación.

---

## 5. Referencias visuales aspiracionales

Estilos a los que queremos llegar. Cada uno tiene slug funcional:

| Slug                  | Aplicación                                | Versión |
|-----------------------|-------------------------------------------|---------|
| `GRID_PLATILLOS`      | Grid catálogo de platillos con foto       | v04     |
| `AGENTE_VOZ`          | Orbe + lenguaje natural ("Serena style")  | v05+    |
| `DASHBOARD_FONDERO`   | Dark tech metrics (Momentum)              | v04+    |
| `FICHA_EDITORIAL`     | Ficha fondita Hanbut (serif sangrado)     | v03+    |
| `REDES_LANZAMIENTO`   | Grid de posts IG, dos modos               | pre-launch |
| `GLASS_ORGANICO`      | Texturas glass + botánica CDMX (sistema)  | activo  |

---

## 6. Pain points UX actuales

> Lista honesta de qué chirría hoy. Los screenshots en `assets/screenshots/` muestran cada uno.

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
- **Paleta** — el fondo claro (`#F8F8F5`) + texto/botón oscuro (`#1C1C1E`) + accent naranja funciona
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

## 9. Entregables de un rediseño (cualquier herramienta)

1. **Sistema de diseño visual** consolidado (paleta extendida, sistema de spacing, tokens completos)
2. **Mockups por pantalla** (las 13 pantallas listadas en sección 3)
3. **Componentes reutilizables** (botón, card, sheet, pill, input, top-bar)
4. **Animaciones clave** descritas (radar dots → algo tech glow, transiciones entre pantallas, loading)
5. **Guidelines de implementación** — qué tokens, qué fuentes, qué intensidades de BlurView

---

## 10. Insumos disponibles para diseñar

- **Screenshots reales del flujo actual** — `assets/screenshots/`.
- **Flujo escrito Foodie/Fondero** — `docs/PATIO_SYSTEM_MAP.md`, `docs/STATE.md`.
- **Definición de Fondero** — dueño/encargado/cocinera/cocinero u operador de una fondita que publica qué hay hoy.
- **Referencias de spinner/radar** — Linear / Tesla / Apple system activity / tech glow silencioso.
- **Referencias aspiracionales** — `docs/design/references/`.
- **Logo de Patio** — `assets/images/logo-negro.png` y `logo-blanco.png` (si existen en el workspace).
- **Documentos fundacionales** — ver lectura complementaria al inicio del PRD.
- **Sistema de diseño** — `docs/DESIGN_SYSTEM.md` + `docs/design/VISUAL_SYSTEM.md`.

> Nota: no usar paquetes bajo `docs/design/screenshots/` como fuente hasta que existan físicamente en el worktree.

---

## 11. Glosario

- **Fondita:** pequeño negocio de comida casera/corrida en CDMX, típicamente operado por una familia
- **Menú del día:** lo que la fondita cocina ese día (cambia diario)
- **Carta:** menú permanente (raro en fonditas, común en taquerías)
- **Foodie:** usuario que descubre dónde comer
- **Fondero:** dueño/cocinero de la fondita que publica
