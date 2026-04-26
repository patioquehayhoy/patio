# STATE

## Estado actual (2026-04-19)
La app está en una fase funcional avanzada de MVP: ya existe flujo completo de producto, pero todavía hay puntos frágiles en autenticación y calidad técnica antes de considerarla estable para operación continua.

## Qué ya funciona
- Estructura de navegación principal con Expo Router.
- Pantalla de acceso por correo (magic link) y acceso dev.
- Callback de login robustecido para múltiples formatos de deep link (`code`, `token_hash`, `token`) con inicialización centralizada de usuario.
- Edición de perfil de negocio con guardado en Supabase.
- Edición de menú manual con secciones/platillos y guardado de menú del día.
- Lectura de menú por foto usando Anthropic + flujo de revisión.
- Vista previa para compartir contenido en formato visual.
- Estado vacío de compartir mejorado: solo aparece cuando no hay platillos reales, con CTA directo a Menú.
- Tema claro/oscuro persistido en AsyncStorage.
- `npx tsc --noEmit` ya pasa en verde.
- Botón de foto en Menú migrado a botón redondo centrado estilo HIG (se quitó el ícono inline en la primera sección).
- En `menu` y `foto-menu` los inputs de precio (sección y platillo) muestran prefijo visual `$` fijo para mejorar claridad.
- En cards de bebidas el call-to-action ya muestra `+ agregar bebidas`.
- En `foto-menu` (review) se quitó el ícono de cámara dentro de la primera sección y se eliminó el badge `IA` para reducir ruido visual.
- Cards de platillo en `menu` y `foto-menu` regresaron a fondo blanco (`surface`) y se mejoró legibilidad del separador `/`.
- En `preview` ya no se fuerza el título naranja de `MENÚ DEL DÍA`; además, limpia precios embebidos en descripción y los muestra como precio de item.
- Se reforzó la alineación del bloque de precios (`$` + valor + `×`) al extremo derecho en sección y platillo.
- En `menu` se agregó estado de onboarding vacío cuando no hay secciones, con CTA para crear secciones sugeridas.
- En `foto-menu` (idle) se reemplazó el emoji/fallback por icono de cámara consistente y color accent.
- En `menu` y `foto-menu` el CTA `+ agregar platillo` ya está alineado a la izquierda y ahora usa feedback gris al presionar (estilo touch nativo).
- En `foto-menu` (idle) el ícono principal de cámara se homologó en color accent y posición centrada para consistencia con el estilo general.
- En `menu` se cambió el estado inicial para arrancar en onboarding vacío (`{ secciones: [] }`) cuando no hay menú guardado, en vez de pre-crear secciones.
- En `menu` el CTA `Crear secciones sugeridas` ahora abre un selector de secciones tipo “widgets” (pills seleccionables en modal) antes de crear el menú.
- En `menu` se ajustó el bloque de precio (`$ + número + ×`) para quedar más pegado al borde derecho y con menor separación visual.
- El texto `+ agregar platillo / + agregar bebidas` ahora se muestra con transparencia (opacidad) para verse más ligero.
- En `menu`, el selector fue refinado a estilo HIG: copy más limpio, grabber de sheet, selección no invertida y plantillas por giro (Fondita, Taquería, Repostería, Mariscos, Personalizado).
- En `menu` se compactó aún más el layout del precio para evitar hueco entre símbolo y valor (`$0x`), removiendo anchos fijos que generaban separación visual.
- En `menu` se alineó el header de sección a baseline inferior (título, `$`, precio y `×`) y se eliminó el kerning en títulos para una lectura más limpia estilo HIG.
- En `menu` las cards de platillo se rediseñaron al estilo referencia: bloque izquierdo (nombre + descripción), icono visual a la izquierda, y precio pegado a la izquierda de `×` con mismo color.
- En `preview` (Compartir) se homologó el look para mostrar platillos en filas limpias sin subtítulos pesados de sección, con precio en el extremo derecho.
- En `menu` y `foto-menu` los botones `×` se movieron a variante circular para mejorar tocabilidad (tap target) y reducir errores al editar precio.
- Se ajustó interlineado/jerarquía tipográfica de nombre y descripción de platillos para un ritmo visual más cercano a HIG.
- En `menu` se retiró el círculo de `×`; ahora las `×` son limpias y la de platillo queda en esquina superior derecha para reducir ruido visual.
- En `menu` y `foto-menu` se adoptó layout compacto tipo lista (menos caja interna), con nombre+descripción a la izquierda y bloque `precio + ×` alineado a la derecha.
- En `menu` se rediseñó el modal de plantillas: selección estable por checklist (las secciones no desaparecen al deseleccionar), CTA deshabilitado si no hay selección y visual más coherente.
- En `preview` se restauró la jerarquía visual por grupos y secciones: vuelve a mostrar encabezado de grupo (`MENÚ DEL DÍA` / `CARTA`) y encabezado de sección con precio alineado a la derecha.
- En `preview` se homogeneizó la columna de precios con el mismo ancho visual para sección y platillo, reduciendo brincos entre filas.
- En `foto-menu` la normalización de Vision limpia ruido textual como `menu/menú` en nombre y descripción antes de guardar en store.
- En `preview` las descripciones con variantes separadas se muestran como sub-bullets cuando aplica, para que un platillo con varias opciones se lea mejor.
- `npx tsc --noEmit` volvió a pasar después de corregir refs de `Swipeable` en `foto-menu`.
- Arrancó V3 MVP de ubicación: en `perfil` ya existe control para `Mostrar ubicación`.
- En `preview` la dirección solo se muestra si está habilitada y aparece CTA `Abrir en Maps`.
- El enlace de ubicación usa Apple Maps en iOS y búsqueda de Google Maps en Android.
- En `perfil` se refinó la sección de negocio y se reemplazó el selector de giro por una ruleta vertical tipo picker con snap al centro.
- En `perfil` se reestructuró `Operación` como bloque minimalista tipo Settings: apertura, cierre y métodos de pago en una sola jerarquía.
- `app/perfil.tsx` quedó sin warnings de lint; persiste solo el warning conocido de `app/onboarding.tsx`.
- Arrancó base V3 Foodie: `app/explorar.tsx` funciona como home de exploración con mapa liviano, pins seleccionables, filtros simples y Top 10 curado.
- `app/explorar.tsx` se rediseñó siguiendo referencias de dashboard logístico: mapa full-bleed, controles flotantes y bottom sheet con selección/lista.
- `app/index.tsx` ahora separa intención inicial: `Busco comida` lleva a Explorar y `Tengo un negocio` revela el acceso de fondero.
- Se quitó el reset forzado de `app/onboarding.tsx`; `npm run lint` queda sin warnings.

## Qué está incompleto o frágil
- Falta validación manual del flujo de callback en dispositivo real (deep links iOS/Android).
- Falta aterrizar el rediseño de “grupo grande de secciones” (MENÚ DEL DÍA/CARTA) en `app/menu.tsx`; hoy siguen cards por sección sueltas.
- No hay suite de tests automatizados.
- El mapa/listado de Foodie usa datos mock; falta conectarlo a Supabase, ubicación real y ficha pública.

## Próximos 3 pasos
1. Probar en simulador el flujo `Busco comida -> Explorar` y `Tengo un negocio -> acceso fondero`.
2. Crear ficha pública de Patio desde la selección del mapa/lista.
3. Conectar `Explorar` a datos reales de Supabase y ubicación por zona/celda.
