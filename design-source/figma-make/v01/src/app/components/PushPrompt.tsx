import { StatusBar } from "./PhoneFrame";
import { motion } from "motion/react";
import { Bell, MapPin } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function PushPrompt() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#111214" }}>
      <StatusBar dark />

      {/* Blurred botanical backdrop (the onboarding behind it) */}
      <div className="absolute inset-0">
        <RandomImage
          seed={4}
          objectPosition="center"
          overlay="linear-gradient(180deg, rgba(17,18,20,0.5) 0%, rgba(17,18,20,0.7) 100%)"
        />
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(20px) saturate(120%)",
            WebkitBackdropFilter: "blur(20px) saturate(120%)",
            background: "rgba(17,18,20,0.45)",
          }}
        />
      </div>

      {/* Dimmed onboarding silhouette */}
      <div
        className="absolute"
        style={{
          left: 24,
          right: 24,
          top: 120,
          textAlign: "center",
          opacity: 0.4,
        }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 12,
          }}
        >
          Casi listo · 3 de 3
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            color: "#F8F8F5",
          }}
        >
          Para avisarte cuando tu fonda publica el menú.
        </div>
      </div>

      {/* Native iOS system modal */}
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 }}
        className="absolute"
        style={{
          left: 32,
          right: 32,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(44,44,48,0.92)",
          backdropFilter: "blur(50px) saturate(180%)",
          WebkitBackdropFilter: "blur(50px) saturate(180%)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ padding: "20px 18px 16px", textAlign: "center" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: "linear-gradient(135deg, #FF8458 0%, #F2612F 100%)",
              margin: "0 auto 12px",
              boxShadow: "0 6px 16px -4px rgba(242,97,47,0.5)",
            }}
          >
            <Bell size={20} color="#fff" strokeWidth={2.4} fill="#fff" />
          </div>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#F8F8F5",
              marginBottom: 6,
              lineHeight: 1.2,
            }}
          >
            "Patio" quiere enviarte notificaciones
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 13,
              color: "rgba(248,248,245,0.7)",
              lineHeight: 1.35,
              letterSpacing: "-0.005em",
              padding: "0 4px",
            }}
          >
            Las notificaciones pueden incluir alertas, sonidos e iconos.
            Solo te avisamos cuando tu fonda publica — máximo uno al día.
          </div>
        </div>

        <div
          style={{
            borderTop: "0.5px solid rgba(255,255,255,0.15)",
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
          }}
        >
          <button
            style={{
              padding: "11px 0",
              fontFamily: SF_TEXT,
              fontSize: 16,
              color: "#0A84FF",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            No permitir
          </button>
          <div style={{ background: "rgba(255,255,255,0.15)" }} />
          <button
            style={{
              padding: "11px 0",
              fontFamily: SF_TEXT,
              fontSize: 16,
              fontWeight: 600,
              color: "#0A84FF",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            Permitir
          </button>
        </div>
      </motion.div>

      {/* Hint footer */}
      <div
        className="absolute"
        style={{
          left: 24,
          right: 24,
          bottom: 56,
          textAlign: "center",
          opacity: 0.55,
        }}
      >
        <div
          className="flex items-center justify-center gap-1.5 mb-1"
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(248,248,245,0.7)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <MapPin size={10} strokeWidth={2.4} color="#FF6A3D" />
          Después: ubicación
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            color: "rgba(248,248,245,0.5)",
            letterSpacing: "-0.005em",
          }}
        >
          Puedes cambiar esto en Ajustes
        </div>
      </div>
    </div>
  );
}
