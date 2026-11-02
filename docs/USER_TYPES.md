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
- **Puede:** listas (privadas, con enlace o públicas), compartirlas, reseñar,
  seguir perfiles, notificaciones de sus lugares. Perfil público, como Instagram.
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
  compartir su menú como imagen, aviso a quien lo guarda cuando publica, recibir
  y responder reseñas, guardados y «me gusta» de sus platillos.
- **Nunca ve:** lugares guardados ni listas de Foodie.

### Negocio Pro
- **Viene a:** publicar todos los días y traer de vuelta a quien ya lo conoce.
- **Llega:** suscripción desde Planes, del lado negocio. **Oculto** hasta que
  existan sus beneficios y el cobro esté encendido.
- **Costo:** $99/mes · $990/año.
- **Tendrá:** lo de Gratis + 60 lecturas con foto al día, 8 avisos especiales
  (promociones) al mes, estadísticas por horario y colonia (sin nombres),
  platillo destacado.

### Fundador
- **Viene a:** arrancar Patio en su colonia y que se le reconozca.
- **Llega:** por invitación («Pedir invitación» en Planes), primeros negocios
  de cada colonia.
- **Costo:** $0.
- **Recibe hoy:** alta del negocio y del menú en persona y línea directa con el
  equipo. Cuando Pro exista, 6 meses sin costo; el sello Fundador aún no existe.

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
- Avisos especiales (promociones) de Pro: panel o flyer, nunca desarrollado.
