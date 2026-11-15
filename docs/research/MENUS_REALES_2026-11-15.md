# Menús reales — qué hay en la calle (2026-11-15)

**Lado difícil hoy:** el negocio que publica su menú diario.

Piloto con fotos reales: Apify juntó **96 lugares** de Google Maps (12 giros:
fonda, cocina económica, comida corrida, taquería, restaurante, antojitos,
mariscos, pozolería, tortería, cafetería, comida casera y pollos rostizados;
4 zonas: Narvarte, Nuevo Polanco, Iztapalapa y Coyoacán) con **1,162 fotos**,
y **124 publicaciones** de Instagram (#comidacorrida, #tacoscdmx…). Jev
clasificó las 1,371 fotos. Costo: 1.45 USD de Apify; Jev, centavos.
Scripts: `menus_juntar_…`, `menus_jev_clasificar_…`, `menus_informe_…`
(misma fecha). Las fotos son de terceros y no entran a git.

## Lo que salió

| | Google Maps | Instagram |
|---|---|---|
| Tienen su menú en foto | 70 % de los lugares | 34 % de las publicaciones |
| Cómo está hecho | impreso 61 % · pizarrón 19 % · digital 11 % · hoja 9 % | digital 90 % |
| Dice la fecha o el día | 8 % | 50 % |
| Dice que incluye agua o postre | 41 % | 57 % |
| Platillos con precio propio distinto al de su bloque | 30 % | 17 % |
| Carta aparte | 23 % (casi siempre con precio por platillo) | 12 % |

- **Cómo cobran.** Lo más común, en todos los giros, es precio por
  platillo. Un precio escrito en el encabezado del menú es raro (≈8 %).
- **En fondas y comida corrida, revisado a mano** (8 fotos), aparecen tres formas:
  1. **Precio por guisado, con sopa y arroz incluidos.** «Mixiote $65»,
     «Pollo en salsa de 3 chiles $75», «Guisado $130 · Guarnición $40».
     Jev lo cuenta como «sin precio del menú», y en lo literal tiene razón:
     no hay precio en el encabezado.
  2. **Un precio para todo el menú.** «Comidas Tere $60».
  3. **Dos menús, cada uno con su precio.** «Menú del día $120 · Menú
     ejecutivo $140» (Fonda La Doña). Es justo el modelo de bloques del
     editor.
- **Quién sube las fotos en Maps.** Solo el **18 %** de las fotos de
  platillos son del negocio (133 de 721) y el **82 %** son de clientes. Del
  menú, 25 % las sube el negocio.
- **Palabras en el texto de Instagram.** «menú» 25 % · «menú del día» 6 % ·
  «comida corrida» 3 % · «completo» 5 % · precio escrito con $ 12 %. Casi
  nadie nombra la forma de cobrar en el texto: el precio va en la imagen.

## Qué significa para Patio

1. **El precio por platillo es la base.** El precio del bloque («MENÚ
   $100», «CARTA $110») sigue siendo opcional, como ya está.
2. **Falta una forma de decir «incluye».** El 41–57 % lo pone (agua,
   postre, sopa y arroz con el guisado). Candidato: una línea «Incluye…»
   bajo el precio del menú o del guisado.
3. **Las fotos de platillos las ponen sobre todo los clientes** (82 % en
   Maps). Las fotos de clientes, desde sus reseñas, deben llegar pronto; con
   solo las del negocio, la mayoría de los platillos se quedaría sin foto.
4. **El menú del día en redes es una imagen digital con fecha.** El póster
   de Patio compite justo ahí: debe decir el día y verse bien al compartirse.

## Límites

- 96 lugares en 4 zonas: es un piloto. Las cifras por giro llevan 2–8
  menús cada una y solo indican tendencia.
- Las fotos de Maps pueden ser viejas. Quien vende solo por WhatsApp no
  aparece.
- Jev responde sobre lo que se ve escrito; las formas «precio por guisado»
  y «dos menús con su precio» salieron de la revisión a mano. Antes del
  estudio completo: agregar esas dos opciones a la pregunta del precio y
  revisar 20 fotos a mano.
