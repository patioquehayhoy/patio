import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "./PhoneFrame";
import { MapPin, ChefHat, Bell } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  icon: React.ReactNode;
  seed: number;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Esto no es delivery",
    title: "Saber qué hay hoy.",
    body: "Las fonditas de tu barrio publican su menú del día. Tú decides si vale la caminata.",
    cta: "Continuar",
    icon: <ChefHat size={28} color="#F2612F" strokeWidth={2} />,
    seed: 0,
  },
  {
    eyebrow: "Sin filtros raros",
    title: "Lo que se cocina, en su voz.",
    body: "La fondera escribe el menú como lo diría en persona. Tinga, bistec, sopa de fideo. Real.",
    cta: "Continuar",
    icon: <MapPin size={28} color="#F2612F" strokeWidth={2} />,
    seed: 2,
  },
  {
    eyebrow: "Cuando quieras",
    title: "Te avisamos si abre.",
    body: "Guarda tus fonditas favoritas y te decimos cuando publican menú. Sin spam, sin notificaciones inútiles.",
    cta: "Permitir ubicación",
    icon: <Bell size={28} color="#F2612F" strokeWidth={2} />,
    seed: 4,
  },
];

export function FoodieOnboarding() {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="absolute inset-0" style={{ background: "#F8F8F5", overflow: "hidden" }}>
      <StatusBar dark />

      {/* botanical hero */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 380,
          overflow: "hidden",
          background: "#111214",
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={slide.seed}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <RandomImage seed={slide.seed} objectPosition="center 30%" />
          </motion.div>
        </AnimatePresence>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17,18,20,0.15) 0%, rgba(17,18,20,0) 30%, rgba(248,248,245,0.4) 80%, #F8F8F5 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: 340,
          bottom: 0,
          padding: "0 28px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "#FFFFFF",
            border: "1px solid rgba(17,18,20,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
            boxShadow: "0 10px 28px -8px rgba(17,18,20,0.18)",
          }}
        >
          {slide.icon}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
          >
            <div
              style={{
                fontFamily: SF_TEXT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#F2612F",
                marginBottom: 10,
              }}
            >
              {slide.eyebrow}
            </div>
            <div
              style={{
                fontFamily: SF_DISPLAY,
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 0.98,
                color: "#111214",
                marginBottom: 14,
              }}
            >
              {slide.title}
            </div>
            <div
              style={{
                fontFamily: SF_TEXT,
                fontSize: 15,
                color: "#4A4A47",
                lineHeight: 1.45,
                letterSpacing: "-0.005em",
              }}
            >
              {slide.body}
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={{ flex: 1 }} />

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === idx ? 24 : 6 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{
                height: 6,
                borderRadius: 3,
                background: i === idx ? "#F2612F" : "rgba(17,18,20,0.15)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 18,
            background: isLast ? "#F2612F" : "#111214",
            color: "#fff",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            letterSpacing: "-0.01em",
            marginBottom: 10,
            boxShadow: isLast
              ? "0 12px 30px -10px rgba(242,97,47,0.5)"
              : "0 10px 24px -10px rgba(17,18,20,0.3)",
            cursor: "pointer",
          }}
        >
          {slide.cta}
        </button>
        <button
          style={{
            width: "100%",
            height: 40,
            background: "transparent",
            border: "none",
            color: "#8A8A85",
            fontFamily: SF_TEXT,
            fontSize: 13,
            letterSpacing: "-0.005em",
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          {isLast ? "Ahora no" : "Saltar"}
        </button>
      </div>
    </div>
  );
}
