# Patio — Flexible Menu Model + Shared MenuCard + Share Poster

See assistant message for full detail. Summary of files:

## Create
1. src/app/data/menu.ts — MenuItem/MenuOfDay/PriceMode types, MENU_SECTIONS closed list, helpers (formatPrice, priceSummary, groupBySection, oneLineSummary), mock data (LUPITA_MENU fixed $55, TAQUERIA_MENU per-item $18 c/u, PAST_MENUS).
2. src/app/components/MenuCard.tsx — shared renderer; props menu, theme(light/dark), variant(detail/thumb/poster), soldOut, showPrice, showHeader, maxItemsPerSection. Internal SectionGroup + ItemRow. Replaces duplicated MenuSection (FoodieDetail l.238-305, FoodieDetailDark l.241-308) and Row (FoodieSoldOut l.302-335).
3. src/app/components/MenuPoster.tsx — branded 9:16 vertical card: PatioMark (tone honoring brand rule), "¿Qué hay hoy?" claim, businessName, type/area, dateLabel, MenuCard variant=poster, price block, Patio footer. No emojis.

## Modify
4. FoodieDetail.tsx — use <MenuCard menu={LUPITA_MENU} theme=light variant=detail/>, delete local MenuSection.
5. FoodieDetailDark.tsx — MenuCard TAQUERIA_MENU theme=dark, delete local MenuSection.
6. FoodieSoldOut.tsx — MenuCard thumb soldOut, delete local Row, keep Agotado badge.
7. FoodieSaved.tsx — SavedCard uses MenuCard thumb showHeader=false maxItemsPerSection=2.
8. FonderoHistory.tsx — PastMenu uses MenuCard thumb, fed PAST_MENUS.
9. FonderoPublish.tsx — price-mode segmented toggle (Precio unico / Precio por platillo), free-form ItemEditorRow with closed-list section chips (8 + Sin seccion), per-item price field in perItem mode, "Anadir platillo" button, Vista previa -> MenuPoster. Delete CourseRow.
10. FonderoSuccess.tsx — wire "Compartir en WhatsApp" to a local-state MenuPoster overlay preview.

## Verify
Run dev server; check each screen via InteractivePrototype/SpecSheet/AppStoreShots harness. Confirm parity on detail/dark/soldout/saved/history, interactions on publish, poster on success. Grep diff for emojis and on-screen fonda/fondero/foodie.
