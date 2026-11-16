# Navegación, perfiles y secciones — investigación y propuesta (2026-11-16)

**Lado difícil hoy:** el negocio que publica su menú diario. Toda decisión de
abajo se mide primero por cuánto le ayuda a publicar y a que lo publicado se vea.

## 0. Ajuste con Parco (16 nov, noche) — manda sobre lo de abajo

- **El buscador y Patios (listas) se quedan igual.** Ya funcionan y ya están
  homologados con Menús (misma tarjeta, filtro y selección). La propuesta de
  cuatro pestañas iguales en los dos lados (§4) queda en pausa.
- **Foodie: solo cambia Perfil.** Perfil abre tu perfil público.
  - Arriba a la derecha, la campana (Actividad, con su punto) y el engrane
    (ajustes).
  - Adentro, las secciones `Fotos · Reseñas · Listas`.
  - La barra de pestañas no cambia: `Mapa · Patios · Perfil`.
- **Negocio: el «＋» se queda y se vuelve «Crear».** El negocio crea varias
  cosas, no solo el menú:
  - **Menú de hoy:** Tomar foto, Elegir de Fotos o Escribir.
  - **Aviso a quienes te siguen:** gratis, uno al día («Abrimos tarde», «Hoy
    no abrimos», «Se acabó»).
  - **Aviso especial:** Pro; una promoción que se ve 24 horas.
- **Actividad del negocio queda solo con lo que pasó:** reseñas, me gusta y
  seguidores, con el resumen de «Hoy» arriba.
  - Salen de ahí las filas de crear («Avisar a quienes te siguen» y «Aviso
    especial»).
  - «Platillo destacado» se queda en Mi Patio, en la estrella de cada
    platillo.
- **Por qué el «＋» se queda aunque Apple pida pestañas para lugares:** el
  trabajo del lado difícil es crear, y el «＋» al centro que abre un menú
  de tipos es la forma que la gente ya conoce. TikTok abre la cámara con el
  «＋» del centro, e Instagram usó por años un «＋» con Publicación, Historia,
  Reel y En vivo (según guías de terceros: [TikTok](https://smallbiztrends.com/how-to-make-a-tiktok-video/), [Instagram](https://wyzowl.com/how-to-post-a-video-on-instagram/)).
  Se acepta la desviación de la guía de Apple a propósito y por escrito.

## 1. Lo que hay hoy (vista panorámica)

| | Pestaña 1 | Pestaña 2 | Centro | Pestaña 4 | Pestaña 5 |
|---|---|---|---|---|---|
| **Foodie** | Mapa | Patios (los que sigue y sus listas) | — | — | Perfil = **ajustes** |
| **Negocio** | Menús | Actividad | **＋ Publicar** (una acción) | Mi Patio (su ficha pública) | Perfil = **ajustes** |

Dónde vive lo demás:
- **Tu perfil público** (foto, nombre, «Sus lugares», «Sus fotos», «Sus
  reseñas», seguidores): un nivel abajo, en Perfil → «Ver mi perfil».
- **Actividad del foodie** (me gusta, comentarios, seguidores, respuestas):
  una fila dentro de Perfil, con un punto en la pestaña.
- **Perfiles de otros:** se abren tocando un nombre o una foto en reseñas,
  fotos, listas y seguidores. No hay búsqueda de personas.
- **«Hoy» del negocio** (vistas y racha): pantalla secundaria; se llega desde
  el resumen de las 18:00, Menús o Actividad.

Cinco problemas:
1. **«Perfil» hoy es una lista de ajustes**, en los dos lados;
   tu cara pública está escondida un nivel abajo. En toda red social la última
   pestaña es tu perfil tal como lo ven los demás.
2. **La Actividad del foodie está escondida** dentro de los ajustes, justo
   cuando llegan las fotos, los me gusta y «Hoy hay».
3. **El centro del negocio es una acción** («＋ Publicar»); Apple pide que
   las pestañas sean lugares (§2).
4. **Los dos lados no se parecen.** Hacen trabajos paralelos (lo de hoy, lo
   mío, lo que pasó, mi cara pública) con estructuras distintas; contradice la
   regla del proyecto de que dos pantallas que resuelven lo mismo comparten
   forma (CLAUDE.md, caso Guardados↔Menús).
5. **El perfil público es una columna larga** («Sus lugares», «Sus fotos»,
   «Sus reseñas» uno debajo de otro). Con muchas visitas no escala.

## 2. Qué dicen las fuentes y qué se transfiere

| Referente o práctica | Fuente | Qué se transfiere a Patio |
|---|---|---|
| **Apple HIG, Tab bars** | [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | «Use a tab bar to support navigation, not to provide actions» → el «＋» sale de la barra. «Generally easier to navigate among fewer tabs». «Don't disable or hide tab bar buttons» → el visitante ve las mismas pestañas, con su estado vacío. Badges solo para lo crítico. |
| **NN/g, navegación oculta** | [Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/) (179 personas, 6 sitios) | Ocultar la navegación casi reduce a la mitad que se descubra; en móvil, 15 % más lento. Con 4 destinos o menos, mostrarlos. → nada importante dentro de «ajustes» ni en un cajón. |
| **CDF — Steve Jobs**, enfoque | [WWDC 1997, charla de cierre](https://allaboutstevejobs.com/videos/misc/wwdc_1997_closing_chat) | «Focus is about saying no». → cuatro pestañas, ni una más; cada una con un solo trabajo. |
| **CDF — Elon Musk**, el algoritmo de cinco pasos | [Starbase Tour, parte 1 (Everyday Astronaut, 2021)](https://everydayastronaut.com/starbase-tour-and-interview-with-elon-musk/) | Primero cuestionar el requisito y borrar; después simplificar, acelerar y automatizar. → borrar «Perfil = ajustes» como pestaña en los dos lados y el «＋» como pestaña, antes de pulir nada. |
| **CDF — Jeff Bezos**, working backwards | [An insider look at Amazon's culture and processes](https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes) (PR/FAQ) | Escribir primero el comunicado para quien lo usa (§6). Si no se puede explicar en un párrafo, la navegación aún no está lista. |
| **CDF — Boris Cherny**, lo simple primero y la demanda latente | [Latent Space: Claude Code](https://www.latent.space/p/claude-code) | Hacer primero lo más simple que funcione. La gente hace lo que ya hace → la cuenta «dos caras» (§5, C) espera a ver que los dueños ya usan Patio como foodies. |
| **Andrew Chen**, el lado difícil | [Solve a Hard Problem (The Cold Start Problem)](https://andrewchen.com/solve-a-hard-problem-cold-start-problem/) | Ganar primero el lado difícil. → la primera pestaña del negocio es «Hoy» con «Publicar» al centro; lo que publica llega a la Actividad de quien lo sigue (§4). |
| **Instagram 2025** | [Engadget, 10 oct 2025](https://www.engadget.com/social-media/instagram-tests-new-layout-that-puts-the-spotlight-on-reels-and-dms-215407062.html) | Sacó el «＋» de la barra y dio pestañas a lo que hace volver a la gente (Reels y mensajes, «most all our growth»). → las pestañas son para lo que hace volver a la gente. |
| **Beli** (reseñas de restaurantes) | [Pratt IXD, crítica de diseño 2026](https://ixd.prattsi.org/2026/09/a-design-critique-of-beli-restaurant-discovery-and-social-platform/) | Perfil = tu gusto (listas, lo que calificaste); feed corto que no invita a quedarse. → el perfil de Patio es un diario de comida, sin feed infinito (decisión del 2 nov). |

## 3. Lo que se aprende de ChatGPT, Claude y las redes

| Patrón | En ChatGPT / Claude | En Instagram, Threads o Beli | En Patio |
|---|---|---|---|
| Una sola cosa obvia al abrir | El campo para escribir | El feed | Foodie: «¿Qué se te antoja?» sobre el mapa. Negocio: «Publicar lo de hoy». |
| Lo reciente manda | Historial por fecha | Actividad por fecha | Actividad por fecha: «Hoy hay», me gusta, respuestas. |
| La cuenta, al final | Tu nombre al pie del menú | Engrane dentro de tu perfil | Engrane dentro de Perfil / Mi Patio. |
| Poca interfaz | Casi solo conversación | Cinco pestañas fijas | Cuatro pestañas, iguales en los dos lados. |

La simplicidad de ChatGPT y Claude viene de que el 95 % del uso es una sola
pantalla; por eso pueden esconder el resto en un cajón. Patio tiene dos
trabajos que vuelven cada día (decidir dónde comer y ver qué pasó) y, según
NN/g, esconder el segundo lo apaga. De ellos se toma el enfoque: una cosa
obvia al abrir y la cuenta al final.

## 4. Propuesta: un solo esqueleto para los dos lados

```
            1 · Lo de hoy   2 · Lo tuyo   3 · Lo que pasó   4 · Tu cara pública
Foodie      Mapa            Patios        Actividad         Perfil
Negocio     Hoy             Menús         Actividad         Mi Patio
```

- **Misma posición, mismo significado.** Quien aprende un lado ya sabe usar el
  otro. Los ajustes viven en un engrane dentro de la pestaña 4.
- **Negocio:**
  - «Hoy» es su pantalla de inicio (hoy es Menús): «Publicar lo de hoy» en
    naranja, como la única acción prominente, con sus vistas y su racha.
  - El «＋» deja de ser pestaña (Apple); publicar sigue a un toque al abrir.
  - «Mi Patio» es su perfil: la ficha tal como la ve la gente, con el engrane.
- **Foodie:**
  - «Actividad» junta lo que publican los lugares que sigue («Hoy hay mole en
    Fonda Lupita»), me gusta, comentarios, seguidores y respuestas del negocio.
  - **Así la pestaña nunca está vacía en el arranque:** el negocio publica
    cada día, y su publicación es la actividad diaria del foodie. Lo que hace
    el lado difícil le llega a quien lo sigue.
  - «Perfil» es su perfil público. Su ícono es su foto, como en Instagram.
- **Secciones dentro del perfil**, como en las redes:
  - Encabezado: foto, nombre, cifras y «Seguir».
  - Debajo, una sola fila para cambiar de sección: «Fotos · Reseñas ·
    Listas». «Sus lugares» pasa a Listas, como la primera.
  - Igual en tu perfil y en el de otros; en el tuyo hay un engrane en vez de
    «Seguir».
- **Personas por todas partes:** todo nombre o foto lleva a su perfil (ya
  pasa). Falta que el buscador del mapa también encuentre personas.
- **Visitante:** ve las mismas cuatro pestañas, cada una con su estado vacío y
  «Entrar» (Apple: no esconder pestañas).

### Casos de largo (ley del 8 nov)

| Texto | Corto | Largo / límite | Qué hace |
|---|---|---|---|
| Etiqueta de pestaña | «Hoy» | «Actividad» (9 letras), letra grande | La etiqueta no pasa de 1.15×; nunca se corta. |
| Número en Actividad | punto | «12,480 me gusta» | En la pestaña, solo un punto. La cifra va dentro de Actividad. |
| Nombre en el perfil | «Ana M.» | 40 letras + inicial | Baja de renglón, nunca «…». |
| Secciones del perfil | «Fotos» | «Reseñas 1,248» | La cifra va debajo de la etiqueta, en su columna. |

## 5. Alternativas consideradas

- **A. Una pantalla y un cajón, como ChatGPT.** Mapa a pantalla completa y
  tu foto arriba abre perfil, Patios, Actividad y ajustes.
  - A favor: lo más limpio.
  - En contra: NN/g mide que lo escondido casi no se descubre; la Actividad
    (el regreso diario) se apagaría.
  - Se descarta.
- **B. Tres pestañas con campana.** `Mapa · Patios · Perfil`, Actividad en
  una campana arriba.
  - A favor: menos cambio.
  - En contra: deja el negocio como está (con su «＋» de acción) y los dos
    lados distintos.
  - Sirve como paso intermedio.
- **C. Una cuenta, dos caras.** Persona y negocio en la misma cuenta;
  cambias tocando tu nombre.
  - A favor: un dueño también come fuera, y un creador puede tener negocio.
  - En contra: mezcla trabajos.
  - Esperar a ver demanda real (Cherny).

## 6. El comunicado (working backwards)

> **Patio, más fácil de usar todos los días.** Al abrir Patio ves lo de hoy:
> si comes, el mapa con lo que hay cerca; si tienes un negocio, un botón para
> publicar tu menú. En Actividad te enteras de lo que publicaron tus lugares y
> de quién respondió a tus fotos. Y en tu perfil está todo lo que has comido y
> contado, como lo ven los demás.

## 7. Plan y qué medir

1. **Foodie:**
   - Perfil = perfil público + engrane, con las secciones «Fotos · Reseñas ·
     Listas».
   - Actividad como pestaña.
2. **Negocio:**
   - «Hoy» como inicio con «Publicar lo de hoy».
   - Mi Patio con engrane; se van el «＋» de la barra y la pestaña Perfil.
3. **Buscador:** personas en el buscador del mapa.

Medir antes y después:
- **Negocio (lado difícil):** días con menú publicado y segundos de abrir a
  publicar.
- **Foodie:** cuántos abren Actividad al día y si vuelven en 7 días.

## 8. Decide Parco

- [ ] ¿Va el esqueleto de cuatro pestañas para los dos lados (§4)?
- [ ] ¿«Hoy» como inicio del negocio, con «Publicar» y sin «＋» en la barra?
- [ ] ¿Secciones del perfil «Fotos · Reseñas · Listas»?
