import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, Bookmark, Share, Clock, MapPin, Phone, Star } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieDetailDark() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#111214" }}>
      <StatusBar dark />

      {/* Hero image */}
      <div
        style={{
          height: 320,
          background: "#0a0b0d",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <RandomImage
          rotate
          intervalMs={6000}
          seed={3}
          objectPosition="center 30%"
          overlay="linear-gradient(180deg, rgba(17,18,20,0.35) 0%, rgba(17,18,20,0.15) 35%, rgba(17,18,20,0.85) 85%, #111214 100%), linear-gradient(135deg, rgba(255,106,61,0.22) 0%, transparent 55%)"
        />
        {/* Floating nav */}
        <div
          className="absolute flex items-center justify-between"
          style={{ top: 58, left: 16, right: 16, zIndex: 20 }}
        >
          <GlassIcon><ChevronLeft size={20} color="#F8F8F5" strokeWidth={2.2} /></GlassIcon>
          <div className="flex gap-2">
            <GlassIcon><Share size={17} color="#F8F8F5" strokeWidth={2.2} /></GlassIcon>
            <GlassIcon><Bookmark size={17} color="#F8F8F5" strokeWidth={2.2} /></GlassIcon>
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
          background: "#111214",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "22px 20px 0",
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#3DDC97",
              boxShadow: "0 0 0 3px rgba(61,220,151,0.2)",
            }}
          />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 600,
              color: "#3DDC97",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Abierto · cierra 23:00
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
            color: "#F8F8F5",
            marginBottom: 6,
          }}
        >
          Taquería El Patio
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "rgba(248,248,245,0.55)",
            marginBottom: 16,
          }}
        >
          Tacos al pastor · Roma Sur
        </div>

        {/* Meta row */}
        <div
          className="flex items-center gap-4 mb-5"
          style={{
            paddingBottom: 18,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Meta icon={<Star size={13} color="#FF6A3D" fill="#FF6A3D" strokeWidth={0} />} primary="4.9" secondary="218 reseñas" />
          <Divider />
          <Meta icon={<MapPin size={13} color="rgba(248,248,245,0.5)" strokeWidth={2.2} />} primary="320 m" secondary="4 min" />
          <Divider />
          <Meta icon={<Clock size={13} color="rgba(248,248,245,0.5)" strokeWidth={2.2} />} primary="19–23h" secondary="Mar–Dom" />
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
              color: "rgba(248,248,245,0.55)",
            }}
          >
            En la parrilla · Esta noche
          </span>
          <span
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#FF6A3D",
            }}
          >
            $18 c/u
          </span>
        </div>

        <MenuSection label="Al pastor" items={["Trompo recién cortado · piña"]} />
        <MenuSection
          label="De res"
          items={["Suadero", "Bistec", "Tripa dorada"]}
          choice
        />
        <MenuSection label="Para acompañar" items={["Cebollitas asadas · limones · salsas"]} />
        <MenuSection label="Para cerrar" items={["Agua de jamaica del día"]} last />
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
            "linear-gradient(180deg, rgba(17,18,20,0) 0%, rgba(17,18,20,0.95) 30%, #111214 100%)",
        }}
      >
        <button
          style={{
            width: "100%",
            height: 54,
            borderRadius: 18,
            background: "#FF6A3D",
            color: "#111214",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 12px 28px -10px rgba(255,106,61,0.5)",
          }}
        >
          <Phone size={16} strokeWidth={2.4} />
          Cómo llegar · 4 min
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
        background: "rgba(28,29,33,0.6)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px -6px rgba(0,0,0,0.5)",
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
        <span style={{ fontFamily: SF_TEXT, fontSize: 14, fontWeight: 700, color: "#F8F8F5", letterSpacing: "-0.01em" }}>
          {primary}
        </span>
      </div>
      <span style={{ fontFamily: SF_TEXT, fontSize: 11, color: "rgba(248,248,245,0.45)", marginTop: 1 }}>
        {secondary}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />;
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
        borderBottom: last ? "none" : "1px dashed rgba(255,255,255,0.1)",
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
            color: "rgba(248,248,245,0.5)",
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
              background: "rgba(255,106,61,0.18)",
              color: "#FF6A3D",
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
            color: "#F8F8F5",
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
