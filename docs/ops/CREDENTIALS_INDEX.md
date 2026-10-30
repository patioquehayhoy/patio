# Patio · índice de credenciales (sin secretos)

Última revisión local: 2026-10-29.

Este documento registra ubicación y propósito. No contiene valores secretos.

| Servicio | Identidad / proyecto | Dónde vive el secreto | Estado comprobado |
|---|---|---|---|
| Expo/EAS | owner `patio-quehayhoy`, usuario `patiomx` | Expo Dashboard → Credentials / Environment variables | Acceso confirmado |
| Android firma | package `com.parcomx.patio` | Expo EAS Credentials (keystore remoto) | Existe; no regenerar |
| Android FCM | proyecto Patio elegido para producción | EAS Environment → `GOOGLE_SERVICES_JSON` (archivo) | Existe en production |
| Google Maps | API key restringida a Android + 4 APIs | EAS Environment → `GOOGLE_MAPS_ANDROID_API_KEY` | Pendiente de cargar en EAS |
| iOS firma | bundle `com.parcomx.patio`, team `JK2N262L7X` | Expo EAS Credentials + `credentials/ios/` local ignorado | Certificado/perfil válidos |
| Supabase cliente | URL publicada en `lib/supabase.ts` / `.env.local` | Variables `EXPO_PUBLIC_*` | No imprimir valores |
| Supabase servidor | Edge Functions | Supabase Dashboard → Secrets | No copiar al repo |
| GitHub | `patioquehayhoy/patio` | GitHub account/token/CLI | Repo y push confirmados |
| Apple/App Store | App Store Connect app ID en `eas.json` | Expo EAS Submit / App Store Connect | Configurado |

## Archivos locales protegidos

- `.env`, `.env.local`: ignorados por Git; no mover a `docs/`.
- `credentials.json`: ignorado por Git; solo referencias de firma iOS.
- `credentials/ios/dist-cert.p12`: ignorado por Git; certificado privado.
- `credentials/ios/profile.mobileprovision`: ignorado por Git; perfil de distribución.

## Verificaciones periódicas

```bash
eas whoami
eas env:list --environment production
git check-ignore -v .env credentials.json credentials/ios/dist-cert.p12
git ls-files | rg -i '(^|/)(\.env|credentials|google-services|.*secret|.*token)'
```

La última orden debe devolver únicamente plantillas/documentación permitidas; nunca valores privados.
