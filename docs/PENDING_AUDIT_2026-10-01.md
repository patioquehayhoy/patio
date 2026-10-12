# Auditoría de pendientes — 2026-10-01

Solicitud: comprobar si el trabajo anterior terminó, contrastando handoff,
estado, plan, código y pendientes de Supabase. **El trabajo quedó parcial.**
No hay evidencia que permita atribuirlo a falta de créditos.

## Evidencia del corte

- Rama `rebuild/patio-final`; worktree limpio antes de esta auditoría.
- HEAD `218a934`: piezas de degradado de scroll sin conectar. Anterior
  `9340487`: cards compartidas y mover con origen explícito.
- 55 commits por delante de la referencia upstream local, 0 por detrás.
  No se hizo fetch: esto no certifica el estado actual de GitHub.
- `npm run check`: TypeScript y lint aprobados, 133/133 tests aprobados;
  release check con 29 correctas, 0 errores y 2 pendientes externos.
- `npm run check:release:strict`: exit 1 por falta de Maps Android y archivo
  Firebase Android. No se creó build ni se publicó nada.
- `npm audit --json` no pudo consultar el registro por DNS/red
  (`ENOTFOUND registry.npmjs.org`). El reporte del 12-sep conserva 8 avisos
  altos y 8 moderados; no es un conteo actualizado.

## Qué quedó terminado y qué falta

| Frente | Evidencia actual | Pendiente |
|---|---|---|
| Cards Explorar/Guardados | Ambos usan `PatioCardInfo`; lógica real cubierta por tests | QA visual, texto ampliado y accesibilidad en teléfono |
| Mover lugares | Origen explícito centralizado; tests de fallo/reintento aprobados | Picker completo y gestos en teléfono |
| Degradado de scroll | `useScrollEdges` y `ScrollEdgeFade` existen y están comiteados, sin consumidores | Completar integración y verificar comportamiento; punto 5 de etapa 1 abierto |
| Inventario y reglas comunes | El plan no registra cierre de puntos 1 y 2 de etapa 1 | Consolidar inventario y contrato antes de declarar cierre |
| Etapa 2 | Menús sigue usando `MenuListsSheet` propio y barra local en `historial.tsx`; Guardados usa `SelectionActions` | Homologar paneles, listas, teclado y Perfil Fondero; no consta cierre |
| Etapa 3 | No hay evidencia de recorrido global de cierre | Estados, temas, accesibilidad y regresiones de componentes compartidos |
| Supabase | Migraciones y handlers locales presentes, tests aprobados | Inventario remoto, esquema restaurable y ensayo Auth/Storage/Edge real |
| Lanzamiento | Check local estructural aprobado | Configuración Android, dependencias, infraestructura, moderación, firma y QA real |

Supabase conserva los bloqueos documentados en
[APP_BACKEND_AUDIT_2026-09-10.md](APP_BACKEND_AUDIT_2026-09-10.md):
esquema base incompleto en el repo, propiedad por correo sin `owner_id`
auditado, RLS/grants por verificar, ensayo real de borrado/publicación y
operación de moderación sin demostrar. También siguen documentados cuotas IA,
reintentos/receipts de push y paginación. No se accedió al proyecto remoto;
no se afirma que su estado actual coincida con el corte histórico.

El ensayo SQL histórico de 14 comprobaciones usa un fixture mínimo. No se
repitió: la dependencia aislada `/private/tmp/patio-pglite-audit` ya no existe.
Los tests de contratos incluidos en las 133 pruebas no sustituyen ese ensayo.

## Deriva documental corregida

`NEXT_SESSION`, `TASKS`, `STATE` y `ROADCONTROLLER` conservaban prioridades
del 13–14 de septiembre. `AGENT_STATUS` terminaba en agosto. El plan decía
“implementación pendiente” aunque ya registraba tres puntos implementados.
El handoff afirmaba que los archivos de scroll nunca se comitearon: ahora
están en `218a934`. Se agregaron cortes vigentes sin borrar el historial.

## Siguiente acción exacta

Retomar etapa 1: completar el inventario/contrato y resolver la integración
del degradado de scroll. Validar cards, mover, gestos, VoiceOver y teclado en
iPhone físico antes del cierre visual. Después ejecutar etapa 2 y luego
etapa 3. Los bloqueos de lanzamiento tienen su propia cola; no declarar
Supabase desplegado ni la app lista para tiendas por pasar tests locales.
