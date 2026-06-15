import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, TrendingUp, Eye, RotateCcw, Plus } from "lucide-react";
import { TabBar } from "./TabBar";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FonderoHistory() {
  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark />

      {/* Top */}
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
          }}
        >
          <ChevronLeft size={20} color="#fff" strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(248,248,245,0.9)",
            letterSpacing: "-0.01em",
          }}
        >
          Tu fonda
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div className="absolute" style={{ top: 116, left: 22, right: 22, bottom: 110, overflow: "hidden" }}>
        {/* Big number */}
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 6,
          }}
        >
          Esta semana
        </div>
        <div className="flex items-baseline gap-3 mb-1">
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              color: "#F8F8F5",
            }}
          >
            312
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 13,
              fontWeight: 600,
              color: "#1F9D55",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <TrendingUp size={12} strokeWidth={2.4} />
            +18%
          </div>
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "rgba(248,248,245,0.55)",
            marginBottom: 24,
            letterSpacing: "-0.005em",
          }}
        >
          foodies vieron tu menú
        </div>

        {/* Mini chart */}
        <div
          style={{
            padding: "18px 16px 14px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 22,
          }}
        >
          <div className="flex items-end justify-between" style={{ height: 60, gap: 6 }}>
            {[34, 52, 28, 71, 65, 48, 14].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{
                    width: "100%",
                    height: `${v}%`,
                    background:
                      i === 3
                        ? "linear-gradient(180deg, #FF6A3D 0%, #C04020 100%)"
                        : "rgba(248,248,245,0.15)",
                    borderRadius: 6,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div
                key={i}
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: 10.5,
                  fontWeight: i === 3 ? 700 : 500,
                  color: i === 3 ? "#FF6A3D" : "rgba(248,248,245,0.4)",
                  letterSpacing: "0.05em",
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(248,248,245,0.5)",
            marginBottom: 12,
          }}
        >
          Menús pasados
        </div>

        <PastMenu
          day="Ayer · Lun"
          dish="Mole verde · Milanesa"
          views={71}
          price="$60"
        />
        <PastMenu
          day="Vie pasado"
          dish="Pancita · Chiles rellenos"
          views={65}
          price="$60"
        />
        <PastMenu
          day="Jue pasado"
          dish="Tinga · Bistec"
          views={48}
          price="$55"
        />
      </div>

      {/* CTA repetir */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 96,
          padding: "16px 22px 0",
          background:
            "linear-gradient(180deg, rgba(17,18,20,0) 0%, #111214 50%)",
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
          <Plus size={16} strokeWidth={2.4} />
          Publicar menú de hoy
        </button>
      </div>

      <TabBar variant="fondero" active="history" />
    </div>
  );
}

function PastMenu({
  day,
  dish,
  views,
  price,
}: {
  day: string;
  dish: string;
  views: number;
  price: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(248,248,245,0.4)",
            marginBottom: 3,
          }}
        >
          {day} · {price}
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "#F8F8F5",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {dish}
        </div>
      </div>
      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
        <Eye size={11} color="rgba(248,248,245,0.4)" strokeWidth={2.2} />
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(248,248,245,0.6)",
          }}
        >
          {views}
        </span>
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "rgba(255,106,61,0.12)",
          border: "1px solid rgba(255,106,61,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <RotateCcw size={13} color="#FF6A3D" strokeWidth={2.2} />
      </div>
    </div>
  );
}
