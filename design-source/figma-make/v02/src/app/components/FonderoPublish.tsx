import { useState } from "react";
import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, Plus, Eye, Minus, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import {
  MENU_SECTIONS,
  MenuItem,
  MenuOfDay,
  MenuSection,
  TODAY_DRAFT,
} from "../data/menu";
import { MenuPosterOverlay } from "./MenuPoster";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

// Opciones de sección: "Sin sección" (undefined) + lista cerrada curada.
const SECTION_OPTIONS: (MenuSection | undefined)[] = [undefined, ...MENU_SECTIONS];

function nextSection(cur?: MenuSection): MenuSection | undefined {
  const i = SECTION_OPTIONS.indexOf(cur);
  return SECTION_OPTIONS[(i + 1) % SECTION_OPTIONS.length];
}

let idCounter = 100;
const newId = () => `i${idCounter++}`;

export function FonderoPublish() {
  // Precio del día: puede dejarse vacío (undefined) si el lugar es solo a la carta.
  const [dayPrice, setDayPrice] = useState<number | undefined>(TODAY_DRAFT.dayPrice);
  const [items, setItems] = useState<MenuItem[]>(() =>
    TODAY_DRAFT.items.map((it) => ({ ...it })),
  );
  const [preview, setPreview] = useState(false);

  const menu: MenuOfDay = {
    businessName: "Fonda Lupita",
    businessType: "Comida corrida",
    area: "Roma Norte",
    dateLabel: TODAY_DRAFT.dateLabel,
    closingLabel: "cierra 17:30",
    dayPrice,
    items,
  };

  function updateItem(id: string, patch: Partial<MenuItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }
  function addItem() {
    setItems((prev) => [...prev, { id: newId(), name: "" }]);
  }

  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark={true} />

      {/* Top bar */}
      <div
        className="absolute flex items-center justify-between"
        style={{ top: 58, left: 16, right: 16, zIndex: 20 }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(20px)",
          }}
        >
          <ChevronLeft size={20} color="#fff" strokeWidth={2.2} />
        </div>
        <button
          onClick={() => setPreview(true)}
          style={{
            padding: "6px 12px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: SF_TEXT,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Eye size={12} strokeWidth={2.2} />
          Vista previa
        </button>
      </div>

      <div
        className="absolute"
        style={{
          top: 116,
          left: 0,
          right: 0,
          bottom: 96,
          padding: "0 22px",
          overflowY: "auto",
        }}
      >
        {/* Header editorial */}
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 8,
          }}
        >
          {menu.dateLabel}
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 0.98,
            color: "#F8F8F5",
            marginBottom: 6,
          }}
        >
          Menú de hoy
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "rgba(248,248,245,0.55)",
            marginBottom: 20,
          }}
        >
          30 segundos. Tú lo escribes, quien anda cerca lo ve.
        </div>

        {/* Precio del día — opcional. Vacío = el lugar es solo a la carta. */}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: SF_TEXT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(248,248,245,0.5)",
                marginBottom: 2,
              }}
            >
              Precio del día
            </div>
            {typeof dayPrice === "number" ? (
              <div
                style={{
                  fontFamily: SF_DISPLAY,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#F8F8F5",
                  lineHeight: 1,
                }}
              >
                ${dayPrice}
                <span style={{ fontSize: 16, color: "rgba(248,248,245,0.4)", fontWeight: 500 }}>
                  {" "}
                  MXN
                </span>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: 15,
                  color: "rgba(248,248,245,0.4)",
                  lineHeight: 1.2,
                }}
              >
                Sin precio fijo · solo a la carta
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CircleBtn
              onClick={() =>
                setDayPrice((p) =>
                  typeof p === "number" ? (p - 5 < 5 ? undefined : p - 5) : undefined,
                )
              }
            >
              <Minus size={16} color="rgba(248,248,245,0.9)" strokeWidth={2.4} />
            </CircleBtn>
            <CircleBtn accent onClick={() => setDayPrice((p) => (typeof p === "number" ? p + 5 : 50))}>
              <Plus size={16} color="#fff" strokeWidth={2.4} />
            </CircleBtn>
          </div>
        </div>

        {/* Lista de platillos. El precio por platillo siempre está disponible:
            déjalo vacío si entra en el menú del día, o ponle precio si es extra/a la carta. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {items.map((it) => (
            <ItemEditorRow
              key={it.id}
              item={it}
              showPrice={true}
              onName={(name) => updateItem(it.id, { name })}
              onCycleSection={() =>
                updateItem(it.id, { section: nextSection(it.section) })
              }
              onPrice={(price) => updateItem(it.id, { price })}
              onRemove={() => removeItem(it.id)}
            />
          ))}
        </div>

        {/* Añadir platillo */}
        <button
          onClick={addItem}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 16,
            background: "transparent",
            border: "1.5px dashed rgba(255,255,255,0.16)",
            color: "rgba(248,248,245,0.7)",
            fontFamily: SF_TEXT,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Plus size={16} strokeWidth={2.4} />
          Añadir platillo
        </button>
      </div>

      {/* CTA */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          padding: "16px 22px 32px",
          background:
            "linear-gradient(180deg, rgba(17,18,20,0) 0%, rgba(17,18,20,0.95) 35%, #111214 100%)",
        }}
      >
        <button
          style={{
            width: "100%",
            height: 56,
            borderRadius: 18,
            background: "#FF6A3D",
            color: "#fff",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 10px 30px -10px rgba(255,106,61,0.5)",
          }}
        >
          Publicar menú · Visible ya
        </button>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11.5,
            color: "rgba(248,248,245,0.4)",
            textAlign: "center",
            marginTop: 10,
            letterSpacing: "-0.005em",
          }}
        >
          Se oculta automáticamente a las 17:30
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <MenuPosterOverlay menu={menu} onClose={() => setPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CircleBtn({
  children,
  accent,
  onClick,
}: {
  children: React.ReactNode;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        background: accent ? "#FF6A3D" : "rgba(255,255,255,0.08)",
        border: accent ? "none" : "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function ItemEditorRow({
  item,
  showPrice,
  onName,
  onCycleSection,
  onPrice,
  onRemove,
}: {
  item: MenuItem;
  showPrice: boolean;
  onName: (v: string) => void;
  onCycleSection: () => void;
  onPrice: (v: number | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-10" style={{ gap: 10 }}>
        <input
          value={item.name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Nombre del platillo"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "#F8F8F5",
            letterSpacing: "-0.01em",
          }}
        />
        <button
          onClick={onRemove}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={12} color="rgba(248,248,245,0.5)" strokeWidth={2.4} />
        </button>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <button
          onClick={onCycleSection}
          style={{
            padding: "5px 11px",
            borderRadius: 999,
            background: item.section ? "rgba(255,106,61,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${
              item.section ? "rgba(255,106,61,0.35)" : "rgba(255,255,255,0.12)"
            }`,
            fontFamily: SF_TEXT,
            fontSize: 12,
            fontWeight: 600,
            color: item.section ? "#FF6A3D" : "rgba(248,248,245,0.5)",
            letterSpacing: "-0.005em",
          }}
        >
          {item.section ?? "Sin sección"}
        </button>

        {showPrice && (
          <div
            className="flex items-center"
            style={{
              padding: "4px 10px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              gap: 2,
            }}
          >
            <span style={{ fontFamily: SF_TEXT, fontSize: 14, color: "rgba(248,248,245,0.5)" }}>
              $
            </span>
            <input
              value={item.price ?? ""}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                onPrice(Number.isNaN(n) ? undefined : n);
              }}
              inputMode="numeric"
              placeholder="0"
              style={{
                width: 44,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: SF_TEXT,
                fontSize: 14,
                fontWeight: 600,
                color: "#F8F8F5",
                textAlign: "right",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
