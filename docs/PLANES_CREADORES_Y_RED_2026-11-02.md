# Planes, creadores y red — propuesta para cerrar (2026-11-02)

Visión de conjunto para decidir cobro, creadores y feed de una vez, siguiendo
*The Cold Start Problem* (Andrew Chen). Base:
[cold start y monetización](NETWORK_COLD_START_AND_MONETIZATION.md) y
[tipos de usuario](USER_TYPES.md). Alejandro delegó la decisión (2026-11-02) con
una condición: la app nunca ofrece un plan o herramienta que no exista.

## 0. El lado difícil (revisar en cada decisión)

El lado difícil es el que cuesta más conseguir y sin el cual la red no sirve.
Cambia con la etapa; se anota aquí cada vez que cambie.

| Etapa (Chen) | Lado difícil | Por qué | Señal de que ya cambió |
|---|---|---|---|
| **Arranque — HOY** | **Negocio que publica su menú diario** | Sin menú de hoy el mapa está vacío y el Foodie no vuelve | 20–30 negocios publicando a diario en la colonia piloto |
| Punto de inflexión | Foodie que va y guarda | El negocio solo sigue publicando si ve guardados y visitas | Negocios que dejan de publicar por falta de respuesta |
| Velocidad de escape | Creador que abre colonias nuevas | Sus listas llevan gente a una colonia antes de que tenga muchos negocios | Colonias nuevas que arrancan por listas, no por altas |

Regla que sale de la tabla: **nunca se cobra ni se pone barrera al lado
difícil de la etapa actual.** Al negocio se le da gratis todo lo que hace
funcionar la red; Pro solo vende comodidad y alcance extra.

## 1. Quién paga y quién no

| Lado | Papel en la red | Paga |
|---|---|---|
| Negocio | Lado difícil hoy: publica el menú que hace útil la red | Gratis generoso; Pro opcional |
| Foodie | Demanda: abre, guarda, sigue, reseña | No en arranque (ver §3) |
| Creador | Siembra demanda: trae a su audiencia con sus listas | No; programa por invitación |

- Chen: «llegas por la herramienta, te quedas por la red». Para el negocio la
  herramienta es leer su menú con foto y compartirlo; sirve aunque nadie más
  use Patio. Pro amplía la herramienta, no el acceso a la red.
- El Foodie no ve precios. En su Perfil quedan dos puertas discretas:
  «¿Tienes un negocio?» y «¿Recomiendas lugares? Pide tu sello».
- Cobrar al Creador frena a quien acelera la red. Hoy cuesta $199, el doble
  que Pro: eso es lo que hace ruido.

## 2. Estructura de negocio

Única pantalla de precios de la app, estilo Higgsfield (anual destacado,
mensual al lado, tabla para comparar, texto alineado a la izquierda):

| Plan | Precio | Qué suma |
|---|---|---|
| Gratis (visible) | $0 siempre | Perfil público, menú a mano sin límite, 20 lecturas con foto al día, compartir como imagen, aviso a quien te guarda, reseñas y respuesta, guardados y «me gusta» |
| Fundador (visible) | Por invitación | Primeros negocios de cada colonia, alta en persona, línea directa con el equipo |
| Pro (oculto) | $99/mes · $990/año | Todo lo de Gratis, más 60 lecturas con foto al día, 8 avisos especiales, estadísticas por horario y colonia, platillo destacado |

Pro solo aparece cuando el cobro se enciende, y el cobro solo se enciende
cuando cada beneficio de Pro existe y el servidor aplica su cupo. Hoy el
límite real de lecturas es 20 al día para todos. Los Fundadores recibirán 6
meses de Pro cuando exista; el sello Fundador tampoco existe todavía.

- La comparación con la comida corrida va implícita en el número: $99 al mes
  es lo que cuesta una comida corrida, y el anual se muestra como $83 al mes.
  No se escribe ninguna comparación.
- Sin tercer nivel por ahora. Un tercero (p. ej. «Cadena», $199, varias
  sucursales y lecturas sin límite) solo sirve para que Pro se vea razonable;
  se agrega si un negocio con sucursales lo pide.
- Conflicto a resolver: Pro ofrece «Ver quién te guarda», pero la regla de
  comunidad dice que quién guardó es privado (solo totales). Propuesta:
  cambiarlo por estadísticas agregadas (guardados por semana, horario y
  colonia de quienes te guardan), sin nombres.

## 3. ¿Cobrarle al Foodie por ver listas de creadores?

No en arranque. Razones:

1. Las listas son el canal por el que llega gente nueva (un enlace que
   alguien comparte). Una barrera en la primera visita corta ese ciclo.
2. El creador quiere alcance. Si sus listas quedan detrás de un pago, pierde
   alcance y deja de curar.
3. El miedo a perderse algo necesita abundancia. Con pocas listas no hay nada
   que dé ganas de pagar.

LinkedIn cobró Premium cuando ya era enorme, y lo que vende es información
sobre ti (quién vio tu perfil) y herramientas para reclutadores. Nunca escondió
los perfiles de los demás. El equivalente en Patio, para la etapa de velocidad
de escape:

- **Patio+ para Foodie (después):** quién vio y guardó tus listas, saber
  primero cuando tus lugares publican y listas sin límite. El contenido de los
  demás sigue abierto.
- **Listas para suscriptores (después, decisión del creador):** si Arturito
  quiere, cobra por una lista especial y Patio se queda una parte. Así cobra el
  creador, no Patio a costa del creador.

## 4. Técnicas de precio

- **Anclaje:** el primer número fija la referencia; aquí lo hace el propio
  $99, sin texto.
- **Escalera de valor (good–better–best):** «Todo lo de Gratis, más…».
- **Efecto señuelo:** el mensual de $99 junto al anual de $83 al mes empuja
  al anual.
- **Precio terminado en 9:** $99 y $990.
- **Para fijar las cantidades: Van Westendorp.** Cuatro preguntas a 15–20
  negocios del piloto (demasiado barato para confiar, barato, caro pero lo
  pagaría, demasiado caro). Se hace en la visita de alta de los Fundadores.

## 5. Creadores Fundadores (en el radar)

1. Antes de abrir: elegir a mano 5–10 creadores de comida de la colonia piloto
   y escribirles directo.
2. Oferta: «Creador Fundador», sin costo, con sello y sus listas destacadas en
   el mapa de su zona.
3. Reciben: perfil con listas y top 10, póster para historias y un enlace con
   números reales (entradas, guardados, visitas).
4. Patio gana: listas curadas y gente nueva por su enlace.
5. Después, con números para mostrar: «¿Recomiendas lugares? Pide tu sello».

## 6. Feed y lugares favoritos

- Sin feed tipo Instagram. Dentro del mapa: «De quienes sigues» (sus listas y
  su top), «Hoy en tu colonia» y reseñas nuevas de gente que sigues.
- Falta construir el **top por defecto de cada perfil**: al entrar al perfil de
  alguien se ven sus lugares favoritos (de calificaciones y guardados) y sus
  listas, aunque no haya armado ninguna.

## 7. Avisos (confirmado, sin cambio)

«¿Ya publicaste lo de hoy?» al negocio (10:00), «¿Qué hay hoy? /
Saaaaaaabes.» al Foodie (13:00) y «X publicó lo de hoy» cuando un lugar
guardado publica.

## Decisiones (2026-11-02, aplicadas en la app)

- [x] Planes según *The Cold Start Problem*.
- [x] Comparación con la comida corrida implícita en el precio, sin texto.
- [x] Creador sin cobro, por invitación directa; sello, listas destacadas y
  estadísticas no se ofrecen hasta construirse. Plan Creador eliminado del código.
- [x] Foodie sin cobro en arranque; Patio+ y listas para suscriptores después.
- [x] «Plan» sale del Perfil Foodie; en su lugar, «¿Tienes un negocio?».
- [x] El botón «IA» del buscador solo existe en desarrollo (llevaba a un plan
  Foodie que no existe).
- [x] «Ver quién te guarda» → estadísticas por horario y colonia, sin nombres.
- [x] Sin tercer nivel de negocio por ahora.
- [x] Pantalla de planes: Gratis + Fundadores con beneficios reales; Pro oculto.
- [ ] Van Westendorp con los Fundadores antes de fijar precios en tienda.
