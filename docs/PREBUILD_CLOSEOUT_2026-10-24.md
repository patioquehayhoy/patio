# Cierre técnico previo al build — 2026-10-24

Estado: comprobaciones locales aprobadas; no hay candidato firmado ni
aceptación del recorrido físico. No se inició EAS ni se publicó nada.

## Comprobado en este corte

| Control | Resultado |
| --- | --- |
| TypeScript, lint y pruebas de aplicación | 189/189 aprobadas |
| PostgreSQL aislado: permisos, cuotas, transacciones y borrado | 19/19 aprobadas |
| Reconstrucción del esquema inventariado: contrato móvil, propiedad y cascadas | 12/12 aprobadas |
| Exportación JavaScript/assets | iOS y Android completos |
| Configuración estricta iOS | 19 correctos, 0 errores, 0 pendientes detectados |
| Configuración estricta Android | 26 correctos, 0 errores, 2 pendientes externos |
| Auditoría npm tras actualizaciones compatibles de fast-uri y undici | 8 paquetes afectados: 5 altos y 3 moderados; gate de auditoría pendiente |
| EAS production, consulta sin imprimir valores | Maps y archivo Firebase no detectados |
| Clave IA legada en .env y EAS production | No detectada; esto no demuestra revocación en el proveedor ni ausencia en builds antiguos |
| Dispositivo de prueba | No hay simulador iniciado; no se ejecutó Maestro ni recorrido físico |

Las pruebas SQL usan datos aislados y el inventario histórico del esquema;
no vuelven a certificar producción, Auth, Storage ni entrega de notificaciones.
Exportar JavaScript no compila ni firma una aplicación nativa.

## Bloqueos y siguiente acción concreta

1. **Seguridad:** `node-forge` 1.4.0 sigue sin versión corregida publicada
   según [el aviso](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
   `decode-uri-component` está corregido desde 0.5.0, pero su actualización
   cambia el contrato ESM respecto del consumidor CommonJS actual. Requiere
   una solución compatible y su prueba, no un override sin verificar.
   [Aviso del decodificador](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
   Se conserva el gate `npm audit --audit-level=high`; no se usó `--force`.
2. **Android:** falta proyecto/cliente Google Cloud y Firebase accesible para
   habilitar Maps SDK for Android y obtener su configuración real. Registrar
   `com.parcomx.patio`, restringir Maps por package y SHA-1 de las firmas
   candidatas; cargar `GOOGLE_MAPS_ANDROID_API_KEY` y el archivo cliente
   `GOOGLE_SERVICES_JSON` en EAS production. La credencial FCM V1 de servidor
   se carga en EAS Credentials, nunca en el archivo cliente ni el bundle.
3. **Integraciones físicas:** probar magic link, cámara/galería, ubicación,
   publicación visible desde otra cuenta, reintento sin red y push. No se
   hicieron llamadas IA pagadas ni publicaciones/borrados en producción.
4. **Operación pública:** auditoría adicional confirma que soporte ya está
   implementado en `app/soporte.tsx` con `quehayhoy.patio@gmail.com`, y ambos
   perfiles muestran eliminación de cuenta a personas con sesión. No rehacer
   esos flujos. `app/privacidad.tsx` configura visibilidad y bloqueos; no es
   un aviso integral que identifique al responsable. No se encontró dominio
   ni URL pública de aviso/eliminación en el repo o los sitios conectados
   consultados (Sites e Higgsfield). No descarta otro hosting o cuenta.
   El usuario plantea operar como persona física; falta confirmar si Patio
   lo opera él o una sociedad, nombre legal completo, domicilio y dominio.
   Sigue pendiente atención operativa a reportes y soporte.
5. **Accesos y checkpoint remoto:** el último bloqueo registrado de push es
   HTTP 403 de T1Alejandro; no se cambió cuenta, propietario ni historial.
6. **Candidato:** solo después de cerrar los gates aplicables, generar el
   candidato firmado, revisar permisos y bibliotecas Android de 16 KB, y
   ejecutar QA desde TestFlight/Google Play. Requisitos de tienda y firma
   deben verificarse con las consolas antes del envío.

## Recorrido físico breve pendiente

- Foodie: abrir, buscar → cerrar resultados → cambiar de sección → reabrir;
  ficha, guardar, Listas y regreso; conceder y denegar ubicación.
- Fondero: entrar, escribir/fotografiar menú, capturar precio, guardar,
  publicar y comprobarlo desde otra cuenta; recuperación de red/borrador.
- Ambos: cerrar/reabrir, claro/oscuro, teclado, texto grande y notificaciones.

No marcar estos casos aprobados a partir de pruebas de componentes.
El usuario aceptó Listas Foodie con `list-outline`. Se conservan
`bookmarks-outline` para Listas Fondero y libro para navegación Menús.
Los iconos de giro y la densidad de puntos del mapa siguen sin cambiar:
su discusión no acredita una decisión final de producto.

## Evidencia temporal

Logs `/private/tmp/patio-prebuild-{check,ios,android,export,sql,schema}.log`,
auditoría `/private/tmp/patio-prebuild-audit.json` y bundles en
`/private/tmp/patio-prebuild-export-20261024`. Estos archivos son locales,
temporales y no contienen evidencia de instalación en dispositivos.
