# Patio — PRD para rediseño visual con Claude Design

> Documento de entrega. Copy/paste a Claude Design + adjunta screenshots de cada pantalla.
> Última actualización: 2026-05-16

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

- [ ] Screenshots de cada pantalla en estado actual (toma del simulador o TestFlight)
- [ ] Imágenes de las 7 referencias aspiracionales (`GRID_PLATILLOS`, `TINDER_PLATILLO`, `AGENTE_VOZ`, `DASHBOARD_FONDERO`, `FICHA_EDITORIAL`, `REDES_LANZAMIENTO`, `GLASS_ORGANICO`)
- [ ] Logo de Patio (`assets/images/logo-negro.png` y `logo-blanco.png`)
- [ ] Este documento + `docs/DESIGN_SYSTEM.md` completo

---

## 11. Glosario

- **Fondita:** pequeño negocio de comida casera/corrida en CDMX, típicamente operado por una familia
- **Menú del día:** lo que la fondita cocina ese día (cambia diario)
- **Carta:** menú permanente (raro en fonditas, común en taquerías)
- **Foodie:** usuario que descubre dónde comer
- **Fondero:** dueño/cocinero de la fondita que publica
