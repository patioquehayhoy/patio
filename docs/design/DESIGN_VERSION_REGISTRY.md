# Patio — Registro de Versiones de Diseño

> Última actualización: 2026-06-07
> Propósito: nombrar cada línea de trabajo para no mezclar app funcional, rediseño Figma y exploraciones generativas.

---

## 1. Patio Vivo

**Qué es:** la app actual que ya funciona en React Native/Expo.

**Dónde vive:**

- Código: rama actual `v2-menu-vivo`
- Fuente visual actual: `assets/screenshots/`
- Documentación factual: `docs/PATIO_PRD.md`, `docs/STATE.md`

**Estado:** funcional / base estable.

**Regla:** no tocar para rediseño sin crear rama nueva.

**Uso:** referencia funcional. Dice qué hace la app, no cómo debe verse al final.

---

## 2. Patio Tahoe

**Qué es:** el rediseño propio hecho en Figma con criterio Patio.

**Dónde vive:**

- Figma: `Patio Redesign System`
- URL: `https://www.figma.com/design/vk9BJccEXfO3PGUCOqSBwI`
- Blueprint: `docs/design/REDESIGN_BLUEPRINT_V1.md`

**Estado:** exploración visual sistemática.

**Dirección:** Apple Tahoe + glass orgánico + ficha editorial + operación Fondero premium.

**Uso:** base para implementar el rediseño cuando esté aprobado.

**Regla:** no reemplaza a `Patio Vivo` hasta que se implemente en una rama dedicada y pase QA.

---

## 3. Patio Agent

**Qué es:** exploración generada/asistida por el agente interno de Figma u otra herramienta generativa.

**Dónde vive:** por definir si se usa.

**Estado:** opcional / exploratorio.

**Uso correcto:** pedir variaciones, layouts, refinamiento de componentes o alternativas visuales usando el blueprint de Patio.

**Uso incorrecto:** pedir “haz una app de comida” sin contexto, porque produciría algo genérico.

**Regla:** cualquier output de agente se evalúa contra `Patio Tahoe`, no contra gustos sueltos.

---

## 4. Futuras ramas de código

Cuando se implemente el rediseño:

- Rama sugerida: `design/patio-tahoe-v1`
- Base: rama estable actual
- Orden de implementación:
  1. `explorar.tsx`
  2. `patio/[id].tsx`
  3. `foto-menu.tsx`
  4. `menu.tsx`
  5. `preview.tsx` / `share.tsx`
  6. `index.tsx`, `favoritos.tsx`, `cuenta.tsx`, `perfil.tsx`

Nada del rediseño debe mezclarse con `Patio Vivo` sin decisión explícita.

