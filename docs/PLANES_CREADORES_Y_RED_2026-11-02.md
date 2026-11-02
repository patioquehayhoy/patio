# Planes, creadores y red — propuesta para cerrar (2026-11-02)

Visión de conjunto para decidir cobro, creadores y feed de una vez. Base:
[cold start y monetización](NETWORK_COLD_START_AND_MONETIZATION.md) (Andrew
Chen, *The Cold Start Problem*) y [tipos de usuario](USER_TYPES.md). Nada de
esto cambia precios en código hasta que Alejandro lo apruebe.

## 1. Quién paga y quién no (efecto de red)

| Lado | Papel en la red | Paga |
|---|---|---|
| Foodie | Demanda: abre, guarda, sigue, reseña | Nunca |
| Creador | Siembra demanda: trae a su audiencia con sus listas | No al lanzar; programa por invitación |
| Negocio | Lado difícil: publica el menú que hace útil la red | Gratis generoso; Pro opcional |

- El lado difícil es el negocio. Se le quita fricción: gratis para siempre lo
  que hace que la red funcione (perfil, menú, compartir, reseñas) y Pro solo
  para quien ya publica diario y quiere más.
- El Foodie nunca ve precios: su pantalla de Perfil no ofrece planes. Del lado
  Foodie solo quedan dos puertas discretas: «¿Tienes un negocio?» y
  «¿Recomiendas lugares? Pide tu sello de Creador».
- Cobrar al Creador antes de que su enlace le traiga resultados frena justo a
  quien acelera la red. Hoy el plan Creador cuesta $199, el doble que el Pro de
  un negocio: esa es la parte que «hace ruido».

## 2. Estructura propuesta

**Negocio** (única pantalla de precios de la app, estilo Higgsfield: anual
destacado, mensual al lado, tabla de comparación; texto alineado a la
izquierda):

| Plan | Precio | Qué suma |
|---|---|---|
| Gratis | $0 siempre | Perfil público, menú a mano sin límite, 10 lecturas con foto al mes, compartir, reseñas |
| Pro | $99/mes · $990/año | Todo lo de Gratis, más 60 lecturas con foto, 8 avisos especiales, ver quién te guarda, platillo destacado |
| Fundador | Por invitación | 6 meses de Pro sin costo, primeros 100 negocios por colonia, sello numerado |

Cada plan dice «Todo lo de Gratis, más…», como iCloud+ o Apple One: se ve que
los beneficios se van sumando.

**Creador** (sin precio al lanzar): sello, listas destacadas en el mapa,
estadísticas de su enlace (cuántos entraron, guardaron y fueron) y póster
compartible para historias. Cuando el enlace ya rinda, se evalúa cobrarle.

## 3. Técnicas de precio (cómo se llaman y cómo se aplican)

- **Anclaje (anchoring):** el primer número que se ve fija la referencia.
  Comparar Pro con algo conocido: «menos que una comida corrida al mes».
- **Precio por día (reencuadre temporal):** el anual son unos $2.70 al día.
- **Escalera de valor (good–better–best):** cada nivel incluye el anterior y
  suma; la persona ve qué gana al subir.
- **Efecto señuelo (decoy) y centro del escenario:** con tres opciones se elige
  la de en medio. Hoy el mensual de $99 junto al anual de $83 al mes empuja al
  anual. Un tercer nivel ($199, sucursales y lecturas ilimitadas) haría ver Pro
  como la opción razonable; solo si hay negocios que lo pidan.
- **Precio terminado en 9 (charm pricing):** $99 y $990 ya lo usan.
- **Para fijar las cantidades: Van Westendorp.** Cuatro preguntas a 15–20
  negocios del piloto: a qué precio es demasiado barato para confiar, barato,
  caro pero lo pagaría, demasiado caro. El cruce da el rango aceptable. Se
  puede hacer en la visita de alta de los Fundadores.

## 4. Creadores Fundadores (anotado para tenerlo en el radar)

1. Antes de abrir: elegir a mano 5–10 creadores de comida de la colonia piloto
   y escribirles directo.
2. Oferta: «Creador Fundador», sin costo, con sello y sus listas destacadas en
   el mapa de su zona.
3. Lo que reciben: perfil con listas y top 10, póster para historias y un
   enlace propio con números reales (entradas, guardados, visitas).
4. Lo que gana Patio: listas curadas (contenido) y gente nueva por su enlace.
5. Después, con números para mostrar: «¿Recomiendas lugares? Pide tu sello»
   para que lleguen solos.

## 5. Feed y lugares favoritos

- Sin feed tipo Instagram. Dentro del mapa: «De quienes sigues» (sus listas y
  su top), «Hoy en tu colonia» (lugares con menú hoy que alguien que sigues
  tiene guardados) y reseñas nuevas de gente que sigues.
- Falta construir el **top por defecto de cada perfil**: al entrar al perfil de
  alguien se ven sus lugares favoritos (de sus calificaciones y guardados) y
  sus listas, aunque no haya armado ninguna.

## 6. Avisos (confirmado, sin cambio)

Ya existen: «¿Ya publicaste lo de hoy?» al negocio (10:00), «¿Qué hay hoy? /
Saaaaaaabes.» al Foodie (13:00) y «X publicó lo de hoy» cuando un lugar
guardado publica. No se agrega resumen diario: iOS ya agrupa avisos con su
Resumen programado.

## Decisiones pendientes de Alejandro

- [ ] Quitar el plan Creador pagado y convertirlo en programa por invitación.
- [ ] Quitar «Plan» del Perfil Foodie (queda «¿Tienes un negocio?» y el sello de Creador).
- [ ] Agregar a Pro el ancla («menos que una comida corrida») y el precio por día.
- [ ] Tercer nivel de negocio: no por ahora, salvo que el piloto lo pida.
- [ ] Hacer Van Westendorp con los Fundadores antes de fijar precios en tienda.
