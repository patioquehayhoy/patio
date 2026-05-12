# Prompt maestro — Rediseño visual de Patio

> Usar despues de adjuntar screenshots del flujo limpio.
> Objetivo: pedir estilo visual nuevo sin permitir cambios de flujo.

```text
Quiero que rediseñes visualmente estas pantallas de Patio, pero sin cambiar el flujo, la navegación ni las funciones.

Contexto del producto:
Patio es una app móvil para comida local del día.

Tiene dos tipos de usuario:
1. Foodie: quiere encontrar qué comer hoy cerca de él.
2. Fondero: quiere publicar su menú del día rápido y compartirlo.

Principios obligatorios:
- Progressive disclosure: no mostrar todo de golpe; pedir más solo cuando hace falta.
- Search-first interface: la búsqueda es el elemento principal de navegación y descubrimiento.
- Ambient state: el estado inicial puede sentirse vivo y contextual sin exigir atención.
- Structured feedback: si algo falta o sale mal, dar opciones concretas.
- Closed-loop feedback: las acciones del usuario deben mejorar algo después.
- Choice architecture: la decisión principal debe ser obvia, no pesada.
- Search en tiempo real: la búsqueda vive dentro del mapa y conserva contexto.
- One job per surface: cada pantalla tiene una tarea principal.
- Recovery over dead ends: ningún estado vacío debe ser callejón sin salida.
- Local trust: horario, precio, dirección, menú actualizado y pagos deben ser claros.

Flujo que NO puedes cambiar:

Foodie:
- Inicio -> Explorar comida
- Explorar mapa abre en modo radar de antojo: buscador protagonista, mapa tenue/vivo y señales sutiles
- Buscar platillo inline -> se encienden puntos relevantes y aparece lista compacta
- Tocar negocio/punto -> ver resumen / bottom sheet
- Ver negocio -> detalle completo
- Guardar favoritos
- Cuenta solo como ajustes y soporte

Fondero:
- Inicio -> Publicar mi menú
- Login por correo
- Perfil negocio
- Menú
- Crear menú
- Elegir método: tomar foto, elegir imagen, usar plantilla o empezar desde cero
- Preview / Compartir
- Si no hay menú, Compartir debe mandar a crear menú

Puedes cambiar:
- Dirección de arte
- Layout visual
- Color
- Tipografía
- Iconografía
- Texturas
- Profundidad, glass, sombras
- Estilo de botones, tabs, sheets, cards y mapas
- Composición de cada pantalla mientras conserve su tarea

No puedes cambiar:
- Rutas
- Orden del flujo
- CTAs principales
- Estados funcionales
- Texto base si cambia el significado
- Agregar funciones nuevas
- Convertir pantallas operativas en landing pages
- Abrir Explorar con una lista grande de negocios sin intención del usuario

Pantallas adjuntas:
- Inicio
- Onboarding
- Explorar mapa
- Búsqueda en mapa
- Interacción con negocio en mapa
- Detalle de negocio
- Favoritos vacío
- Cuenta
- Perfil fondero
- Editor de menú
- Crear menú / foto menú
- Más opciones / borrar menú
- Compartir vacío
- Compartir lleno
- Preview imagen compartible

Dirección deseada:
Patio debe sentirse local, cálido, rápido y premium-operativo. No debe parecer app genérica de delivery ni dashboard corporativo. Debe sentirse como una herramienta elegante para saber qué hay de comer hoy y para que una fondita publique su menú sin fricción.

Dirección específica para Explorar:
- No mostrar inventario completo al abrir.
- La pantalla inicial debe sentirse como una espera viva: mapa suave, buscador protagonista y señales cercanas sutiles.
- La lista aparece solo cuando hay intención: búsqueda, toque en punto o sugerencia.
- Evitar sobrecargar al usuario como una cabina de avión o una herramienta profesional llena de paneles.

Entrega:
1. Propón una dirección visual general.
2. Rediseña cada pantalla respetando su intención.
3. Señala componentes reutilizables: botones, bottom sheet, tabs, cards, inputs, chips, estados vacíos.
4. Di qué cambios son solo visuales y cuáles tocarían flujo; si algo toca flujo, márcalo como NO recomendado.
5. Mantén consistencia entre Foodie y Fondero.
```

## Nota para quien lo use

Antes de enviar, adjuntar las capturas actuales desde `assets/screenshots/` y, si ya existen, las capturas nuevas despues de implementar `FLOW_V2.md`.
