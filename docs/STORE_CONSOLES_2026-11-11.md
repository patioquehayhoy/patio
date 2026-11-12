# Respuestas para las consolas de Apple y Google — 2026-11-11

Qué contestar en cada formulario que piden App Store Connect y Play Console
antes de publicar. Sale del código real (tablas, funciones y SDK), no de
suposiciones. Se capturan una sola vez y se actualizan solo si cambia lo que
la app recoge.

**Lado difícil hoy:** el negocio que publica su menú diario.

## 0. Qué es cada formulario

| Consola | Formulario | Para qué sirve |
|---|---|---|
| App Store Connect | **App Privacy** («etiqueta nutrimental») | Lista pública de qué datos recoge la app, si se ligan a la persona y si se usan para rastrear. Sale en la ficha de la tienda. |
| App Store Connect | **Age Rating** | Cuestionario de contenido; Apple calcula la edad (4+, 9+, 13+…). |
| App Store Connect | **App Review Information** | Cuenta de prueba y notas para el revisor. |
| Play Console | **Data safety** | El equivalente de App Privacy en Google. |
| Play Console | **Clasificación de contenido (IARC)** | Cuestionario de contenido; da la clasificación por país. |
| Play Console | **Público objetivo**, **Anuncios**, **App de gobierno**, **Funciones financieras**, **Salud**, **Noticias** | Declaraciones cortas de sí/no. |
| Play Console | **Acceso a la app** | Cuenta e instrucciones para el revisor. |
| Play Console | **Permisos: ubicación en segundo plano** | Declaración y video de 30 s para «Tus visitas» (ver §5). |

## 1. Inventario de datos (verificado en código)

| Dato | De dónde sale | ¿Ligado a la cuenta? | Para qué |
|---|---|---|---|
| Correo | Acceso con código (Supabase Auth) | Sí | Entrar, avisos de cuenta, soporte |
| Nombre y usuario | `user_profiles`, `negocios` | Sí | Perfil y ficha públicos |
| Dirección del negocio y su punto en el mapa | `negocios` (solo negocios) | Sí | Ficha y mapa |
| Fotos | Avatar (`avatars`), foto del lugar (`place-photos`), foto del menú enviada a `read-menu` | Sí | Perfil, ficha, lectura del menú |
| Contenido propio | Menús, reseñas, comentarios, listas, «me gusta», seguidos, reportes | Sí | Funciones de la app |
| ID de usuario | Supabase | Sí | Funcionamiento |
| Token de notificaciones | `push_devices` | Sí | Avisos |
| Visitas a un lugar (opcional, «Tus visitas») | `place_visits`, `place_presence` con un identificador que cambia cada día | **No** | «Qué tan lleno» y «¿Qué te pareció?» |
| Vistas de una ficha | `patio_views` con el mismo identificador diario | **No** | «Hoy» del negocio |
| Compras del plan | `store_purchases` | Sí | Plan Pro (apagado hasta firmar contratos) |
| Ubicación del Foodie | Solo en el teléfono (distancias y mapa) | — | **No sale del teléfono**: no se declara |

**No hay** anuncios, SDK de analítica, reporte de fallos, rastreo entre apps
ni venta de datos. Teléfono: la columna se borró el 2026-11-01; si se agrega
el WhatsApp del negocio, se declara aquí como «Número de teléfono» (ligado).

Proveedores que procesan datos por cuenta de Patio (no cuentan como
«compartir»): Supabase (base y archivos), Anthropic (lee la foto del menú y el
texto del alta con IA), Expo + APNs/FCM (avisos), Gmail SMTP (correos de
acceso), Apple y Google (cobro) y Google Maps en Android.

## 2. App Store Connect → App Privacy

**¿Recopilas datos?** Sí. **¿Rastreo (tracking)?** No, en ningún dato.

| Tipo de dato (Apple) | Ligado a la identidad | Propósito |
|---|---|---|
| Contact Info → Email Address | Sí | App Functionality |
| Contact Info → Name | Sí | App Functionality |
| Contact Info → Physical Address | Sí | App Functionality |
| User Content → Photos or Videos | Sí | App Functionality |
| User Content → Other User Content | Sí | App Functionality |
| User Content → Customer Support | Sí | App Functionality |
| Identifiers → User ID | Sí | App Functionality |
| Identifiers → Device ID | Sí | App Functionality (token de avisos) |
| Location → Precise Location | **No** | App Functionality |
| Usage Data → Product Interaction | **No** | Analytics, App Functionality |
| Purchases → Purchase History | Sí | App Functionality |

Notas:
- Ubicación precisa: la visita dice en qué lugar estuvo un teléfono; se
  declara precisa aunque no guarde coordenadas, por ser lo más honesto.
- Compras: declararla desde ahora evita olvidarla el día que se prenda el cobro.

## 3. Play Console → Data safety

- ¿Recopila o comparte datos? **Recopila: sí. Comparte: no** (los
  proveedores de arriba están exentos; lo público lo publica la persona).
- ¿Cifrados en tránsito? **Sí** (HTTPS en todo).
- ¿La persona puede pedir que se borren? **Sí**: en la app (Perfil → Eliminar
  cuenta, al final) y en la URL web de eliminación (necesita el dominio).

| Categoría (Google) | Tipo | ¿Obligatorio? | Propósito |
|---|---|---|---|
| Información personal | Nombre | Obligatorio | Funcionalidad, Gestión de la cuenta |
| Información personal | Correo | Obligatorio | Funcionalidad, Gestión de la cuenta |
| Información personal | Dirección | Opcional (solo negocios) | Funcionalidad |
| Información personal | ID de usuario | Obligatorio | Funcionalidad, Gestión de la cuenta |
| Fotos y videos | Fotos | Opcional | Funcionalidad |
| Actividad en la app | Interacciones en la app | Obligatorio | Funcionalidad, Estadísticas |
| Actividad en la app | Otro contenido generado por el usuario | Opcional | Funcionalidad |
| Info financiera | Historial de compras | Opcional | Funcionalidad |
| ID de dispositivo u otros | Token de avisos | Opcional | Funcionalidad |

- **Ubicación → Ubicación precisa:** opcional (solo con «Tus visitas»), no se
  comparte, propósito Funcionalidad de la app. La del mapa no se declara:
  se queda en el teléfono.
- **Por verificar al capturar:** la guía de Google sobre lo que recoge el SDK
  de Google Maps para Data safety; si pide declarar algo, se suma aquí.

## 4. Clasificación de contenido y declaraciones

Contestar con la verdad. Lo que aplica a Patio:

- Contenido generado por personas (reseñas, comentarios, fotos, perfiles): **sí**,
  con reporte, bloqueo, filtro de palabras y soporte que atiende.
- Interacción entre personas: **sí** (comentarios públicos). Chat privado: **no**.
- Comparte la ubicación de la persona con otras: **no** (solo la dirección del negocio).
- Compras digitales: **sí** (Pro, cuando se active).
- Alcohol: **referencias poco frecuentes** (los menús pueden listar cerveza o mezcal).
- Violencia, sexo, apuestas, lenguaje fuerte: **no**.
- Anuncios: **no**. App de gobierno, finanzas, salud o noticias: **no**.
- Público objetivo (Google): **18 años o más** para el lanzamiento; menos
  requisitos y se puede ampliar después.
- Cifrado (Apple): exento; ya va `ITSAppUsesNonExemptEncryption: false`.
- Inicio de sesión: solo correo con código, sin Google/Facebook, así que Apple
  no exige «Iniciar sesión con Apple».

## 5. Ubicación en segundo plano

Decisión de Parco (2026-11-11): «Tus visitas» también en Android. Se quitó
el bloqueo de `ACCESS_BACKGROUND_LOCATION` en `app.json` y el control de
release ahora exige que no esté bloqueado. Antes del permiso sale un aviso
propio («Tus visitas» → «Ahora no» / «Continuar») en `app/avisos.tsx`, como
pide Google. Necesita un build Android nuevo.

**iPhone:** Apple no pide video; basta el texto del permiso (en `app.json`)
y la nota para el revisor de §6.

**Play Console → Contenido de la app → Permisos de ubicación** (pegar en inglés):

```
Feature: "Tus visitas" (visit check-ins), off by default.
When the user turns it on, Patio places geofences around the food places
listed on its map. Background location lets Patio notice a visit while the
app is closed, ask the user afterwards how the place was, and count the
visit anonymously (no name, no stored coordinates) to show how busy each
place is. Visits happen with the phone in a pocket, so the feature cannot
work with foreground-only location. Users can turn it off at any time in
Profile → Settings → Notificaciones → "Tus visitas".
```

**Video para Google (máximo 30 s, subido a YouTube como «No listado»).**
Grabar la pantalla del Android con el build nuevo:

| Segundo | Qué se ve |
|---|---|
| 0–3 | Patio abierto en el mapa. |
| 3–8 | Perfil → engrane → Notificaciones → fila «Tus visitas». |
| 8–14 | Tocar el interruptor: aparece el aviso «Tus visitas». Dejarlo 3 s en pantalla para que se lea y tocar «Continuar». |
| 14–22 | Permiso del sistema «Al usar la app»; después Android abre Ajustes: elegir «Permitir todo el tiempo» y volver a Patio. |
| 22–30 | El interruptor encendido y la ficha de un lugar con «Qué tan lleno». Si ya hubo una visita, mostrar el aviso «¿Qué te pareció?». |

Sin cortes ni música: Google revisa que el aviso aparezca antes del permiso.

## 6. Notas para el revisor (pegar en inglés)

```
Patio helps people in Mexico City find today's menu at nearby small
restaurants ("fondas"), and lets those businesses publish their daily menu.

Sign-in: email with an 8-digit code. Demo account: <pending, see below>.

Location: used while the app is open to show nearby places. "Always"
location is optional and only requested if the user turns on "Tus visitas"
in the notification settings (Avisos): Patio then notices visits to listed
places to ask for a rating and to count anonymous visits for the "how busy"
indicator. No coordinates are stored; visits use an identifier that
changes every day.

User-generated content: reviews, comments and photos can be reported and
their authors blocked ("···" → "Reportar contenido" / "Bloquear cuenta").
Reports reach support at quehayhoy.patio@gmail.com, reviewed daily.

Account deletion: Profile → "Eliminar cuenta" (at the bottom).
```

## 7. Cuenta de revisión — pendiente

Nunca hubo una. TestFlight interno y la prueba interna de Play no la piden,
y por eso no hizo falta antes. Para la revisión real, el revisor no puede
recibir el código en un correo ajeno. Propuesta: un correo de revisión en
lista permitida con un código fijo guardado como secreto en Supabase; una
función valida ese código y abre la sesión. Nada fijo dentro de la app ni del
repositorio. Se entrega en el campo de la consola, fuera de Git.
