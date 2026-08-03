# Auditoría de espaciado y blancos táctiles — 2 ago 2026

## Objetivo

Mantener una interfaz compacta y editorial sin sacrificar precisión táctil,
jerarquía ni estabilidad. La auditoría cubre `app/` y `components/`: pantallas
principales, formularios, mapas, fichas, listas, modales y navegación.

## Contrato de Patio

- `20 pt`: gutter normal de pantalla y formularios.
- `22 pt`: encabezados editoriales y páginas de lectura.
- `18 pt`: listas densas dentro de una jerarquía que ya tiene encabezado.
- `24 pt`: modales, sheets y mensajes centrados.
- `28 pt`: acceso inmersivo; no usar en pantallas operativas.
- `16 pt`: interior de tarjetas y filas con contenido compuesto.
- `12 pt`: controles compactos, celdas densas y segundo nivel.
- `8 pt`: separación relacionada; `16–32 pt` entre grupos o secciones.
- `44 × 44 pt`: blanco táctil mínimo para navegación y acciones frecuentes.

Los valores son roles, no una cuadrícula que obligue a que todo mida igual.
Un glyph puede medir 16–20 pt dentro de un blanco táctil de 44 pt.

## Resultados aplicados

- Navegación atrás/cerrar normalizada a blancos de 44 pt en Favoritos,
  Vistos, Cuenta, Avisos, Soporte, Fondero, compositor de menú, reseña,
  vista previa, Patio Smart y encabezados colapsables.
- Acciones frecuentes de Actividad, Historial y gestión de reseñas llevadas a
  44 pt reales.
- Acciones compactas del compositor conservan su tamaño visual y amplían su
  región táctil con `hitSlop`.
- Pleca social de la ficha compactada sin reducir su blanco táctil.
- Compositor de comentarios separado con divisor y padding propio.
- Pleca de reconocimientos fijada a un escenario de 48 pt para impedir saltos
  al activar o desactivar medallas.
- Se incorporaron tokens semánticos `Layout` en `lib/theme.tsx` para impedir
  que pantallas nuevas inventen gutters para funciones ya definidas.

## Excepciones válidas

- Chips secundarios pueden medir 28–38 pt si no son la única forma de acceder
  a una acción y conservan separación suficiente.
- El horario semanal cambia la altura de forma intencional porque revela
  contenido; seleccionar una medalla no debe cambiarla.
- Safe areas se suman al padding de navegación o barras inferiores; no se
  sustituyen con números fijos.
- Estados vacíos pueden usar mayor padding para mantener una medida de lectura
  corta, pero no deben desplazar controles persistentes.

## Regla de revisión

Antes de aprobar una pantalla nueva:

1. identificar el rol del gutter;
2. verificar 44 pt en controles frecuentes;
3. evitar sumar padding del padre, fila y botón sin intención;
4. comparar estados activo/inactivo para detectar saltos;
5. probar nombres largos, Dynamic Type, teclado y safe areas;
6. conservar alineaciones compartidas entre título, tarjeta y lista.

## Referencias

- Apple Human Interface Guidelines: Layout.
- Apple Human Interface Guidelines: Buttons.
- Apple Human Interface Guidelines: Accessibility.
- Apple Human Interface Guidelines: Motion and Feedback.
