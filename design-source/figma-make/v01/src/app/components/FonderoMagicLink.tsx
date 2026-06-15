import { StatusBar } from "./PhoneFrame";
import { Mail, ArrowRight, Check } from "lucide-react";
import { RandomImage } from "./RandomImage";
import logoPatio from "../../imports/logo-blanco.png";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FonderoMagicLink() {
  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark />

      {/* botanical backdrop top */}
      <RandomImage
        rotate
        intervalMs={9000}
        objectPosition="center top"
        style={{ height: "55%", bottom: "auto", opacity: 0.5 }}
        overlay="linear-gradient(180deg, rgba(17,18,20,0.2) 0%, rgba(17,18,20,0.6) 70%, #111214 100%)"
      />

      {/* warm glow top */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -100,
          right: -100,
          height: 600,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(255,106,61,0.22) 0%, transparent 65%)",
        }}
      />

      <div
        className="absolute"
        style={{ left: 28, right: 28, top: 90 }}
      >
        <img
          src={logoPatio}
          alt="Patio"
          style={{
            height: 40,
            width: "auto",
            objectFit: "contain",
            marginBottom: 32,
            display: "block",
          }}
        />

        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 12,
          }}
        >
          Patio para fonderos
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: "#F8F8F5",
            marginBottom: 14,
          }}
        >
          Tu menú,
          <br />
          en un correo.
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "rgba(248,248,245,0.55)",
            lineHeight: 1.45,
            marginBottom: 32,
            letterSpacing: "-0.005em",
          }}
        >
          Sin contraseñas. Te mandamos un enlace mágico y publicas el menú
          del día en 30 segundos.
        </div>

        {/* Email field */}
        <div
          style={{
            padding: "4px 4px 4px 18px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,106,61,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 0 0 4px rgba(255,106,61,0.1)",
          }}
        >
          <Mail size={18} color="rgba(248,248,245,0.5)" strokeWidth={2} />
          <span
            style={{
              flex: 1,
              fontFamily: SF_TEXT,
              fontSize: 16,
              color: "#F8F8F5",
              letterSpacing: "-0.01em",
            }}
          >
            lupita@fondaroma.mx
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: 18,
                background: "#FF6A3D",
                marginLeft: 2,
                verticalAlign: "middle",
                animation: "blink 1s infinite",
              }}
            />
          </span>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#FF6A3D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px -4px rgba(255,106,61,0.5)",
            }}
          >
            <ArrowRight size={18} color="#fff" strokeWidth={2.4} />
          </div>
        </div>

        {/* Benefits */}
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          <Benefit text="Sin app extra para tus clientes" />
          <Benefit text="Repite el menú de ayer con un toque" />
          <Benefit text="Se oculta solo cuando cierras" />
        </div>
      </div>

      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 24,
          textAlign: "center",
          fontFamily: SF_TEXT,
          fontSize: 12,
          color: "rgba(248,248,245,0.35)",
          letterSpacing: "-0.005em",
        }}
      >
        ¿Eres foodie? <span style={{ color: "#FF6A3D", fontWeight: 600 }}>Descubrir fonditas →</span>
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-10" style={{ gap: 10 }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          background: "rgba(255,106,61,0.15)",
          border: "1px solid rgba(255,106,61,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={11} color="#FF6A3D" strokeWidth={3} />
      </div>
      <span
        style={{
          fontFamily: SF_TEXT,
          fontSize: 14,
          color: "rgba(248,248,245,0.75)",
          letterSpacing: "-0.01em",
        }}
      >
        {text}
      </span>
    </div>
  );
}
