# Patio — Sistema Visual (v2)

> Fuente de verdad para decisiones de diseño. El agente de diseño debe leer este documento antes de modificar cualquier componente visual.

---

## 1. Filosofía

**Minimalist Glass** — las superficies receden, el contenido avanza.

- El mapa es la superficie heroica. La UI flota sobre él, no lo cubre.
- El glass no es decoración — es señal de profundidad. Blur = "esto está encima".
- Dark mode es la experiencia premium. Light mode es operacional/limpio.
- Un solo color de acento. Nunca dos colores compitiendo.
- La jerarquía visual se construye con peso tipográfico (900 vs 300), no con color.
- Ruido cero: si un elemento no tiene una función clara, no existe.

---

## 2. Sistema de Color

### Paleta base

| Token      | Light                  | Dark                   | Uso                                    |
|------------|------------------------|------------------------|----------------------------------------|
| `t.bg`     | `#EFEFEF`              | `#111111`              | Fondo principal de pantalla            |
| `t.surface`| `#FFFFFF`              | `#1C1C1E`              | Cards, inputs, paneles no-glass        |
| `t.text`   | `#292929`              | `#F0F0F0`              | Texto primario                         |
| `t.gray`   | `rgba(41,41,41,0.5)`   | `rgba(240,240,240,0.5)`| Texto secundario, metadata             |
| `t.accent` | `#292929`              | `#F0F0F0`              | Acento principal (monochromático)      |
| `t.sep`    | `rgba(0,0,0,0.08)`     | `rgba(255,255,255,0.10)`| Separadores, bordes internos          |
| `t.border` | `rgba(0,0,0,0.08)`     | `rgba(255,255,255,0.10)`| Bordes de contenedores               |

### Acento cálido (para estado activo/seleccionado en mapa)

| Token           | Valor              | Uso                                              |
|-----------------|--------------------|--------------------------------------------------|
| `t.warm`        | `#F5C842`          | Horario activo, lugar seleccionado, CTA de mapa  |
| `t.warmSurface` | `rgba(245,200,66,0.12)` | Fondo de pill activo, badge de horario      |

> El acento cálido (`#F5C842`) aparece únicamente en el contexto del mapa y horarios. Nunca en formularios ni UI general.

---

## 3. Sistema Glass

### Capas

```
┌─────────────────────────────────────────────┐
│  CAPA 3 — Overlays / Modales                │  blur: 8,  tint: dark
│  ┌─────────────────────────────────────────┐│
│  │  CAPA 2 — Botones flotantes / Pills     ││  blur: 14, tint: light/dark
│  │  ┌───────────────────────────────────┐  ││
│  │  │  CAPA 1 — Bottom sheets / Bars   │  ││  blur: 20, tint: light/dark
│  │  └───────────────────────────────────┘  ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
                 MAPA (superficie)
```

### Specs por capa

#### Capa 1 — Sheets y bottom bars
```ts
// expo-blur BlurView
intensity: isDark ? 16 : 20
tint: isDark ? 'dark' : 'light'

// Borde superior (hairline)
borderTopWidth: StyleSheet.hairlineWidth
borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)'

// Sombra
shadowOpacity: isDark ? 0.20 : 0.08
shadowRadius: 32
shadowOffset: { width: 0, height: 12 }
shadowColor: '#000'
```

#### Capa 2 — Botones flotantes y pills sobre mapa
```ts
intensity: isDark ? 10 : 14
tint: isDark ? 'dark' : 'light'

borderWidth: StyleSheet.hairlineWidth
borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)'

shadowOpacity: isDark ? 0.16 : 0.06
shadowRadius: 16
shadowOffset: { width: 0, height: 4 }
```

#### Capa 3 — Modales / backdrops
```ts
intensity: 8
tint: 'dark'
// No shadow — el propio overlay es la señal de profundidad
```

### Regla: ¿Glass o surface sólido?

| Componente                      | Glass | Surface sólida |
|---------------------------------|-------|----------------|
| Bottom sheet sobre mapa         | ✓     |                |
| Botones flotantes sobre mapa    | ✓     |                |
| Modal sobre pantalla            | ✓     |                |
| Card de menú / lista de platillos |     | ✓              |
| Input de texto                  |       | ✓              |
| Header de pantalla sin mapa     |       | ✓              |

---

## 4. Tipografía

### Fuentes

| Rol          | Fuente                        | Dónde usar                                            |
|--------------|-------------------------------|-------------------------------------------------------|
| `Fonts.brand`| Plus Jakarta Sans 800ExtraBold| Nombre de negocio, taglines, hero text de marca       |
| UI           | SF Pro (sistema iOS)          | Labels, inputs, botones, metadata, body copy          |

### Escala y pesos

Solo dos pesos. Sin excepciones (salvo las documentadas abajo).

| Nivel        | fontSize | fontWeight | fontFamily   | letterSpacing | Uso                          |
|--------------|----------|------------|--------------|---------------|------------------------------|
| Display      | 32       | `'900'`    | Fonts.brand  | -0.5          | Títulos de pantalla          |
| H1           | 24–28    | `'900'`    | Fonts.brand  | -0.3          | Nombre de negocio en fichas  |
| Label sección| 11       | `'900'`    | sistema      | 1.8 (UPPER)   | Encabezados de sección       |
| Body         | 14–16    | `'300'`    | sistema      | 0             | Descripción, cuerpo          |
| Meta         | 12–13    | `'300'`    | sistema      | 0             | Horario, zona, categoría     |
| Dato grande  | 40–56    | `'900'`    | sistema      | -1.0          | Número editorial (rating, precio destacado) |

**Excepciones documentadas:**
- `'500'` en nombre de platillo en preview (legibilidad en lista densa)
- `'700'` en botón WhatsApp (convención de marca externa)

### Jerarquía editorial

El contraste **900 vs 300** es el mecanismo principal. Evitar pesos intermedios (`400`, `500`, `600`) en UI general — son el ruido que destruye el ritmo editorial.

---

## 5. Espaciado y Geometría

### Grid
- Múltiplos de 8px: `8 | 16 | 24 | 32 | 40 | 48`
- `gap` entre elementos relacionados: `4` (compacto) o `8` (normal)
- Padding horizontal de pantalla: `24`

### Radios

| Componente                      | borderRadius |
|---------------------------------|--------------|
| Sheets / panels grandes         | 28–32 (esquinas superiores) |
| Cards de contenido              | 20           |
| Botones primarios y cápsulas    | 14           |
| Botones flotantes cuadrados     | 16           |
| Pills de estado / categoría     | 100 (full)   |
| Inputs                          | 14           |

### Bordes

- Todos los bordes internos: `StyleSheet.hairlineWidth` — sin excepción.
- `borderWidth: 1` solo en botones de contorno primarios (acción principal negativa/outline).
- Nunca `height: 1` en separadores — siempre `StyleSheet.hairlineWidth`.

---

## 6. Mapa

El mapa es la pantalla heroica de Patio. Toda la UI del mapa debe partir de este principio.

### Estructura de capas (explorar.tsx)

```
┌──────────────────────────────────┐
│  Controles flotantes (Capa 2)    │  top bar: búsqueda, cuenta
│                                  │
│         MapView                  │  superficie principal
│         (full-bleed)             │
│                                  │
│  [velo LinearGradient]           │  rgba(0,0,0,0) → rgba(0,0,0,0.18)
│                                  │
│  Bottom sheet (Capa 1)           │  lugar seleccionado + lista
└──────────────────────────────────┘
```

### Pins

- **Neutro** (no seleccionado): punto 8–10pt, color `t.accent` con `opacity 0.7`
- **Seleccionado**: ring blanco 20pt + dot oscuro interior 8pt, `shadowRadius 8`, `shadowOpacity 0.20`
- Nunca emoji, icono, ni texto en el pin — el pin es señal de posición, no de información.

### Estilo de mapa (dark mode)
Muted gris oscuro: quitar saturación de calles, reducir labels al mínimo. El pin y el glass son los únicos elementos con contraste alto.

---

## 7. Componentes

### Bottom sheet (sobre mapa)
```ts
// Contenedor glass
BlurView intensity={isDark ? 16 : 20} tint={isDark ? 'dark' : 'light'}
borderTopLeftRadius={28} borderTopRightRadius={28}
borderTopWidth={StyleSheet.hairlineWidth}
borderTopColor={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)'}
shadowOpacity={isDark ? 0.20 : 0.08} shadowRadius={32}

// Handle
width={36} height={4} borderRadius={2}
backgroundColor={isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.14)'}
marginTop={12} marginBottom={16} alignSelf='center'
```

### Botón flotante cuadrado (sobre mapa)
```ts
BlurView intensity={isDark ? 10 : 14} tint={isDark ? 'dark' : 'light'}
width={44} height={44} borderRadius={16}
borderWidth={StyleSheet.hairlineWidth}
borderColor={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)'}
shadowOpacity={isDark ? 0.16 : 0.06} shadowRadius={16}
```

### Pill de categoría / estado activo
```ts
// Inactiva
borderRadius={100} paddingHorizontal={12} paddingVertical={6}
backgroundColor={t.surface} borderWidth={StyleSheet.hairlineWidth} borderColor={t.sep}
// Label: fontSize 12, fontWeight '300', color t.gray

// Activa (seleccionada)
backgroundColor={t.warm} // #F5C842
// Label: fontSize 12, fontWeight '900', color '#292929'
```

### Separador de lista
```ts
height={StyleSheet.hairlineWidth}
backgroundColor={t.sep}
marginLeft={16} // inset left para no tocar el borde
```

---

## 8. Animaciones

- Duración estándar: `200ms`
- Easing: `Easing.out(Easing.quad)` para aparición; `Easing.in(Easing.quad)` para salida
- Sheets: spring `{ tension: 65, friction: 11 }` para entrada desde abajo
- Transición de opacidad simple: `200ms`, sin spring

---

## 9. Criterio de calidad (checklist antes de cerrar)

Antes de hacer commit de cualquier cambio de UI:

- [ ] ¿Cada elemento tiene una función? (ruido cero)
- [ ] ¿El mapa sigue siendo la superficie heroica? (nada lo cubre innecesariamente)
- [ ] ¿Los pesos son solo 900 y 300? (sin 400, 500, 600 salvo excepciones documentadas)
- [ ] ¿Los separadores son hairlineWidth? (nunca height: 1)
- [ ] ¿Los paneles flotantes usan BlurView? (nunca fondo sólido sobre mapa)
- [ ] ¿El acento cálido (#F5C842) solo aparece en contexto de mapa/horario?
- [ ] `npx tsc --noEmit` pasa en verde

---

## 10. Anti-patrones (nunca hacer)

- `backgroundColor: 'white'` en un panel sobre el mapa — usar BlurView
- `fontWeight: '400'` o `'600'` en texto de UI — usar solo `'900'` o `'300'`
- Dos colores de acento distintos en la misma pantalla
- `borderWidth: 1` en separadores internos — usar `StyleSheet.hairlineWidth`
- Sombra con `shadowRadius > 32` o `shadowOpacity > 0.25`
- Gradiente visible en cards de contenido o inputs
- Texto en los pins del mapa
