import { StatusBar } from "./PhoneFrame";
import { Moon, Bell, MapPin } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieEmpty() {
  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark />
      {/* botanical backdrop */}
      <RandomImage
        rotate
        intervalMs={8000}
        objectPosition="center 20%"
        style={{ opacity: 0.45 }}
        overlay="linear-gradient(180deg, rgba(17,18,20,0.4) 0%, rgba(17,18,20,0.7) 60%, rgba(17,18,20,0.95) 100%)"
      />
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -50,
          right: -50,
          height: 500,
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,106,61,0.18) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* dim map */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        style={{ position: "absolute", inset: 0, opacity: 0.15 }}
      >
        <g stroke="#F8F8F5" strokeWidth="14">
          <line x1="-20" y1="380" x2="410" y2="360" />
          <line x1="240" y1="-20" x2="260" y2="860" />
        </g>
        <g stroke="#F8F8F5" strokeWidth="6">
          <line x1="-20" y1="470" x2="410" y2="460" />
          <line x1="160" y1="-20" x2="150" y2="860" />
        </g>
      </svg>

      <div
        className="absolute flex flex-col items-center text-center"
        style={{ left: 32, right: 32, top: 230 }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
            backdropFilter: "blur(20px)",
          }}
        >
          <Moon size={28} color="#FF6A3D" strokeWidth={1.8} />
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 10,
          }}
        >
          18:42 · Las fonditas descansan
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "#F8F8F5",
            marginBottom: 12,
          }}
        >
          Hoy ya no hay comida corrida
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "rgba(248,248,245,0.55)",
            lineHeight: 1.45,
            maxWidth: 280,
            letterSpacing: "-0.005em",
          }}
        >
          La mayoría cierran a las 17:30. Vuelve mañana entre 13 y 16 hrs para ver
          los menús del día.
        </div>
      </div>

      <div
        className="absolute"
        style={{ left: 20, right: 20, bottom: 36, display: "flex", flexDirection: "column", gap: 10 }}
      >
        <button
          style={{
            height: 54,
            borderRadius: 18,
            background: "#FF6A3D",
            color: "#fff",
            fontFamily: SF_TEXT,
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Bell size={15} strokeWidth={2.2} />
          Avísame mañana a las 13:00
        </button>
        <button
          style={{
            height: 54,
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            color: "#F8F8F5",
            fontFamily: SF_TEXT,
            fontSize: 15,
            fontWeight: 500,
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <MapPin size={15} strokeWidth={2.2} />
          Ver mercados abiertos en la noche
        </button>
      </div>
    </div>
  );
}
