# Superficies y navegación — revisión del 1 de noviembre

Solicitud: revisar las «cards que salen desde abajo», empezando por negocio.
Inventario basado en componentes y sus llamadas reales; no es una aprobación
visual en teléfono. Primera intervención limitada a Menús y Editar mi negocio.

## Actualización de continuidad — 2026-11-02

Comparación entregada: [PNG](../../artifacts/patio-paneles-antes-despues.png)
y [HTML](../../artifacts/patio-paneles-antes-despues.html). Reconstrucción del
antes/después con texto y estructura del código; iconos, escala y tipografía
aproximados. No es captura del teléfono ni aprobación visual. Se reveló en Finder.

El trabajo quedó en `a4b0058`. La siguiente propuesta de biblioteca está
**condicionada**: el usuario cuestionó si necesita listas de Menús; primero
resolver si se conservan. No migrarlas automáticamente. El onboarding fue
completado después en `fc771da`; el recorrido ilustrado aquí es histórico.

## Criterio

- Menú junto al botón: elegir una acción breve sobre un objeto.
- Panel inferior: resolver una elección puntual conservando contexto debajo.
- Pantalla: tarea con recorrido, contenido extenso, edición o identidad propia.
- Ayuda dentro de la pantalla: explicar el dato o la acción donde se usa.
- Confirmación: reservar la interrupción para decisiones con consecuencias.

Una tarea no debe cambiar de altura y de propósito repetidamente dentro de una
misma tarjeta. La duración y profundidad de la tarea deciden su superficie.

## Inventario y decisión propuesta

| Superficie real | Dónde vive | Tratamiento |
|---|---|---|
| Bienvenida de tres pasos | `fondero-welcome-tour.tsx`, antes invocada en Historial | Retirada de Historial en este corte. Su estado vacío explica cómo empezar y ofrece Nuevo menú directamente. Componente conservado sin uso para no mezclar limpieza con la prueba. |
| Ayuda inicial del perfil | `hint-sheet.tsx`, antes invocada en Perfil editar | Retirada de esa pantalla. Título y explicación permanente sobre el formulario, sin Empezar ni cierre adicional. |
| Nuevo menú | `new-menu-sheet.tsx`: barra central, Historial, Preview | Conservar selector corto de foto, Fotos y escritura. No necesita pantalla intermedia. Revisar acabado y tamaño con captura real. |
| Acciones de menú/platillo | `action-sheet.tsx`: Historial, composer | Ya son menús anclados. Conservar; no convertir a pantalla. |
| Listas de menús | `menu-lists-sheet.tsx` + `library-sheet.tsx` | Separar administración de selección. Filtrar/asignar conservan panel corto; organizar, crear y renombrar desde una biblioteca dedicada es la siguiente propuesta. Aún no migrado. |
| Mover menús | misma hoja, origen → destino | Mantener confirmación explícita y selección conservada al volver. Si falta origen, mostrar el recorrido en una superficie estable; no encadenar paneles nuevos. |
| Renombrar menú | `rename-dialog.tsx` en Historial | Diálogo breve de un campo; conservar guardado explícito y error. No necesita página completa. |
| Horario del negocio | `business-schedule-editor.tsx` | Editor ya integrado en alta/perfil; selector de hora puntual. Conservar el control junto al dato. |
| Filtros y listas Foodie | `foodie-filter-bar.tsx` + `LibrarySheet` | Filtros junto al mapa sí justifican panel. Administración de listas requiere la misma separación propuesta para Menús. No cambiar solo un lado del patrón compartido. |
| Guardar/mover un lugar | `save-to-list-sheet.tsx` | Panel selector válido. Administración extensa fuera de él; preservar selección y fallos al crear. |
| Personas a las que gusta un platillo | `dish-like-detail-sheet.tsx` en Reseñas | Detalle contextual válido; falta verificar desbordamiento: el cuerpo mapea autores sin ScrollView y limita altura al 70%. |
| Resultados sobre mapa | `use-explore-sheet.ts` + Explorar | Conservar panel porque permite relacionar lugares y mapa. No confundirlo con un formulario. |
| Perfil público de negocio | ruta `patio/[id]`, `transparentModal` en layout | Es contenido profundo (menú, reseñas, comentarios, mapa), aunque entra desde abajo. Candidato a pantalla navegable propia; validar retorno a mapa y enlaces antes de migrar. |
| Seguridad/reportar | `content-safety-menu.tsx` + ActionSheet | Conservar menú contextual para elegir acción/motivo. |

## Primera prueba implementada

1. Alta → Menús: desaparece el recorrido que exigía Siguiente/Siguiente/Publicar
   antes de mostrar el selector de captura. La pantalla queda disponible desde
   que carga; el botón Nuevo menú mantiene los tres caminos existentes.
2. Editar mi negocio: título visible y ayuda en el contenido. El nombre se toca
   directamente; no hay un panel que tapar ni un enfoque del teclado por timer.

No se cambiaron marca, tipografía, colores, backend ni guardado del perfil.
No se ha migrado Listas ni el perfil público: requieren una comparación de
pantallas y aprobación visual antes de extender el cambio, como pidió Alejandro.

## Validación pendiente en dispositivo

Validación automática de este corte: TypeScript y lint aprobados; 231 pruebas
existentes aprobadas. Esto verifica regresiones de código, no el acabado visual.

- Entrar desde alta con `bienvenida=1`: Menús sin recorrido superpuesto.
- Nuevo menú → cancelar Fotos: permanecer en Menús; foto elegida → editor.
- Perfil: título y ayuda legibles con letra grande, teclado y tema oscuro.
- Guardar/cancelar edición mantiene las protecciones actuales.
- Antes de migrar Listas: comparar biblioteca completa y selector corto, revisar
  volver, cambios sin guardar, teclado y errores; conservar contexto de selección.
