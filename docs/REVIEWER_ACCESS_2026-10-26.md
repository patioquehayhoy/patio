# Acceso por correo — actualizado 2026-10-27

Implementado: formulario de código de **8 dígitos** en Foodie y Fondero,
verificación Supabase por email/OTP, reenvío con espera de 60 segundos y
mismo destino/perfil/biblioteca que el enlace mágico. Código inválido o
vencido no cambia de cuenta ni borra borradores.

La propuesta inicial de 6 dígitos se ajustó a los **8 configurados realmente**
en producción. No se redujo la longitud ni se alteró la configuración de Auth.
Vigencia observada en el panel: 3600 segundos. Se retiró la afirmación de
15 minutos de la pantalla, pues no coincidía con el servidor.

## Despliegue y prueba real

- Producción `gjfjsjlrgycrgmcbjrus` restaurada; CLI confirmó ACTIVE_HEALTHY.
- Guardadas las dos plantillas: Magic link or OTP y Confirm sign up.
- Se preservó el diseño remoto existente y se añadió `{{ .Token }}` junto
  al enlace. Asunto de ambas: «Tu código para entrar a Patio».
- Copias locales conciliadas en `supabase/templates/magic-link.html` y
  `confirm-signup.html`. SMTP Gmail existente conservado sin tocar credenciales.
- Un correo real llegó al buzón propio de Patio y su OTP se verificó con éxito.
- Con esa sesión se ejecutó una lectura IA real de un menú sintético: recuperó
  sopa, chile relleno, agua incluida y precio de $95. No se publicó un menú,
  no se guardó sesión/token en Git ni se expusieron credenciales en el resultado.
- Evidencia sin credenciales: `/private/tmp/patio-auth-ai-live-20261026.json`.

## Pendiente

Probar el formulario en ambos teléfonos, retorno con app abierta/cerrada,
códigos vencidos/reutilizados, cuenta nueva y recuperación de red.
Un OTP por sí solo no da al revisor acceso al buzón: aún falta cuenta de revisión
con instrucciones accesibles para las tiendas y datos de prueba.
No hay código fijo, bypass ni credenciales de revisión dentro del repositorio.
