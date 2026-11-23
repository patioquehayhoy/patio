# Agotados y varios negocios — 23 noviembre 2026

Parco pidió verificar con Apple, Jev y el CDF cómo se ve un platillo que se
acabó, y dejar resuelto qué pasa cuando alguien tiene más de un negocio.
Datos de Jev: [script](research/jev_agotados_y_marcas_2026-11-23.py) ·
[resultado](research/jev-agotados-y-marcas-2026-11-23.json). Jev orienta;
no decide. Lado difícil hoy: el negocio que publica su menú del día.

## 1. Agotados: se queda como está

**Decisión: el diseño actual se queda.** El platillo no cambia de lugar, el
nombre va tachado en gris y la descripción se conserva. Donde iba el precio
dice «Se acabó». Aplica en ficha y póster. No hubo cambio de código. La
propuesta de quitar el tachado (auditoría del 22 nov) queda descartada.

### Apple (HIG en `docs/hig.pdf`, iOS 26)

Apple no dice nada de tachar o no; pide tres cosas, y el diseño actual las cumple:

| Lo que pide Apple | Cómo lo cumple Patio |
| --- | --- |
| No depender de un solo medio para informar (Accessibility, «Perceivable»; Color, «Inclusive color»: usar texto o forma además del color). | Tres señales para un estado: raya (forma), gris (color) y «Se acabó» (texto). VoiceOver lee «…, se acabó hoy». |
| Contraste mínimo 4.5:1 en texto de hasta 17 pt, en claro y en oscuro. | Gris de agotado: 8.4:1 en claro y 9.2:1 en oscuro. |
| Interacciones familiares y consistentes (Accessibility, «Intuitive»). | Es lo que hace el negocio en su pizarrón: tacha (43 %) o escribe «se acabó» (48 %). Patio hace las dos. |

La variante «casi transparente» es la que choca con Apple: no llega al
contraste mínimo. Además, en visionOS, Apple reserva su estilo más tenue para
elementos inactivos cuyo texto no hace falta leer bien. Un platillo agotado
sí se tiene que poder leer.

### Jev (4 comensales, 6 negocios)

| Pregunta | Resultado |
| --- | --- |
| Comensal: ¿con cuál entiendes más rápido qué hay y qué no? | **Tachado 76 %**, gris sin raya 10 %, al final 9 %, oculto 4 %, transparente 1 %. Los 4 eligen tachado. |
| Comensal: ¿con cuál lees mejor qué era, para pedirlo otro día? | Gris sin raya 55 %, tachado 37 %. |
| Comensal: ¿qué tanto te cuesta leer un nombre tachado? (0–4) | 1.0 en promedio. El señor de 67 años con letra grande: **2.06**. |
| Comensal: ¿una raya te hace pensar que ya no lo venden nunca? (0–4) | 2.19, a medias. «Se acabó» junto al precio aclara que es de hoy. |
| Negocio: ¿cómo prefieres que lo vean tus clientes? | **Tachado 67 %**, gris 18 %. Los 6 eligen tachado. |
| Negocio: en tu pizarrón, ¿qué haces? | Escribo «se acabó» 48 %, tacho 43 %, borro 8 %. |

Lectura: el tachado gana donde importa (entender de un vistazo a la 1:30 y lo
que quiere el negocio) y cuesta un poco al releer, sobre todo con letra grande.
Ese costo ya lo compensan el gris con 8.4:1 y la descripción completa.

### CDF

- **Bezos, «working backwards» y puertas de dos sentidos** (carta a
  accionistas 2015). Se parte de la pregunta de quien come: «¿qué hay todavía?».
  La respuesta más rápida es el tachado. Además es una decisión reversible:
  se decide rápido y se mide con datos reales, sin más rondas de diseño.
- **Musk, borrar partes** (5 pasos, recorrido de Starbase con Everyday
  Astronaut, julio 2021). Antes de borrar una parte, preguntar qué trabajo
  hace. Aquí cada señal tiene uno: la raya sirve para verlo de un vistazo, el
  texto es lo que lee VoiceOver y el gris baja la jerarquía. Musk también dice
  que si nunca regresas algo que borraste, no estás borrando suficiente. Quitar
  la raya fue esa prueba, y Jev pide regresarla.
- **Amazon, la raya en el precio significa descuento** («List Price»,
  «Typical Price»). Por eso Patio nunca tacha el precio: lo cambia por «Se
  acabó». El tachado va solo en el nombre.

Fuentes: [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) ·
[HIG Color](https://developer.apple.com/design/human-interface-guidelines/color) ·
[Bezos, decisiones tipo 1 y 2](https://www.businessinsider.in/jeff-bezos-there-are-two-types-of-decisions-to-make-and-dont-confuse-them/articleshow/51706758.cms) ·
[Musk, Starbase](https://everydayastronaut.com/starbase-tour-and-interview-with-elon-musk/) ·
[Amazon, precios tachados](https://sell.amazon.com/blog/amazon-list-price).

## 2. Varios negocios: primera versión (sustituida)

> Sustituida el mismo día por [marcas, sucursales y equipo](SUCURSALES_Y_EQUIPO_2026-11-23.md),
> que agrega franquicias, cadenas, puestos de una misma marca, roles y auditoría.

### Los casos reales

| Caso | Ejemplo | Qué necesita |
| --- | --- | --- |
| Un negocio, varios lugares que venden lo mismo | Tianguis lunes y viernes, sobre ruedas | Ya existe: «Dónde vendes» (puntos). Mismo menú. |
| Sucursales del mismo dueño | «Tacos El Güero» en Narvarte y en Del Valle | Cada una con su menú del día. Hoy comparten menú: **hueco**. |
| Varias marcas del mismo dueño | La fonda de día y unos tacos de noche | Dos perfiles con nombre, menú, seguidores y reseñas propios. Hoy: un negocio por cuenta. **Hueco**. |
| Franquicia | Cada local es de otro dueño | Cada franquiciatario tiene su cuenta y su negocio. Ya funciona; dos negocios pueden llamarse igual en lugares distintos, como en Maps. |

### Lo que dijo Jev (6 negocios)

- Segundo negocio: **cambiar de negocio con una sola cuenta, como en Instagram
  — 88 %**. Cuentas separadas 12 %; juntar todo en un perfil 1 %.
- Sucursales: cada una publica su menú 47 %; un menú y eliges en cuáles sale
  44 %; el mismo menú en todas, como hoy, **10 %**.
- Pro con dos negocios: un pago para todos 44 %, uno por negocio 35 %, el
  segundo con descuento 22 %. Callejón y desayunos: 72 % un pago.

### Propuesta (un solo concepto)

1. **Una cuenta, varios negocios.** Es la misma persona con su correo.
   Cada negocio es un perfil completo: nombre, giro, menú, seguidores y
   reseñas. Se cambia tocando el nombre del negocio arriba en Perfil, con las
   mismas palabras que Instagram: «Cambiar de cuenta» y «Agregar cuenta».
   Instagram anunció hasta 5 cuentas con un solo inicio de sesión; Patio
   propone 3 negocios.
2. **Una sucursal con su propio menú es un negocio más.** Usa el mismo nombre
   y vive en la misma cuenta, igual que Google Maps tiene una ficha por
   ubicación. Al publicar sale «Publicar también en…» con las otras
   sucursales marcadas; así una persona escribe el menú una vez y lo cambia
   donde haga falta. Los puntos de «Dónde vendes» quedan para lo itinerante,
   donde el mismo menú cambia de lugar.
3. **Pro por cuenta: un pago cubre todos tus negocios.** Por tres razones:
   - Es lo que más eligió Jev, sobre todo el lado difícil.
   - No pone un cobro por negocio a quien publica.
   - En la App Store, una persona solo puede tener una suscripción activa
     por grupo. Cobrar por negocio obligaría a crear grupos o productos por
     cada lugar.
4. **Franquicias:** nada nuevo por ahora. Si una cadena pide verse unida,
   se estudia una «marca» verificada, pero no antes.

### Qué toca construir (cuando Parco diga que sí)

- **Base de datos:**
  - quitar `fonditas_one_per_owner_idx` y limitar a 3 negocios por dueño;
  - guardar el negocio activo por dispositivo;
  - revisar cada RLS y RPC que hoy suponen «el negocio del dueño».
- **App:**
  - selector «Cambiar de cuenta» en Perfil;
  - una sola fuente del negocio activo para las pantallas del negocio (Hoy,
    Menús, Avisar, Ajustes);
  - los menús guardados del teléfono, separados por negocio;
  - «Publicar también en…».
- **Avisos:**
  - el resumen y el recordatorio de publicar, uno por negocio;
  - el título de cada aviso con el nombre del negocio.
- **Pro:**
  - el beneficio pasa del negocio a la cuenta;
  - las cuotas (avisos especiales, lecturas) se cuentan por negocio, para que
    un negocio no se coma las de otro.

Fuentes: [Instagram, varias cuentas](https://help.instagram.com/iphone-app/1696686240613595) ·
[App Store Connect, grupos de suscripción](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions).
