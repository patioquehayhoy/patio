# Patio · runbook de release

## Antes de un build Android

1. Confirmar owner con `eas whoami`.
2. Confirmar `GOOGLE_SERVICES_JSON` en EAS Production.
3. Confirmar `GOOGLE_MAPS_ANDROID_API_KEY` en EAS Production.
4. Verificar que la API key tenga restricción Android para `com.parcomx.patio` y la huella de firma correcta.
5. Ejecutar `npx expo config --json` y revisar `name`, `owner`, `extra.eas.projectId` y package Android.
6. Lanzar `eas build --platform android --profile production`.

## Después del build

- Revisar logs de `Read app config` antes de culpar a Gradle.
- Instalar el APK/AAB en un Android de prueba.
- Validar mapa, login, ubicación y recepción de push.
- No rotar keystore ni borrar credenciales por un fallo de configuración.

## iOS/Web

Usar claves separadas por plataforma. No reutilizar una key Android restringida para iOS o Web.
