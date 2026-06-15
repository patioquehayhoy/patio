import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, Check, Plus, Eye, Sparkles } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FonderoPublish() {
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
        <div
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
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: 116,
          left: 0,
          right: 0,
          bottom: 0,
          padding: "0 22px",
          overflow: "hidden",
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
          Martes · 7 de junio
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
            marginBottom: 22,
          }}
        >
          30 segundos. Tú lo escribes, los foodies lo ven.
        </div>

        {/* Price card */}
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
              Precio
            </div>
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
              $55
              <span style={{ fontSize: 16, color: "rgba(248,248,245,0.4)", fontWeight: 500 }}> MXN</span>
            </div>
          </div>
          <Stepper />
        </div>

        {/* Course inputs */}
        <CourseRow label="Entrada" value="Sopa de fideo" done />
        <CourseRow label="Guisado" value="Tinga · Bistec a la mexicana" done multi />
        <CourseRow label="Acompañante" value="Arroz · Frijoles · Tortillas" done />
        <CourseRow label="Postre" placeholder="Toca para añadir" />

        {/* Suggestion chip */}
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(255,106,61,0.08)",
            border: "1px solid rgba(255,106,61,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={14} color="#FF6A3D" strokeWidth={2.2} />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 13,
              color: "rgba(248,248,245,0.8)",
              flex: 1,
              letterSpacing: "-0.005em",
            }}
          >
            Como el martes pasado: <b style={{ color: "#FF6A3D" }}>gelatina de mosaico</b>
          </span>
        </div>
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
    </div>
  );
}

function Stepper() {
  return (
    <div className="flex items-center gap-2">
      <CircleBtn>−</CircleBtn>
      <CircleBtn accent>+</CircleBtn>
    </div>
  );
}

function CircleBtn({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        background: accent ? "#FF6A3D" : "rgba(255,255,255,0.08)",
        border: accent ? "none" : "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SF_TEXT,
        fontSize: 18,
        fontWeight: 500,
        color: accent ? "#fff" : "rgba(248,248,245,0.9)",
      }}
    >
      {children}
    </div>
  );
}

function CourseRow({
  label,
  value,
  placeholder,
  done,
  multi,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  done?: boolean;
  multi?: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        background: done ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${done ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)"}`,
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: done ? "#FF6A3D" : "transparent",
          border: done ? "none" : "1.5px dashed rgba(248,248,245,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {done ? <Check size={13} color="#fff" strokeWidth={3} /> : <Plus size={12} color="rgba(248,248,245,0.4)" strokeWidth={2.2} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(248,248,245,0.4)",
            marginBottom: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {label}
          {multi && (
            <span
              style={{
                padding: "1.5px 5px",
                borderRadius: 3,
                background: "rgba(255,106,61,0.15)",
                color: "#FF6A3D",
                fontSize: 8.5,
                letterSpacing: "0.04em",
              }}
            >
              2 opc
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: value ? "#F8F8F5" : "rgba(248,248,245,0.3)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || placeholder}
        </div>
      </div>
    </div>
  );
}
