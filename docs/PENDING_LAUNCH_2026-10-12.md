# Pendientes y roadmap de lanzamiento — actualizado 2026-10-25

Objetivo: iPhone y Android. Este es el checklist vigente; reemplaza pendientes
operativos de los cortes históricos. El lanzamiento público sigue pendiente.

Último cierre técnico: [prebuild](PREBUILD_CLOSEOUT_2026-10-24.md) y
[continuidad del 25 de octubre](HEADS_UP_2026-10-12.md). **196 pruebas de app**,
19 SQL y 12 de esquema aislado aprobadas. Exportaciones iOS/Android y builds
locales Release/Debug realizadas; DEV restaurado en iPhone. Eso no es un
candidato de tienda ni aceptación del recorrido completo. Auditoría npm y
configuración Android siguen pendientes.

## Completado

- [x] Supabase bajo la cuenta Patio como único Owner; proyecto visible `patio`.
- [x] Staging real preparado y 15 pruebas Auth/RLS/Storage/Edge aprobadas.
- [x] Producción actualizada con siete migraciones y cinco funciones con JWT.
- [x] Bibliotecas, mover/renombrar, filtros, selección y estados homologados.
- [x] Cards con columnas estables, estrella única y colonia · distancia.
- [x] Centrar ubicación en Mapa y recuperar navegación al cerrar resultados.
- [x] TypeScript/lint y 196 pruebas locales aprobados el 2026-10-25.
- [x] Cámara con pellizco para zoom; último corte sin título ni pastilla 1×.
- [x] Pulido compartido de Filtros/Listas, encabezados, iconos, colores y desvanecido.
- [x] Error al abrir Listas corregido con regresión; el usuario confirmó «ya quedó me parece».
- [x] Precio por platillo sin + y panel Nuevo menú con oscurecimiento sincronizado.
- [x] Elegir de Fotos corregido en código: cierre nativo antes del picker,
  recuperación sin cámara y regresiones automatizadas. QA física pendiente.
- [x] Zoom progresivo sin números; giros finales de Claude/Jev en PatioGiros
  junto con Ionicons (taco 2A y catálogo documentado).
- [x] Borrador de fichas preparado; soporte `quehayhoy.patio@gmail.com`.

Backend comprobado el 2026-10-09: [producción](PRODUCTION_PROMOTION_2026-10-09.md)
y [staging](STAGING_REHEARSAL_2026-10-09.md). No repetir login, migraciones,
asignación de dueños ni borrado de datos sintéticos para cerrar esta lista.

## 1. QA del usuario y estabilidad móvil

- [ ] Subir los commits locales y el cierre `335f36c` del 2026-10-18 a
  `rebuild/patio-final`, incluidos los commits posteriores de Claude.
  Dry-run de push revalidado el 2026-10-25: HTTP 403.
  GitHub confirma que la cuenta activa `T1Alejandro` tiene `push: false`.
  Autenticar una cuenta de Patio con escritura; conservar historia y rama,
  sin force-push ni cambio de propietario.

- [ ] Alejandro: buscar «mole», cerrar resultados con swipe, tocar Guardados/
  Cuenta y reabrir la misma búsqueda. Confirmar que vuelve la navegación y
  no se cierra Patio al inicio del iPhone; el cierre anterior sigue sin confirmar.
- [ ] Alejandro: comprobar cards con nombres/precios largos, con/sin sello,
  claro/oscuro, letra grande, teclado y margen inferior. Contrato y ejemplos:
  [columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).
- [ ] Probar el centrado con ubicación concedida, aproximada, denegada y sin
  respuesta; Guardados y ficha omiten distancia si no se puede obtener.
- [ ] Completar recorridos Foodie/Fondero en iPhone y Android: acceso, guardar,
  listas/mover/renombrar, cámara/galería, publicar y recuperar tras fallo de red.

La confirmación del ajuste reciente de Listas queda registrada; no acredita
los recorridos completos anteriores. El usuario prueba en celular. USB fue
retomado con autorización y DEV restaurado; no repetirlo ni sustituir por
Release sin necesidad. Auditorías amplias siguen fuera de este cierre.

- [ ] Confirmar en iPhone/Android: Elegir de Fotos abre el selector, cancelar
  sale al historial, reintentar lectura conserva Fotos; cámara solo al elegirla.
- [ ] Confirmar en mapa lejano/medio/cercano: puntos sin números, búsqueda
  conservada, selección, snapshots y tacos/elotes legibles sin cierres.

## 2. Dependencias, Android e integraciones

- Verificación 2026-10-24: auditoría actualizada de 10 a **8 paquetes afectados
  (5 altos, 3 moderados, 0 críticos)** tras actualizar `fast-uri` 3.1.8 → 3.1.9
  y `undici` 6.28.1 → 6.29.1 en el lockfile. Parches Metro/maps reaplicados;
  TypeScript, lint y 189 pruebas aprobados. Quedan las cadenas de `node-forge`
  y `decode-uri-component`; no aplicar `audit fix --force` (propone cambios
  incompatibles de Expo/router). Release: 29 correctos, dos pendientes Android.
  Evidencia local: `/private/tmp/patio-check-20261024.log`.

- [ ] Resolver la auditoría npm conservando compatibilidad nativa y verificar
  otra vez. Última consulta 2026-10-24: **8 paquetes afectados, 5 altos, 3
  moderados, 0 críticos**. Son cadenas de dependencias, no 32 fallos independientes.
  `npm audit` sigue devolviendo 1; `npm run check` no sustituye esa auditoría.
  CI conserva su gate `npm audit --audit-level=high`; no desactivarlo para dar
  el release por aprobado.
- [ ] Confirmar el cierre de la rotación/revocación de la clave de proveedor
  legada `EXPO_PUBLIC_ANTHROPIC_API_KEY`, pendiente del roadmap anterior.
- [ ] Configurar y validar `GOOGLE_MAPS_ANDROID_API_KEY` y
  `GOOGLE_SERVICES_JSON` en el entorno Android candidato. Son los dos pendientes
  del control de release actual: 29 correctos, 0 errores.
- [ ] Comprobar APNs/FCM, recepción y apertura de avisos en ambos teléfonos;
  sesión cerrada/cambiada no debe recibir avisos ajenos.
- [ ] Ensayar entrega de magic link y retorno con app cerrada/abierta, enlace
  vencido/reutilizado y cambio de cuenta. Staging no probó entrega SMTP.
- [ ] Ensayar respuestas reales de IA y recuperación de errores/cuotas. Las
  funciones están desplegadas; el ensayo previo no hizo llamadas IA pagadas.

Logs de esta verificación: `/private/tmp/patio-npm-audit-20261012.json` y
`/private/tmp/patio-checkpoint-check-20261012.log`.

## 3. Privacidad, operación y tiendas

- [ ] Confirmar operador legal (persona física o sociedad), nombre completo,
  domicilio y dominio; publicar URLs HTTPS de privacidad/soporte/eliminación.
  Soporte y borrado dentro de ambos perfiles ya existen; no reconstruirlos.
  El usuario plantea ser responsable, sin confirmación definitiva de modalidad.
  No se encontró aviso integral ni URL pública en el repo/sitios consultados.
- [ ] Asignar atención a soporte/reportes y completar moderación operativa.
  El soporte público aprobado sigue siendo `quehayhoy.patio@gmail.com`.
- [ ] Preparar cuentas de revisión y completar App Privacy/Data Safety,
  clasificación, regiones, contratos y accesos de Apple/Google.
- [ ] Generar un candidato firmado por plataforma después de resolver los
  gates anteriores. Verificar permisos, enlaces, mapas, push y bibliotecas
  Android de 16 KB en los artefactos finales.
- [ ] QA del candidato desde TestFlight/prueba de Google Play; capturas de
  esa versión, resultados registrados y correcciones de fallos.
- [ ] Confirmar requisitos vigentes en las consolas y obtener aprobación final
  antes del envío/publicación. El checkpoint Git no envía la app a tiendas.

Detalle: [checklist de distribución](STORE_RELEASE_READINESS.md) y
[borrador de fichas](STORE_SUBMISSION_DRAFT_2026-10-09.md).
No iniciar EAS ni publicación automáticamente desde esta actualización documental.

## 4. Después del candidato

- [ ] Incorporar una miniatura real del local en la zona superior del grid;
  definir origen/calidad de imagen y fallback manteniendo columnas y alturas.
- [ ] Giros guiados por el mercado (idea de Alejandro, 2026-10-25): al elegir
  «Otro» en el alta, pedir «¿De qué es tu negocio?» en texto libre y guardarlo
  (hoy «Otro» se guarda como Fondita y se pierde el dato). Con ese texto y su
  menú, generar un recopilado semanal o mensual de altas nuevas para decidir qué
  giros agregar. Jugos y fruta fue el primero en entrar (2026-10-25).
- [ ] Licencia del icono de Tacos (Flaticon 10305288, modificado): dar atribución al autor
  en Créditos de la app o pagar Flaticon Premium antes de publicar.
- [ ] Medir el piloto de la microzona: publicación, búsqueda, regreso y soporte.
- [ ] Evaluar OTA, mejoras de búsqueda y crecimiento después de QA y datos del
  piloto. [Roadmap de producto](PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md).

Para cada pendiente cerrado, registrar dispositivo/versión, evidencia y fecha.
No marcar aceptación móvil por pasar pruebas de componentes o exportar JavaScript.
