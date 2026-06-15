import { PhoneFrame } from "./PhoneFrame";
import { FoodieMap } from "./FoodieMap";
import { FoodieDetail } from "./FoodieDetail";
import { FoodieMapDark } from "./FoodieMapDark";
import { FonderoPublish } from "./FonderoPublish";
import { FoodieSaved } from "./FoodieSaved";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

type Shot = {
  kicker: string;
  headline: string;
  bg: string;
  accent: string;
  ink: string;
  screen: React.ReactNode;
  tone?: "light" | "dark";
};

const shots: Shot[] = [
  {
    kicker: "Sin reservar · sin pedir",
    headline: "¿Qué hay hoy de comer?",
    bg: "linear-gradient(180deg, #FBE7DD 0%, #F8F8F5 100%)",
    accent: "#F2612F",
    ink: "#111214",
    screen: <FoodieMap />,
    tone: "light",
  },
  {
    kicker: "Menú del día",
    headline: "La fonda, como contenido editorial.",
    bg: "linear-gradient(180deg, #F8F8F5 0%, #EFEFE9 100%)",
    accent: "#F2612F",
    ink: "#111214",
    screen: <FoodieDetail />,
    tone: "light",
  },
  {
    kicker: "También de noche",
    headline: "Cuando el día se acaba, el trompo prende.",
    bg: "linear-gradient(180deg, #1a1b1f 0%, #111214 100%)",
    accent: "#FF6A3D",
    ink: "#F8F8F5",
    screen: <FoodieMapDark />,
    tone: "dark",
  },
  {
    kicker: "Guarda tus de cabecera",
    headline: "Tus fonditas, en un solo lugar.",
    bg: "linear-gradient(180deg, #F8F8F5 0%, #FBE7DD 100%)",
    accent: "#F2612F",
    ink: "#111214",
    screen: <FoodieSaved />,
    tone: "light",
  },
  {
    kicker: "Para fonderos",
    headline: "Publica tu menú en 30 segundos.",
    bg: "linear-gradient(180deg, #111214 0%, #1a1b1f 100%)",
    accent: "#FF6A3D",
    ink: "#F8F8F5",
    screen: <FonderoPublish />,
    tone: "dark",
  },
];

export function AppStoreShots() {
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
          App Store · 6.5"
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
          Cómo se ve en la ficha.
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
          Cinco screenshots para vender Patio en la App Store — promesa, sistema,
          producto. Tipografía editorial sobre el frame.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          justifyItems: "center",
        }}
      >
        {shots.map((s, i) => (
          <Shot key={i} shot={s} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

function Shot({ shot, index }: { shot: Shot; index: number }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        aspectRatio: "9 / 19.5",
        borderRadius: 36,
        overflow: "hidden",
        position: "relative",
        background: shot.bg,
        boxShadow: "0 24px 60px -20px rgba(17,18,20,0.25)",
        border: "1px solid rgba(17,18,20,0.06)",
      }}
    >
      {/* Header copy */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "44px 32px 0",
          textAlign: "center",
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: shot.accent,
            marginBottom: 10,
          }}
        >
          {String(index).padStart(2, "0")} · {shot.kicker}
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: shot.ink,
          }}
        >
          {shot.headline}
        </div>
      </div>

      {/* Phone — cropped frame, bottom anchored */}
      <div
        style={{
          position: "absolute",
          bottom: -40,
          left: "50%",
          transform: "translateX(-50%) scale(0.62)",
          transformOrigin: "bottom center",
        }}
      >
        <PhoneFrame label="" caption="" tone={shot.tone}>
          {shot.screen}
        </PhoneFrame>
      </div>
    </div>
  );
}
