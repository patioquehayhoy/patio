# Templates de email de Patio

Estos HTML **no se compilan ni se importan** desde la app. Son los correos que
manda Supabase Auth. Viven aquí en el repo como fuente de verdad de marca; hay
que **pegarlos a mano** en el dashboard de Supabase.

## Cómo instalar

1. Supabase Dashboard → **Authentication → Email Templates**.
2. Para `magic-link.html`:
   - Pestaña **Magic Link** → pega el HTML completo.
   - Pestaña **Confirm signup** → pega el mismo HTML. *(La app usa
     `signInWithOtp({ shouldCreateUser: true })`, así que la PRIMERA vez que un
     correo entra, Supabase manda el de "Confirm signup", no el de "Magic Link".
     Si solo actualizas uno, los usuarios nuevos ven el template viejo.)*
3. **Subject** sugerido (ambas pestañas):

   ```
   Tu enlace para entrar a Patio
   ```

## Variables de Supabase

| Variable | Qué es |
|---|---|
| `{{ .ConfirmationURL }}` | Enlace que abre `patio://login-callback` con el token. Botón + enlace de respaldo. |
| `{{ .Email }}` | Correo del destinatario (nota legal del pie). |

## Reglas de marca

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
