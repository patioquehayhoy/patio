# Tipos de usuario — mapa vigente (2026-11-02)

Precios y beneficios salen de `lib/plans.ts`; si cambian ahí, cambian aquí.
`scripts/tests/user-types-doc.test.cjs` falla si este documento se desfasa.
Contexto de negocio: [cold start y monetización](NETWORK_COLD_START_AND_MONETIZATION.md).

Cada tipo se define por lo que viene a hacer, no por su lista de funciones
(working backwards). Solo el negocio tiene planes; el Foodie y el Creador no
pagan mientras la red arranca ([decisión](PLANES_CREADORES_Y_RED_2026-11-02.md)).
Aquí solo se describe lo que existe en la app.

**Lado difícil hoy:** el negocio que publica su menú diario.

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
- **Puede:** seguir lugares y personas (desde una lista pública, a quien la armó); armar listas (privadas, con
  enlace o públicas) y compartirlas; reseñar; avisos de los lugares que sigue
  (menú de hoy y, si las activa, promociones). Perfil público, como Instagram:
  sus seguidores, a quién sigue y qué lugares sigue.
- **Nunca ve:** precios, sus menús, estadísticas de negocio. En Perfil solo
  tiene una puerta: «¿Tienes un negocio?».

### Creador
- **Viene a:** recomendar a su audiencia y que sus recomendaciones rindan.
- **Llega:** por invitación directa de Alejandro (Creadores Fundadores).
- **Costo:** $0.
- **Puede hoy:** lo mismo que un Foodie (listas públicas, compartirlas, seguidores).
- **Todavía no existe:** sello, listas destacadas ni estadísticas de enlace; no
  se ofrecen en la app hasta construirse.

## Lado Negocio

### Negocio Gratis
- **Viene a:** que la gente de cerca sepa qué preparó hoy.
- **Llega:** Perfil → «¿Tienes un negocio?», o la intro «Publicar lo que preparo».
- **Costo:** $0.
- **Puede:** perfil público, menú a mano sin límite, 20 lecturas con foto al día,
  compartir su menú como imagen, aviso a sus seguidores cuando publica, recibir
  y responder reseñas, quién lo sigue y «me gusta» de sus platillos.
- **Nunca ve:** lugares guardados ni listas de Foodie.

### Negocio Pro
- **Viene a:** publicar todos los días y traer de vuelta a quien ya lo conoce.
- **Llega:** suscripción desde Planes (se ofrece cuando el cobro esté
  encendido) o como Fundador.
- **Costo:** $99/mes · $990/año.
- **Puede:** lo de Gratis + 60 lecturas con foto al día, 8 avisos especiales
  (promociones) al mes, platillo destacado en su ficha, día y hora con más
  interés (sin nombres). Todo vive en Actividad y en Mi Patio.

### Fundador
- **Viene a:** arrancar Patio en su colonia y que se le reconozca.
- **Llega:** por invitación («Pedir invitación» en Planes), primeros negocios
  de cada colonia.
- **Costo:** $0.
- **Recibe:** 6 meses de Pro (se otorga a mano, ver
  [billing](BILLING_SETUP_2026-10-26.md)), alta del negocio y del menú en
  persona. El sello Fundador aún no existe. En Planes ve Pro a $0 «como
  Fundador» con su fecha, y ya no ve la invitación.

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
