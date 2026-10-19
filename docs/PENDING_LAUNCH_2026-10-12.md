# Pendientes y roadmap de lanzamiento — actualizado 2026-10-18

Objetivo: iPhone y Android. Este es el checklist vigente; reemplaza pendientes
operativos de los cortes históricos. El lanzamiento público sigue pendiente.

## Completado

- [x] Supabase bajo la cuenta Patio como único Owner; proyecto visible `patio`.
- [x] Staging real preparado y 15 pruebas Auth/RLS/Storage/Edge aprobadas.
- [x] Producción actualizada con siete migraciones y cinco funciones con JWT.
- [x] Bibliotecas, mover/renombrar, filtros, selección y estados homologados.
- [x] Cards con columnas estables, estrella única y colonia · distancia.
- [x] Centrar ubicación en Mapa y recuperar navegación al cerrar resultados.
- [x] TypeScript/lint y 189 pruebas locales aprobados el 2026-10-18.
- [x] Pulido compartido de Filtros/Listas, encabezados, iconos, colores y desvanecido.
- [x] Error al abrir Listas corregido con regresión; el usuario confirmó «ya quedó me parece».
- [x] Borrador de fichas preparado; soporte `quehayhoy.patio@gmail.com`.

Backend comprobado el 2026-10-09: [producción](PRODUCTION_PROMOTION_2026-10-09.md)
y [staging](STAGING_REHEARSAL_2026-10-09.md). No repetir login, migraciones,
asignación de dueños ni borrado de datos sintéticos para cerrar esta lista.

## 1. QA del usuario y estabilidad móvil

- [ ] Subir los commits locales y el cierre del 2026-10-18 a `rebuild/patio-final`.
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
los recorridos completos anteriores. El usuario hará esas pruebas en el celular. Diagnóstico USB y auditoría amplia
detenidos por su petición; retomar solo hallazgos concretos que reporte.

## 2. Dependencias, Android e integraciones

- [ ] Resolver la auditoría npm conservando compatibilidad nativa y verificar
  otra vez. Consulta del 2026-10-12: **32 paquetes afectados, 24 altos, 8
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

- [ ] Confirmar responsable legal y publicar URLs HTTPS operativas de
  privacidad, soporte y solicitud de eliminación de cuenta.
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
- [ ] Medir el piloto de la microzona: publicación, búsqueda, regreso y soporte.
- [ ] Evaluar OTA, mejoras de búsqueda y crecimiento después de QA y datos del
  piloto. [Roadmap de producto](PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md).

Para cada pendiente cerrado, registrar dispositivo/versión, evidencia y fecha.
No marcar aceptación móvil por pasar pruebas de componentes o exportar JavaScript.
