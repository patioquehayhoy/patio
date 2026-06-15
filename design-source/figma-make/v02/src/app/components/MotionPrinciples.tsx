import { motion } from "motion/react";
import { useState } from "react";
import { Play } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";
const SF_MONO = "'SF Mono', monospace";

type Preset = {
  name: string;
  use: string;
  spec: string;
  type: "spring" | "tween";
  config: any;
};

const PRESETS: Preset[] = [
  {
    name: "Sheet · entra",
    use: "Bottom sheets, cards que aparecen desde abajo",
    spec: "spring · stiffness 380 · damping 32",
    type: "spring",
    config: { type: "spring", stiffness: 380, damping: 32 },
  },
  {
    name: "Sheet · sale",
    use: "Salidas suaves, dismiss",
    spec: "tween · 280ms · ease [0.4, 0, 0.2, 1]",
    type: "tween",
    config: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
  },
  {
    name: "Tap · responde",
    use: "Botones, chips, items tap-ables",
    spec: "spring · stiffness 600 · damping 28",
    type: "spring",
    config: { type: "spring", stiffness: 600, damping: 28 },
  },
  {
    name: "Pin · pulsa",
    use: "Pin activo en el mapa",
    spec: "loop · 1.8s · easeInOut",
    type: "tween",
    config: { duration: 1.8, ease: "easeInOut", repeat: Infinity },
  },
  {
    name: "Magic · revela",
    use: "Logo splash, confirmaciones grandes",
    spec: "spring · stiffness 220 · damping 18",
    type: "spring",
    config: { type: "spring", stiffness: 220, damping: 18 },
  },
  {
    name: "Crossfade",
    use: "Imágenes botánicas, hero rotation",
    spec: "tween · 800ms · easeInOut",
    type: "tween",
    config: { duration: 0.8, ease: "easeInOut" },
  },
];

export function MotionPrinciples() {
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
          Motion · principios
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
          Cómo se mueve Patio.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#4A4A47",
            maxWidth: 580,
            margin: "0 auto",
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          Spring para entradas, tween para salidas. Nada decorativo — el
          movimiento confirma una acción o revela jerarquía.
        </p>
      </div>

      {/* Three big principles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 48,
        }}
      >
        <Principle
          number="01"
          title="Responde, no decora"
          body="Cada animación es feedback de una acción del usuario. Si nadie tocó nada, nada debería moverse — excepto los pulsos que indican estado vivo."
        />
        <Principle
          number="02"
          title="Entrada con peso, salida sin estorbar"
          body="Las entradas usan spring para sentirse físicas; las salidas son tween cortos porque el usuario ya no las mira."
        />
        <Principle
          number="03"
          title="Una velocidad, no varias"
          body="Si dos elementos entran juntos, comparten timing. Si secuencian, máximo 60ms de stagger — más se siente lento."
        />
      </div>

      {/* Preset playground */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 16,
        }}
      >
        {PRESETS.map((p) => (
          <PresetCard key={p.name} preset={p} />
        ))}
      </div>
    </div>
  );
}

function Principle({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 22,
        background: "#FFFFFF",
        border: "1px solid rgba(17,18,20,0.06)",
        boxShadow: "0 8px 24px -12px rgba(17,18,20,0.08)",
      }}
    >
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#F2612F",
          lineHeight: 1,
          marginBottom: 14,
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          color: "#111214",
          lineHeight: 1.15,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 14,
          color: "#4A4A47",
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
        }}
      >
        {body}
      </div>
    </div>
  );
}

function PresetCard({ preset }: { preset: Preset }) {
  const [key, setKey] = useState(0);
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 20,
        background: "#FFFFFF",
        border: "1px solid rgba(17,18,20,0.06)",
        boxShadow: "0 6px 18px -10px rgba(17,18,20,0.08)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#111214",
              marginBottom: 2,
            }}
          >
            {preset.name}
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              color: "#8A8A85",
              letterSpacing: "-0.005em",
            }}
          >
            {preset.use}
          </div>
        </div>
        <button
          onClick={() => setKey((k) => k + 1)}
          className="flex items-center gap-1.5"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "#FBE7DD",
            color: "#F2612F",
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Play size={10} fill="#F2612F" strokeWidth={0} />
          Play
        </button>
      </div>

      <div
        style={{
          height: 80,
          borderRadius: 14,
          background: "#F8F8F5",
          position: "relative",
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <motion.div
          key={key}
          initial={{ x: 0 }}
          animate={
            preset.config.repeat
              ? { x: [0, 220, 0] }
              : { x: 220 }
          }
          transition={preset.config}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: 16,
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "#F2612F",
            boxShadow: "0 6px 14px -4px rgba(242,97,47,0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            width: 4,
            height: 28,
            borderRadius: 2,
            background: "rgba(17,18,20,0.1)",
          }}
        />
      </div>

      <div
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          background: "#F8F8F5",
          fontFamily: SF_MONO,
          fontSize: 11,
          color: "#4A4A47",
          letterSpacing: "-0.005em",
        }}
      >
        {preset.spec}
      </div>
    </div>
  );
}
