import { useEffect, useState } from "react";
import { StatusBar } from "./PhoneFrame";
import { Check, Share, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { LUPITA_MENU } from "../data/menu";
import { MenuPosterOverlay } from "./MenuPoster";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FonderoSuccess({ fireConfetti }: { fireConfetti?: boolean }) {
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (!fireConfetti) return;
    const t = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#FF6A3D", "#F2612F", "#FBE7DD", "#F8F8F5"],
        startVelocity: 35,
        scalar: 0.8,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [fireConfetti]);

  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark />

      {/* warm glow */}
      <div
        style={{
          position: "absolute",
          top: -150,
          left: -100,
          right: -100,
          height: 600,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(255,106,61,0.25) 0%, transparent 60%)",
        }}
      />

      <div
        className="absolute flex flex-col items-center text-center"
        style={{ left: 28, right: 28, top: 180 }}
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            background: "linear-gradient(135deg, #FF6A3D 0%, #C04020 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            boxShadow: "0 20px 50px -10px rgba(255,106,61,0.6)",
          }}
        >
          <Check size={42} color="#fff" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
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
          Publicado · 13:02
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: "#F8F8F5",
            marginBottom: 12,
          }}
        >
          Tu menú está vivo.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "rgba(248,248,245,0.55)",
            lineHeight: 1.45,
            maxWidth: 280,
            letterSpacing: "-0.005em",
            marginBottom: 32,
          }}
        >
          Quien anda cerca ya puede verlo. Se oculta solo a las 17:30.
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            padding: "10px 16px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Eye size={13} color="#FF6A3D" strokeWidth={2.2} />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 13,
              color: "rgba(248,248,245,0.8)",
              letterSpacing: "-0.005em",
            }}
          >
            <b style={{ color: "#F8F8F5" }}>3 personas</b> ya lo están viendo
          </span>
        </motion.div>
      </div>

      <div
        className="absolute"
        style={{ left: 20, right: 20, bottom: 36, display: "flex", flexDirection: "column", gap: 10 }}
      >
        <button
          onClick={() => setPreview(true)}
          style={{
            height: 54,
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            color: "#F8F8F5",
            fontFamily: SF_TEXT,
            fontSize: 15,
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.1)",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Share size={15} strokeWidth={2.2} />
          Compartir en WhatsApp
        </button>
        <button
          style={{
            height: 48,
            borderRadius: 18,
            background: "transparent",
            color: "rgba(248,248,245,0.5)",
            fontFamily: SF_TEXT,
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            letterSpacing: "-0.005em",
          }}
        >
          Ver mi historial
        </button>
      </div>

      <AnimatePresence>
        {preview && (
          <MenuPosterOverlay menu={LUPITA_MENU} onClose={() => setPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
