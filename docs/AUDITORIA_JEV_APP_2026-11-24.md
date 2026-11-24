# Auditoría panorámica con Jev y cambios de Parco — 24 noviembre 2026

Parco revisó la app en su iPhone (túnel de Metro) y pidió: arreglar el
arrastre de secciones, quitar la redundancia de «Publicar» y «Programar»,
cambiar «Publicado hoy», exigir cuenta para lo del negocio, bajar las
lecturas con foto gratis y auditar la app completa con Jev.
Datos: [script](research/jev_auditoria_app_2026-11-24.py) ·
[resultado](research/jev-auditoria-app-2026-11-24.json) (6 negocios,
4 comensales). Jev orienta; no decide. Lado difícil hoy: el negocio que
publica su menú del día.

## Lo que cambió

| Tema | Antes | Ahora | Por qué |
| --- | --- | --- | --- |
| Mover secciones | Al mantener presionado el título, iOS cancelaba el arrastre (Metro: «levanta section» y a 1 s «el sistema canceló los toques»). | Con el teclado cerrado, una capa sobre el título recibe el toque: mantener presionado mueve la sección y tocar abre el título. | El texto de iOS tomaba el toque largo. Sin manijas. |
| «Publicar» y «Programar» | Después del cierre, «Publicar» abría la misma lista de días que «Programar», y «Programar» repetía «Publicar ahora». | «Publicar» sale ahora, siempre. «Programar» solo ofrece días. | Un botón, un trabajo. |
| Nombre del menú vigente | «Publicado hoy». | Arriba de Menús, en negritas: **LO QUE VEN HOY**. En la fila y en el editor: **Lo ven hoy**. | Jev: «Lo que ven hoy» 43 %, «Menú actual» 30 %, «Publicado hoy» 20 %, «En vivo» 7 %. |
| Lecturas con foto | Gratis 20 al día; Pro 60. | Gratis **3**; Pro **30**. A mano, siempre gratis. Al acabarse: «Escribe el menú a mano, que siempre es gratis, o vuelve mañana. Con Pro tienes 30 al día». | Decisión de Parco (FOMO y costo). Jev avisa: al acabarse, «dejar la app» 2.43 de 4 y «pagar Pro» 1.5. Por eso el aviso ofrece primero escribir a mano. Medir cuántos llegan al tope. |

## Cuenta: el negocio ya la pide; el comensal no

- **Negocio:** en producción, publicar y ver Hoy, Racha y reseñas exige
  entrar con correo y código. Lo que Parco vio sin cuenta es el modo de
  ejemplo de desarrollo (`business-demo.ts`, solo `__DEV__`, con rótulo
  «Datos de ejemplo»). Jev: el correo molesta poco al negocio (1.6 de 4).
- **Comensal:** se queda viendo el mapa sin cuenta. Jev: «sin cuenta, correo
  solo para seguir, guardar y reseñar» 95 %; si se pide el correo antes del
  mapa, la cerrarían 2.56 de 4. En el arranque, el comensal sin cuenta es
  el que hace que el negocio vea vistas. El correo se pide al seguir,
  guardar o reseñar, y ahí empiezan los avisos y el contacto.

## Panorámica

| | Lo que más sirve | Lo que más cuesta o menos se entiende |
| --- | --- | --- |
| Negocios | Leer el menú de una foto 54 %; Programar 12 %; «Se acabó» 10 % | Equipo 33 %; foto 26 %; Racha 14 %; Programar 14 % |
| Comensales | El mapa 70 %; el menú de hoy 18 % | «Tus visitas» 65 %; listas 17 % |

**Recomendaciones, sin aplicar todavía (decide Parco):**
1. **Quitar Racha.** Nadie la eligió como útil (0 %) y 14 % la ve como
   carga. Musk: si una parte no hace trabajo, se borra.
2. **Sacar «Tus visitas» del lanzamiento.** Es lo que menos se entiende
   (65 %) y es lo que pide ubicación en segundo plano: el video de Play, la
   revisión más dura de Apple y el párrafo más delicado del aviso de
   privacidad. Vuelve cuando haya red.
3. **Equipo se queda, pero discreto.** Es una fila en Perfil; a la fonda de
   una persona no le estorba en su flujo.
4. **La foto es el producto del negocio.** Cualquier fricción en la lectura
   pega directo al lado difícil: la medición de la lectura lenta (encargo a
   Codex §A) sube de prioridad.
