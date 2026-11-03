# Onboardings de Patio — propuesta 2026-11-02

> **Revisión en simulador (2026-11-02 noche, Claude):** se recorrieron las 13
> pantallas reales de los dos onboardings con la letra de marca. Corregido por
> reglas ya vigentes: el «Continuar» del alta usa el estado homologado y dice
> qué falta («Falta el nombre», «Elige el tipo de lugar», «Falta la
> dirección», «Elige los días que abres», «Elige cómo te pagan»); el giro ya
> no se puede saltar (antes pasaba como Fondita sin elegirlo, y después solo
> soporte lo cambia); «Crear mi primer menú» va en naranja (única acción
> destacada); el acceso del Foodie dice «Sigue lo bueno.» y «Enviar código».
> **Decisiones de Parco pendientes:** (1) quitar las dos primeras
> diapositivas y dejar entrada + elección (recomendado: el valor llega dos
> toques antes); (2) alinear a la izquierda títulos y textos del alta (hoy
> centrados; Parco no quiere párrafos centrados); (3) título del acceso del
> negocio «Tu menú, en un correo.» (puede leerse como que el menú llega por
> correo; propuesta: «Publica con tu correo.»).

> **Actualización (mismo día):** la propuesta de abajo se dibujó desde cero.
> El flujo ya estaba especificado (`docs/PATIO_SYSTEM_MAP.md`, 19 jul) y
> diseñado (Figma Make). Lo que se hizo fue completarlo: el negocio pasa de la
> celebración del alta directo a su primer menú; el Foodie recibe el ofrecimiento
> de avisos al guardar su primer lugar (la pantalla de campana se quitó el 28 de
> julio a propósito). En desarrollo, Perfil → «Ver bienvenida otra vez» y «Ver
> alta del negocio» recorren todo con botones reales.

Primer pendiente de diseño (Parco, 2026-11-02). Imagen de la propuesta:
`artifacts/onboardings-propuesta.png`. Pendiente de aprobación antes de
construir.

## Dirección

Sin diapositivas de bienvenida. Cada persona llega en el primer minuto a lo que
vino a hacer, y la app enseña con una pista a la vez, en el momento en que se
usa. Los permisos se piden cuando hacen falta, diciendo para qué.

## Foodie — ver qué hay hoy

1. **Entrar y elegir:** la pantalla de marca y la elección («Ver qué hay hoy»
   / «Publicar lo que preparo») en una sola.
2. **Ubicación en contexto:** sobre el mapa ya cargado, «Usar mi ubicación» o
   «Escribir mi colonia». Sin cuenta.
3. **Una pista al usarlo:** la primera vez, «Toca un punto para ver el menú de
   hoy». Se va cuando tocas un lugar, nunca por tiempo.
4. **Avisos cuando tienen sentido:** al guardar el primer lugar, «¿Te avisamos
   cuando publique su menú?». La cuenta se pide hasta reseñar o seguir.

## Negocio — publicar lo que preparo

1. **Alta en 5 pasos** con avance visible (la de hoy).
2. **Directo a publicar:** al terminar el alta, la cámara con «Tu primer
   menú». Primer menú publicado en un minuto.
3. **Compartir:** el póster de lo publicado con «Compartir por WhatsApp».
4. **Pistas de una línea** la primera vez en Actividad y Mi Patio.

## Por qué (fuentes)

- Apple HIG, Onboarding: enseñar haciendo, posponer lo que no es esencial y
  pedir permisos cuando se necesitan —
  https://developer.apple.com/design/human-interface-guidelines/onboarding
- Luke Wroblewski, «Sign Up Forms Must Die» (A List Apart): *gradual
  engagement*, usar antes de registrarse —
  https://alistapart.com/article/signupforms
- Duolingo: dejar hacer una lección antes de pedir cuenta subió los usuarios
  diarios cerca de 20 % (First Round Review) —
  https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker

## Qué cambia en el código (cuando se apruebe)

- `app/entrada.tsx` + `app/onboarding.tsx`: una sola pantalla de marca con
  la elección; sin las tres diapositivas.
- Pistas de primera vez: un componente compartido, una pista por pantalla,
  guardada como vista en el teléfono.
- Ubicación y avisos: los mismos permisos de hoy, movidos al momento de uso.
- Negocio: al terminar `patio-smart`, abrir la cámara de nuevo menú.
