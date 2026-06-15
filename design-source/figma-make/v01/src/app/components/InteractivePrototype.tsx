import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PhoneFrame } from "./PhoneFrame";
import { FoodieMap } from "./FoodieMap";
import { FoodieDetail } from "./FoodieDetail";
import { FoodieSoldOut } from "./FoodieSoldOut";
import { FoodieEmpty } from "./FoodieEmpty";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

type Screen = "map" | "detail" | "soldout" | "empty";

const SCREENS: { id: Screen; label: string; hint: string }[] = [
  { id: "map", label: "Mapa", hint: "Descubrir hoy" },
  { id: "detail", label: "Detalle", hint: "Menú del día" },
  { id: "soldout", label: "Agotado", hint: "Se acabó" },
  { id: "empty", label: "Nocturno", hint: "Ya cerraron" },
];

export function InteractivePrototype() {
  const [screen, setScreen] = useState<Screen>("map");

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "120px auto 0",
        padding: "56px 56px 64px",
        borderRadius: 36,
        background: "linear-gradient(180deg, #111214 0%, #1a1b1f 100%)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 56,
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 14,
          }}
        >
          Prototipo · Foodie flow
        </div>
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.96,
            color: "#F8F8F5",
            marginBottom: 18,
          }}
        >
          Tócalo. <br />
          Es de verdad.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "rgba(248,248,245,0.6)",
            lineHeight: 1.5,
            marginBottom: 28,
            letterSpacing: "-0.005em",
            maxWidth: 380,
          }}
        >
          Las cuatro pantallas del flujo Foodie, navegables. Las transiciones aquí
          son las mismas que verás en Expo.
        </p>

        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          {SCREENS.map((s) => {
            const active = screen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScreen(s.id)}
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: active ? "#FF6A3D" : "rgba(255,255,255,0.04)",
                  border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
                  color: active ? "#fff" : "#F8F8F5",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 200ms ease",
                  boxShadow: active
                    ? "0 10px 30px -10px rgba(255,106,61,0.5)"
                    : "none",
                }}
              >
                <div>
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
                      color: active ? "rgba(255,255,255,0.7)" : "rgba(248,248,245,0.45)",
                      marginTop: 2,
                    }}
                  >
                    {s.hint}
                  </div>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    border: `2px solid ${active ? "#fff" : "rgba(248,248,245,0.2)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: "#fff",
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <PhoneFrame label="" caption="">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
            >
              {screen === "map" && <FoodieMap />}
              {screen === "detail" && <FoodieDetail />}
              {screen === "soldout" && <FoodieSoldOut />}
              {screen === "empty" && <FoodieEmpty />}
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
      </div>
    </div>
  );
}
