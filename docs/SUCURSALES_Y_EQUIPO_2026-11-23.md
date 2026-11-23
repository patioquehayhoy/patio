# Marcas, sucursales y equipo — 23 noviembre 2026

Parco pidió pensar en los casos reales:
- franquicias y cadenas, como Starbucks, Toks, Sanborns o Bisquets;
- varios puestos de una misma marca, como «Alitas X» en Azcapo y en Lerma.

Y la pregunta: ¿cómo se lleva el control? ¿Una cuenta por sucursal o perfiles
de acceso? Este documento sustituye la propuesta corta de
[varios negocios](AGOTADOS_Y_VARIOS_NEGOCIOS_2026-11-23.md) §2.

Datos de Jev: [script](research/jev_sucursales_y_equipo_2026-11-23.py) ·
[resultado](research/jev-sucursales-y-equipo-2026-11-23.json), más el estudio
anterior del mismo día. Lado difícil hoy: el negocio que publica su menú del
día. Las cadenas no son el lado difícil.

## 1. Cómo lo resuelven otros

Busqué un punto de venta llamado «Fénix» y no encontré su documentación.
Solo apareció un software contable con ese nombre, que no está en México. Si
Parco tiene el enlace, se revisa. Mientras, estos son los que documentan
sucursales y accesos:

| Plataforma | Cómo lo hace |
| --- | --- |
| **Square** (punto de venta) | Cada persona del equipo entra con lo suyo. Al darla de alta se le asignan un **conjunto de permisos** y las **ubicaciones** que puede tocar. Quien solo tiene la A no ve la B. Hay un registro de actividad: qué se hizo, cuándo y dónde, y por persona en el plan pagado. |
| **Toast** (punto de venta para cadenas) | La carta es compartida. Cada parte de la carta tiene **dueño** (quién puede editarla) y **destino** (en qué sucursales sale). Cada sucursal puede **sobrescribir** ajustes, como el precio por sucursal, si el corporativo lo permite. |
| **Perfil de Negocio de Google** | Una ficha por ubicación. Hay dos roles: **Propietario** (incluye quién entra) y **Administrador** (edita, publica y responde reseñas, pero no agrega ni quita personas). Con muchas ubicaciones se usan **grupos de ubicaciones**. Nadie comparte su contraseña. |
| **Uber Eats Manager** | Se agregan usuarios con roles de distinto alcance. Quien tiene varias tiendas cambia de una a otra junto al nombre. |
| **Meta Business Suite** | Personas dentro del negocio, con **acceso total** o **parcial** a cada página o cuenta. |

Todos coinciden en tres reglas:
1. **Cada persona entra con su propia cuenta; nunca se comparte.**
2. **El acceso es un rol más las sucursales asignadas.**
3. **La carta es del negocio y cada sucursal ajusta lo suyo.**

En Patio la primera regla es todavía más fuerte. Se entra con un código que
llega al correo, así que compartir la cuenta del dueño obligaría al encargado
a leer el correo del dueño.

## 2. Lo que dijo Jev

**Negocios** (5): el dueño de tres puestos de alitas, la encargada de uno de esos
puestos, un franquiciatario de dos sucursales, la gerente de una cadena
grande y la fonda donde la hija publica.

| Pregunta | Resultado |
| --- | --- |
| ¿Quién publica cada día qué hay y lo que se acabó? | **El encargado de cada lugar: 84 %.** Dueño 3 %. |
| ¿Cómo entran? | **Invitación con su propio correo y solo su sucursal: 90 %.** La cuenta del dueño: 2 %. |
| ¿Qué puede hacer el encargado? | **Publicar el menú del día de su sucursal, «se acabó» y avisos, sin carta, precios ni pago: 77 %.** La gerente de cadena pide un poco más: 51 % también carta y precios. |
| ¿Quién decide la carta y los precios? | **El dueño o el corporativo, y cada sucursal ajusta (un precio, lo que ahí no vende): 69 %.** Cada sucursal sola: 22 %. |
| ¿Importa ver quién cambió qué y a qué hora? (0–4) | **2.59.** Gerente 3.15, alitas 2.96; la fonda familiar 1.94. |

**Comensales** (3). Al tocar «Seguir» en unas alitas con varias sucursales:
- **avisos de la sucursal más cercana: 59 %**;
- elegir las sucursales: 30 %;
- una sucursal específica: 11 %.

## 3. El modelo: marca, sucursales y equipo

Tres palabras, y nada más:

- **Cuenta:** una persona con su correo. Nunca se comparte.
- **Negocio:** la marca, con su nombre, logo, giro y carta. Ejemplos: «Alitas
  X», «Toks», «Fonda Doña Mary».
- **Sucursal:** un lugar en el mapa con su ficha. Tiene su dirección,
  horario, menú del día, «Se acabó», reseñas y seguidores. Un negocio de un
  solo lugar tiene una sucursal y la app no usa la palabra «sucursal».

**Equipo.** Las personas con acceso a un negocio, cada una con un rol y sus
sucursales, como en Square. Los roles tienen los nombres de Google:

| Rol | En sus sucursales | En todo el negocio |
| --- | --- | --- |
| **Propietario** | Todo | Carta y precios, sucursales, equipo (invitar y quitar), Pro y pago. El propietario principal es quien paga y solo hay uno. |
| **Administrador**, todas las sucursales | Todo | Carta y precios, pero no el equipo ni el pago. Para la gerente de zona o el socio. |
| **Administrador**, algunas sucursales | Publicar el menú del día, «Se acabó», «Ya abrimos» y «Hoy no abro», avisos de operación, horario, responder reseñas y ver Hoy de su sucursal | Nada. No toca carta, precios, equipo ni pago. |

Esa última fila es la del encargado, la que eligió Jev (77 %). No hace falta
un tercer rol: lo que cambia es el alcance, igual que en Square.

**Carta.** Es del negocio, como en Toast. Cada sucursal marca lo que «aquí
no hay» y publica su menú del día. El precio por sucursal llega en la fase
de cadenas, y lo enciende el propietario.

**Control y auditoría.** Todo lo que se publica o cambia guarda quién fue y a
qué hora. Ejemplos: «María publicó el menú · Azcapo · 1:05 p. m.» o «Luis
marcó Se acabó: alitas BBQ · Lerma · 4:12 p. m.».
- El propietario lo ve en **Actividad**.
- El comensal nunca ve quién fue: ve el negocio.
- Cada persona aparece con su nombre, nunca «Tú».
- Cuando alguien se va, el propietario le quita el acceso. No hay
  contraseñas que cambiar.

**Seguir.** «Seguir» en la ficha de una sucursal sigue esa sucursal. La
campana de esa marca ofrece «Sucursales» para agregar otras. «Siguiendo»
agrupa por marca. En los datos el seguimiento queda por sucursal, como hoy,
así que no hay que migrar lo que ya existe.

**Varias marcas de la misma persona** (la fonda y los tacos de noche): son
dos negocios. Se cambia con «Cambiar de cuenta», como en Instagram (88 % en
Jev).

## 4. Cómo queda cada caso

| Caso | Cómo queda en Patio |
| --- | --- |
| Fonda de una sola persona | Igual que hoy: una cuenta, un negocio, una sucursal. No ve nada nuevo. |
| Fonda donde la hija publica | La dueña invita a su hija como Administrador. Cada una entra con su correo. |
| «Alitas X», 3 puestos del mismo dueño | Un negocio con 3 sucursales y una carta. Cada encargado es Administrador de su puesto y publica, marca «Se acabó» y avisa. El dueño ve las 3 y su Actividad. |
| Franquicia chica (Alitas X vende la marca) | El dueño de la marca es Propietario. El franquiciatario es Administrador de sus sucursales y publica; la carta la sigue decidiendo la marca. Si la marca no está en Patio, el franquiciatario da de alta su negocio. Cuando la marca llegue, pide la propiedad (como en Google) y se unen. |
| Cadena grande (Toks, Sanborns, Starbucks, Bisquets) | El mismo modelo en grande: el corporativo es Propietario y cada gerente es Administrador de su sucursal. La carta es corporativa, con precio por sucursal. Los nombres de cadenas conocidas se verifican a mano para evitar suplantaciones. |
| Tianguis o sobre ruedas | Una sucursal itinerante con sus días («Dónde vendes», como hoy). |
| Dos marcas de la misma persona | Dos negocios en una cuenta, con «Cambiar de cuenta». |

**Pro:**
- Lo paga el propietario principal y cubre sus negocios y sucursales, hasta
  3 lugares.
- Las cuotas (avisos especiales, lecturas con foto) se cuentan por sucursal,
  para que una no se coma las de otra.
- Más de 3 lugares, o una cadena, va en un plan aparte en la fase 4.

En la App Store solo cabe una suscripción activa por persona en cada grupo,
así que cobrar por sucursal con la App Store no funciona.

## 5. Orden para construir, según el lado difícil

| Fase | Qué incluye | Por qué en este orden |
| --- | --- | --- |
| **1. Equipo** | Invitar por correo como Administrador, autoría de cada cambio y Actividad. La base de datos completa (negocio, sucursales y equipo) desde el inicio, para no parchar después. | Ayuda directo al lado difícil: publica quien está en el puesto, no solo el dueño (84 % en Jev). |
| **2. Sucursales** | Agregar sucursal, carta del negocio con «aquí no hay» por sucursal, «Publicar también en…», Hoy por sucursal y en total, «Siguiendo» agrupado, campana con «Sucursales». | Alitas X y los puestos chicos con varias ubicaciones. |
| **3. Varias marcas** | «Cambiar de cuenta» y «Agregar cuenta», hasta 3 negocios. | Menos frecuente; no bloquea a nadie hoy. |
| **4. Cadenas y franquicias grandes** | Verificación de marca, pedir la propiedad, precio por sucursal controlado por el corporativo, alta asistida y plan aparte. | No resuelven el arranque: tienen carta fija, no publican un menú del día y su gente ya los conoce. Van después del piloto. |

**Cambios técnicos de la fase 1:**
- **Base de datos:**
  - tabla de negocio (marca) y tabla de equipo, con persona, rol y
    sucursales;
  - cada `negocios` actual pasa a ser una sucursal con su marca, creada sola;
  - una función `puede(persona, sucursal, acción)` que sustituye los
    `owner_id = auth.uid()` de RLS y RPC;
  - invitaciones que se aceptan entrando con ese correo;
  - autoría en menús, avisos y «Se acabó»;
  - quitar `fonditas_one_per_owner_idx`.
- **Avisos:** el recordatorio de publicar y el resumen del negocio llegan a
  quien tiene acceso a esa sucursal.

Fuentes: [Square, permisos y ubicaciones](https://squareup.com/help/us/en/article/5822-employee-permissions) ·
[Square, registro de actividad](https://squareup.com/help/us/en/article/5579) ·
[Toast, sobrescribir por sucursal](https://doc.toasttab.com/doc/platformguide/platformOverrides.html) ·
[Toast, precio por sucursal](https://support.toasttab.com/en/article/Location-Specific-Pricing-Master-Menu-Management-1492786563831?lang=en_US) ·
[Google, grupos de ubicaciones](https://support.google.com/business/answer/6085326?hl=es) ·
[Google, propietario y administradores](https://developers.google.com/my-business/content/best-practices?hl=es-419) ·
[Uber Eats Manager](https://merchants.ubereats.com/gb/en/resources/learning-center/uber-eats-manager/) ·
[Meta, acceso total y parcial](https://support.chatarchitect.com/books/meta-business-portfolio-setup/page/add-people-to-a-business-portfolio-and-assign-a-business-asset) ·
[App Store, grupos de suscripción](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions).
