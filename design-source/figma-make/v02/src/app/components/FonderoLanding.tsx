import { PatioMark } from "./PatioMark";
import { RandomImage } from "./RandomImage";
import { PhoneFrame } from "./PhoneFrame";
import { FonderoPublish } from "./FonderoPublish";
import { ArrowRight, Mail, Check, Sparkles } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FonderoLanding() {
  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "120px auto 0",
        borderRadius: 36,
        overflow: "hidden",
        background: "#F8F8F5",
        border: "1px solid rgba(17,18,20,0.06)",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          padding: "14px 18px",
          background: "#EFEFE9",
          borderBottom: "1px solid rgba(17,18,20,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div className="flex gap-2">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 8,
            padding: "5px 12px",
            fontFamily: "'SF Mono', monospace",
            fontSize: 12,
            color: "#8A8A85",
            letterSpacing: "-0.005em",
          }}
        >
          patio.mx/fondas
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          padding: "20px 48px",
          borderBottom: "1px solid rgba(17,18,20,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(248,248,245,0.7)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <PatioMark size={32} />
          <span
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#111214",
            }}
          >
            Patio
          </span>
        </div>
        <div className="flex items-center gap-6">
          {["Cómo funciona", "Historias", "Soporte"].map((l) => (
            <span
              key={l}
              style={{
                fontFamily: SF_TEXT,
                fontSize: 13,
                color: "#4A4A47",
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              {l}
            </span>
          ))}
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              background: "#111214",
              color: "#F8F8F5",
              fontFamily: SF_TEXT,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            Entrar
          </div>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          padding: "80px 48px 56px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 56,
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* botanical accent right */}
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(242,97,47,0.12) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#F2612F",
              marginBottom: 16,
            }}
          >
            Para fonderas y fonderos · CDMX
          </div>
          <h1
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              color: "#111214",
              marginBottom: 22,
            }}
          >
            Publica tu menú del día.
            <br />
            <span style={{ color: "#F2612F" }}>En 30 segundos.</span>
          </h1>
          <p
            style={{
              fontFamily: SF_TEXT,
              fontSize: 18,
              color: "#4A4A47",
              lineHeight: 1.45,
              marginBottom: 32,
              maxWidth: 520,
              letterSpacing: "-0.005em",
            }}
          >
            Patio le dice a los foodies de tu barrio qué hay hoy en tu fonda.
            Sin app extra para ellos. Sin contraseña para ti. Solo tu correo.
          </p>

          {/* email form */}
          <div
            style={{
              padding: "5px 5px 5px 18px",
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(17,18,20,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              maxWidth: 480,
              boxShadow: "0 10px 30px -12px rgba(17,18,20,0.12)",
            }}
          >
            <Mail size={18} color="#8A8A85" strokeWidth={2} />
            <span
              style={{
                flex: 1,
                fontFamily: SF_TEXT,
                fontSize: 15,
                color: "#8A8A85",
                letterSpacing: "-0.005em",
              }}
            >
              tu-correo@ejemplo.com
            </span>
            <div
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "#F2612F",
                color: "#fff",
                fontFamily: SF_TEXT,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 6px 16px -4px rgba(242,97,47,0.4)",
              }}
            >
              Empezar
              <ArrowRight size={14} strokeWidth={2.4} />
            </div>
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              color: "#8A8A85",
              marginTop: 12,
              letterSpacing: "-0.005em",
            }}
          >
            Gratis siempre · Sin tarjeta · 2,400 fonditas ya lo usan
          </div>

          {/* Trust */}
          <div
            className="flex items-center gap-5"
            style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid rgba(17,18,20,0.08)" }}
          >
            {[
              { n: "2,400", l: "fondas activas" },
              { n: "180k", l: "foodies en CDMX" },
              { n: "30s", l: "para publicar" },
            ].map((s) => (
              <div key={s.l}>
                <div
                  style={{
                    fontFamily: SF_DISPLAY,
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#111214",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: SF_TEXT,
                    fontSize: 11,
                    color: "#8A8A85",
                    marginTop: 3,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phone preview */}
        <div
          className="flex justify-center"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div style={{ transform: "scale(0.78) rotate(3deg)", transformOrigin: "center" }}>
            <PhoneFrame label="" caption="" tone="dark">
              <FonderoPublish />
            </PhoneFrame>
          </div>
        </div>
      </div>

      {/* "Así se ve" — 3 cards */}
      <div
        style={{
          padding: "56px 48px",
          background: "#FFFFFF",
          borderTop: "1px solid rgba(17,18,20,0.06)",
        }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#F2612F",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Cómo funciona
        </div>
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#111214",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Tan fácil como anotar el menú en la pizarra.
        </h2>

        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <Step
            n="01"
            title="Te llega un enlace"
            body="Pones tu correo, te mandamos un link. Sin contraseñas que olvidar."
            seed={3}
          />
          <Step
            n="02"
            title="Escribes el menú"
            body="Entrada, guisado, postre, precio. Como lo diría tu mamá."
            seed={2}
          />
          <Step
            n="03"
            title="Los foodies lo ven"
            body="Aparece en el mapa de los foodies cerca. Se oculta cuando cierras."
            seed={7}
          />
        </div>
      </div>

      {/* Testimonial */}
      <div
        style={{
          padding: "56px 48px",
          background: "#111214",
          color: "#F8F8F5",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
          }}
        >
          <RandomImage seed={6} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(17,18,20,0.85) 0%, rgba(17,18,20,0.7) 100%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 64,
              color: "#FF6A3D",
              lineHeight: 0.5,
              marginBottom: 8,
            }}
          >
            "
          </div>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              color: "#F8F8F5",
              marginBottom: 24,
            }}
          >
            Antes la gente entraba a preguntar y se iba si no había lo suyo.
            Ahora llegan ya sabiendo y se quedan.
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 14,
              color: "#FF6A3D",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Doña Lupita · Fonda Lupita · Roma Norte
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          padding: "64px 48px",
          textAlign: "center",
          background: "linear-gradient(180deg, #FBE7DD 0%, #F8F8F5 100%)",
        }}
      >
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: "#111214",
            marginBottom: 14,
          }}
        >
          ¿Qué hay hoy en tu fonda?
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#4A4A47",
            marginBottom: 28,
            letterSpacing: "-0.005em",
          }}
        >
          Empieza con tu correo. Tu primer menú toma 30 segundos.
        </p>
        <div
          style={{
            display: "inline-flex",
            padding: "16px 32px",
            borderRadius: 16,
            background: "#F2612F",
            color: "#fff",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.005em",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 16px 36px -10px rgba(242,97,47,0.5)",
          }}
        >
          <Sparkles size={16} strokeWidth={2.4} />
          Publicar mi primer menú
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "28px 48px",
          background: "#F8F8F5",
          borderTop: "1px solid rgba(17,18,20,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: SF_TEXT,
          fontSize: 12,
          color: "#8A8A85",
          letterSpacing: "-0.005em",
        }}
      >
        <div className="flex items-center gap-2">
          <PatioMark size={20} monochrome tone="ink" />
          Patio · Hecho en CDMX
        </div>
        <div className="flex gap-5">
          {["Privacidad", "Términos", "Contacto"].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  seed,
}: {
  n: string;
  title: string;
  body: string;
  seed: number;
}) {
  return (
    <div
      style={{
        padding: 4,
        borderRadius: 22,
        background: "#F8F8F5",
        border: "1px solid rgba(17,18,20,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 180,
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          background: "#111214",
        }}
      >
        <RandomImage seed={seed} objectPosition="center 30%" overlay="linear-gradient(180deg, rgba(17,18,20,0.2) 0%, rgba(17,18,20,0.5) 100%)" />
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            fontFamily: SF_DISPLAY,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {n}
        </div>
      </div>
      <div style={{ padding: "20px 18px 18px" }}>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "#111214",
            marginBottom: 6,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "#4A4A47",
            lineHeight: 1.45,
            letterSpacing: "-0.005em",
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
