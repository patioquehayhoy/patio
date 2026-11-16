# Editor del menú — cómo lo hacen otras apps y qué conviene (2026-11-16, noche)

**Lado difícil hoy:** el negocio que publica su menú diario. El editor es su
herramienta de todos los días: tiene que poder escribir lo de hoy en menos de
un minuto y, cuando quiera, ponerle foto, descripción y precio.

Maqueta para verla: `scratchpad/maquetas/editor-propuesta.html` (se abrió en
la Mac de Parco).

## 1. Lo que no funcionó (tres versiones del 16 nov)

| Versión | Idea | Por qué no |
|---|---|---|
| Pizarrón con «×» | Cada renglón con «$» y «×»; «Agregar descripción · Agregar foto» debajo de cada platillo | La «×» en el título del menú confundía; agregar secciones quedaba disperso |
| Herramientas en el renglón activo | Las herramientas solo en el platillo que escribes | Todo se movía al tocar; el teclado tapaba; «Agregar…» estorbaba al arrastrar |
| Como una nota | Sin botones; todo en la barra del teclado | La descripción y la foto desaparecieron de la vista |

Lección: borré de más. Musk lo dice en su algoritmo: si no regresas al menos
el 10 % de lo que borraste, no borraste suficiente. Aquí toca regresar lo
esencial: que la foto, la descripción y el precio se vean siempre.

## 2. Cómo lo hacen otras apps

| App | Cómo se edita un platillo | Fuente |
|---|---|---|
| Square (punto de venta) | Lista de artículos; cada uno con nombre, precio, descripción, foto y categoría | [Create and edit items](https://squareup.com/help/ca/en/article/8335-create-and-edit-items) |
| Google Business Profile | «Agregar sección» y dentro «Agregar platillo»: nombre, precio, descripción y foto; «Borrar» dentro del platillo | [About the menu editor](https://support.google.com/business/answer/9455840) |
| Uber Eats Manager | Elegir el platillo abre su panel (nombre, foto, descripción, precio); el precio se cambia también desde la lista | [Menu Maker](https://merchants.ubereats.com/mx/en/resources/learning-center/menu-and-photos) |
| DoorDash | Lápiz → «Edit details»; la foto es opcional al guardar | [Add menu items](https://help.doordash.com/en-us/merchants/article/add-menu-items) |
| Recordatorios (Apple) | Se escribe en la lista y «siguiente» abre el de abajo; notas e imagen en los detalles | [Use Reminders](https://support.apple.com/102484) |
| Contactos (Apple) | Una tarjeta con lugares fijos: foto arriba, cada dato en su renglón, «agregar» dentro del grupo | (app de iOS) |

Lo que comparten todas: el menú se agrupa por secciones, y cada platillo
siempre tiene los mismos cuatro lugares (foto, nombre, descripción y precio).
Apple suma escribir rápido en la lista y que cada dato tenga su lugar fijo
dentro de una tarjeta.

## 3. Qué dice Apple y qué dicen las reglas de Patio

- **Listas agrupadas en tarjetas** y editables donde tenga sentido; reordenar
  se agradece ([HIG, Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)).
- **Barra sobre el teclado** para lo del campo donde estás, con «Listo».
- **Leyes del proyecto:** sin viudas; nada de leyendas que expliquen cómo usar;
  íconos repetidos en una sola columna; nada se mueve mientras escribes;
  casos de largo (60 letras, «$1,250», letra grande y oscuro).
- Lo vacío en gris («Descripción», «$») funciona como etiqueta mientras está
  vacío. La ley de «etiqueta persistente» es para formularios de alta; aquí el
  dato escrito se explica solo, como en la ficha.

## 4. CDF: qué se transfiere

| Referente | Fuente | Qué se toma |
|---|---|---|
| Elon Musk: borrar y regresar lo esencial | [Starbase, parte 1](https://everydayastronaut.com/starbase-tour-and-interview-with-elon-musk/) | La v3 borró de más; se regresan foto, descripción y precio visibles, y nada más |
| Steve Jobs: enfocarse es decir que no | [WWDC 1997](https://allaboutstevejobs.com/videos/misc/wwdc_1997_closing_chat) | Un solo lugar para cada cosa; sin «×», sin «···», sin herramientas que aparecen |
| Jeff Bezos: working backwards | [Amazon, PR/FAQ](https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes) | Se diseña desde el día del negocio: escribir los guisados de hoy y publicar |
| Boris Cherny: lo simple primero, demanda latente | [Latent Space](https://www.latent.space/p/claude-code) | El negocio ya escribe su menú como una lista por secciones en el pizarrón: se respeta esa forma |

## 5. Propuesta: tarjetas con todo a la vista

1. **Cada sección es una tarjeta** (radio 18, fondo de superficie): arriba
   su título y su precio; adentro sus platillos; al final «＋ Platillo».
   Debajo de la última tarjeta de hoy, «＋ Sección» (y otro al final de la
   carta, si hay).
2. **Cada platillo tiene siempre sus cuatro lugares:**
   - a la izquierda, el cuadro de la foto (la foto, o un ícono de cámara gris);
   - el nombre, y debajo la descripción, o «Descripción» en gris;
   - a la derecha el precio, o «$» en gris.

   Los íconos forman una columna y los precios otra.
3. **Escribir:** tocas el nombre y escribes. «siguiente» va del nombre a su
   descripción y de ahí al platillo de abajo (o a uno nuevo). Escribir «$»
   lleva al precio. El renglón nunca queda bajo el teclado.
4. **Nada se mueve:** cada campo está siempre en su lugar. Solo cambia lo que
   escribes. Las sugerencias («Mover a la descripción», «¿Es el mismo
   platillo?») aparecen con el teclado cerrado.
5. **Foto:** tocas el cuadro y se abre ahí mismo: Tomar foto, Elegir de Fotos
   y Quitar foto.
6. **Borrar:**
   - «Borrar» en la barra del teclado del renglón que escribes;
   - o mantener presionado y llevarlo arriba, a «Borrar»;
   - lo que se queda vacío se va solo;
   - siempre hay «Deshacer».
7. **Mover:** mantener presionado el nombre o el título y arrastrar; una línea
   naranja marca dónde cae.
8. **Barra del teclado mínima:** «Borrar · Listo». En un precio, «Siguiente ·
   Listo». En un título vacío, los títulos del giro y «Listo».

## 6. Decide Parco

- [ ] ¿Va la propuesta de la maqueta?
- [ ] ¿«Descripción» en gris en cada platillo (recomendado: se ve que se
  puede), o solo cuando tiene?
- [ ] ¿El cuadro de la foto en cada platillo (recomendado: la columna
  ordena), o solo cuando tiene foto?
