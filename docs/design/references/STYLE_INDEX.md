# STYLE INDEX — Referencias Visuales de Patio

> Cada referencia incluye análisis de qué extraer y dónde aplicarlo en Patio.
> Para agregar una nueva referencia: pega la imagen en `docs/design/references/`, nómbrala según la convención, y agrega una entrada aquí.

## Convención de nombre
`categoria_descripcion_fuente_vNN.png`
Ejemplos: `mapa_glass-bottomsheet_behance_v01.png`, `tipografia_editorial-numeros_whoop_v01.png`

---

## Entradas

### REF-001
- Archivo: `minimalismo_layout.png`
- Fuente: App de trail/ruta (desconocida, probablemente Concept/Behance)
- Qué nos gustó:
  - Mapa nocturno azul como superficie heroica full-bleed
  - Bottom sheet glass translúcida con handle discreto
  - Controles (búsqueda, 3D) como pills flotantes en top
  - Tipografía compacta: dato grande (`10 h 11m`) + micro-label (`Climbing Time`) — patrón 900/300
  - Cero ruido de chrome; toda la pantalla respira
- Aplicación en Patio: Bottom sheet de `explorar.tsx`; estilo nocturno del mapa; pill de acción `Custom Route` → similar a nuestro botón de share/favoritos
- Prioridad: Alta

---

### REF-002
- Archivo: `mapa_botones_miniamlismo_colores_typo.png`
- Fuente: App de logística/entrega (desconocida)
- Qué nos gustó:
  - Mapa light con UI casi invisible — botones de control como pills grises tiny
  - Card de acento amarillo-cálido en bottom: fondo sólido, dato bold y mono
  - Tipografía de datos: `01:37` en peso ultra-heavy, `+48 min` en pill secundaria
  - Sin sombras agresivas; todo se sostiene por contraste de color
  - Separación clara entre "superficie del mapa" y "panel de datos"
- Aplicación en Patio: Acento cálido (`#F5C842`) para horario activo / lugar seleccionado; estilo de botones flotantes sobre mapa; jerarquía editorial de datos horarios en bottom sheet
- Prioridad: Alta

---

### REF-003
- Archivo: `interfaz dinamica.png`
- Fuente: WHOOP (app de salud/wearables)
- Qué nos gustó:
  - Fondo negro profundo (`#0A0A0A`) con superficie crema/sand orgánica — contraste máximo
  - Un número editorial gigante (`23.3`) + micro-label light debajo — patrón dato-principal + contexto
  - Iconos en fila: circle 44pt glass sobre negro, sin label
  - Paleta monochromática: negro + crema + un solo accent verde (`▲`)
  - Sin bordes visibles: la forma de la superficie ES el borde
- Aplicación en Patio: Jerarquía de datos en ficha de patio (rating grande + micro-label); modo oscuro con superficie `#1C1C1E` (no crema — Patio es más urbano); icon row de acciones en patio detail
- Prioridad: Media-Alta

---

### REF-004
- Archivo: `fondo degradado-minimalismo.png`
- Fuente: Dashboard de vuelos "Velox" (concepto Behance/Dribbble)
- Qué nos gustó:
  - Dark premium: fondo `#0D1A14` (verde-charcoal) con textura sutil — no negro plano
  - Mapa como elemento luminoso/heroico en la mitad superior
  - Cards glass con borde sutil y fondo semi-transparente
  - Tipografía: blanca peso light sobre dark — muy legible, muy limpio
  - Separación en columnas sin separadores explícitos — el espacio hace el trabajo
  - CTA verde (`$900`) como único acento de color
- Aplicación en Patio: Estética general del dark mode; mapa como hero luminoso en explorar; referencia de spacing entre columnas en listas; modelo de CTA-acento único
- Prioridad: Media

---

### REF-005
- Archivo: `composicion_modular.png`
- Fuente: Dashboard de productividad modular (concepto Behance/Dribbble)
- Qué nos gustó:
  - Fondo crema cálido (`#F5EDE0` aprox.) — da calidez sin perder legibilidad
  - Cards modulares flotantes: fondo blanco, borderRadius grande (~20pt), sombra muy sutil
  - Acento naranja/teja solo en datos clave (gráfica, número resaltado) — nunca decorativo
  - Bottom tab: pill redondeada, ícono activo con fondo de acento — no tab bar genérico
  - Tipografía: número grande 900 + label 300 debajo — patrón dato-principal/contexto
  - Separación entre módulos por espacio, no por líneas visibles
  - El calendario integrado como módulo — misma jerarquía que el resto del contenido
- Aplicación en Patio:
  - Referencia de composición modular para futura pantalla de perfil fondero (cards de stats)
  - El acento cálido como dato único confirma el uso de `#F5C842` solo en horario/selección
  - Modelo de bottom tab como pill activa (no tab bar plano) — revisar cuando hagamos tab nav real
  - Temperatura general de la UI: más cálida que gris frío — refuerza el off-white `#EFEFEF` de bg
- Prioridad: Media

---

## Cómo agregar una nueva referencia

1. Guarda la imagen en `docs/design/references/` con el nombre correcto
2. Agrega una entrada aquí con este formato:

```markdown
### REF-XXX
- Archivo: `nombre_archivo.png`
- Fuente: (app, sitio, cuenta de Behance/Dribbble)
- Qué nos gustó:
  - punto 1
  - punto 2
- Aplicación en Patio: (pantalla o componente específico donde aplicar)
- Prioridad: Alta / Media / Baja
```

3. Si la referencia contradice algo del VISUAL_SYSTEM.md, discutirlo antes de aplicar — el sistema visual tiene precedencia salvo decisión explícita.
