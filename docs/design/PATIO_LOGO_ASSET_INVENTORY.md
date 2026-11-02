# Patio — Logo Asset Inventory

**Auditoría:** 2026-11-01  
**Regla:** no redibujar ni modificar el mark existente.

## Activos de wordmark

| Rol | Archivo | Dimensiones | SHA-256 (prefijo) | Observación |
|---|---|---:|---|---|
| Negro | `assets/images/logo-negro.png` | 880×161 | `7b5e8d2b64af9aee99c5799b` | maestro raster detectado |
| Blanco | `assets/images/logo-blanco.png` | 880×161 | `8ea29b914cd928e658ac0437` | maestro raster invertido |

Los mismos archivos aparecen duplicados en `artifacts/` y en los imports de Figma Make v01. Deben tratarse como copias, no como maestros independientes.

## Activos de símbolo/app icon

- `design-source/figma-make/v02/src/imports/P_Logo_favicon.png.svg`
- `design-source/figma-make/v02/src/imports/P_Logo_icon.png-_1024_x_1024_PNG.svg`
- `design-source/figma-make/v02/src/imports/P_Logo_android-icon-foreground.png_432_x_432_PNG_transparente-.svg`
- `design-source/figma-make/v02/src/imports/P_Logo_android-icon-background.png_432_x_432_PNG_o_color_so_lido.svg`

Estos son candidatos vectoriales para icono, favicon y recursos nativos. Antes de llamarlos “maestros” hay que confirmar visualmente con Alejandro que representan exactamente el logo vigente.

## Decisión pendiente mínima

Confirmar un archivo maestro de wordmark y un archivo maestro de símbolo. Después se documentan área de seguridad, tamaños mínimos y exportaciones sin crear variantes nuevas.
