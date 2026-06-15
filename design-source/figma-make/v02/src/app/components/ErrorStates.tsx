import { StatusBar } from "./PhoneFrame";
import { WifiOff, MapPinOff, LinkIcon, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function ErrorNoInternet() {
  return <ErrorShell
    icon={<WifiOff size={28} color="#F2612F" strokeWidth={2} />}
    eyebrow="Sin conexión"
    title="No te escuchamos."
    body="Estás sin internet. Cuando vuelvas, te mostramos lo que hay hoy cerca."
    cta="Reintentar"
    ctaIcon={<RefreshCw size={15} strokeWidth={2.4} />}
    tone="light"
  />;
}

export function ErrorLocationDenied() {
  return <ErrorShell
    icon={<MapPinOff size={28} color="#F2612F" strokeWidth={2} />}
    eyebrow="Ubicación"
    title="Necesitamos saber dónde estás."
    body="Patio te muestra las fondas cerca. Sin ubicación, no podemos. Actívala en Ajustes."
    cta="Abrir Ajustes"
    tone="light"
  />;
}

export function ErrorMagicExpired() {
  return <ErrorShell
    icon={<LinkIcon size={28} color="#FF6A3D" strokeWidth={2} />}
    eyebrow="Enlace caducado"
    title="Este link ya no sirve."
    body="Por seguridad, los enlaces mágicos duran 15 minutos. Te mandamos uno nuevo."
    cta="Mandar otro"
    tone="dark"
  />;
}

function ErrorShell({
  icon,
  eyebrow,
  title,
  body,
  cta,
  ctaIcon,
  tone,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  ctaIcon?: React.ReactNode;
  tone: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      className="absolute inset-0"
      style={{ background: isDark ? "#111214" : "#F8F8F5", overflow: "hidden" }}
    >
      <StatusBar dark={isDark} />

      {isDark && (
        <RandomImage
          seed={4}
          objectPosition="center 30%"
          style={{ opacity: 0.32 }}
          overlay="linear-gradient(180deg, rgba(17,18,20,0.4) 0%, rgba(17,18,20,0.85) 70%, #111214 100%)"
        />
      )}

      <div
        className="absolute flex flex-col items-center text-center"
        style={{ left: 32, right: 32, top: 220 }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            background: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
            border: isDark
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(17,18,20,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            boxShadow: isDark
              ? "none"
              : "0 14px 36px -10px rgba(17,18,20,0.18)",
          }}
        >
          {icon}
        </motion.div>

        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: isDark ? "#FF6A3D" : "#F2612F",
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: isDark ? "#F8F8F5" : "#111214",
            marginBottom: 14,
            maxWidth: 280,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: isDark ? "rgba(248,248,245,0.55)" : "#4A4A47",
            lineHeight: 1.45,
            maxWidth: 280,
            letterSpacing: "-0.005em",
          }}
        >
          {body}
        </div>
      </div>

      <div
        className="absolute"
        style={{ left: 20, right: 20, bottom: 36 }}
      >
        <button
          style={{
            width: "100%",
            height: 54,
            borderRadius: 18,
            background: isDark ? "#FF6A3D" : "#111214",
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
            boxShadow: isDark
              ? "0 12px 30px -10px rgba(255,106,61,0.5)"
              : "0 12px 30px -10px rgba(17,18,20,0.3)",
          }}
        >
          {ctaIcon}
          {cta}
        </button>
      </div>
    </div>
  );
}
