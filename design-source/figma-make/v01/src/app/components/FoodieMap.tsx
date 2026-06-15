import { StatusBar } from "./PhoneFrame";
import { Search, SlidersHorizontal, Navigation, Bookmark } from "lucide-react";
import { motion } from "motion/react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieMap() {
  return (
    <div className="absolute inset-0">
      <StatusBar dark />
      {/* Map background */}
      <div className="absolute inset-0" style={mapStyle}>
        <MapSVG />
        {/* Pins */}
        <Pin x={120} y={300} label="$55" active />
        <Pin x={245} y={250} label="$70" />
        <Pin x={180} y={400} label="$48" />
        <Pin x={300} y={380} label="$60" />
        <Pin x={90} y={460} label="$52" />
      </div>

      {/* Top glass search bar */}
      <div
        className="absolute z-30"
        style={{
          top: 62,
          left: 16,
          right: 16,
          padding: "12px 14px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 8px 24px -8px rgba(17,18,20,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={18} color="#4A4A47" strokeWidth={2} />
        <span style={{ fontFamily: SF_TEXT, fontSize: 15, color: "#4A4A47", flex: 1 }}>
          ¿Qué hay hoy cerca?
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: "rgba(17,18,20,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SlidersHorizontal size={15} color="#111214" strokeWidth={2.2} />
        </div>
      </div>

      {/* Chip filters */}
      <div
        className="absolute z-30 flex gap-2 overflow-hidden"
        style={{ top: 122, left: 16, right: 16 }}
      >
        {[
          { label: "Abierto ahora", active: true },
          { label: "≤ $80", active: false },
          { label: "Caldos", active: false },
          { label: "Veggie", active: false },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              padding: "7px 13px",
              borderRadius: 14,
              fontFamily: SF_TEXT,
              fontSize: 13,
              fontWeight: 500,
              background: c.active ? "#111214" : "rgba(255,255,255,0.78)",
              color: c.active ? "#F8F8F5" : "#111214",
              border: c.active ? "none" : "1px solid rgba(255,255,255,0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 4px 12px -4px rgba(17,18,20,0.1)",
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Locate button */}
      <div
        className="absolute z-30 flex items-center justify-center"
        style={{
          right: 16,
          top: 180,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 6px 16px -6px rgba(17,18,20,0.15)",
        }}
      >
        <Navigation size={18} color="#F2612F" strokeWidth={2.2} fill="#F2612F" />
      </div>

      {/* Bottom sheet — fonda card */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.15 }}
        className="absolute z-30"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 8,
          background: "rgba(248,248,245,0.92)",
          backdropFilter: "blur(30px) saturate(160%)",
          WebkitBackdropFilter: "blur(30px) saturate(160%)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 -10px 40px -10px rgba(17,18,20,0.12)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 5,
            borderRadius: 3,
            background: "rgba(17,18,20,0.15)",
            margin: "0 auto 14px",
          }}
        />
        <div style={{ padding: "0 18px 14px" }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              style={{
                fontFamily: SF_TEXT,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#F2612F",
              }}
            >
              Hoy · Comida corrida
            </span>
            <span style={{ color: "rgba(17,18,20,0.2)" }}>·</span>
            <span
              style={{
                fontFamily: SF_TEXT,
                fontSize: 12,
                color: "#8A8A85",
              }}
            >
              420 m
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              style={{
                fontFamily: SF_DISPLAY,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#111214",
              }}
            >
              Fonda Lupita
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(17,18,20,0.05)",
                flexShrink: 0,
              }}
            >
              <Bookmark size={16} color="#111214" strokeWidth={2} />
            </div>
          </div>

          {/* Menú del día — ficha editorial */}
          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              background: "#FFFFFF",
              border: "1px solid rgba(17,18,20,0.06)",
            }}
          >
            <div className="flex items-baseline justify-between mb-2.5">
              <span
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#8A8A85",
                }}
              >
                Menú del día
              </span>
              <span
                style={{
                  fontFamily: SF_DISPLAY,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#111214",
                }}
              >
                $55
              </span>
            </div>
            <MenuRow label="Entrada" value="Sopa de fideo" />
            <MenuRow label="Guisado" value="Tinga de pollo · Bistec a la mexicana" />
            <MenuRow label="Acompañante" value="Arroz rojo · Frijoles refritos" />
            <MenuRow label="Postre" value="Gelatina de mosaico" last />
          </div>

          <div className="flex gap-2 mt-3" style={{ marginBottom: 24 }}>
            <button
              style={{
                flex: 1,
                height: 48,
                borderRadius: 16,
                background: "#F2612F",
                color: "#fff",
                fontFamily: SF_TEXT,
                fontSize: 15,
                fontWeight: 600,
                border: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Cómo llegar
            </button>
            <button
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: "rgba(17,18,20,0.06)",
                color: "#111214",
                fontFamily: SF_TEXT,
                fontSize: 18,
                border: "none",
              }}
            >
              ⌖
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MenuRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-baseline justify-between gap-3"
      style={{
        paddingBottom: last ? 0 : 8,
        marginBottom: last ? 0 : 8,
        borderBottom: last ? "none" : "1px dashed rgba(17,18,20,0.08)",
      }}
    >
      <span
        style={{
          fontFamily: SF_TEXT,
          fontSize: 12,
          color: "#8A8A85",
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: SF_TEXT,
          fontSize: 14,
          color: "#111214",
          textAlign: "right",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Pin({ x, y, label, active }: { x: number; y: number; label: string; active?: boolean }) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        zIndex: active ? 20 : 10,
      }}
    >
      <motion.div
        animate={active ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          padding: "6px 11px",
          borderRadius: 14,
          background: active ? "#111214" : "#FFFFFF",
          color: active ? "#fff" : "#111214",
          fontFamily: SF_TEXT,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          border: active ? "2px solid #F2612F" : "1px solid rgba(17,18,20,0.08)",
          boxShadow: "0 6px 14px -4px rgba(17,18,20,0.25)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </motion.div>
      <div
        style={{
          width: 8,
          height: 8,
          background: active ? "#F2612F" : "#FFFFFF",
          border: active ? "none" : "1px solid rgba(17,18,20,0.1)",
          borderRadius: "50%",
          margin: "3px auto 0",
          boxShadow: "0 2px 6px rgba(17,18,20,0.2)",
        }}
      />
    </div>
  );
}

const mapStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, #E8EBE3 0%, #DCE2D4 40%, #D2DACB 100%)",
};

function MapSVG() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 390 844"
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Streets */}
      <g stroke="#F8F8F5" strokeWidth="14" opacity="0.9">
        <line x1="-20" y1="200" x2="410" y2="220" />
        <line x1="-20" y1="380" x2="410" y2="360" />
        <line x1="-20" y1="560" x2="410" y2="580" />
        <line x1="80" y1="-20" x2="60" y2="860" />
        <line x1="240" y1="-20" x2="260" y2="860" />
      </g>
      <g stroke="#F8F8F5" strokeWidth="6" opacity="0.7">
        <line x1="-20" y1="290" x2="410" y2="300" />
        <line x1="-20" y1="470" x2="410" y2="460" />
        <line x1="160" y1="-20" x2="150" y2="860" />
        <line x1="330" y1="-20" x2="340" y2="860" />
      </g>
      {/* Parks */}
      <rect x="100" y="500" width="120" height="80" rx="8" fill="#C8D4B8" opacity="0.7" />
      <rect x="270" y="600" width="80" height="100" rx="8" fill="#C8D4B8" opacity="0.7" />
      {/* Building blocks subtle */}
      <g fill="#EFEFE9" opacity="0.5">
        <rect x="90" y="220" width="60" height="55" rx="3" />
        <rect x="170" y="220" width="60" height="55" rx="3" />
        <rect x="270" y="220" width="50" height="55" rx="3" />
        <rect x="90" y="400" width="55" height="50" rx="3" />
        <rect x="270" y="400" width="55" height="50" rx="3" />
      </g>
    </svg>
  );
}
