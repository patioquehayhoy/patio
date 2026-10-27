# Acceso para revisión — estado

Implementado: formulario de código de 6 dígitos en Foodie y Fondero,
verificación Supabase por email/OTP, reenvío con espera de 60 segundos y
mismo destino/perfil/biblioteca que el enlace mágico. Código inválido o
vencido no cambia de cuenta ni borra borradores. Enlace mágico conservado.

Plantillas locales `magic-link.html` y `confirm-signup.html` incluyen
`{{ .Token }}` además de `{{ .ConfirmationURL }}`. Aplicar ambas en el
proyecto Patio y verificar que OTP length sea 6. No se aplicaron remotamente:
la sesión del panel está cerrada y el proyecto figura INACTIVE en el CLI.
No hacer `supabase config push`: el archivo local solo configura funciones
y no es un respaldo de toda la configuración Auth de producción.

Falta comprobar entrega a usuario nuevo/existente y entrada con app
abierta/cerrada en iPhone/Android. Un campo OTP por sí solo no da al revisor
acceso al buzón: aún hace falta una cuenta de revisión accesible, con método
de entrada e instrucciones aceptadas por las tiendas y datos de prueba.
No se creó cuenta, no hay código fijo, bypass ni credenciales en el repo.
