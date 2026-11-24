# Marcas, sucursales, equipo y cadenas — 23 noviembre 2026

Parco pidió tres cosas el mismo día:
1. Pensar en los casos reales: franquicias y cadenas (Starbucks, Toks,
   Sanborns, Bisquets) y varios puestos de una misma marca («Alitas X» en
   Azcapo y en Lerma).
2. Explicar cómo se lleva el control: ¿una cuenta por sucursal o perfiles de
   acceso?
3. «Lo de cadenas grandes hay que aterrizarlo de una vez» (§4 y §5).

Este documento sustituye la propuesta corta de
[varios negocios](AGOTADOS_Y_VARIOS_NEGOCIOS_2026-11-23.md) §2.

Datos de Jev, de tres estudios del mismo día:
- [sucursales y equipo](research/jev_sucursales_y_equipo_2026-11-23.py) ([resultado](research/jev-sucursales-y-equipo-2026-11-23.json));
- [cadenas](research/jev_cadenas_2026-11-23.py) ([resultado](research/jev-cadenas-2026-11-23.json));
- [agotados y marcas](research/jev_agotados_y_marcas_2026-11-23.py).

Jev orienta; no decide.

**Lado difícil hoy:** el negocio de la colonia que publica su menú del día.
Las cadenas no son ese lado. Por eso entran con alta asistida y sin panel
web, y nunca pagan por aparecer.

## 1. Cómo lo resuelven otros

Busqué un punto de venta llamado «Fénix» y no encontré su documentación.
Solo apareció un software contable con ese nombre, que no está en México. Si
Parco tiene el enlace, se revisa. Mientras, estos son los que documentan
sucursales y accesos:

| Plataforma | Cómo lo hace |
| --- | --- |
| **Square** (punto de venta) | Cada persona del equipo entra con lo suyo. Al darla de alta se le asignan un **conjunto de permisos** y las **ubicaciones** que puede tocar. Quien solo tiene la A no ve la B. Hay un registro de actividad: qué se hizo, cuándo y dónde, y por persona en el plan pagado. |
| **Toast** (punto de venta para cadenas) | La carta es del corporativo. Con «Local Menu Edit», el gerente de una sucursal elige qué platillos salen ahí y, si el corporativo lo prendió para ese platillo, pone su precio. Lo demás del platillo no lo puede cambiar. |
| **Perfil de Negocio de Google** | Una ficha por ubicación. Hay un **propietario principal**, otros **propietarios** (manejan quién entra) y **administradores** (editan, sin manejar personas). Los roles se dan por ficha o por **grupo** de ubicaciones. Una cadena con 10 o más ubicaciones pide **verificación de cadena**: sitio web de la marca con sus sucursales, una sola marca, y a veces un video. Ya verificada, sus sucursales nuevas se verifican de inmediato. Si agrega muchas de golpe, Google puede quitarle la verificación. Todas las sucursales llevan **el mismo nombre**, sin la colonia ni la plaza. Para reclamar una ficha que ya tiene dueño, se **pide la propiedad**: el dueño actual tiene 3 días para contestar. |
| **Uber Eats Manager** | Se agregan usuarios con roles de distinto alcance. Quien tiene varias tiendas cambia de una a otra junto al nombre. |
| **Meta Business Suite** | Personas dentro del negocio, con **acceso total** o **parcial** a cada página o cuenta. |

Todos coinciden en tres reglas:
1. **Cada persona entra con su propia cuenta; nunca se comparte.**
2. **El acceso es un rol más su alcance** (todo, un grupo o algunas
   sucursales).
3. **La carta es de la marca y cada sucursal ajusta lo que la marca le
   permite.**

En Patio la primera regla es todavía más fuerte. Se entra con un código que
llega al correo, así que compartir la cuenta del dueño obligaría al encargado
a leer el correo del dueño.

## 2. Lo que dijo Jev

### Equipo y sucursales

Participaron 5 negocios: el dueño de tres puestos de alitas, la encargada de
uno de esos puestos, un franquiciatario de dos sucursales, la gerente de una
cadena grande y la fonda donde la hija publica.

| Pregunta | Resultado |
| --- | --- |
| ¿Quién publica cada día qué hay y lo que se acabó? | **El encargado de cada lugar: 84 %.** Dueño 3 %. |
| ¿Cómo entran? | **Invitación con su propio correo y solo su sucursal: 90 %.** La cuenta del dueño: 2 %. |
| ¿Qué puede hacer el encargado? | **Publicar el menú del día de su sucursal, «se acabó» y avisos, sin carta, precios ni pago: 77 %.** |
| ¿Quién decide la carta y los precios? | **El dueño o el corporativo, y cada sucursal ajusta: 69 %.** |
| ¿Importa ver quién cambió qué y a qué hora? (0–4) | **2.59.** Gerente 3.15; la fonda familiar 1.94. |
| Comensal: al seguir unas alitas con varias sucursales | Avisos de la más cercana 59 %; elegir sucursales 30 %. |

### Cadenas y franquicias

Participaron 4 negocios:
- el corporativo de una cadena de 150 restaurantes;
- la gerente de una de sus sucursales;
- el dueño de una marca de tortas con 18 franquicias;
- un franquiciatario de esa marca con dos sucursales.

| Pregunta | Resultado |
| --- | --- |
| ¿Qué publicarías cada día? | **Menú del día o comida corrida: 73 %.** Promoción 16 %; solo estado 11 %; nada 0 %. |
| ¿Quién publica lo de hoy? | **El corporativo publica el menú o la promoción para todas o una zona, y cada sucursal marca lo que se acabó, si abre y sus avisos: 74 %.** Cada sucursal todo: 24 %. El corporativo todo: 1 %. |
| ¿Cómo se dan de alta las sucursales? | **Hoja de cálculo: 71 %.** Alta asistida en una llamada: 29 %. Una por una: 1 %. |
| Cambia el gerente: ¿quién da y quita el acceso? | Dividido. **Corporativo 59 % y dueño de la marca 88 % piden hacerlo ellos.** **Gerente 50 % y franquiciatario 85 % piden que lo haga quien está a cargo**, y que el corporativo vea quién entra. |
| ¿Los precios cambian entre sucursales? | **Iguales en todas: solo 5 %.** Cambian en algunas 49 %; cada una los suyos 46 %. |
| En franquicia, ¿quién paga? | **La marca sus sucursales y cada franquiciatario las suyas: 56 %.** Lo cubre la cuota de publicidad: 31 %. La marca todo: 12 %. |
| ¿Mandarías constancia fiscal y registro IMPI para proteger tu nombre? (0–4) | **3.13.** |

### Cadenas junto a la fonda

Participaron 3 negocios de la colonia (fonda, cocina del callejón y taquero)
y 4 comensales.

| Pregunta | Locales | Comensales |
| --- | --- | --- |
| ¿Cómo deberían aparecer las cadenas? | **Igual 38 %, con filtro para ocultarlas 36 %.** Fonda y callejón eligen el filtro (44 % y 39 %). Agrupadas 21 %; fuera de la app 5 %. | **Igual 42 %, con filtro 32 %.** Agrupadas 19 %; fuera 8 %. |
| ¿Qué tanto te preocupa o estorba? (0–4) | 2.16 | 2.15 |

**Qué se hizo con cada resultado:**
- La cadena publica su **menú del día**: cabe en «¿Qué hay hoy?» sin
  inventar otro producto.
- **El corporativo publica y la sucursal opera.**
- La primera **alta es asistida con la hoja**. No hay panel web.
- **El acceso lo maneja el propietario de esas sucursales**, y la marca ve y
  quita a cualquiera. Esto resuelve la división: el franquiciatario contrata
  a su gente, y la marca no pierde el control.
- **El precio por sucursal llega con las sucursales**, no al final.
- **Cada propietario paga el plan de sus lugares.**
- **Las cadenas aparecen igual que todos**, y en Filtros hay **«Ocultar
  cadenas»**: lo pide el lado difícil y no estorba a quien no lo usa.

## 3. El modelo

### Palabras

- **Cuenta:** una persona con su correo. Nunca se comparte.
- **Negocio:** la marca, con su nombre, logo, giro y carta. Ejemplos: «Alitas
  X», «Toks», «Fonda Doña Mary».
- **Sucursal:** un lugar en el mapa con su ficha. Tiene su dirección,
  horario, menú del día, «Se acabó», reseñas y seguidores. Un negocio de un
  solo lugar tiene una sucursal y la app no usa la palabra «sucursal».
- **Grupo:** varias sucursales de un negocio con nombre propio («Zona
  Norte», «Aeropuerto»), como los grupos de Google. Solo existe si el
  negocio lo crea. Cada sucursal está en un grupo o en ninguno.

### Equipo: rol y alcance

Cada persona del equipo tiene **un rol** (los de Google) y **un alcance**
(como Square): todo el negocio, un grupo o algunas sucursales.

| | Todo el negocio | Un grupo | Algunas sucursales |
| --- | --- | --- | --- |
| **Propietario** | Corporativo o dueño. Todo: carta, precios, sucursales, grupos, equipo y verificación. | Gerente de zona que contrata. Equipo y operación de su grupo. | Franquiciatario o dueño del puesto. Equipo y operación de sus sucursales, y el plan de esos lugares. |
| **Administrador** | Socio o gerente general. Carta, precios y operación de todo; no maneja equipo ni pago. | Gerente de zona. Operación de su grupo. | Encargado o gerente de sucursal. Operación de su sucursal. |

- **Operación** es publicar el menú del día, «Se acabó», «Ya abrimos» y «Hoy
  no abro», avisos de operación, horario, responder reseñas y ver Hoy.
- **La carta y el precio base** solo los cambia quien tiene todo el negocio.
- **El precio por sucursal** lo pone quien tiene todo el negocio. Si el
  negocio prende «Las sucursales ponen su precio», también el propietario de
  esa sucursal (el franquiciatario), como «Local Menu Edit» de Toast. El
  gerente de una sucursal del corporativo no cambia precios.
- **Solo el propietario principal** paga el plan del negocio, cambia quién es
  principal, elimina el negocio y ve a todo el equipo. También puede quitar a
  cualquiera, aunque lo haya invitado un franquiciatario. Hay uno por
  negocio.
- Nadie da más de lo que tiene: un propietario de un grupo solo invita a ese
  grupo o a sucursales de ese grupo.

Así, la mitad de Jev que pedía control central (corporativo, dueño de la
marca) lo tiene. La mitad que pedía manejar a su gente (gerente,
franquiciatario) también lo tiene, si la marca la hace propietaria de sus
sucursales.

### Carta

Es del negocio, como en Toast. En cada sucursal se puede marcar lo que «aquí
no hay» y su precio, si toca. El platillo se reconoce con la identidad que ya
usa Patio (`lib/dish-identity.ts`).

### Registro de actividad

Todo lo que se publica o cambia guarda quién fue y a qué hora. Ejemplos:
«María publicó el menú · Azcapo · 1:05 p. m.» o «Luis marcó Se acabó: alitas
BBQ · Lerma · 4:12 p. m.».

- Vive en **Equipo → Registro de actividad** (la palabra de Meta). No se
  llama «Actividad» porque así se llama la campana del negocio.
- Los propietarios lo ven en su alcance, por sucursal y por persona.
- El comensal nunca ve quién fue: ve el negocio.
- Cada persona aparece con su nombre, nunca «Tú».
- Se guarda 180 días (número de Patio).
- Cuando alguien se va, el propietario le quita el acceso. No hay
  contraseñas que cambiar.

### Seguir

- «Seguir» en la ficha de una sucursal sigue esa sucursal.
- La campana de esa marca ofrece «Sucursales» para agregar otras.
- «Siguiendo» agrupa por marca.
- En los datos el seguimiento queda por sucursal, como hoy, así que no hay
  que migrar lo que ya existe.
- Si alguien sigue tres sucursales y la marca publica en las tres, le llega
  **un** aviso al día por marca.

### Varias marcas de la misma persona

Por ejemplo, la fonda y los tacos de noche, o la gerente que también tiene
su fonda. Son dos negocios. Se cambia con «Cambiar de cuenta», como en
Instagram (88 % en Jev).

## 4. Cadenas y franquicias grandes

### 4.1 Qué publican y quién

- **El corporativo publica una vez y elige dónde.** Al tocar «Publicar» con
  más de una sucursal en su alcance, se elige en **«Publicar en»**: todas las
  sucursales, un grupo o algunas. Por defecto aparece lo último que eligió.
  - Es el mismo editor y el mismo menú del día de la fonda.
  - Si «Actualizar» cambia el menú, se cambia en todas donde salió, y cada
    sucursal conserva sus «Se acabó».
- **La sucursal opera lo suyo:**
  - «Se acabó» (cada sucursal el suyo);
  - «Ya abrimos» y «Hoy no abro»;
  - avisos de operación y su horario;
  - responder reseñas.

  Si la sucursal publica su propio menú del día, ese menú se queda en ella.
- **Hoy, con alcance de varias:** arriba, el total («Publicaron hoy 138 de
  150»). Abajo, **«Sin publicar hoy»** con las que faltan. Así se lleva el
  control diario sin revisar sucursal por sucursal.
- **Cambiar de sucursal:** el nombre del negocio arriba abre «Todas las
  sucursales», los grupos y las sucursales, con búsqueda. Es el selector de
  tiendas de Uber Eats Manager.
- **Avisos:**
  - el recordatorio «¿Ya publicaste lo de hoy?» le llega a quien opera esa
    sucursal, nunca 150 veces al corporativo;
  - el corporativo recibe a lo más un resumen al día («12 sucursales sin
    publicar»);
  - si el corporativo ya publicó para una sucursal, esa sucursal no recibe
    recordatorio.

### 4.2 Cómo entran: alta asistida con hoja

La primera vez la alta es **asistida**: la cadena manda su hoja y Patio la
carga con ella en una llamada. Jev la pide (hoja 71 %, llamada 29 %). Las
tres prácticas del CDF que se aplican aquí:
- **Collison** (Stripe) instalaba el producto él mismo en la computadora del
  cliente, «Collison installation» en el ensayo de Paul Graham. Aquí, la
  primera alta la hace Patio.
- **Bezos, working backwards:** se parte del trabajo diario de la gerente:
  publicar y marcar lo que se acabó desde el celular.
- **Musk, borrar la parte:** no se construye un panel web hasta que haya al
  menos 3 cadenas.

**Hoja de sucursales**, una fila por sucursal:
- nombre interno, que solo ve el equipo («Plaza Universidad»);
- calle y número, colonia, municipio o alcaldía, estado y código postal;
- teléfono;
- horario por día;
- grupo;
- correo y rol de quien la opera.

**Al cargarla:**
- Un script (`scripts/import-sucursales`) revisa direcciones y ubica cada
  sucursal en el mapa.
- Si hay un negocio con el mismo nombre a menos de 100 m, se pide la
  propiedad (§4.4) en lugar de duplicarlo.
- Crea las sucursales y manda las invitaciones.
- Nada sale público hasta que el propietario principal lo revisa y lo
  confirma.

### 4.3 Verificación de marca y nombres protegidos

- **Cuándo:** un negocio necesita verificarse para pasar de 10 sucursales
  (Google pide verificar la cadena desde 10) o para usar un nombre
  reservado.
- **Qué manda el propietario principal:**
  - constancia de situación fiscal (RFC y razón social);
  - el registro de la marca en el IMPI, a nombre de esa razón social, o el
    contrato de franquicia o licencia;
  - el sitio web oficial con su lista de sucursales (lo que revisa Google);
  - un correo con el dominio de la marca.

  Si algo no cuadra, una videollamada. Jev: disposición de 3.13 de 4.
- **Quién revisa:** Parco, a mano, en un plazo que él fije. Los documentos
  van a un lugar privado y se borran al decidir. Solo se guarda qué se
  revisó, cuándo y por quién.
- **Qué gana la marca:**
  - nadie más puede usar su nombre;
  - sus sucursales nuevas se verifican solas, como en Google.

  Si agrega más de 10 sucursales en un día, se revisa otra vez.
- **Nombres reservados: solo se bloquea el nombre idéntico** (decisión de
  Parco, 23 nov). El juego con los nombres es parte de la cultura de la
  calle y se permite: «Samborcito», «Toxito», «Starbucksito», «Starbucaker».
  - **Idéntico** quiere decir igual después de quitar mayúsculas, acentos,
    signos, espacios y palabras del giro («café», «coffee», «restaurante»,
    «cafetería», «taquería», «sucursal»). «STARBUCKS», «Star Bucks» y
    «Starbucks Coffee» son idénticos a «Starbucks»; «Starbucksito» no.
  - **Qué se reserva:** solo nombres distintivos de cadenas nacionales
    (Starbucks, Toks, Sanborns, Vips, Potzollcalli). Los nombres hechos de
    palabras comunes («El Portón», «La Casa de Toño») nunca se reservan,
    aunque sean de una cadena: hay fondas con ese nombre en todo el país.
    Cada marca verificada con nombre distintivo se agrega sola.
  - **Cuándo se avisa:** al escribir el nombre, en el alta y en «Editar mi
    negocio», antes de guardar: «Ese nombre ya es de una marca registrada.
    Prueba con otro». Si trabaja ahí, «Pide acceso a su equipo». La regla
    vive en el servidor, junto a las de cambio de nombre
    (`20261101133000_identity_rules.sql`), no solo en la app.
  - **Lo que ya existe no se toca por su nombre.** Un negocio dado de alta
    antes de la lista solo se revisa si la marca lo reporta.
  - **Lo parecido se resuelve por reporte, no por filtro.** La marca usa
    «Reportar»; Parco revisa si alguien se hace pasar por ella (mismo
    logo, «sucursal oficial»). El juego de palabras se queda.
- **Sin sello visible.** El comensal confía en el nombre porque nadie más lo
  puede usar. Un sello pondría a las cadenas por encima de la fonda.

### 4.4 Pedir la propiedad

Este caso aparece cuando un franquiciatario dio de alta su sucursal antes de
que llegara la marca, o cuando la hoja encuentra un duplicado. Funciona como
en Google:
1. La marca pide la propiedad de esa sucursal.
2. Al dueño actual le llegan un aviso y un correo. Tiene **3 días** para
   contestar.
3. **Si acepta,** la sucursal entra a la marca con su historial, reseñas y
   seguidores, y él queda como propietario de esa sucursal.
4. **Si rechaza o no contesta,** Patio lo revisa a mano con los documentos.

Nunca se pasa sola.

### 4.5 Franquicias

- **Roles:** la marca es la propietaria principal. Cada franquiciatario es
  propietario de sus sucursales: invita y quita a su gente, y la marca ve a
  todos y puede quitar a cualquiera.
- **Carta:** la decide la marca. Si la marca prende «Las sucursales ponen su
  precio», el franquiciatario pone el suyo; la gente que él invita no puede
  cambiarlo.
- **Pago:** cada quien paga sus lugares (56 % en Jev). La marca puede cubrir
  también las franquiciadas en su contrato. Si una sucursal ya la cubre la
  marca, el franquiciatario ve «Tu marca ya cubre esta sucursal» y puede
  cancelar su Pro.
- **Cuando termina una franquicia:** la marca quita esa sucursal. La sucursal
  queda como «Cerró» y sus reseñas se quedan con la marca en esa dirección.
  Si el exfranquiciatario sigue con otro nombre, da de alta un negocio nuevo.
  Las reseñas hablan de la comida de esa marca, no de la persona.

### 4.6 Cómo se ven junto a la fonda

- **Igual que cualquier lugar:** por cercanía y por lo que buscas.
  - Nadie paga por aparecer más arriba, nunca.
  - Las cadenas no tienen sello.
  - El orden de hoy (relevancia y luego distancia,
    `useFoodieExploreController`) no cambia.
- **«Ocultar cadenas»** en Filtros, apagado por defecto. Cadena quiere decir
  marca verificada con más de 10 sucursales. Alitas X con 3 puestos nunca
  cuenta como cadena.
- **El mismo nombre en todas**, como pide Google («Toks», nunca «Toks
  Polanco»). La tarjeta ya distingue cada una por su colonia y distancia.

### 4.7 Casos de largo

| Texto | Corto | Típico | Largo | Límite |
| --- | --- | --- | --- | --- |
| Nombre de la marca | Toks | Sanborns Café | Bisquets Bisquets Obregón | Potzollcalli Pozolería y Antojitos Mexicanos |
| Nombre interno de sucursal | Lerma | Plaza Universidad | Aeropuerto Terminal 2 Sala B | Centro Comercial Perisur Nivel Terraza Local 3021 |
| Grupo | Norte | Zona Centro | Zona Metropolitana Norte | Estado de México y Zona Metropolitana Norte |
| Conteo en Hoy | 3 de 3 | 138 de 150 | 1,204 de 1,312 | «Sin publicar hoy · 1,312» |

**Regla:** en el selector y en Hoy, el nombre de la sucursal y el del grupo
bajan a su propio renglón y, si no caben, se parten en dos. Nunca se cortan
con «…». Las cifras llevan separador de miles. Se revisa con letra grande y
en oscuro (`docs/design/CONTENT_STRESS_CASES.md`).

## 5. Planes y cobro

> Los precios son propuesta para que decida Parco. Lo demás queda decidido.

| Plan | Lugares | Precio propuesto | Cómo se paga |
| --- | --- | --- | --- |
| **Gratis** | Hasta 3 | $0 | — |
| **Pro** | Hasta 3 | $99/mes · $990/año (vigente) | En la app |
| **Pro 10** | Hasta 10 | $249/mes | En la app, mismo grupo de suscripción que Pro |
| **Cadenas** | 11 o más, marca verificada | $49 por sucursal al mes más IVA, mínimo 10 | Contrato y factura, fuera de la app |

**Reglas del cobro:**
- **El plan cubre lugares** y lo paga un propietario de esos lugares: el
  dueño, el franquiciatario o la marca por contrato.
- **Cada sucursal va cubierta:** las 3 primeras de un negocio pueden ir en
  Gratis; de la cuarta en adelante, cada una va en el plan de la marca o en
  el de su propietario. No se agrega una sucursal sin ese plan, y la que se
  une al pedir la propiedad también se cubre.
- **Lecturas con foto, por negocio** (compartidas entre sus sucursales):
  Gratis 20 al día; Pro, Pro 10 y Cadenas 60 al día. Una cadena lee su carta
  una vez y publica en todas. Contarlas por sucursal multiplicaría el costo
  sin darle nada a nadie.
- **Avisos especiales, por sucursal:** 8 al mes en cada lugar cubierto.
- **Cadena Fundadora:** las primeras 3 cadenas tienen 6 meses sin costo, como
  Fundador.
- Pasar de 3 lugares pide Pro 10, y pasar de 10, Cadenas. La fonda de un solo
  lugar no ve nada de esto.

**Tiendas:**
- **Apple:** dentro de un grupo de suscripción una persona solo tiene una
  activa, y se sube o se baja de nivel. Por eso Pro y Pro 10 son niveles del
  mismo grupo.
- **Cadenas fuera de la app:** Apple deja vender por fuera a organizaciones
  para su gente (3.1.3(c), «Enterprise Services»), y Google deja usar en la
  app lo que se pagó en otro lado. Las dos piden lo mismo: dentro de la app,
  ni precio, ni botón, ni invitación a comprar por fuera. La gente de una
  cadena solo ve «Plan Cadenas».
- **Riesgo:** la excepción de Apple dice que lo que se vende a una sola
  persona va por compra en la app. Como Patio vende Pro a personas, un
  revisor podría objetar. El respaldo, si pasa, es ofrecer Cadenas también
  como compra en la app (3.1.3(b)).
- **Antes de la primera cadena:** Codex lo confirma con App Review.

**Fiscal:** con RESICO, el tope de 2026 es de 3.5 millones de pesos al año en
ingresos cobrados. La propuesta de 5 millones para 2027 sigue en el Congreso.
Una cadena de 150 sucursales a $49 son $88,200 al año. Revisarlo con el
contador junto con los productos de Pro.

## 6. Cómo queda cada caso

| Caso | Cómo queda en Patio |
| --- | --- |
| Fonda de una sola persona | Igual que hoy: una cuenta, un negocio, una sucursal. No ve nada nuevo. |
| Fonda donde la hija publica | La dueña invita a su hija como Administrador. Cada una entra con su correo. |
| «Alitas X», 3 puestos del mismo dueño | Un negocio con 3 sucursales y una carta. Cada encargado es Administrador de su puesto. El dueño ve las 3, «Sin publicar hoy» y el registro. Pro cubre los 3. |
| «Alitas X» con 7 puestos | Igual, con Pro 10. Si un puesto cobra distinto, el dueño le pone su precio. |
| Franquicia chica (tortas, 4 propias y 18 franquiciadas) | La marca es propietaria principal y decide la carta. Cada franquiciatario es propietario de sus sucursales y maneja a su gente. Necesita verificarse por pasar de 10 sucursales. La marca paga Pro 10 por sus 4 propias y cada franquiciatario paga Pro por las suyas; o la marca cubre las 22 con Cadenas. |
| Franquiciatario que llegó antes que la marca | Su negocio sigue igual. Cuando llega la marca, pide la propiedad, él acepta y su sucursal se une con todo su historial. |
| Cadena grande (Toks, Sanborns, Starbucks, Bisquets) | Alta asistida con hoja y marca verificada. El corporativo es propietario principal; los gerentes de zona son de su grupo; cada gerente de sucursal es Administrador de la suya. El corporativo publica el menú del día en todas o en un grupo, y cada sucursal marca lo suyo. Plan Cadenas por contrato. |
| Alguien da de alta «Starbucks» sin serlo | El nombre idéntico está reservado: al escribirlo se le pide otro, o pedir acceso al equipo de la marca. |
| Un puesto se llama «Samborcito» o «Starbucksito» | Se permite porque el nombre es distinto. Si la marca cree que se hace pasar por ella, lo reporta y Parco revisa. |
| Tianguis o sobre ruedas | Una sucursal itinerante con sus días («Dónde vendes», como hoy). |
| Dos marcas de la misma persona | Dos negocios en una cuenta, con «Cambiar de cuenta». |

## 7. Orden para construir

| Fase | Qué incluye | Por qué en este orden |
| --- | --- | --- |
| **1. Equipo** | Invitar por correo con rol y alcance, autoría de cada cambio y Registro de actividad. La base de datos completa de §8 desde el inicio, para no parchar después. | Ayuda directo al lado difícil: publica quien está en el puesto (84 % en Jev). |
| **2. Sucursales** | Agregar sucursal, selector de sucursal, carta del negocio con «aquí no hay» y precio por sucursal, «Publicar en», Hoy con «Sin publicar hoy», «Siguiendo» agrupado, campana con «Sucursales» y Pro 10. | Alitas X y los puestos chicos. Y es todo lo que una cadena usa a diario. |
| **3. Cadenas** | Grupos, verificación de marca, nombres reservados, pedir la propiedad, script de alta con hoja, «Ocultar cadenas», plan Cadenas por contrato y la primera Cadena Fundadora. | Queda aterrizado hoy. Se construye sobre la fase 2 y solo agrega lo que una cadena necesita para entrar. |
| **4. Varias marcas** | «Cambiar de cuenta» y «Agregar cuenta», hasta 3 negocios. Mientras, una persona está en un solo equipo. | Es lo menos frecuente y no bloquea a nadie hoy. |

Antes, las cadenas iban al final y después del piloto. Ahora van terceras,
antes que varias marcas: la primera cadena puede entrar en cuanto exista la
fase 2, con alta asistida.

## 8. Cambios técnicos

**Nombres:**
- `negocios` sigue siendo el lugar del mapa: en la app, la **sucursal**. Así
  no se tocan seguidores, reseñas, menús ni vistas, que ya cuelgan de
  `negocio_id`.
- Arriba se agrega `marcas`, que en la app es el **negocio**.

**Tablas nuevas o cambios:**
- `marcas`:
  - nombre y nombre normalizado, giro, logo;
  - `propietario_principal`;
  - `verificada_at`;
  - `sucursales_ponen_precio` (apagado por defecto).
- `negocios` + `marca_id` (se llena sola: una marca por cada negocio de
  hoy), `grupo_id` y `nombre_interno`.
- `grupos`: `marca_id`, nombre.
- `equipo`: `marca_id`, `user_id`, `rol` (`propietario` | `administrador`),
  `alcance` (`todo` | `grupo` | `sucursales`), `grupo_id`; más
  `equipo_sucursales` para el alcance por sucursal. Cada dueño de hoy entra
  como propietario principal.
- `invitaciones`:
  - correo, rol, alcance, grupo o sucursales, y quién invitó;
  - vencen a los 7 días (número de Patio);
  - se aceptan al entrar con ese correo.
- `registro_actividad`: marca, sucursal, persona, acción, detalle y hora;
  se borra a los 180 días.
- `cartas` pasa de `negocio_id` a `marca_id`, y se agrega `carta_ajustes`
  (sucursal, identidad del platillo, «aquí no hay», precio).
- `menus` + `autor_id` y `publicacion_id`. «Publicar en» escribe una fila por
  sucursal con la misma `publicacion_id`, así `fetchPublicMenus` sigue
  leyendo por sucursal. «Actualizar» reescribe las filas de esa publicación
  y conserva los «Se acabó» de cada una.
- `marcas_reservadas` (nombre normalizado) y `verificaciones_marca` (RFC,
  razón social, registro IMPI, sitio, dominio, estado y quién revisó). Los
  archivos van en un bucket privado y se borran al decidir.
- `solicitudes_propiedad`: marca, sucursal, vence a los 3 días y estado.
- `business_plans` cubre sucursales: lugar, quién paga y origen (`app_store`,
  `play`, `contrato` o `fundador`). Se agrega `contratos_cadena` (sucursales,
  precio, vigencia, RFC para la factura).

**Permisos:**
- La función `puede(persona, sucursal, acción)` sustituye todos los
  `owner_id = auth.uid()` de RLS y RPC.
- Sus acciones son `operar`, `carta`, `precio_local`, `equipo`, `pago` y
  `verificar`.
- Se quita `fonditas_one_per_owner_idx`. Hasta la fase 4, una persona está
  en un solo equipo.

**Avisos:**
- El recordatorio de publicar va a quien opera cada sucursal.
- Resumen diario para quien tiene varias.
- Un aviso al día por persona y por marca, aunque siga varias sucursales.

**Pruebas:**
- `puede()` con cada rol y alcance;
- que nadie dé más de lo que tiene;
- que un nombre idéntico a uno reservado se rechace en el servidor y que
  «Samborcito» o «Starbucksito» pasen;
- que «Actualizar» conserve los «Se acabó»;
- que el comensal nunca vea quién publicó.

## 9. Lo que decide Parco

1. Precios: A (escalones: Pro 10 a $249 y Cadenas a $49 por sucursal), B
   (Pro y $29 por lugar extra) o C ($33 por lugar para todos). Las tres,
   con ejemplos, en `artifacts/patio-sistema.html`, Producto 08 «Planes».
2. Gratis y Pro hasta 3 lugares; pasar de 3 pide Pro 10.
3. Cadena Fundadora: las primeras 3, 6 meses sin costo.
4. La lista de nombres reservados. La regla ya está decidida: solo el
   nombre idéntico y solo nombres distintivos (§4.3).
5. Construir la fase 1, Equipo.

Fuentes: [Square, permisos y ubicaciones](https://squareup.com/help/us/en/article/5822-employee-permissions) ·
[Square, registro de actividad](https://squareup.com/help/us/en/article/5579) ·
[Toast, permisos de carta para cadenas](https://doc.toasttab.com/doc/platformguide/adminUnderstandingMenuEditingPermissionsForEnterprises.html) ·
[Toast, precio por sucursal](https://support.toasttab.com/en/article/Location-Specific-Pricing-Master-Menu-Management-1492786563831?lang=en_US) ·
[Google, verificación de cadena](https://support.google.com/business/contact/bulk_verification) ·
[Google, retrasos en la verificación de cadena](https://support.google.com/business/answer/3217747?hl=en) ·
[Google, nombres en la ficha](https://support.google.com/business/answer/3038177) ·
[Google, pedir la propiedad](https://support.google.com/business/answer/4566671) ·
[Google, propietarios y administradores de grupos](https://support.google.com/business/answer/6085300?hl=en) ·
[Google, buenas prácticas para grupos de ubicaciones](https://developers.google.com/my-business/content/best-practices) ·
[Uber Eats Manager](https://merchants.ubereats.com/gb/en/resources/learning-center/uber-eats-manager/) ·
[Meta, acceso total y parcial](https://support.chatarchitect.com/books/meta-business-portfolio-setup/page/add-people-to-a-business-portfolio-and-assign-a-business-asset) ·
[App Store, grupos de suscripción](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions) ·
[App Review Guidelines 3.1.3](https://developer.apple.com/app-store/review/guidelines/) ·
[Google Play, preguntas sobre pagos](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en) ·
[Paul Graham, «Do Things That Don't Scale»](https://paulgraham.com/ds.html) ·
[RESICO, límite vigente](https://www.noticiasgobierno.com/resico-2026-limite-ingresos/) ·
[RESICO, propuesta 2027](https://idconline.mx/fiscal-contable/2026/09/11/propuesta-resico-pf-2027-limite-de-5-millones-y-nuevo-iva).
