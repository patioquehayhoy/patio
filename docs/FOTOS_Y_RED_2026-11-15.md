# Fotos, visitas y red — propuesta (2026-11-15)

**Lado difícil hoy:** el negocio que publica su menú diario
([planes y red](PLANES_CREADORES_Y_RED_2026-11-02.md)). Toda idea de abajo se
ordena por cuánto ayuda a que ese negocio siga publicando.

Base: estudio de menús reales ([MENUS_REALES](research/MENUS_REALES_2026-11-15.md)):
en Google Maps el 82 % de las fotos de platillos las suben clientes. Con solo
las del negocio, la mayoría de los platillos se queda sin foto.

## Decisiones de Parco (2026-11-16)

- Las seis ideas van. Orden: Jev revisa la foto → «Hoy hay» → varias fotos
  por visita → el negocio usa la foto de un cliente → visita verificada.
- **«Hoy hay»:** un aviso al día como máximo, a la hora de comer del lugar,
  juntando lugares; nunca dos días seguidos del mismo platillo en el mismo
  lugar, y se apaga desde el aviso.
- **Foto de cliente en el menú del negocio:** sin pedir permiso (va en los
  términos de uso); crédito automático («Foto de Ana») y aviso a quien la
  tomó. El negocio puede elegir la de alguien conocido y presumirla.
- **Jev revisa cada foto** antes de publicarla.
- **Visita verificada:** automática, la resuelve Patio con la visita real
  (el aviso «¿Qué te pareció?» ya sabe quién estuvo); quien no tiene
  ubicación puede reseñar, pero sin la marca.
- Pendiente de diseño: perfiles y navegación cuando haya varias fotos por
  visita (dónde se ven las fotos de una persona: platillo, reseña y perfil).

## 1. Lo que ya existe

| Objeto | Verbos | Dónde |
|---|---|---|
| Lugar | seguir, guardar en lista, reseñar, reportar | ficha, mapa, listas |
| Menú de hoy y carta | ver, compartir póster | ficha |
| Platillo | me gusta (corazón), foto del negocio, fotos de clientes | ficha |
| Reseña (una visita al día) | estrellas, etiquetas, nota de 600, una foto con su platillo, me gusta, comentarios (280), respuesta del negocio (600), reportar | ficha, Actividad |
| Persona | seguir, perfil público, listas | perfil |
| Visita real | «¿Qué te pareció?» 40 min después de salir (con «Tus visitas») | aviso |

## 2. La idea que une todo: la visita

Una visita es lo que la persona vivió: **qué pidió, cómo estuvo, su foto y lo
que quiere contar**. Hoy eso ya es la reseña. La propuesta es tratarla como el
único contenido de la comunidad y colgar todo de ella:

- **Las fotos del menú salen de las visitas.** Cada foto de cliente es de una
  reseña; en el menú se ve por platillo y en la reseña se ve completa. Tocar
  una lleva a la otra (hecho hoy).
- **Un solo «me gusta» por visita.** Darle corazón a la foto es darle corazón a
  la reseña de donde sale (hecho hoy). Así no hay tres «me gusta» distintos
  que explicar, y quien publicó recibe un solo tipo de aviso.
- **Una sola conversación por visita.** Los comentarios viven en la reseña;
  desde la foto, «···» → «Ver la reseña» (hecho hoy). Sin comentarios aparte
  por foto o por platillo: dividiría la conversación y la moderación.

El corazón del platillo (el que está junto al precio) es otra cosa: dice «me
gusta este platillo» aunque no lo hayas comido. Ver §4.1.

## 3. Cuánto se puede escribir

| Texto | Límite | Por qué |
|---|---|---|
| Reseña (la historia de la visita) | 600 | Un párrafo bueno, unas 100 palabras. Se ve completa, nunca se corta |
| Frase de la foto | — | Se quitó (2026-11-15): la foto va limpia, con su autor y «3/12»; todo lo que se cuenta va en la reseña |
| Comentario | 280 | Conversación corta |
| Respuesta del negocio | 600 | Igual que la reseña |
| Nombre público | 40 + inicial | «Caro M.»; el más largo baja de renglón |

No se recomienda subir de 600: quien escribe más, casi siempre repite. Si una
persona quiere contar mucho, que sean varias visitas: cada una con su día.

Casos para revisar en el teléfono: [CONTENT_STRESS_CASES](design/CONTENT_STRESS_CASES.md)
(«Fondita Dev» y «Cocina Grande Dev 6»).

## 4. Ideas para que se use, en orden

### 4.1 «Se me antoja» → «Hoy hay» (recomendada como siguiente)
El corazón del platillo pasa a significar «avísame cuando haya». Cuando un
negocio publica su menú del día con ese platillo, llega: **«Hoy hay pozole
verde en Fonda Lupita»**. Un aviso al día como máximo, juntando lugares
(«Hoy hay pozole en 2 lugares que te gustan»).

- **Por qué primero:** es lo único de esta lista que hace que publicar el menú
  diario le traiga gente al negocio el mismo día. Ataca el lado difícil.
- El menú del día cambia (el estudio lo confirma): saber cuándo toca tu
  guisado solo lo puede avisar quien publica el menú de hoy.
- Necesita cuenta para avisar: buena razón para entrar.
- Ya existe casi todo: los «me gusta» de platillos se guardan en el servidor y
  ya hay aviso de «X publicó lo de hoy».

### 4.2 «¿Qué pediste?» en la reseña
Al reseñar, primero se eligen los platillos de ese día (chips del menú). Cada
uno puede llevar su foto. Con eso:

- una visita da varias fotos, cada una en su platillo, sin escoger a mano;
- cada platillo puede decir **«Lo pidieron 23 esta semana»**, sin pedirle nada
  más a nadie;
- el aviso «Tacos Juan · ¿Qué te pareció?» abre directo en «¿Qué pediste?».

Cambio de datos: una tabla de fotos por reseña (hoy es una foto por reseña).

### 4.3 El negocio usa la foto de un cliente
En el editor, en «Agregar foto» de un platillo: «Fotos de tus clientes». El
negocio elige una, sale con crédito («Foto de Ana») y Ana recibe **«Fonda
Lupita eligió tu foto de Al pastor para su menú»**. Le quita trabajo al
negocio y es el mejor reconocimiento para quien sube fotos.
Decisión pendiente: avisar y dejar quitarla, o pedir permiso antes.

### 4.4 Reconocimiento sin puntos ni rankings
- «Tu foto es la portada de Al pastor» (cuando el negocio no tiene foto propia
  y la tuya es la primera).
- «A Fonda Lupita le gustó tu foto».
- «A 5 personas les gustó tu visita a Fonda Lupita», juntado una vez al día.

Sin puntos, insignias ni tablas de posiciones por ahora: en arranque se ven
vacías y el tono de Patio es de barrio.

### 4.5 Perfil con «Sus fotos»
En el perfil de cada persona, una cuadrícula con sus fotos de platillos: su
diario de comida. Tocar una abre el lugar con ese platillo abierto. Es parte
del perfil, sin feed (decisión del 2 de noviembre).

### 4.6 Jev revisa la foto al subirla
Antes de publicar: «¿Es comida? ¿Parece Al pastor?». Si no, se pregunta a la
persona («Parece otro platillo, ¿cuál es?») en vez de publicarla mal. Evita
casi todos los errores antes de que haya que corregirlos. Cuesta centavos.

## 5. Casos de uso

| Quién | Momento | Qué pasa |
|---|---|---|
| Foodie nuevo | No sabe qué es un campechano | Toca el platillo; sus fotos se abren ahí mismo, sin salir del menú |
| Foodie con antojo | Le gustó el pozole hace semanas | Le llega «Hoy hay pozole verde en Fonda Lupita» (4.1) |
| Foodie que comió | 40 min después de salir | «¿Qué te pareció?» → ¿Qué pediste? → foto del suadero (4.2) |
| Foodie que se equivocó | Subió la de lengua como suadero | En su foto, «···» → Corregir → Lengua. La foto se mueve sola (hecho) |
| Cualquiera | Ve una foto que no es | «···» → «No es de este platillo» (hecho) |
| Quien publicó | Al día siguiente | «A 3 personas les gustó tu visita» (4.4) |
| Negocio | Sin tiempo para fotos | En el editor, «Fotos de tus clientes» → usa la de Ana (4.3) |
| Lugar grande | 40 fotos de chiles en nogada | Orden: la del negocio, las de 90 días (una por persona), las viejas al final (hecho) |
| Historia larga | Reseña de 591 letras | Se ve completa con su foto debajo; la foto lleva al platillo (hecho) |

## 6. Lo que decide Parco

1. ¿El corazón del platillo pasa a ser «Se me antoja / Hoy hay» (4.1)?
2. ¿Varias fotos por visita con «¿Qué pediste?» (4.2)?
3. Foto de cliente en el menú del negocio: ¿avisar o pedir permiso (4.3)?
4. ¿Jev revisa cada foto antes de publicarla (4.6)?

Orden recomendado: 4.1 → 4.2 → 4.6 → 4.3 → 4.4 → 4.5.
