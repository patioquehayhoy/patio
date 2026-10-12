# Consistencia de interfaz — tres etapas

> **Corte vigente — 2026-10-09:** lanzamiento solicitado para iPhone y Android.
> Homologación de bibliotecas implementada; 149 pruebas y 19 comprobaciones SQL
> aisladas aprobadas; exportaciones de ambas plataformas completas. Backend real,
> seguridad restante, configuración Android, QA visual y tiendas siguen abiertos.
> Checklist y contrato: [LAUNCH_CLOSEOUT_2026-10-09.md](LAUNCH_CLOSEOUT_2026-10-09.md).
> Los cortes anteriores se conservan como historial, no como estado de lanzamiento.


Solicitud vigente de Alejandro, 2026-09-19: cerrar el diseño y la experiencia
por bloques acotados. Revisar la app de forma panorámica, incluyendo Perfil
Fondero; priorizar cards, Guardados, listas, iconos e interacción. Conservar la
ficha pública de negocio ya aprobada.

## Estado de este corte

- Plan dividido en exactamente tres etapas. Implementación parcial: puntos
  3, 4 y 6 de etapa 1 implementados; restantes sin cierre. Auditoría vigente:
  [PENDING_AUDIT_2026-10-01.md](PENDING_AUDIT_2026-10-01.md).
- Revisión inicial de código y documentación; no acredita revisión visual en
  dispositivo, pruebas ni aceptación de las pantallas.
- Hay componentes compartidos, pero también paneles y variantes locales.
- La documentación contiene decisiones históricas contradictorias. El pedido
  actual manda: mismos patrones entre roles cuando resuelven la misma tarea,
  y rango de precio contemplado en todas las cards de lugares.

## Etapa 1 — reglas comunes, cards y Guardados

1. Terminar el inventario panorámico de componentes y consumidores Foodie y
   Fondero. Registrar hallazgos adicionales dentro de estas tres etapas.
2. Definir una regla por función: botones, iconos, filas, superficies,
   tipografía, separación de grupos, estados y animaciones.
3. ✅ (2026-09-27) Aplicado a cards y filas vía `PatioCardInfo`
   (`components/patio-card-info.tsx` + `lib/patio-card-info.ts`): nombre,
   abierto/cerrado/desconocido, distancia, estrellas, calificación personal y
   rango de precio, con `patio`/`menu` como fuente. Calificación pública vs.
   propia distinguidas; datos ausentes muestran placeholder honesto, nunca
   inventado.
4. ✅ (2026-09-27) `PatioCardInfo` mide su propio ancho/`fontScale` y apila
   verticalmente en vez de recortar cuando el texto crece o el ancho es
   chico — cubierto por `scripts/tests/patio-card-info.test.cjs`.
5. ✅ (2026-10-09, código) `useScrollEdges` y `ScrollEdgeFade` conectados a
   Guardados, Menús, Explorar y paneles de listas. Dos pruebas de estado y
   restablecimiento aprobadas; aceptación visual en dispositivo pendiente.
6. ✅ (2026-09-27) Mover ahora es su propio paso: elegir origen (cuando es
   ambiguo, ej. vista "Todos") → elegir destino → confirmar. Centralizado en
   `lib/library-selection.ts`, consumido por `favoritos.tsx`,
   `foodie-filter-bar.tsx` y `save-to-list-sheet.tsx`; cubierto por
   `scripts/tests/library-selection.test.cjs` y `save-list-flow.test.cjs`.

Cierre: cards y flujo de mover usan el contrato común y pasan `tsc`/lint/tests;
**falta la validación en dispositivo real** (gestos, VoiceOver, teclado) antes
de dar la etapa 1 por cerrada del todo. Ver entrada 2026-09-27 en HANDOFF.

## Etapa 2 — paneles, listas y Fondero

1. Homologar crear, renombrar, guardar en lista, mover y eliminar: misma
   estructura, jerarquía, botones, geometría, teclado y feedback por función.
2. Aplicar las mismas piezas a Menús/historial, Perfil Fondero y su edición,
   conservando el contenido y propósito de cada rol.
3. Resolver materiales de forma coherente por capa: contenido, controles
   flotantes y paneles. No imponer un solo material a funciones diferentes.
4. Usar etiquetas breves y declarativas; retirar instrucciones contextuales
   innecesarias. Conservar errores útiles y consecuencias de acciones
   destructivas.

Cierre: acciones equivalentes tienen el mismo aspecto y comportamiento en
Foodie y Fondero; registrar pendientes concretos antes de pasar a etapa 3.

## Etapa 3 — consistencia global y cierre visual

1. Recorrer Explorar, colecciones, perfiles, actividad, reseñas,
   notificaciones y ajustes para aplicar las reglas ya definidas.
2. Revisar alineación de usuarios, comentarios, corazones, contadores,
   estrellas, iconos y controles sin depender del largo del contenido.
3. Verificar estados vacío/carga/error/guardado, claro y oscuro, teclado,
   áreas seguras, texto ampliado, accesibilidad y conflictos gestuales.
4. Revisar consumidores de componentes compartidos, incluida la ficha
   aprobada, para detectar regresiones sin rediseñarla.
5. Cerrar hallazgos y documentar lo realmente verificado frente a lo que
   todavía requiera revisión visual en el teléfono.

## Continuidad entre etapas

- Trabajar una etapa por vez; no declarar terminada una etapa por agotar el
  contexto o porque compile.
- Al cerrar cada bloque, actualizar este archivo y la primera entrada de
  HANDOFF con: cambios, evidencia, pendientes y siguiente acción exacta.
- No repetir auditorías ya documentadas salvo que el código haya cambiado.
- Punto de reanudación: consolidar inventario y contrato común, completar
  degradado de scroll y QA físico de etapa 1; después continuar etapa 2.

## Referencias

Las decisiones de Patio se apoyan en agrupación, jerarquía y consistencia de
`PATIO_DESIGN_PRINCIPLES.md` y
`design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`. Contrastar tokens reales
con `CLAUDE.md` y `lib/theme.tsx`; no adoptar valores históricos de documentos
sin comprobar su vigencia.

Guías oficiales consultadas para este plan:
[materiales](https://developer.apple.com/design/human-interface-guidelines/materials),
[gestos](https://developer.apple.com/design/human-interface-guidelines/gestures/)
y [botones](https://developer.apple.com/design/human-interface-guidelines/buttons).
La división en etapas y su aplicación a Patio son decisiones de este proyecto.
