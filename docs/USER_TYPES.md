# Tipos de usuario — mapa vigente (2026-10-28)

Precios y beneficios salen de `lib/plans.ts`; si cambian ahí, cambian aquí.
`scripts/tests/user-types-doc.test.cjs` falla si este documento se desfasa.
Contexto de negocio: [cold start y monetización](NETWORK_COLD_START_AND_MONETIZATION.md).

Cada tipo se define por lo que viene a hacer, no por su lista de funciones
(working backwards). Cada lado ve solo sus planes, como Uber One o DashPass;
la puerta al otro lado es un renglón discreto, nunca una tarjeta de precio.

## Lado Foodie

### Visitante
- **Viene a:** saber qué hay hoy cerca, sin dar datos.
- **Llega:** abre la app sin cuenta.
- **Costo:** $0.
- **Puede:** ver el mapa, buscar por platillo, abrir fichas, guardar en este teléfono.
- **Nunca ve:** planes de negocio, herramientas de publicación.

### Foodie
- **Viene a:** decidir dónde comer y recordar sus lugares.
- **Llega:** entra con correo y código.
- **Costo:** $0.
- **Puede:** listas (privadas, con enlace o públicas), compartirlas, reseñar,
  seguir perfiles, notificaciones de sus lugares. Perfil público, como Instagram.
- **Nunca ve:** sus menús, estadísticas de negocio.

### Creador
- **Viene a:** recomendar a su audiencia y que sus recomendaciones rindan.
- **Llega:** suscripción desde Planes.
- **Costo:** $199/mes · $1,990/año.
- **Puede:** lo de Foodie + listas destacadas, estadísticas de sus listas,
  sello de Creador, enlace de invitación.
- **Nunca ve:** planes de negocio dentro de su pantalla de planes.

## Lado Negocio

### Negocio Gratis
- **Viene a:** que la gente de cerca sepa qué preparó hoy.
- **Llega:** Planes → «¿Tienes un negocio?», o la intro «Publicar lo que preparo».
- **Costo:** $0.
- **Puede:** perfil público, menú a mano sin límite, 10 lecturas con foto al mes,
  compartir su menú, recibir y responder reseñas.
- **Nunca ve:** lugares guardados ni listas de Foodie.

### Negocio Pro
- **Viene a:** publicar todos los días y traer de vuelta a quien ya lo conoce.
- **Llega:** suscripción desde Planes, del lado negocio.
- **Costo:** $99/mes · $990/año.
- **Puede:** lo de Gratis + 60 lecturas con foto al mes, 8 avisos especiales
  (promociones) al mes, ver quién lo guarda, platillo destacado.
- **Nunca ve:** el plan Creador.

### Fundador
- **Viene a:** arrancar Patio en su colonia y que se le reconozca.
- **Llega:** por invitación, primeros 100 negocios por colonia.
- **Costo:** 6 meses de Pro sin costo.
- **Puede:** lo de Pro; sello numerado al publicar 4 semanas seguidas.

## Reglas

- La privacidad vive en cada lista, no en el perfil. Lo que se administra:
  cuentas bloqueadas (Perfil → Sesión / Cuenta).
- Bloquear y reportar: ••• en ficha de lugar, reseña, perfil y lista pública
  (exigido por App Review 1.2 para contenido de usuarios).
- Cobro apagado hasta conectar tiendas y entitlements en servidor
  ([billing](BILLING_SETUP_2026-10-26.md)).

## Abierto

- Quien ya es Foodie y registra un negocio: ¿misma cuenta y correo, o aparte?
  Pendiente de Jev. Hoy usa la misma cuenta.
- Qué gana un negocio en el lado Foodie (p. ej. beneficios de Creador).
- Avisos especiales (promociones) de Pro: panel o flyer, nunca desarrollado.
