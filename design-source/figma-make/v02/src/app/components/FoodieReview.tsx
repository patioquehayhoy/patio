import { StatusBar } from "./PhoneFrame";
import { ChevronLeft, Star, Camera } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

const TAGS = [
  "Caldoso",
  "Bien servido",
  "Recién hecho",
  "Salsa picosa",
  "Trato amable",
  "Tortillas hechas a mano",
];

export function FoodieReview() {
  const [rating] = useState(5);
  const [selected] = useState<Set<string>>(new Set(["Recién hecho", "Bien servido"]));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#F8F8F5" }}>
      <StatusBar dark />

      {/* Top nav */}
      <div
        className="absolute flex items-center justify-between"
        style={{ top: 58, left: 16, right: 20, zIndex: 20 }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "rgba(17,18,20,0.05)",
          }}
        >
          <ChevronLeft size={20} color="#111214" strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            color: "#8A8A85",
            letterSpacing: "-0.005em",
          }}
        >
          Borrador guardado
        </span>
      </div>

      <div
        className="absolute"
        style={{ top: 118, left: 22, right: 22, bottom: 110 }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#F2612F",
            marginBottom: 6,
          }}
        >
          Tu visita · hoy
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#111214",
            marginBottom: 4,
          }}
        >
          ¿Cómo estuvo Fonda Lupita?
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "#8A8A85",
            marginBottom: 22,
            letterSpacing: "-0.005em",
          }}
        >
          Tinga · Chiles rellenos · $55
        </div>

        {/* Stars */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= rating;
            return (
              <motion.div
                key={n}
                animate={active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4, delay: 0.05 * n, ease: "easeOut" }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: active ? "#FBE7DD" : "rgba(17,18,20,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: active ? "1px solid rgba(242,97,47,0.25)" : "1px solid transparent",
                }}
              >
                <Star
                  size={22}
                  color={active ? "#F2612F" : "rgba(17,18,20,0.2)"}
                  fill={active ? "#F2612F" : "none"}
                  strokeWidth={2}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Chips */}
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8A8A85",
            marginBottom: 10,
          }}
        >
          ¿Qué destacó?
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {TAGS.map((t) => {
            const on = selected.has(t);
            return (
              <div
                key={t}
                style={{
                  padding: "7px 13px",
                  borderRadius: 999,
                  fontFamily: SF_TEXT,
                  fontSize: 13,
                  fontWeight: 500,
                  background: on ? "#111214" : "#FFFFFF",
                  color: on ? "#F8F8F5" : "#111214",
                  border: on ? "none" : "1px solid rgba(17,18,20,0.08)",
                  letterSpacing: "-0.005em",
                }}
              >
                {t}
              </div>
            );
          })}
        </div>

        {/* Note + photo */}
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: "#FFFFFF",
            border: "1px solid rgba(17,18,20,0.06)",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 14,
              color: "#111214",
              lineHeight: 1.45,
              letterSpacing: "-0.005em",
              minHeight: 64,
            }}
          >
            La tinga estaba a punto, el arroz suelto y los chiles rellenos
            recién doraditos.<span style={{ color: "rgba(17,18,20,0.3)" }}> Lupita siempre con buena mano.</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2"
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(17,18,20,0.04)",
            border: "1px dashed rgba(17,18,20,0.12)",
            fontFamily: SF_TEXT,
            fontSize: 12.5,
            color: "#4A4A47",
            letterSpacing: "-0.005em",
          }}
        >
          <Camera size={14} color="#F2612F" strokeWidth={2.2} />
          Foto opcional · ayuda a otros foodies
        </div>
      </div>

      {/* CTA */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 20px 32px",
          background:
            "linear-gradient(180deg, rgba(248,248,245,0) 0%, rgba(248,248,245,0.95) 30%, #F8F8F5 100%)",
        }}
      >
        <button
          style={{
            width: "100%",
            height: 54,
            borderRadius: 18,
            background: "#F2612F",
            color: "#fff",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            letterSpacing: "-0.01em",
            boxShadow: "0 10px 24px -8px rgba(242,97,47,0.4)",
          }}
        >
          Publicar reseña
        </button>
      </div>
    </div>
  );
}
