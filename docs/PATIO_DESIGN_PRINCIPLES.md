# Patio Design Principles

Use this file as the shared product and UI reference for Patio. Prefer these rules over generic app patterns when designing or refining screens in this repo.

> ⚠️ **Separación importante:**
> Las secciones **Core Direction → Role Principles** son principios durables: aplican siempre.
> La sección **Current UI Decisions** son decisiones vigentes y cambiables — pueden replantearse
> en una exploración de diseño (Claude Design u otra) sin violar los principios.
> La biblia fundacional vive en [`design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`](design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md).

## Core Direction

- Prioritize iOS-native patterns and behavior before custom UI.
- Aim for a Tahoe-like feel: calm surfaces, soft hierarchy, crisp spacing, restrained accents.
- Borrow Notion's restraint in secondary actions: low noise, clear hierarchy, simple controls.
- Keep the product feeling warm and approachable, but never cluttered.

## Interaction Rules

- Keep one clear primary action per area.
- Secondary actions should not compete with the primary action.
- Use action sheets or bottom sheets for grouped secondary or destructive actions instead of inline expanded panels when possible.
- Hide destructive actions behind a secondary entry point unless the task explicitly requires always-visible danger actions.
- Prefer simple disclosure patterns:
  - closed state: `chevron.right`
  - open state: `chevron.down`

## Layout Rules

- Add generous vertical breathing room between action groups.
- Avoid making unrelated controls look like equal siblings.
- Keep CTA groups visually separated:
  - primary action first
  - secondary escape hatch after visible spacing
- Prefer centered, contained controls over full-width controls when the action is secondary or optional.
- Avoid jumpy layouts. If content switches between variants, stabilize height or width so the screen does not visibly shift.

## Visual Style

- Use light, clean backgrounds with subtle warmth.
- Keep borders soft and low-contrast.
- Use shadows lightly; depth should feel airy, not heavy.
- Prefer rounded geometry and smooth radii, especially for sheets, cards, and pills.
- Accent color should be used sparingly and mostly for clear calls to action.
- For map/exploration surfaces, use the shared logistics-dashboard references as structural direction: pale desaturated map, thin route/pin language, floating controls, translucent panels, dense list rows, and calm hierarchy. Do not copy the neon green palette; keep Patio's warmer accent system.
- Prefer full-bleed map composition with overlays instead of placing a small map inside a decorative card.
- Bottom sheets and floating panels should feel like glassy operational surfaces: large radius, low border contrast, restrained shadow, enough transparency/softness to keep map context visible.
- Lists inside Foodie/Map flows should be dense but breathable: strong item name, concise metadata, right-aligned key value, and one clear affordance.

## Copy Rules

- Use short, direct labels.
- Prefer generic verbs when the action applies to multiple content types.
- Avoid over-explaining in persistent UI.
- Put explanatory detail in sheets, helper text, or follow-up surfaces instead of the main layout.

## Current UI Decisions (cambiables)

> Estas son decisiones de la versión actual. Una exploración de rediseño puede proponer
> cambiarlas siempre que respete los principios de arriba.

- In menu editing, `Agregar sección` is the persistent primary action.
- Menu utilities like changing source, re-choosing a template, or deleting should live under `Más opciones`.
- For menu item creation, use `Agregar` instead of content-specific labels when the item could be a platillo, bebida, guarnición, postre, salsa, or similar.
- Template picking should feel like a quick starting point, not a branching workflow.

## Role Principles

- `Fondero` tools should optimize for speed, confidence, and low-friction editing.
- `Foodie` tools should optimize for clarity, discovery, and trust.
- Shared components may reuse styling, but each role should preserve its own primary job to be done.
