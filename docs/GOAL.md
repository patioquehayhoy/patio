# GOAL

## Objetivo actual del producto
Construir una app móvil (Patio) para dueños de fonditas/negocios de comida en México que les permita:

1. Entrar con magic link.
2. Configurar su perfil de negocio.
3. Crear su menú del día manualmente o desde foto con IA.
4. Guardar ese menú en Supabase.
5. Generar una vista previa lista para compartir con clientes.

## Objetivo técnico inmediato
Dejar el flujo principal `login -> perfil -> menú -> preview/share` estable, con persistencia confiable y sin regresiones entre sesiones.

## Criterio de éxito de corto plazo
Un usuario nuevo puede completar el flujo de punta a punta en una sola sesión sin bloqueos de autenticación ni pérdida de datos del menú del día.
