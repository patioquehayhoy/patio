#!/usr/bin/env python3
"""Genera los 6 correos de Supabase Auth desde una sola base (2026-11-15).

Mismas medidas en todos (ver README «Medidas»). Para cambiar algo, se cambia
aquí y se vuelve a correr: python3 supabase/templates/generar.py
Los archivos generados se pegan a mano en Supabase → Authentication → Email Templates.
"""
from pathlib import Path

AQUI = Path(__file__).resolve().parent
LOGO = "https://gjfjsjlrgycrgmcbjrus.supabase.co/storage/v1/object/public/Patio%20ID/p-icon-correo.png"
FUENTE = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif"
TINTA, GRIS, LINEA, AZUL = "#1D1D1F", "#6E6E73", "#D2D2D7", "#0066CC"

# Medidas: tamaño / interlineado en px (Outlook respeta px, no proporciones).
TITULO = f"font-size:24px;line-height:30px;font-weight:600;letter-spacing:-0.2px;color:{TINTA};"
CUERPO = f"font-size:17px;line-height:24px;font-weight:400;color:{TINTA};"
CODIGO = f"font-size:34px;line-height:40px;font-weight:600;letter-spacing:3px;color:{TINTA};"
PIE = f"font-size:12px;line-height:16px;font-weight:400;color:{GRIS};"
ENLACE = f"color:{AZUL};text-decoration:none;"


def fila(contenido, estilo, abajo):
    return f'          <tr>\n            <td style="padding:0 0 {abajo}px 0;{estilo}">\n              {contenido}\n            </td>\n          </tr>\n'


def correo(previa, titulo, bloques, uso):
    """bloques: lista de (html, estilo, espacio_abajo). El último espacio abre aire antes del pie."""
    cuerpo = "".join(fila(html, estilo, abajo) for html, estilo, abajo in bloques)
    return f"""<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
</head>
<!--
  {uso}
  Generado por supabase/templates/generar.py: no editar a mano.
-->
<body style="margin:0;padding:0;background:#FFFFFF;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#FFFFFF;">{previa}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#FFFFFF;">
    <tr>
      <td align="center" style="padding:40px 24px 40px 24px;">
        <!--[if mso]><table width="600" cellpadding="0" cellspacing="0" role="presentation"><tr><td><![endif]-->
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;font-family:{FUENTE};color:{TINTA};text-align:left;">
          <tr>
            <td style="padding:0 0 32px 0;">
              <img src="{LOGO}" width="48" height="48" alt="Patio" style="display:block;border:1px solid #E5E5E0;border-radius:11px;" />
            </td>
          </tr>
{fila(titulo, TITULO, 8)}{cuerpo}          <tr>
            <td style="border-top:1px solid {LINEA};padding:16px 0 0 0;{PIE}">
              Enviado a&nbsp;{{{{ .Email }}}}<br>
              <a href="mailto:quehayhoy.patio@gmail.com" style="{ENLACE}">Ayuda</a>&nbsp;&nbsp;|&nbsp;&nbsp;Patio, Ciudad de&nbsp;México
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
"""


def enlace(texto):
    return f'<a href="{{{{ .ConfirmationURL }}}}" style="{ENLACE}">{texto}</a>'


SEGURIDAD = "No lo compartas: nadie de Patio te lo va a pedir. Si no lo pediste, ignora este&nbsp;correo."

ACCESO = correo(
    "{{ .Token }} es tu código para entrar a Patio.",
    "Tu código para entrar a&nbsp;Patio",
    [
        ("Escríbelo en la&nbsp;app:", CUERPO, 16),
        ("{{ .Token }}", CODIGO, 16),
        (f"Si abriste este correo en tu celular, puedes {enlace('entrar con un&nbsp;toque')}.", CUERPO, 8),
        (SEGURIDAD, CUERPO, 32),
    ],
    "Acceso por código (Magic Link y Confirm signup). Asunto: «[código] es tu código para entrar a Patio».",
)

CORREOS = {
    "magic-link.html": ACCESO,
    "confirm-signup.html": ACCESO,
    "reauthentication.html": correo(
        "{{ .Token }} es tu código para confirmar que eres tú.",
        "Confirma que eres&nbsp;tú",
        [
            ("Escribe este código en la app para&nbsp;seguir:", CUERPO, 16),
            ("{{ .Token }}", CODIGO, 16),
            (SEGURIDAD, CUERPO, 32),
        ],
        "Reautenticación (acciones sensibles). Asunto: «[código] es tu código para confirmar que eres tú».",
    ),
    "change-email.html": correo(
        "Confirma tu nuevo correo en Patio.",
        "Confirma tu nuevo&nbsp;correo",
        [
            ("Pediste cambiar el correo de tu cuenta a {{ .NewEmail }}. Para terminar,&nbsp;confírmalo.", CUERPO, 16),
            (enlace("Confirmar mi nuevo&nbsp;correo"), CUERPO, 8),
            ("Si no lo pediste, ignora este correo y tu cuenta se queda&nbsp;igual.", CUERPO, 32),
        ],
        "Cambio de correo. Asunto: «Confirma tu nuevo correo en Patio».",
    ),
    "invite.html": correo(
        "Te invitaron a Patio.",
        "Te invitaron a&nbsp;Patio",
        [
            ("Entra con un toque y descubre qué hay hoy cerca de&nbsp;ti.", CUERPO, 16),
            (enlace("Aceptar la&nbsp;invitación"), CUERPO, 8),
            ("Si no esperabas esta invitación, ignora este&nbsp;correo.", CUERPO, 32),
        ],
        "Invitación. Asunto: «Te invitaron a Patio».",
    ),
    "reset-password.html": correo(
        "Entra a Patio con este enlace.",
        "Vuelve a entrar a&nbsp;Patio",
        [
            ("Patio no usa contraseñas: entras con tu correo. Toca el enlace para entrar de&nbsp;nuevo.", CUERPO, 16),
            (enlace("Entrar a&nbsp;Patio"), CUERPO, 8),
            ("Si no lo pediste, ignora este&nbsp;correo.", CUERPO, 32),
        ],
        "Restablecer acceso (Patio no usa contraseñas). Asunto: «Vuelve a entrar a Patio».",
    ),
}

if __name__ == "__main__":
    for nombre, html in CORREOS.items():
        (AQUI / nombre).write_text(html, encoding="utf-8")
        print("escrito", nombre)
