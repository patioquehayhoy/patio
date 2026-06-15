import { MenuOfDay, groupBySection, showsPerItemPrices, formatPrice } from "../data/menu";

const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

type Theme = "light" | "dark";
type Variant = "detail" | "thumb" | "poster";

const PALETTE = {
  light: {
    sectionLabel: "#8A8A85",
    item: "#111214",
    dashed: "1px dashed rgba(17,18,20,0.1)",
    chooseBg: "#FBE7DD",
    chooseFg: "#F2612F",
    price: "#F2612F",
  },
  dark: {
    sectionLabel: "rgba(248,248,245,0.5)",
    item: "#F8F8F5",
    dashed: "1px dashed rgba(255,255,255,0.1)",
    chooseBg: "rgba(255,106,61,0.18)",
    chooseFg: "#FF6A3D",
    price: "#FF6A3D",
  },
} as const;

// Renderer ÚNICO del menú del día. Mismo componente para detalle del foodie,
// póster compartible y miniaturas, alimentado por el modelo MenuOfDay.
export function MenuCard({
  menu,
  theme = "light",
  variant = "detail",
  showPerItemPrice,
  maxItemsPerSection,
}: {
  menu: MenuOfDay;
  theme?: Theme;
  variant?: Variant;
  showPerItemPrice?: boolean;
  maxItemsPerSection?: number;
}) {
  const c = PALETTE[theme];
  const groups = groupBySection(menu);
  const withPrice =
    showPerItemPrice !== undefined ? showPerItemPrice : showsPerItemPrices(menu);
  const itemSize = variant === "thumb" ? 13 : 15;

  return (
    <div>
      {groups.map((g, gi) => {
        const last = gi === groups.length - 1;
        const items =
          maxItemsPerSection !== undefined
            ? g.items.slice(0, maxItemsPerSection)
            : g.items;
        return (
          <div
            key={g.section ?? "sin-seccion"}
            style={{
              paddingBottom: last ? 0 : 12,
              marginBottom: last ? 0 : 12,
              borderBottom: last ? "none" : c.dashed,
            }}
          >
            {g.section && (
              <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: SF_TEXT,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: c.sectionLabel,
                  }}
                >
                  {g.section}
                </span>
                {g.chooseOne && (
                  <span
                    style={{
                      fontFamily: SF_TEXT,
                      fontSize: 9.5,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: c.chooseBg,
                      color: c.chooseFg,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Elige uno
                  </span>
                )}
              </div>
            )}
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-baseline justify-between gap-3"
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: itemSize,
                  color: c.item,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.4,
                  marginBottom: items.length > 1 ? 2 : 0,
                }}
              >
                <span>{it.name}</span>
                {withPrice && typeof it.price === "number" && (
                  <span style={{ color: c.price, fontWeight: 700, flexShrink: 0 }}>
                    {formatPrice(it.price)}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
