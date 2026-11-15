# Templates de email de Patio

Estos HTML **no se compilan ni se importan** desde la app. Son los correos que
manda Supabase Auth. Viven aquí en el repo como fuente de verdad de marca; hay
que **pegarlos a mano** en el dashboard de Supabase.

## Cómo instalar

1. Supabase Dashboard → **Authentication → Email Templates**.
2. Pega cada archivo en su pestaña correspondiente:
   - `magic-link.html` → **Magic Link**.
   - `confirm-signup.html` → **Confirm signup**.
   - `invite.html` → **Invite user**.
   - `change-email.html` → **Change email address**.
   - `reset-password.html` → **Reset password**.
   - `reauthentication.html` → **Reauthentication**.
3. **Magic Link** y **Confirm signup** son obligatorios hoy. La app usa
   `signInWithOtp({ shouldCreateUser: true })`: la primera entrada dispara
   Confirm signup y las siguientes Magic Link.
4. **Subject** de Magic Link y de Confirm signup (2026-11-15): el código va
   primero, así se lee en la notificación sin abrir el correo:

   ```
   {{ .Token }} es tu código para entrar a Patio
   ```

   Supabase ya usa `{{ .Token }}` en el asunto de su correo de
   reautenticación. Al pegarlo, mándate un código de prueba: si el asunto
   llega con el texto `{{ .Token }}` literal, usa «Tu código para entrar a
   Patio» (el código igual sale en la vista previa del buzón).

## Variables de Supabase

| Variable | Qué es |
|---|---|
| `{{ .ConfirmationURL }}` | Enlace que abre `patio://login-callback` con el token. Botón + enlace de respaldo. |
| `{{ .Email }}` | Correo del destinatario (nota legal del pie). |

## Reglas de marca

- La P oficial es el único logo del encabezado y está embebida como PNG. Cuando
  exista un CDN público de Patio debe migrarse a HTTPS para reducir peso.
- **Los 6 correos salen de `generar.py` (2026-11-15).** Mismas medidas en
  todos; se cambia ahí y se vuelve a correr (`python3
  supabase/templates/generar.py`). Antes, cambio de correo, invitación,
  reautenticación y contraseña eran copias viejas del de acceso con su texto.
- **Medidas** (Parco: «100 % Apple», cel y compu):
  - Columna centrada de 600 (Outlook con tabla fija de 600), margen de 24
    a los lados y 40 arriba y abajo. Todo a un solo borde izquierdo, logo y
    pie incluidos.
  - Logo: el ícono de la app a 48 con esquinas de 11
    (`assets/images/p-icon-correo.png`, subirlo al bucket «Patio ID»
    antes de pegar). Una P negra transparente desaparece en el modo oscuro
    de Gmail, que oscurece el fondo pero no la imagen.
  - Tipografía del sistema, interlineado en px: título 24/30 seminegrita,
    cuerpo 17/24, código 34/40 seminegrita (lo más grande), pie 12/16 gris.
    Enlaces `#0066CC` sin subrayar; línea del pie `#D2D2D7`.
  - Espacios: 32 bajo el logo, 8 bajo el título, 16 entre bloques, 8 entre
    párrafos seguidos, 32 antes del pie.
  - Sin viudas: los dos últimos términos de cada texto van con `&nbsp;`,
    también «Enviado a [correo]».
  - El código va también en la vista previa del buzón y en el asunto.
- Copy regido por `docs/design/foundations/IDENTITY_VERBAL.md`: humano, local,
  sin "fonda/fondero" paraguas, sin lenguaje comparativo.
- `"¿Qué hay hoy?"` y `"Saaaaaaabes."` van SIEMPRE juntos como par de marca —
  viven en la firma final del correo, nunca separados en piezas distintas.
- Paleta vigente (CLAUDE.md, corregida 2026-07-22): fondo `#EFEFEF`, ink `#292929`,
  card `#FFFFFF`, accent naranja `#F2612F` sin cambio, hairline `rgba(0,0,0,0.08)`.
- Tipografía: system-ui (`-apple-system, Segoe UI, Roboto, Helvetica, Arial`) —
  la fuente de marca (`Fonts.brand` / Plus Jakarta) no se carga de forma
  confiable en clientes de correo.
- HTML de email: maquetado con `<table>` y estilos inline. Nada de flexbox/grid
  ni `<style>` en `<head>` (Gmail los ignora).

## Soporte

Correo público de soporte: `quehayhoy.patio@gmail.com`.

## Acceso por código (2026-10-26)

`magic-link.html` y `confirm-signup.html` incluyen `{{ .Token }}` junto con
el enlace. La app admite 8 dígitos mediante `verifyOtp({email, token, type: 'email'})`.
Aplicar ambas plantillas y conservar OTP length = 8 en el proyecto correcto;
probar cuenta nueva y existente. Los archivos locales no actualizan el panel.
Estado de despliegue y revisión: `docs/REVIEWER_ACCESS_2026-10-26.md`.

Aplicadas ambas plantillas en producción tras restauración; entrega y verificación OTP reales aprobadas. El diseño remoto existente se conservó y se concilió en estos dos archivos. Ver actualización 2026-10-27 del documento de acceso.
