import { StatusBar } from "./PhoneFrame";
import { Search, SlidersHorizontal, Navigation, Bookmark } from "lucide-react";
import { motion } from "motion/react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieMapDark() {
  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark />
      {/* Map background */}
      <div className="absolute inset-0" style={mapStyle}>
        <MapSVG />
        {/* Pins */}
        <Pin x={120} y={300} label="$18" active />
        <Pin x={245} y={250} label="$22" />
        <Pin x={180} y={400} label="$15" />
        <Pin x={300} y={380} label="$25" />
        <Pin x={90} y={460} label="$20" />
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
          background: "rgba(28,29,33,0.72)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={18} color="rgba(248,248,245,0.6)" strokeWidth={2} />
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "rgba(248,248,245,0.6)",
            flex: 1,
          }}
        >
          ¿Qué hay esta noche?
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SlidersHorizontal size={15} color="#F8F8F5" strokeWidth={2.2} />
        </div>
      </div>

      {/* Chip filters */}
      <div
        className="absolute z-30 flex gap-2 overflow-hidden"
        style={{ top: 122, left: 16, right: 16 }}
      >
        {[
          { label: "Abierto ahora", active: true },
          { label: "Cenas", active: false },
          { label: "Tacos", active: false },
          { label: "≤ $100", active: false },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              padding: "7px 13px",
              borderRadius: 14,
              fontFamily: SF_TEXT,
              fontSize: 13,
              fontWeight: 500,
              background: c.active ? "#FF6A3D" : "rgba(28,29,33,0.72)",
              color: c.active ? "#111214" : "#F8F8F5",
              border: c.active ? "none" : "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 4px 12px -4px rgba(0,0,0,0.4)",
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
          background: "rgba(28,29,33,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 6px 16px -6px rgba(0,0,0,0.5)",
        }}
      >
        <Navigation size={18} color="#FF6A3D" strokeWidth={2.2} fill="#FF6A3D" />
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
          background: "rgba(20,21,24,0.92)",
          backdropFilter: "blur(30px) saturate(160%)",
          WebkitBackdropFilter: "blur(30px) saturate(160%)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -10px 40px -10px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 5,
            borderRadius: 3,
            background: "rgba(248,248,245,0.15)",
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
                color: "#FF6A3D",
              }}
            >
              Esta noche · En la parrilla
            </span>
            <span style={{ color: "rgba(248,248,245,0.2)" }}>·</span>
            <span
              style={{
                fontFamily: SF_TEXT,
                fontSize: 12,
                color: "rgba(248,248,245,0.5)",
              }}
            >
              320 m
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
                color: "#F8F8F5",
              }}
            >
              Taquería El Patio
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              <Bookmark size={16} color="#F8F8F5" strokeWidth={2} />
            </div>
          </div>

          {/* Menú — ficha editorial */}
          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
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
                  color: "rgba(248,248,245,0.55)",
                }}
              >
                Hoy en la parrilla
              </span>
              <span
                style={{
                  fontFamily: SF_DISPLAY,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#FF6A3D",
                }}
              >
                $18 c/u
              </span>
            </div>
            <MenuRow label="Al pastor" value="Trompo recién cortado · piña" />
            <MenuRow label="De res" value="Suadero · Bistec · Tripa dorada" />
            <MenuRow label="Salsas" value="Verde · Roja · Habanero" />
            <MenuRow label="Para cerrar" value="Agua de jamaica" last />
          </div>

          <div className="flex gap-2 mt-3" style={{ marginBottom: 24 }}>
            <button
              style={{
                flex: 1,
                height: 48,
                borderRadius: 16,
                background: "#FF6A3D",
                color: "#111214",
                fontFamily: SF_TEXT,
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                letterSpacing: "-0.01em",
                boxShadow: "0 8px 20px -6px rgba(255,106,61,0.5)",
              }}
            >
              Cómo llegar
            </button>
            <button
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                color: "#F8F8F5",
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
        borderBottom: last ? "none" : "1px dashed rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          fontFamily: SF_TEXT,
          fontSize: 12,
          color: "rgba(248,248,245,0.5)",
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
          color: "#F8F8F5",
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
          background: active ? "#FF6A3D" : "rgba(28,29,33,0.92)",
          color: active ? "#111214" : "#F8F8F5",
          fontFamily: SF_TEXT,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: active
            ? "0 8px 20px -4px rgba(255,106,61,0.5)"
            : "0 6px 14px -4px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </motion.div>
      <div
        style={{
          width: 8,
          height: 8,
          background: active ? "#FF6A3D" : "rgba(28,29,33,0.92)",
          border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%",
          margin: "3px auto 0",
          boxShadow: active
            ? "0 2px 8px rgba(255,106,61,0.6)"
            : "0 2px 6px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

const mapStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #15171b 0%, #191c21 40%, #1f2228 100%)",
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
      <g stroke="#0a0b0d" strokeWidth="14" opacity="0.9">
        <line x1="-20" y1="200" x2="410" y2="220" />
        <line x1="-20" y1="380" x2="410" y2="360" />
        <line x1="-20" y1="560" x2="410" y2="580" />
        <line x1="80" y1="-20" x2="60" y2="860" />
        <line x1="240" y1="-20" x2="260" y2="860" />
      </g>
      <g stroke="#0a0b0d" strokeWidth="6" opacity="0.7">
        <line x1="-20" y1="290" x2="410" y2="300" />
        <line x1="-20" y1="470" x2="410" y2="460" />
        <line x1="160" y1="-20" x2="150" y2="860" />
        <line x1="330" y1="-20" x2="340" y2="860" />
      </g>
      {/* Parks darker */}
      <rect x="100" y="500" width="120" height="80" rx="8" fill="#1a2218" opacity="0.8" />
      <rect x="270" y="600" width="80" height="100" rx="8" fill="#1a2218" opacity="0.8" />
      {/* Warm glow points — open fonditas */}
      <g>
        <circle cx="120" cy="300" r="40" fill="#FF6A3D" opacity="0.1" />
        <circle cx="245" cy="250" r="30" fill="#FF6A3D" opacity="0.08" />
        <circle cx="180" cy="400" r="30" fill="#FF6A3D" opacity="0.08" />
        <circle cx="300" cy="380" r="30" fill="#FF6A3D" opacity="0.08" />
        <circle cx="90" cy="460" r="30" fill="#FF6A3D" opacity="0.08" />
      </g>
      {/* Building blocks subtle */}
      <g fill="#22262d" opacity="0.6">
        <rect x="90" y="220" width="60" height="55" rx="3" />
        <rect x="170" y="220" width="60" height="55" rx="3" />
        <rect x="270" y="220" width="50" height="55" rx="3" />
        <rect x="90" y="400" width="55" height="50" rx="3" />
        <rect x="270" y="400" width="55" height="50" rx="3" />
      </g>
    </svg>
  );
}
