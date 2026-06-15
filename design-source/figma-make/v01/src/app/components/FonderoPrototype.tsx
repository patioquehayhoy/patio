import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PhoneFrame } from "./PhoneFrame";
import { FonderoMagicLink } from "./FonderoMagicLink";
import { FonderoPublish } from "./FonderoPublish";
import { FonderoSuccess } from "./FonderoSuccess";
import { FonderoHistory } from "./FonderoHistory";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

type Step = "magic" | "publish" | "success" | "history";

const STEPS: { id: Step; n: string; label: string; hint: string }[] = [
  { id: "magic", n: "01", label: "Entrar", hint: "Magic link · sin password" },
  { id: "publish", n: "02", label: "Publicar", hint: "Menú en 30 segundos" },
  { id: "success", n: "03", label: "Vivo", hint: "Confirmación + confetti" },
  { id: "history", n: "04", label: "Repetir", hint: "Métricas + reuso" },
];

export function FonderoPrototype() {
  const [step, setStep] = useState<Step>("magic");
  const [confettiKey, setConfettiKey] = useState(0);

  const handleStep = (s: Step) => {
    setStep(s);
    if (s === "success") setConfettiKey((k) => k + 1);
  };

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "80px auto 0",
        padding: "56px 56px 64px",
        borderRadius: 36,
        background: "linear-gradient(180deg, #F8F8F5 0%, #FBE7DD 100%)",
        border: "1px solid rgba(17,18,20,0.06)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 56,
        alignItems: "center",
      }}
    >
      <div className="flex justify-center" style={{ order: 1 }}>
        <PhoneFrame label="" caption="" tone="dark">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
            >
              {step === "magic" && <FonderoMagicLink />}
              {step === "publish" && <FonderoPublish />}
              {step === "success" && <FonderoSuccess key={confettiKey} fireConfetti />}
              {step === "history" && <FonderoHistory />}
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
      </div>

      <div style={{ order: 2 }}>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#F2612F",
            marginBottom: 14,
          }}
        >
          Prototipo · Fondero flow
        </div>
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.96,
            color: "#111214",
            marginBottom: 18,
          }}
        >
          De cero a publicado en 4 pasos.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#4A4A47",
            lineHeight: 1.5,
            marginBottom: 28,
            letterSpacing: "-0.005em",
            maxWidth: 380,
          }}
        >
          Doña Lupita debería poder hacer esto en lo que sirve un plato.
          Sin password, sin distracciones, con refuerzo positivo al final.
        </p>

        <div className="flex flex-col gap-2" style={{ maxWidth: 380 }}>
          {STEPS.map((s) => {
            const active = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleStep(s.id)}
                style={{
                  padding: "14px 18px",
                  borderRadius: 16,
                  background: active ? "#111214" : "rgba(255,255,255,0.6)",
                  border: active ? "none" : "1px solid rgba(17,18,20,0.08)",
                  color: active ? "#F8F8F5" : "#111214",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transition: "all 200ms ease",
                  boxShadow: active ? "0 12px 30px -10px rgba(17,18,20,0.3)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: SF_DISPLAY,
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: active ? "#FF6A3D" : "#8A8A85",
                    width: 30,
                  }}
                >
                  {s.n}
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      fontFamily: SF_TEXT,
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: SF_TEXT,
                      fontSize: 12,
                      color: active ? "rgba(248,248,245,0.55)" : "#8A8A85",
                      marginTop: 2,
                    }}
                  >
                    {s.hint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
