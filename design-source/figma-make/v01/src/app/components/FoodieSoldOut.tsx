import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, Bookmark, Bell, MapPin, Clock } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieSoldOut() {
  return (
    <div className="absolute inset-0" style={{ background: "#F8F8F5" }}>
      <StatusBar dark />

      {/* hero muted */}
      <div
        style={{
          height: 280,
          background: "#111214",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <RandomImage
          rotate
          intervalMs={7000}
          desaturate
          overlay="linear-gradient(180deg, rgba(17,18,20,0.3) 0%, rgba(17,18,20,0.1) 50%, rgba(17,18,20,0.4) 100%)"
        />
        {/* "Se acabó" diagonal banner */}
        <div
          style={{
            position: "absolute",
            top: 132,
            left: 0,
            right: 0,
            padding: "10px 0",
            background: "rgba(17,18,20,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
            fontFamily: SF_TEXT,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Se acabó · 15:42
        </div>

        <div
          className="absolute flex items-center justify-between"
          style={{ top: 58, left: 16, right: 16 }}
        >
          <GlassIcon><ChevronLeft size={20} color="#111214" strokeWidth={2.2} /></GlassIcon>
          <GlassIcon><Bookmark size={17} color="#111214" strokeWidth={2.2} /></GlassIcon>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 256,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#F8F8F5",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "22px 20px 0",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#8A8A85",
            }}
          />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 600,
              color: "#8A8A85",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Sin existencia · vuelve mañana
          </span>
        </div>

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
            marginBottom: 22,
          }}
        >
          Comida corrida · Roma Norte
        </div>

        {/* Faded menu */}
        <div
          style={{
            padding: "18px 18px 16px",
            borderRadius: 18,
            background: "#FFFFFF",
            border: "1px solid rgba(17,18,20,0.06)",
            position: "relative",
            overflow: "hidden",
            marginBottom: 22,
          }}
        >
          <div style={{ opacity: 0.42 }}>
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
                Lo que había hoy
              </span>
              <span
                style={{
                  fontFamily: SF_DISPLAY,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#111214",
                  textDecoration: "line-through",
                }}
              >
                $55
              </span>
            </div>
            <Row label="Entrada" value="Sopa de fideo" />
            <Row label="Guisado" value="Tinga · Bistec a la mexicana" />
            <Row label="Postre" value="Gelatina de mosaico" last />
          </div>

          <div
            style={{
              position: "absolute",
              right: 14,
              bottom: 14,
              padding: "5px 10px",
              borderRadius: 10,
              background: "#111214",
              color: "#F8F8F5",
              fontFamily: SF_TEXT,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Agotado
          </div>
        </div>

        {/* Mañana */}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 18,
            background: "#FBE7DD",
            border: "1px solid rgba(242,97,47,0.2)",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#F2612F",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Clock size={11} strokeWidth={2.4} />
            Mañana abre a las 13:00
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 14,
              color: "#111214",
              letterSpacing: "-0.01em",
              lineHeight: 1.45,
            }}
          >
            Los miércoles suele haber <b>mole verde</b> y <b>milanesa</b>.
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 20px 32px",
          display: "flex",
          gap: 8,
          background:
            "linear-gradient(180deg, rgba(248,248,245,0) 0%, #F8F8F5 35%)",
        }}
      >
        <button
          style={{
            flex: 1,
            height: 54,
            borderRadius: 18,
            background: "#111214",
            color: "#F8F8F5",
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
          Avísame mañana
        </button>
        <button
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            background: "rgba(17,18,20,0.06)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={18} color="#111214" strokeWidth={2.2} />
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

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
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
