# La Fondita — Reglas de diseño

## Contexto de producto — LEER PRIMERO

Antes de cualquier cambio de UI, copy o flujo, leer los siguientes documentos en este orden:

0. `docs/ROADCONTROLLER.md` — mapa operativo superior: frentes, estado, fuentes de verdad, no-mezcla
1. `docs/GOAL.md` — filosofía de producto, principios de experiencia, objetivos técnicos
2. `docs/PATIO_DESIGN_PRINCIPLES.md` — reglas de interacción, layout, copy y rol Fondero/Foodie
3. `docs/DESIGN_SYSTEM.md` — sistema de diseño completo: paleta, tipografía, glass, spacing, referencias REF-001 a REF-007
4. `docs/design/foundations/IDENTITY_AND_TYPE.md` — identidad de marca y sistema tipográfico
5. `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md` — biblia de diseño (WWDC17 Mike Stern): 12 principios + filosofía humano-no-usuario
6. `docs/HANDOFF.md` — estado actual y decisiones recientes
7. `docs/STATE.md` — estado de features y flujos

**Reglas de marca no negociables:**
- `"Saaaaaaabes."` es el tagline oficial de Patio — no modificar, no parafrasear, no "mejorar"
- `"¿Qué hay hoy?"` y `"Saaaaaaabes."` van SIEMPRE juntos como par de marca — nunca separados en una misma pieza
- **PROHIBIDO el lenguaje comparativo** "no es X, es Y" ("Esto no es un delivery…", "no es solo un menú…"). Es contaminación de identidad verbal: se afirma lo que Patio ES, sin apoyarse en negaciones (ley dictada 2026-07-07)
- El tono es humano, local, editorial — nunca genérico ni de marketing
- Fondero y Foodie son roles distintos con JTBDs distintos. **Derogado
  2026-08-24:** la prohibición total de "no mezclar ni contaminar sus
  flujos" quedó eliminada por decisión de Alejandro — estaba haciendo daño
  al bloquear que dos pantallas que resuelven el mismo problema (ej.
  Guardados y Menús: organizar una colección propia) compartan el mismo
  lenguaje visual y de interacción. Ahora la regla es la inversa: cuando dos
  pantallas hacen lo mismo, DEBEN compartir tarjeta/filtro/selección/vacío
  en vez de reinventarse por separado (ver caso Guardados↔Menús). Lo que
  sigue sin mezclarse es el CONTENIDO y el JTBD de cada flujo — un Fondero
  no ve lugares guardados, un Foodie no ve sus menús — no la forma en que se
  construyen las pantallas.
- **LEY TIPOGRÁFICA ABSOLUTA — CERO VIUDAS:** ningún título, subtítulo, párrafo,
  ayuda, alerta o CTA de varias palabras puede dejar una palabra sola en la
  última línea. Todo copy estático de UI debe pasar por `noWidow()` de
  `lib/typography`; el contenido dinámico se protege cuando se presenta como
  bloque editorial. Esta revisión es obligatoria en cada cambio de pantalla.
- **La pantalla funciona sin conocer el chat:** jamás exponer decisiones
  internas, campos pospuestos, arquitectura o contexto de implementación. El
  copy solo explica la acción presente y el beneficio que la persona necesita
  para decidir.

## Tipografía

> Corregido 2026-07-22 tras auditoría de contenido: esta sección describía un
> sistema aspiracional que nunca coincidió con lo que corre en producción.
> Lo de abajo es lo real, verificado contra 40+ estilos en `app/` y `components/`.

- **`Fonts.brand`** (Plus Jakarta Sans 800 ExtraBold, `lib/theme.tsx`) para
  identidad ≥ 20pt: títulos de pantalla, nombre de fondita, hero text, precios
  destacados. Es el sistema real — no SF Pro Display.
- **SF Pro Text** (default del sistema iOS, sin `fontFamily` explícito) para
  textos ≤ 19pt: labels, inputs, botones, descripciones, metadata.
- **fontWeight real**: `'900'` (títulos grandes con `Fonts.brand`) · `'700'`
  (eyebrows/labels UPPERCASE, texto de botón primario, tags) · `'300'` (cuerpo,
  secundario). `'600'` aparece de forma puntual en subtítulos de opción — no
  generalizar sin revisión. Excepción documentada: `'500'` en nombres de
  platillo en preview.

## Espaciado

- Múltiplos de 8px: `8 | 16 | 24 | 32 | 40 | 48`
- `gap` entre elementos: `4` (compacto) o `8` (normal)
- `borderRadius` estándar: `14` para botones y cápsulas

## Campos de texto agrupados
Cuando varios campos de texto forman un bloque semántico
(nombre + descripción + ubicación), tratarlos como unidad:
- marginBottom entre ellos: 2 máximo
- Sin separadores visuales dentro del bloque
- Referencia: densidad tipográfica de Apple Music (título/artista)

## Densidad de listas y menús (regla HIG)
En cualquier lista de contenido (menú, póster, historial, resultados):
- Nombre + descripción de un item son UNA unidad óptica: 1-2px de separación
- Filas de items: `paddingVertical 5-7` máximo
- Separación entre secciones: `10-14` — el doble que entre filas, nunca más
- El aire vive ENTRE grupos, no dentro de ellos (ley dictada 2026-07-13)

## Paleta

| Token   | Hex       | Uso                                      |
|---------|-----------|------------------------------------------|
| BG      | `#EFEFEF` | Fondo principal de la app                |
| BLACK   | `#292929` | Texto principal, botones primarios       |
| WHITE   | `#FFFFFF` | Superficie, cards, inputs                |
| BLACK60 | `rgba(41,41,41,0.5)` | Texto secundario, placeholders, iconos |

## Componentes

> **Regla de color de botones — homologada 2026-07-22.** Apple HIG (`color.txt`,
> sección Buttons): *"To emphasize primary actions, apply color to the
> background rather than to symbols or text... the system applies the app
> accent color to the background in prominent buttons... Refrain from adding
> color to the background of multiple controls."* Y: *"In apps with primarily
> monochromatic content... choosing your brand color as the app accent color
> can be an effective way to reflect your company's identity."* Patio es
> exactamente ese caso: paleta mono negro/blanco/gris + un acento de marca.
>
> Aplicación — **homologada 2026-08-16, sin ambigüedad**: si una pantalla
> tiene UNA acción claramente más importante que las demás (la cosa que se
> espera que la persona haga ahí), esa lleva el acento naranja de fondo —
> sin importar el verbo. "Guardar", "Publicar", "Continuar", "Enviar",
> "Comenzar", "Confirmar" cuentan igual: todos son la acción prominente de
> su pantalla si son la única con ese peso. No se decide caso por caso según
> si "suena" a guardar/confirmar — se decide por prominencia visual/jerarquía
> de la pantalla, punto. Solo se queda en negro cuando genuinamente NO hay
> una sola acción que destaque sobre las demás (varias acciones con el mismo
> peso, o la pantalla es puramente de navegación). Todo lo demás — botones
> secundarios, de contorno, navegación — se queda neutro. Nunca dos botones
> con fondo de color en la misma pantalla.
>
> **Única excepción, acotada y explícita (decisión 2026-08-16):** la
> secuencia de intro de marca — `entrada.tsx` y `onboarding.tsx` únicamente —
> usa vidrio (`BlurView`) en su CTA principal ("Entrar a Patio", "Continuar"),
> no naranja. Son pantallas hermanas de una misma pieza de identidad
> (botánica full-bleed, logo + par de marca), y cambiar una sin la otra las
> rompería como pareja. No uses esta excepción como precedente para otras
> pantallas — es específica a esas dos.

- **Botón de confirmación prominente** (la única acción destacada de la pantalla, sea cual sea su verbo — guardar/publicar/continuar/enviar/comenzar): **cápsula completa** — `borderRadius` = altura del botón / 2 (nunca 14; corregido 2026-09-06 tras auditoría: ningún botón de confirmación real en el código usa 14, y 6 de 11 instancias auditadas comparten radio-igual-a-mitad-de-altura de forma exacta e independiente, lo que confirma que es el patrón real homologado, no los 4 outliers en `Radius.card`/18 ni el caso aislado en 16). Fondo `ACCENT` (naranja), texto blanco `fontWeight '700'`. Referencia: `publishButton`/`saveButton` en `menu-composer.tsx` (`height 50, borderRadius 25`, comentario en código "cápsulas HIG en fila"), `saveBtn` en `perfil-editar.tsx` (`height 52, borderRadius 26`), `primary` en `menu-publicado.tsx` (`height 54, borderRadius 27`), `cta` en `preview.tsx` (`height 54, borderRadius 27`), `follow` en `foodie/[id].tsx` (`height 40, borderRadius 20`), `button` en `coleccion-publica/[id].tsx` (`height 48, borderRadius 24`).
- **Botones primarios compactos genéricos** (cuando no hay una única acción prominente que destacar): `borderRadius 14`, fondo `BLACK (#292929)`, texto blanco `fontWeight '700'`.
- **Botones de contorno**: `borderWidth 1.5`, fondo transparente. **Corregido 2026-09-06:**
  esta entrada decía `borderColor BLACK` (literal) — no es lo que corre en el código real.
  El borde siempre sale del token de paleta `border`/`t.border`/`c.border`
  (`rgba(17,18,20,0.08)` claro · `rgba(255,255,255,0.10)` oscuro, mismo valor que
  "Líneas y separadores" abajo), nunca un negro sólido. Un botón de contorno sin ese
  color explícito no "hereda" nada razonable — sale con el borde por defecto de RN, que
  no es ninguno de los dos tonos de la paleta (bug real encontrado y corregido en
  `historial.tsx`: los botones "Lista"/"Eliminar" de la barra de selección en lote eran
  los únicos elementos con borde en todo el archivo sin `borderColor` explícito).
- **Segmented control**: `borderRadius 14`, `borderWidth 1`, `overflow hidden`
- **Separadores**: `StyleSheet.hairlineWidth`, color `t.sep`
- **Placeholders**: `BLACK60`
- **Cards / inputs**: fondo `WHITE`, `borderRadius 14`

### Qué significa cada tratamiento de botón — auditoría 2026-09-06

Después de revisar todos los botones de la app (tamaños, radios, colores, comportamiento),
esto es lo que cada lenguaje visual COMUNICA — no son intercambiables, cada uno tiene un
rol específico y no debe usarse fuera de él:

- **Naranja (`ACCENT`) de fondo** = "esta es LA acción que se espera que hagas en esta
  pantalla, y solo hay una." Nunca decoración, nunca dos en la misma pantalla (ver regla
  homologada 2026-07-22/2026-08-16 arriba).
- **Negro (`BLACK #292929`) de fondo** = acción primaria genérica cuando NO hay una sola
  acción que destaque — sigue siendo "la más importante de las disponibles", pero sin el
  peso narrativo del naranja.
- **Contorno (borde de paleta, fondo transparente)** = acción secundaria o de igual peso
  entre varias — el caso típico es una barra de acciones en lote (seleccionar → "Lista" /
  "Eliminar" / "Compartir" en `favoritos.tsx` y `historial.tsx`): ninguna domina sobre
  las demás, así que ninguna lleva fondo de color.
- **Vidrio (`BlurView`/`GlassIconButton`)** = capa de NAVEGACIÓN/control flotante sobre
  contenido, nunca la capa de contenido en sí (ver "Materials" de Apple: *"Don't use
  Liquid Glass in the content layer"*). En Patio esto son íconos circulares de nav bar
  (cerrar, cámara, retroceder) — 38-44pt, `BlurView` + anillo `hairlineWidth`. **Regla
  añadida 2026-09-06 tras encontrar un botón zombi real:** todo `GlassIconButton` se ve
  tocable (círculo, blur, sombra) — por lo tanto DEBE reaccionar de verdad al toque.
  Un ícono con `onPress={() => {}}` (sin efecto) es un control roto disfrazado de
  funcional, no uno "discreto". Aplica igual a cualquier ícono de feedback/confirmación
  transitorio (ej. una palomita que confirma un guardado): debe desaparecer por una
  acción real de la persona (lo toca, o vuelve a editar lo que confirmaba) — nunca por
  un `setTimeout` arbitrario, porque si la persona no está mirando el nav en ese
  instante preciso, la confirmación desaparece sin que nadie la haya visto.
- **Ambas versiones, clara y oscura:** ningún tratamiento de botón cambia de ROL entre
  temas — el naranja sigue siendo naranja, el contorno sigue siendo contorno — solo
  cambian los valores de opacidad/rgba del borde y el blur (`intensity` 20 claro / 16
  oscuro para `BlurView`; `border` `rgba(17,18,20,0.08)` claro / `rgba(255,255,255,0.10)`
  oscuro). Si un botón se ve distinto por tema más allá de esos dos valores, es una
  desviación, no una variante válida.

## Ley visual — altas y formularios

- Acciones primarias compactas en tinta neutra; naranja como acento de
  selección, progreso actual y navegación, **y** como fondo de la acción de
  confirmación más prominente de la pantalla (ver "Componentes" arriba —
  regla homologada 2026-07-22).
- Campos con label persistente. Un ejemplo/placeholder nunca reemplaza la etiqueta.
- Controles nativos junto al dato que editan. Horas en iOS usan picker compacto
  anclado; prohibido envolver una edición atómica en un sheet inferior adicional.
- Ubicación se pide en contexto y ofrece ubicación actual + dirección manual.
- La introducción visual ocurre antes de elegir intención. “Ver qué hay hoy”
  conduce a avisos opcionales y mapa; “Publicar lo que preparo” omite avisos y
  conduce al acceso/alta del negocio.
- Alta y perfil deben importar el mismo editor de horarios y pagos; nunca mantener
  dos versiones visuales o conductuales de esos controles.
- En celebraciones, el nombre/identidad ocupa el centro geométrico exacto de la
  pantalla; instrucciones y acciones viven abajo con una primaria y una secundaria.
- Fuente completa: `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`,
  sección “Patrón confirmado: altas y formularios Patio”.

## Glass y superficies flotantes

Panels flotantes (sheets, bottom bars, overlays, controles sobre mapa) deben usar `BlurView` de `expo-blur`, nunca fondo sólido:
- `intensity`: `20` (claro) / `16` (oscuro)
- `tint`: `"light"` o `"dark"` según tema
- Borde encima del blur: `borderWidth StyleSheet.hairlineWidth`, `borderColor rgba(255,255,255,0.18)` en claro — `rgba(255,255,255,0.10)` en oscuro
- Sombra: `shadowOpacity 0.08` claro / `0.20` oscuro, `shadowRadius 32`, `shadowOffset { width:0, height:12 }`
- Cards de contenido (menú, lista) NO usan blur — fondo `t.surface` normal

## Gradientes

Usar `LinearGradient` de `expo-linear-gradient` para:
- Overlay de velo sobre mapa: de `rgba(0,0,0,0)` a `rgba(0,0,0,0.18)` (bottom-to-top)
- Fondos de hero/header en fichas: mismo color del bg ± 6% luminosidad
- Nunca gradiente visible en cards de contenido ni en inputs

## Líneas y separadores

- **Todos** los bordes internos: `StyleSheet.hairlineWidth` sin excepción
- Color de borde en claro: `rgba(0,0,0,0.08)` — en oscuro: `rgba(255,255,255,0.10)`
- `borderWidth 1` solo en botones de contorno primarios
- Separadores de lista: `StyleSheet.hairlineWidth`, nunca `height 1`

## Tipografía — jerarquía visual

- Títulos de pantalla: `fontSize 32-38`, `fontWeight '900'`, `fontFamily Fonts.brand`, `letterSpacing -0.5` a `-1.3`
- Labels de sección: `fontSize 11`, `fontWeight '700'`, `letterSpacing 1.6-1.8`, `UPPERCASE` (no `'900'` — corregido 2026-07-22, así es como corre en producción)
- Metadata/subtítulo: `fontSize 13`, `fontWeight '300'`, `opacity 0.6`
- El contraste 900 (identidad) / 700 (labels y CTA primario) / 300 (cuerpo) es el mecanismo de jerarquía — evitar pesos intermedios fuera de estos tres

## Radios y geometría

- Sheets y panels grandes: `borderRadius 28-32` (solo esquinas superiores cuando están pegados al borde)
- Botones de acción flotantes (cuadrados): `borderRadius 16`
- Pills y cápsulas de estado: `borderRadius 100`
- Cards de contenido: `borderRadius 18` (corregido 2026-08-17: `Radius.card` real en `lib/theme.tsx` es 18, la documentación decía 20 por error)

## Convenciones de código

- Estilos en `makeStyles(t: Theme)` que recibe el tema — nunca hardcodear colores fuera de paleta
- Nombres de sección en `UPPERCASE` con `letterSpacing`
- Animaciones con `Animated` de React Native, duración estándar `200ms`
- Importar `BlurView` de `expo-blur` y `LinearGradient` de `expo-linear-gradient` cuando aplique
