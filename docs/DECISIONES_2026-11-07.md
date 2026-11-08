# Decisiones y aterrizaje — 2026-11-07 (Claude con Parco)

**Lado difícil hoy:** el negocio que publica su menú diario.

Este documento aterriza las preguntas técnicas y de diseño del 7 de noviembre.
Lo que aquí queda «propuesto» necesita el sí de Parco antes de construirse.

---

## 1. Cobro: stack directo con Apple y Google (sin RevenueCat)

### Qué usan las empresas grandes

En contenido digital vendido dentro de la app, Apple (regla 3.1.1) y Google
obligan a usar su sistema de pago. Las empresas grandes que cobran dentro de
la app (Duolingo, Tinder, Calm, Strava) arman este mismo stack con su propio
servidor:

| Pieza | iPhone | Android |
|---|---|---|
| Compra en el teléfono | StoreKit 2 | Play Billing Library |
| Verificación en el servidor | App Store Server API (transacción firmada JWS) | Google Play Developer API (`purchases.subscriptionsv2`) |
| Avisos de renovación, cancelación y reembolso | App Store Server Notifications V2 | Real-time developer notifications (Cloud Pub/Sub) |
| Fuente de verdad del plan | Tabla propia (`business_plans` en Supabase) | La misma tabla |

Spotify y Netflix no cobran dentro de la app: mandan a pagar en su web con
tarjeta. En México eso no conviene hoy: obliga a tener checkout web, facturación
y cobro propio, y Apple limita los enlaces a pagos externos.

RevenueCat es el intermediario más usado del mercado para esto (no es chafa),
pero agrega una dependencia y una comisión (1 % arriba de cierto ingreso).
Con un solo producto, ir directo es razonable y deja todo en Supabase.

### Comisiones

- Apple, programa de pequeñas empresas (< USD 1 M al año): **15 %**.
- Google, suscripciones: **15 %**.
- Ambas tiendas cobran y enteran el IVA en México. Confirmar en los contratos
  de cada consola.

### Paso a paso

1. **Contratos.** En App Store Connect: Paid Apps Agreement, cuenta bancaria y
   datos fiscales. En Play Console: perfil de pagos. Sin esto, ninguna compra
   funciona ni en pruebas de tienda.
2. **Productos.**
   - Apple: grupo de suscripción «Patio Pro» con `pro_mensual` (y, más
     adelante, `pro_anual`), más la oferta de introducción «30 días gratis».
   - Google: suscripción `pro` con plan base mensual y oferta de prueba de 30 días.
   - Opcional: consumibles `avisos_10` (paquetes de avisos especiales).
3. **Cliente.** Cambiar `react-native-purchases` por `expo-iap` (StoreKit 2 y
   Play Billing). Requiere un build nativo nuevo.
4. **Compra.** El negocio toca «Probar Pro», la tienda cobra y devuelve la
   transacción. La app la manda a la función `verify-purchase`, que la valida
   con Apple o Google y escribe `business_plans`. La app solo lee esa tabla.
5. **Avisos de la tienda.** Dos funciones nuevas: `apple-notifications` (URL en
   App Store Connect) y `google-notifications` (push de Pub/Sub). Atienden
   renovación, cancelación, reembolso, periodo de gracia y cobro fallido.
   Reemplazan a `revenuecat-webhook`.
6. **Restaurar compras.** Apple lo exige: botón en Tu plan.
7. **Pruebas.** Testers de sandbox de Apple y archivo StoreKit local; testers
   con licencia en Play. Todo sin cobros reales.
8. **Revisión.** La pantalla de pago debe mostrar precio, periodo, renovación
   automática y enlaces a términos y privacidad (regla 3.1.2). Esto depende del
   dominio.
9. **Fundadores.** Usar los **offer codes** de Apple y los **códigos
   promocionales** de Google para regalar 6 meses de Pro sin tocar SQL a mano.

### Modos de cobro posibles

| Modo | Qué es | Patio |
|---|---|---|
| Gratis | Todo sin pagar | Lo que hace funcionar la red: publicar, compartir, avisar |
| Freemium | Gratis generoso + plan de pago opcional | **El modelo de Patio** |
| Prueba gratis | Pro completo N días; luego cobra si no cancelas | 30 días (Jev: menos presión) |
| Oferta de introducción | Primer periodo con descuento | No por ahora |
| Suscripción mensual o anual | Renovación automática | Mensual primero; anual después |
| Consumible | Paquete que se gasta (avisos, lecturas) | Candidato: lo prefirieron fondera y venta en casa |
| No consumible | Compra única para siempre | No aplica |
| Código de oferta | Meses gratis por invitación | Fundadores |

---

## 2. Planes: técnicas tipo Higgsfield contra Jev y el libro

### Técnicas de precio de Higgsfield

La página de precios se arma con JavaScript y la descarga automática no la
pudo leer. Lo de abajo sale de observación previa y no está verificado hoy.

- Precio por **créditos**: cada generación gasta créditos.
- Tres o cuatro niveles; el caro sirve de **ancla**.
- Insignia «Most popular» en el nivel medio.
- Anual preseleccionado con descuento grande.
- Precio tachado y **ofertas con cuenta regresiva**.
- Promesas de «unlimited» acotadas a ciertos modelos.
- Paquetes extra de créditos.
- Prueba social: «40M+ creators», Fortune 500.

### Lo que dijo Jev (2026-11-07)

Script en `docs/research/jev_planes_negocio_2026-11-07.py`, datos en el `.json`
del mismo nombre. Jev es asesoría, no aprobación. Escala 0–4.

| Opción | Fondera 52 | Cocina 34 | Venta en casa 29 |
|---|---|---|---|
| a. Anual preseleccionado (estilo Higgsfield) | pagaría 1.65 · presión 2.21 | 2.13 · 1.73 | 1.32 · 2.14 |
| b. 30 días gratis, luego $99/mes | 2.07 · 1.29 | **2.56 · 0.85** (elige) | 1.89 · 1.12 |
| c. Paquetes sin mensualidad | **2.06 · 1.33** (elige) | 2.54 · 1.30 | **2.04 · 1.09** (elige) |
| d. Fundador 6 meses gratis | 1.99 · 1.49 | 2.54 · 1.44 | 1.88 · 1.59 |
| e. Cuenta regresiva $49 | 1.71 · 2.42 | 2.32 · 1.95 | 1.64 · 2.35 |

**Lectura:** las técnicas agresivas de Higgsfield (anual preseleccionado,
cuenta regresiva) son las que más presión generan y las que menos confianza
dan en los tres perfiles. Con el lado difícil siendo el negocio, no se usan.

### Propuesta de planes (para decidir)

1. **Gratis** igual que hoy.
2. **Pro $99/mes con 30 días gratis.** Lo eligió la cocina; es la opción con
   menor presión.
3. **Paquetes de avisos especiales como consumible** (p. ej. 5 avisos), para
   quien no quiere mensualidad. Lo eligieron la fondera y la venta en casa.
4. **Fundadores:** 6 meses de Pro con código de oferta.
5. Anual cuando haya retención medida, sin preseleccionarlo.

De Higgsfield sí se toma: comparación clara, un solo nivel destacado y prueba
social real («120 negocios en Narvarte») cuando exista.

---

## 3. *The Cold Start Problem* (Andrew Chen) — mapa de técnicas

Son conceptos parafraseados con el nombre que usa el libro. No es el texto
del autor (no se reproduce). Cada concepto trae su regla para Patio.

### Marco

| Concepto | Qué dice | Patio |
|---|---|---|
| **Network effect** | El producto vale más mientras más gente lo usa | Más negocios publicando = mapa más útil |
| **Cold Start Problem** | Una red nueva con pocos usuarios no sirve y la gente se va | Mapa sin menús de hoy = nadie vuelve |
| **Anti-network effects** | Fuerzas que hacen que la red sin densidad se destruya | Abrir en toda la ciudad a la vez lo provoca |

### Etapa 1 — Cold Start

| Concepto | Qué dice | Regla Patio |
|---|---|---|
| **Atomic network** | La red más pequeña que ya funciona sola; se arma una y se copia | Una colonia (piloto) con 20–30 negocios publicando |
| **Hard side** | El lado escaso que hace casi todo el trabajo | El negocio que publica a diario |
| **Solve a hard problem** | El producto debe resolverle algo serio al lado difícil | Foto → menú listo y compartible en segundos |
| **Killer product** | Producto simple que crea la red | Leer el menú con foto y compartirlo como imagen |
| **Magic moment** | Instante en que el usuario siente el valor de la red | El Foodie abre y ve el menú de hoy de sus lugares |

### Etapa 2 — Tipping point (técnicas de arranque)

| Técnica | Qué es | Regla Patio |
|---|---|---|
| **Invite-only** | Entrar por invitación crea deseo y densidad | Fundadores y Creadores por invitación |
| **Come for the tool, stay for the network** | Primero una herramienta útil sin red; luego la red retiene | Póster del menú sirve aunque nadie más use Patio |
| **Paying up for launch** | Subsidiar al lado difícil (dinero, beneficios) | Pro gratis 6 meses a Fundadores; nunca cobrarle al lado difícil |
| **Flintstoning** | Hacer a mano lo que el producto aún no automatiza | Alta en persona; publicar el menú por ellos los primeros días |
| **Always be hustlin'** | Trabajo manual y creativo del equipo en el arranque | Visitas a fondas, cartel con QR, WhatsApp |
| **Big-bang launch** (antipatrón) | Lanzar a todos a la vez falla sin redes atómicas | Lanzar por colonia, no en toda la CDMX |

### Etapa 3 — Escape velocity (los tres efectos)

| Efecto | Qué es | Palanca Patio |
|---|---|---|
| **Engagement effect** | Más red = más uso por persona | Avisos de lugares seguidos, «De quienes sigues» |
| **Acquisition effect** | La red se trae sola nuevos usuarios (viralidad) | Póster + enlace web compartido por WhatsApp |
| **Economic effect** | Con la red, conversión y monetización mejoran (aquí entra **freemium**) | Pro se vende mejor cuando ya hay seguidores que avisar |

### Etapa 4 — Hitting the ceiling

| Concepto | Qué dice | Riesgo Patio |
|---|---|---|
| **Saturation** | Se acaba el mercado de la red atómica | Colonia saturada → abrir la siguiente |
| **Law of Shitty Clickthroughs** | Cada canal de marketing se gasta | No depender de un solo canal (p. ej. Facebook) |
| **Eternal September** | Llegan usuarios nuevos que rompen la cultura | Reglas de comunidad y moderación |
| **Context collapse** | Demasiadas conexiones distintas apagan la participación | Avisos por lugar y silenciar |
| **Trolls / spam** | Abuso a escala | Reportes, bloqueos, límites antiabuso |
| **Overcrowding** | Demasiada oferta y nadie encuentra nada | Orden por cercanía y abiertos hoy |

### Etapa 5 — The moat

| Concepto | Qué dice | Patio |
|---|---|---|
| **Vicious / virtuous cycle** | El efecto de red en la competencia: el que tiene más red gana | Densidad por colonia antes que la competencia |
| **Cherry-picking** | Robar al lado difícil del rival con algo mejor | Proteger a los negocios: herramienta gratis y buena |
| **Big guy vs. underdog** | El grande copia; el chico gana en nichos | Ganar fondas y venta en casa, que las apps grandes no atienden |

---

## 4. APNs y FCM

Un aviso push no lo manda la app, sino el servidor del fabricante del teléfono:

- **APNs** (Apple Push Notification service) es el cartero de Apple. Solo él
  puede despertar un iPhone con un aviso. Patio ya tiene su llave APNs en Expo.
- **FCM** (Firebase Cloud Messaging) es el cartero de Google para Android.
  Patio ya tiene la cuenta `patio-expo-push` y FCM V1 cargado en Expo.

El recorrido completo: la app pide permiso y recibe un *token* (la dirección del
teléfono). Lo guarda en Supabase. Cuando un lugar publica, la función de
Supabase manda el aviso al servicio de Expo, Expo lo entrega a APNs o FCM y
ellos lo llevan al teléfono. Falta comprobarlo en un Android real.

---

## 5. Avisos por servidor — lista completa

| # | Aviso | Para | Estado | Preferencia |
|---|---|---|---|---|
| 1 | Menú de hoy de un lugar que sigues | Foodie | ✅ (tope 3/día) | Menú de hoy + por lugar |
| 2 | Aviso especial (Pro) | Foodie | ✅ | Promociones |
| 3 | Reseña nueva | Negocio | ✅ | Reseñas nuevas |
| 4 | Comentario a tu reseña / respuesta del negocio | Foodie | ✅ | Comentarios y seguidores |
| 5 | Te quieren seguir / nuevo seguidor | Ambos | ✅ | Comentarios y seguidores |
| 6 | Reporte de contenido | Soporte | ✅ | — |
| 7 | **Me gusta a tu reseña** | Foodie | Falta | Comentarios y seguidores |
| 8 | **Nuevos seguidores del lugar** (agrupado) | Negocio | Falta | Resumen del día (§6) |
| 9 | **Me gusta a tus platillos** (agrupado) | Negocio | Falta | Resumen del día (§6) |
| 10 | **Cambio de hoy** («hoy no abrimos», «abrimos hasta las 8») | Foodie | Falta | Menú de hoy |
| 11 | Novedades de Patio | Ambos | Falta, opt-in, envío manual | Novedades (apagado) |
| 12 | Lugares nuevos cerca | Foodie | Falta, requiere guardar zona | Lugares nuevos (apagado) |

**Diseño:** 7 y 10 son avisos inmediatos. 8 y 9 nunca se mandan uno por uno:
viajan en el resumen diario. 11 y 12 quedan ocultos hasta existir (regla:
nunca ofrecer algo que no existe). Orden de construcción: 10 → resumen diario
(8 y 9) → 7 → 11 → 12.

---

## 6. Resumen diario del negocio (y del Foodie)

Sí: el resumen tiene que darle utilidad real al negocio, no solo números.

- **Negocio, a la hora que elija (sugerida 18:00):** «Hoy 34 personas vieron
  tu menú, 5 te empezaron a seguir y tu platillo más gustado fue la milanesa».
  Si no publicó, no se manda. Tocarlo abre Tu racha.
- **Foodie:** sin resumen diario; el aviso de las 13:00 ya cumple esa función.
- **Hora elegible:** una fila en Notificaciones («Recordatorio a las 10:00»,
  «Resumen a las 18:00») con selector compacto anclado.
- **Técnica:** `pg_cron` cada 15 minutos llama a una función que manda a
  quienes coinciden con su hora local. Los datos ya existen
  (`business_stats` y `business_insights`).
- **Dashboard:** Tu racha ya es el tablero. Le faltan tendencia de vistas por
  semana y «qué platillo te trajo más seguidores».

---

## 7. Clave antigua de Anthropic

Revocarla una sola vez la deja resuelta para siempre. Hoy la app no lleva
ninguna clave; la vigente vive solo en los secretos de Supabase. Solo habría
que volver a rotar si una clave se filtra otra vez. Queda como último pendiente.

---

## 8. Registro obligatorio y medición de usuarios

- Apple (regla 5.1.1 v) rechaza apps que obligan a crear cuenta para usar
  funciones que no dependen de ella. Google Maps, Uber Eats y TikTok dejan ver
  sin cuenta.
- **Propuesta:** al abrir por primera vez, Patio crea una **sesión anónima**
  (Supabase anonymous sign-in). Así cada instalación ya es un usuario contable:
  activos por día, retención y búsquedas.
- La cuenta con correo se pide en el momento de valor: seguir un lugar,
  reseñar o publicar (el negocio siempre se registra). La sesión anónima se
  convierte en cuenta y conserva lo que ya hizo.
- Resultado: se sabe cuántos usuarios hay, no solo tráfico, sin poner una
  barrera en la primera visita.

---

## 9. Página web y enlace de descarga

Son las dos cosas en el mismo dominio:

- `quehayhoy.mx/app` detecta el teléfono y manda a App Store o Play.
- `quehayhoy.mx/l/{lugar}` es la página de cada lugar: menú de hoy, precio,
  póster como vista previa en WhatsApp y «Abrir en Patio». Si tienes la app,
  abre la ficha (universal links).
- `quehayhoy.mx/privacidad`, `/terminos` y `/eliminar-cuenta`.
- Cada visita web cuenta con parámetros de origen, para saber qué lugar trae
  más descargas.

---

## 10. Filtro de Mapa y Guardados — qué significa la duda

En Mapa (Cerca de ti) y en Patios (lugares que sigues) hay una lista con el
mismo botón de filtros: abiertos ahora, giro y precio. La duda era si al
filtrar «Fondas» en el mapa, Patios también debe quedar filtrado (un filtro
compartido) o si cada lista recuerda el suyo.

**Recomendación:** el mismo componente, con estado separado. Lo que filtras al
buscar en el mapa no debe esconderte tus lugares.

---

## 11. Avisos especiales (flyer) — casos de uso

Plantillas listas, con foto opcional del negocio:

| Caso | Ejemplo | Campos |
|---|---|---|
| Platillo especial | «Hoy hay pozole» | Platillo, precio, foto |
| Promoción | «2×1 en aguas» / «10 % de descuento» | Qué, condición, vigencia |
| Cambio de hoy | «Hoy no abrimos» / «Abrimos hasta las 8» | Motivo, horario |
| Evento | «Viernes de mariscos» | Día, hora |
| Nuevo en el menú | «Llegaron las enchiladas suizas» | Platillo, foto |

El negocio elige plantilla, escribe poco y puede subir su imagen. Patio arma el
póster con su identidad, para que no se vea genérico ni como flyer de
imprenta. El cambio de hoy es gratis y operativo; los demás son de Pro.

---

## 12. Lector del menú

No es OCR clásico. La función `read-menu` manda la foto a un modelo de visión
(Claude Sonnet) que entiende platillos, secciones y precios aunque estén escritos
a mano en un pizarrón. La prueba con un menú real es el QA correcto: anotar qué
leyó mal (precio, sección, platillo inventado).

---

## 13. Miniatura del local (referencia Uber Eats)

- Uber Eats pide al restaurante una **foto de portada** horizontal y un logo.
  Sin foto, muestra la de un platillo o un fondo genérico de la categoría.
- **Patio:** foto de portada subida por el negocio en alta y en Editar mi
  negocio («Tu fachada o tu mejor platillo»), recorte 16:9 para la ficha y
  cuadrado para la tarjeta del grid.
- **Respaldo:** ícono del giro (PatioGiros) sobre color plano, nunca vacío.
- **Calidad:** al subirla, validar luz y tamaño mínimo; sin texto encima.

---

## 14. Concurrencia («muy concurrido») como Google Maps

**Cómo lo hace Google:** usa el Historial de Ubicaciones de millones de
personas que lo activaron. Detecta visitas al lugar, arma un histograma por
hora y día de la semana, lo normaliza contra la hora pico (0–100) y compara la
hora actual contra el promedio para decir «más concurrido de lo normal».
Agrega ruido estadístico (privacidad diferencial) y no muestra nada sin
suficientes visitas.

**Patio hoy no puede hacerlo «100 %».** Le faltan visitas reales: pedir
ubicación «siempre» a los Foodies es invasivo y Apple lo revisa con lupa.

**Propuesta honesta, en orden:**

1. **«Horas con más interés en Patio»:** histograma de vistas de ficha y
   «Cómo llegar» por hora. Ya se calcula para Pro. Se muestra público solo con
   un mínimo de datos (p. ej. ≥ 30 eventos por franja en 4 semanas).
2. **Estado en vivo del negocio:** el negocio toca «Hay lugar / Lleno / Se
   acabó» (ya existe «Se acabó por hoy»).
3. **Visitas confirmadas:** «Estoy aquí» al reseñar o al abrir la ficha a
   menos de 50 m (solo con la app abierta). Con densidad, esto se vuelve el
   histograma tipo Google.

Nunca escribir «muy concurrido» con datos de interés: el texto debe decir lo
que mide.

---

## 15. Onboarding estilo Leica LUX (propuesta)

Referencias: 12 capturas en `~/Downloads/IMG_9802–9814`. No se recorrió en la
App Store: no hay iPhone ni navegador conectado en esta sesión.

**Qué hace bien Leica:**

- Logo y titular arriba, imagen en medio (mockup del teléfono con la función
  real) y texto corto abajo, con las **palabras clave en negrita**.
- Puntos de progreso, «Siguiente» sólido y «Omitir» en texto.
- **Pantalla de permisos** que lista cada uno con ícono y para qué sirve. El
  permiso nativo se pide al tocar cada uno y queda una palomita.
- Inicio de sesión opcional («Quizás más tarde»).
- Consentimiento de datos explicado.
- La pantalla de pago va al final, con prueba gratis, ahorro, prueba social,
  «Restaurar compras» y enlaces legales.

**Patio — Foodie:**

1. Portada: collage de platillos y fondas, logo, par «¿Qué hay hoy?» /
   «Saaaaaaabes.», botón Comenzar.
2. «Mira el **menú de hoy** en el mapa» (mockup del mapa).
3. «**Sigue** tus lugares y entérate cuando publican» (mockup de la ficha).
4. «Arma tus **listas** y compártelas» (mockup de listas).
5. Permisos: Ubicación («para ver lo que hay cerca»), Notificaciones («para
   saber cuando publican tus lugares»).
6. Cuenta: «Crea tu cuenta» + «Quizás más tarde» (ver §8).

**Patio — Negocio:**

1. Portada.
2. «Toma **una foto** de tu menú».
3. «Patio la **lee y la arma**».
4. «**Avisa** a quienes te siguen».
5. Alta.

Sin pantalla de pago en el onboarding: es el lado difícil.

**Choques con reglas vigentes (Parco decide):**

- `NOTIFICATION_ARCHITECTURE` dice «el permiso nativo no se pide en
  onboarding». La pantalla de permisos de Leica lo pediría ahí, explicado.
- La excepción de vidrio en `entrada.tsx`/`onboarding.tsx` contra el CTA
  sólido de Leica: en Patio sería naranja.
- El 2026-11-03 se decidió un onboarding de una sola pantalla; esta propuesta
  lo vuelve un recorrido de 4–6 pantallas.

---

## 16. Decisiones registradas hoy

- [x] Listas de Menús: **se quedan** por ahora.
- [x] Cobro: directo con Apple y Google, sin RevenueCat (stack en §1).
- [x] QA en teléfono y operación de red: siguen pendientes, sin cambios.
- [x] Clave de Anthropic: último pendiente; revocarla una vez la cierra.
- [ ] Planes: aprobar la propuesta de §2.
- [ ] Registro: aprobar sesión anónima + cuenta en el momento de valor (§8).
- [ ] Onboarding Leica: aprobar estructura y resolver los choques (§15).
- [ ] Concurrencia: aprobar el enfoque honesto en tres pasos (§14).

---

## 17. Segunda ronda (2026-11-07, tarde)

Propuesta visual: `artifacts/propuesta-2026-11-07-v2.html`.

- **Registro:** no obligatorio. Sesión anónima al abrir; la cuenta se pide al
  seguir, reseñar o publicar. «Quizás más tarde» en el onboarding.
- **Dominio:** sí, comprarlo (Parco). Lo necesitan privacidad, términos, la
  página de cada lugar, el QR del cartel y el enlace de descarga.
- **Filtro Mapa/Patios:** decidido por el lado difícil: mismo componente,
  memoria separada. Filtrar en el mapa nunca esconde los lugares que sigues
  (son los que hacen que el negocio vea respuesta).
- **Avisos — gramática única (aplicada en código):** título = quién; cuerpo =
  el hecho en una línea con punto. Menú: «Fonda Poblana / Publicó su menú de
  hoy.» Aviso: «Doña Mary / Hoy abrimos a las 8 pm.» (la notificación ya es el aviso: no se repite la palabra) «Cambio de hoy» se
  retira como nombre. Resumen del negocio: «Hoy / 34 personas vieron tu menú.»
- **Avisos de operación gratis; promociones con flyer en Pro.** El aviso de
  cerrado/horario/se acabó protege la red y le demuestra al negocio que avisar
  funciona; eso es lo que después vende Pro.
- **Venta de Pro como Uber:** tarjeta dentro de Hoy, junto al dato que la
  justifica («Tus 48 seguidores ya están aquí»). Nunca por push.
- **Hoy (dashboard):** un número grande (vistas del día) con comparación
  contra su día normal; gráfica semanal con barra de hoy resaltada y línea de
  promedio; seguidores, me gusta y lo más gustado en tres mosaicos chicos; el
  resto en «Ver todo».
- **Notificaciones:** «Pausar todo» + tres filas por rol, como Instagram.
- **Flyers:** cinco plantillas (platillo especial, promoción, evento, nuevo en
  el menú, aviso) con el mismo esqueleto y foto opcional.
- **Onboarding:** adaptar Leica (§15) + paso «La foto de tu lugar» en el alta
  y en Editar mi negocio.
- **Marca en la calle:** cartel con QR, sticker de ventana y sello Fundador.
- **Listas:** en espera.

### Concurrencia real como Google («sí o sí»)

Plan técnico, por etapas:

1. **Permiso opcional** en la pantalla de Permisos: «Ayuda a mostrar qué tan
   lleno está cada lugar» → ubicación «Siempre» (iOS) / en segundo plano
   (Android). Sin él, Patio funciona igual.
2. **Detección de visitas en el teléfono:** geocercas (`expo-location` +
   `expo-task-manager`) en los 20 lugares más cercanos (límite de iOS), que se
   renuevan con cambios grandes de ubicación. Visita = entrar y quedarse al
   menos 8 minutos.
3. **Anónimo:** solo se manda «lugar + hora». Sin id de usuario; un hash
   diario del teléfono evita contar dos veces la misma visita.
4. **Servidor:** cada noche, histograma por día de la semana y hora de las
   últimas 8 semanas, normalizado contra la hora pico (0–100). En vivo:
   visitas de la última hora contra el promedio de esa hora.
5. **Ficha:** barras por hora como Google, con «Poco concurrido / Lo normal /
   Muy concurrido» y «Ahora: más que de costumbre». Solo se muestra con
   mínimo de visitas (p. ej. 30 por franja); antes, nada.

**Costos y requisitos:** Google Play pide declarar el uso de ubicación en
segundo plano con video y justificación; Apple revisa el texto del permiso;
hay que actualizar el aviso de privacidad y App Privacy («ubicación precisa,
no ligada a la identidad»). Con pocos usuarios no habrá datos suficientes:
crece con la red. Recomendación: construirlo en la primera actualización
después del lanzamiento, para no frenar la revisión de tiendas.

### Lector del menú: costo

`read-menu` usa Claude Sonnet con visión, máximo 2,200 tokens de salida. Una
lectura típica ≈ 3,000 tokens de entrada (foto + instrucciones) y ≈ 1,200 de
salida ≈ **USD 0.03 (≈ $0.50 MXN)**. El gasto ocurre solo cuando el negocio
toma o elige la foto y Patio la lee; escribir el menú a mano no cuesta.
Tope actual: 20 lecturas al día en Gratis, 60 en Pro.

---

## 18. Propuesta v4 (homologada con la app)

`artifacts/propuesta-2026-11-07-v4.html`: pantallas a 390 × 844 pt reales con
la escala homologada (`PATIO_DESIGN_PRINCIPLES.md`), Ionicons de la app y
listas de `components/settings-list.tsx`. Trae la auditoría v3 → v4.

- **Formas:** una sola esquina continua de Apple (22.37 % del lado, suavizado
  60 %) para sticker, sello, casillas de sellos e ícono. Área segura 12 %.
  En código: `borderCurve: 'continuous'` en tarjetas, hojas y botones (iOS).
- **La P:** unidad = hueco interior (35 % del alto); área de seguridad = 1
  unidad; mínimo 10 pt en pantalla (16 recomendado) y 5 mm impreso.
- **Hoy:** tarjeta con número + comparación + gráfica; debajo listas
  agrupadas (valores en una sola columna) y ranking de platillos que baja de
  línea. Tu racha hoy corta el platillo con «…»: se corrige al construir.
- **Tarjeta de Pro:** aparece con 10 seguidores y 5 menús publicados, junto
  al dato; × de 44; cerrada no vuelve en 30 días; nunca por push; una sola en
  la app a la vez.
- **Mostrar en caja y sellos (idea nueva):** fase 1 sin escáner (quien atiende
  toca «Canjear»); fase 2 QR de un solo uso que cambia cada 30 s y lo
  escanea el negocio, con tarjeta de sellos. Cada escaneo es una visita
  confirmada para «Qué tan lleno». Canjes y sellos en Pro.
- **Entrada:** el botón de vidrio de `entrada.tsx` (52/14) se homologa a 54/27.

### Ajustes del 8 nov (v4.1)

- **Flyers solo con neutros:** blanco, gris (lienzo #F8F8F5 con tarjeta blanca,
  el mismo par del póster del menú) y negro; con foto del negocio, degradado
  negro de abajo hacia arriba. El naranja queda solo en la etiqueta chica.
- **Hallazgo de tipografía:** `noWidow` unía «suizas gratinadas» en un bloque
  más ancho que el renglón y el flyer lo cortaba. En títulos grandes (marca,
  flyers) la viuda se evita equilibrando renglones y bajando el tamaño en
  pasos (128 → 112 → 96 → 84 → 72), nunca uniendo palabras que no caben
  juntas. Revisar el mismo caso en la app al construir.
- **Video de oferta irresistible:** estructura y prácticas aplicadas a Pro,
  flyers y reels en `docs/research/VIDEO_OFERTA_IRRESISTIBLE_2026-11-08.md`.
  Propuesta: campo «Hasta cuándo» en los flyers (escasez verdadera).

---

## 19. Onboarding construido y opinión después de la visita (8 nov)

- **Onboarding estilo Leica, ya en la app** (`app/onboarding.tsx`): ¿Cómo vas
  a usar Patio? → tres pantallas por lado → permisos explicados (cada fila
  pide su permiso al tocarla; se puede continuar sin darlos) → cuenta opcional
  para quien busca («Crear cuenta» / «Quizás más tarde»); el negocio sigue a
  su acceso. Copy abierto: «lo de hoy», «lugares», «favoritos»; sin giros.
  `entrada.tsx` homologada a 54/27. Esto cambia la regla anterior de no pedir
  permisos en el onboarding: ahora se piden explicados, como Leica.
- **«¿Qué te pareció Tacos Juan?»** (idea de Parco). Hoy no existe. Plan:
  - Copy: título = el lugar; cuerpo «¿Qué te pareció?». Abre la reseña.
  - Reglas: solo si no has reseñado ese lugar; máximo uno al día; el mismo
    lugar no se repite en 30 días; nunca de 22 a 9 h; se apaga en
    Notificaciones («Pedir mi opinión»).
  - **Fase 1, sin ubicación en segundo plano:** aviso local (no sale del
    teléfono) 3 h después de tocar «Cómo llegar» o de canjear una promo:
    «¿Fuiste a Tacos Juan? ¿Qué te pareció?».
  - **Fase 2, con visitas reales:** las mismas geocercas de «Qué tan lleno»;
    visita de 8 minutos o más y, al alejarte, el aviso.
  - Por qué conviene: cada reseña es respuesta para el negocio, y que el
    negocio vea respuesta es lo que lo hace seguir publicando (lado difícil).
