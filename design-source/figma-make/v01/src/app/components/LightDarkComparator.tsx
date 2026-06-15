import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PhoneFrame } from "./PhoneFrame";
import { FoodieMap } from "./FoodieMap";
import { FoodieMapDark } from "./FoodieMapDark";
import { FoodieDetail } from "./FoodieDetail";
import { FoodieDetailDark } from "./FoodieDetailDark";
import { Sun, Moon } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function LightDarkComparator() {
  const [mode, setMode] = useState<"split" | "light" | "dark">("split");
  const [auto, setAuto] = useState(true);
  const isSplit = mode === "split";
  const isDark = mode === "dark";

  useEffect(() => {
    if (!auto) return;
    const order: Array<"split" | "light" | "dark"> = ["split", "light", "dark"];
    const id = setInterval(() => {
      setMode((m) => order[(order.indexOf(m) + 1) % order.length]);
    }, 4200);
    return () => clearInterval(id);
  }, [auto]);

  function pick(next: "split" | "light" | "dark") {
    setAuto(false);
    setMode(next);
  }

  const splitBg =
    "linear-gradient(90deg, #F8F8F5 0%, #F8F8F5 50%, #111214 50%, #111214 100%)";
  const lightBg = "#F8F8F5";
  const darkBg = "#111214";

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
          Día · Noche
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
          Patio cambia con la hora.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#4A4A47",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          A mediodía la comida corrida; en la noche los tacos al pastor. Mismo
          sistema, dos temperaturas — sin perder identidad.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center items-center gap-3" style={{ marginBottom: 28 }}>
        {auto && (
          <div
            className="flex items-center gap-1.5"
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8A8A85",
            }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#F2612F",
              }}
            />
            Auto
          </div>
        )}
        <div
          style={{
            display: "inline-flex",
            padding: 5,
            borderRadius: 999,
            background: "rgba(17,18,20,0.06)",
            border: "1px solid rgba(17,18,20,0.06)",
            gap: 4,
          }}
        >
          <ModeBtn active={mode === "light"} onClick={() => pick("light")}>
            <Sun size={13} strokeWidth={2.4} /> Día
          </ModeBtn>
          <ModeBtn active={mode === "split"} onClick={() => pick("split")}>
            Día · Noche
          </ModeBtn>
          <ModeBtn active={mode === "dark"} onClick={() => pick("dark")}>
            <Moon size={13} strokeWidth={2.4} /> Noche
          </ModeBtn>
        </div>
      </div>

      <motion.div
        animate={{
          background: isSplit ? splitBg : isDark ? darkBg : lightBg,
        }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          borderRadius: 32,
          overflow: "hidden",
          padding: "56px 40px",
          border: "1px solid rgba(17,18,20,0.08)",
          minHeight: 920,
        }}
      >
        <AnimatePresence mode="wait">
          {mode === "split" && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
              }}
            >
              <div>
                <Header
                  tone="light"
                  icon={<Sun size={14} strokeWidth={2.4} color="#F2612F" />}
                  kicker="13:42 · Día"
                  title="Comida corrida"
                />
                <div className="flex gap-6 justify-center">
                  <PhoneFrame label="" caption="" tone="light">
                    <FoodieMap />
                  </PhoneFrame>
                  <PhoneFrame label="" caption="" tone="light">
                    <FoodieDetail />
                  </PhoneFrame>
                </div>
              </div>
              <div>
                <Header
                  tone="dark"
                  icon={<Moon size={14} strokeWidth={2.4} color="#FF6A3D" />}
                  kicker="20:18 · Noche"
                  title="Tacos al pastor"
                />
                <div className="flex gap-6 justify-center">
                  <PhoneFrame label="" caption="" tone="dark">
                    <FoodieMapDark />
                  </PhoneFrame>
                  <PhoneFrame label="" caption="" tone="dark">
                    <FoodieDetailDark />
                  </PhoneFrame>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "light" && (
            <motion.div
              key="light"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
            >
              <Header
                tone="light"
                icon={<Sun size={14} strokeWidth={2.4} color="#F2612F" />}
                kicker="13:42 · Día"
                title="Comida corrida"
              />
              <div className="flex gap-8 justify-center">
                <PhoneFrame label="" caption="" tone="light">
                  <FoodieMap />
                </PhoneFrame>
                <PhoneFrame label="" caption="" tone="light">
                  <FoodieDetail />
                </PhoneFrame>
              </div>
            </motion.div>
          )}

          {mode === "dark" && (
            <motion.div
              key="dark"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
            >
              <Header
                tone="dark"
                icon={<Moon size={14} strokeWidth={2.4} color="#FF6A3D" />}
                kicker="20:18 · Noche"
                title="Tacos al pastor"
              />
              <div className="flex gap-8 justify-center">
                <PhoneFrame label="" caption="" tone="dark">
                  <FoodieMapDark />
                </PhoneFrame>
                <PhoneFrame label="" caption="" tone="dark">
                  <FoodieDetailDark />
                </PhoneFrame>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pair of token rows */}
      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <TokenRow
          tone="light"
          tokens={[
            { name: "bg", hex: "#F8F8F5" },
            { name: "ink", hex: "#111214" },
            { name: "accent", hex: "#F2612F" },
            { name: "soft", hex: "#FBE7DD" },
          ]}
        />
        <TokenRow
          tone="dark"
          tokens={[
            { name: "bg", hex: "#111214" },
            { name: "ink", hex: "#F8F8F5" },
            { name: "accent", hex: "#FF6A3D" },
            { name: "glass", hex: "#1C1D21" },
          ]}
        />
      </div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5"
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        background: active ? "#111214" : "transparent",
        color: active ? "#F8F8F5" : "#4A4A47",
        fontFamily: SF_TEXT,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        border: "none",
        cursor: "pointer",
        transition: "background 200ms ease",
      }}
    >
      {children}
    </button>
  );
}

function Header({
  tone,
  icon,
  kicker,
  title,
}: {
  tone: "light" | "dark";
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  const isDark = tone === "dark";
  return (
    <div style={{ marginBottom: 28, textAlign: "center" }}>
      <div
        className="inline-flex items-center gap-1.5"
        style={{
          padding: "5px 11px",
          borderRadius: 999,
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,18,20,0.06)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(17,18,20,0.06)",
          marginBottom: 10,
        }}
      >
        {icon}
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: isDark ? "#FF6A3D" : "#F2612F",
          }}
        >
          {kicker}
        </span>
      </div>
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: isDark ? "#F8F8F5" : "#111214",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function TokenRow({
  tone,
  tokens,
}: {
  tone: "light" | "dark";
  tokens: { name: string; hex: string }[];
}) {
  const isDark = tone === "dark";
  return (
    <div
      style={{
        padding: "18px 22px",
        borderRadius: 20,
        background: isDark ? "#1C1D21" : "#FFFFFF",
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(17,18,20,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: isDark ? "rgba(248,248,245,0.5)" : "#8A8A85",
          minWidth: 50,
        }}
      >
        {tone}
      </div>
      <div className="flex gap-3 flex-1 flex-wrap">
        {tokens.map((t) => (
          <div key={t.name} className="flex items-center gap-2">
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: t.hex,
                border: isDark
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(17,18,20,0.08)",
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: 10,
                  color: isDark ? "rgba(248,248,245,0.45)" : "#8A8A85",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontFamily: "'SF Mono', monospace",
                  fontSize: 11,
                  color: isDark ? "#F8F8F5" : "#111214",
                  marginTop: 2,
                  letterSpacing: "-0.005em",
                }}
              >
                {t.hex}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
