import { MapPin, Clock } from "lucide-react";
import { PatioMark } from "./PatioMark";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function IOSWidgets() {
  return (
    <div style={{ maxWidth: 1400, margin: "120px auto 0" }}>
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#F2612F",
            marginBottom: 12,
          }}
        >
          iOS · Widgets
        </div>
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#111214",
            marginBottom: 14,
          }}
        >
          El menú, sin abrir la app.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#4A4A47",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          Tres tamaños para Home Screen y Lock Screen. La pregunta — ¿qué hay
          hoy? — siempre a un vistazo.
        </p>
      </div>

      {/* Wallpaper canvas */}
      <div
        style={{
          borderRadius: 36,
          overflow: "hidden",
          padding: "72px 56px",
          background:
            "linear-gradient(160deg, #2a1f1d 0%, #1a1416 50%, #0f0c0d 100%)",
          display: "grid",
          gridTemplateColumns: "auto auto",
          gridTemplateRows: "auto auto",
          gap: 24,
          justifyContent: "center",
          alignItems: "start",
          border: "1px solid rgba(17,18,20,0.08)",
        }}
      >
        {/* Small widget */}
        <SmallWidget />
        {/* Medium widget */}
        <MediumWidget />
        {/* Lock screen circular + rectangular */}
        <div className="flex gap-3 items-center" style={{ gridColumn: "1 / -1", justifyContent: "center", marginTop: 8 }}>
          <LockCircular />
          <LockRectangular />
          <LockInline />
        </div>
      </div>

      {/* Specs row */}
      <div
        style={{
          marginTop: 28,
          padding: "22px 28px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
        }}
      >
        <Spec label="Small" value="158 × 158" sub="Home" />
        <Spec label="Medium" value="338 × 158" sub="Home" />
        <Spec label="Circular" value="76 × 76" sub="Lock" />
        <Spec label="Rectangular" value="172 × 76" sub="Lock" />
      </div>
    </div>
  );
}

function SmallWidget() {
  return (
    <div
      style={{
        width: 158,
        height: 158,
        borderRadius: 22,
        background: "#F8F8F5",
        padding: 14,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 16px 32px -10px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <PatioMark size={14} tone="ink" />
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#F2612F",
          }}
        >
          Hoy
        </span>
      </div>
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#111214",
          lineHeight: 1.05,
          marginBottom: 6,
        }}
      >
        Fonda Lupita
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 10.5,
          color: "#4A4A47",
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        Tinga · Chiles rellenos · Arroz rojo
      </div>
      <div
        className="absolute flex items-center gap-1"
        style={{ bottom: 14, left: 14 }}
      >
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "#F2612F",
            lineHeight: 1,
          }}
        >
          $55
        </div>
      </div>
      <div
        className="absolute flex items-center gap-0.5"
        style={{
          bottom: 16,
          right: 14,
          fontFamily: SF_TEXT,
          fontSize: 10,
          color: "#8A8A85",
        }}
      >
        <MapPin size={9} strokeWidth={2.2} />
        420 m
      </div>
    </div>
  );
}

function MediumWidget() {
  return (
    <div
      style={{
        width: 338,
        height: 158,
        borderRadius: 22,
        background: "#F8F8F5",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        boxShadow: "0 16px 32px -10px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ padding: 14, position: "relative" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <PatioMark size={14} tone="ink" />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#F2612F",
            }}
          >
            Cerca de ti · Hoy
          </span>
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "#111214",
            lineHeight: 1.05,
            marginBottom: 4,
          }}
        >
          Fonda Lupita
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 10.5,
            color: "#4A4A47",
            lineHeight: 1.35,
            marginBottom: 10,
          }}
        >
          Sopa de fideo · Tinga · Bistec a la mexicana · Gelatina
        </div>
        <div className="flex items-end gap-2.5" style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#F2612F",
              lineHeight: 1,
            }}
          >
            $55
          </div>
          <div className="flex-1" />
          <div
            className="flex items-center gap-0.5"
            style={{
              fontFamily: SF_TEXT,
              fontSize: 10,
              color: "#8A8A85",
            }}
          >
            <Clock size={9} strokeWidth={2.2} />
            cierra 17:30
          </div>
        </div>
      </div>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <RandomImage seed={2} objectPosition="center" overlay="linear-gradient(270deg, rgba(248,248,245,0) 60%, #F8F8F5 100%)" />
      </div>
    </div>
  );
}

function LockCircular() {
  return (
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 38,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <PatioMark size={16} monochrome tone="light" />
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#fff",
          lineHeight: 1,
        }}
      >
        $55
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 7.5,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        hoy
      </div>
    </div>
  );
}

function LockRectangular() {
  return (
    <div
      style={{
        width: 172,
        height: 76,
        borderRadius: 18,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.2)",
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="flex items-center gap-1 mb-1">
        <PatioMark size={9} monochrome tone="light" />
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Patio · hoy
        </span>
      </div>
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#fff",
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        Fonda Lupita · $55
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 9.5,
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.25,
        }}
      >
        Tinga · Chiles rellenos · 420 m
      </div>
    </div>
  );
}

function LockInline() {
  return (
    <div
      className="flex items-center gap-1.5"
      style={{
        height: 28,
        padding: "0 12px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <PatioMark size={11} monochrome tone="light" />
      <span
        style={{
          fontFamily: SF_TEXT,
          fontSize: 11,
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "-0.005em",
        }}
      >
        Lupita · $55 · 420 m
      </span>
    </div>
  );
}

function Spec({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#8A8A85",
          marginBottom: 4,
        }}
      >
        {label} · {sub}
      </div>
      <div
        style={{
          fontFamily: "'SF Mono', monospace",
          fontSize: 14,
          color: "#111214",
          letterSpacing: "-0.005em",
        }}
      >
        {value}
      </div>
    </div>
  );
}
