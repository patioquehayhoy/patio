import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, Bookmark, Share, Clock, MapPin, Phone, Star } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieDetail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#F8F8F5" }}>
      <StatusBar dark />

      {/* Hero image */}
      <div
        style={{
          height: 320,
          background: "#1a0a05",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <RandomImage
          rotate
          intervalMs={6000}
          objectPosition="center 30%"
          overlay="linear-gradient(180deg, rgba(17,18,20,0.15) 0%, rgba(17,18,20,0.05) 40%, rgba(248,248,245,0.4) 100%), linear-gradient(135deg, rgba(242,97,47,0.25) 0%, transparent 60%)"
        />
        {/* Floating nav */}
        <div
          className="absolute flex items-center justify-between"
          style={{ top: 58, left: 16, right: 16, zIndex: 20 }}
        >
          <GlassIcon><ChevronLeft size={20} color="#111214" strokeWidth={2.2} /></GlassIcon>
          <div className="flex gap-2">
            <GlassIcon><Share size={17} color="#111214" strokeWidth={2.2} /></GlassIcon>
            <GlassIcon><Bookmark size={17} color="#111214" strokeWidth={2.2} /></GlassIcon>
          </div>
        </div>
      </div>

      {/* Content card overlapping */}
      <div
        style={{
          position: "absolute",
          top: 290,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#F8F8F5",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "22px 20px 0",
          overflow: "hidden",
        }}
      >
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#1F9D55",
              boxShadow: "0 0 0 3px rgba(31,157,85,0.18)",
            }}
          />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 600,
              color: "#1F9D55",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Abierto · cierra 17:30
          </span>
        </div>

        {/* Title block */}
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "#111214",
            marginBottom: 6,
          }}
        >
          Fonda Lupita
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "#4A4A47",
            marginBottom: 16,
          }}
        >
          Comida corrida · Roma Norte
        </div>

        {/* Meta row */}
        <div
          className="flex items-center gap-4 mb-5"
          style={{
            paddingBottom: 18,
            borderBottom: "1px solid rgba(17,18,20,0.08)",
          }}
        >
          <Meta icon={<Star size={13} color="#F2612F" fill="#F2612F" strokeWidth={0} />} primary="4.8" secondary="142 reseñas" />
          <Divider />
          <Meta icon={<MapPin size={13} color="#8A8A85" strokeWidth={2.2} />} primary="420 m" secondary="5 min" />
          <Divider />
          <Meta icon={<Clock size={13} color="#8A8A85" strokeWidth={2.2} />} primary="13–17h" secondary="Lun–Vie" />
        </div>

        {/* Menú editorial */}
        <div className="flex items-baseline justify-between mb-3">
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8A8A85",
            }}
          >
            Menú del día · Hoy
          </span>
          <span
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#F2612F",
            }}
          >
            $55
          </span>
        </div>

        <MenuSection label="Entrada" items={["Sopa de fideo aguada"]} />
        <MenuSection
          label="Guisado"
          items={["Tinga de pollo", "Bistec a la mexicana", "Chiles rellenos de queso"]}
          choice
        />
        <MenuSection label="Acompañante" items={["Arroz rojo · Frijoles refritos · Tortillas"]} />
        <MenuSection label="Postre" items={["Gelatina de mosaico"]} last />
      </div>

      {/* Sticky CTA */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 20px 32px",
          background:
            "linear-gradient(180deg, rgba(248,248,245,0) 0%, rgba(248,248,245,0.95) 30%, #F8F8F5 100%)",
        }}
      >
        <button
          style={{
            width: "100%",
            height: 54,
            borderRadius: 18,
            background: "#111214",
            color: "#F8F8F5",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Phone size={16} strokeWidth={2.2} />
          Cómo llegar · 5 min
        </button>
      </div>
    </div>
  );
}

function GlassIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px -6px rgba(17,18,20,0.2)",
      }}
    >
      {children}
    </div>
  );
}

function Meta({ icon, primary, secondary }: { icon: React.ReactNode; primary: string; secondary: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        {icon}
        <span style={{ fontFamily: SF_TEXT, fontSize: 14, fontWeight: 700, color: "#111214", letterSpacing: "-0.01em" }}>
          {primary}
        </span>
      </div>
      <span style={{ fontFamily: SF_TEXT, fontSize: 11, color: "#8A8A85", marginTop: 1 }}>
        {secondary}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 24, background: "rgba(17,18,20,0.08)" }} />;
}

function MenuSection({
  label,
  items,
  choice,
  last,
}: {
  label: string;
  items: string[];
  choice?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        paddingBottom: last ? 0 : 12,
        marginBottom: last ? 0 : 12,
        borderBottom: last ? "none" : "1px dashed rgba(17,18,20,0.1)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#8A8A85",
          }}
        >
          {label}
        </span>
        {choice && (
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 9.5,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4,
              background: "#FBE7DD",
              color: "#F2612F",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Elige uno
          </span>
        )}
      </div>
      {items.map((it) => (
        <div
          key={it}
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "#111214",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
            marginBottom: items.length > 1 ? 2 : 0,
          }}
        >
          {it}
        </div>
      ))}
    </div>
  );
}
