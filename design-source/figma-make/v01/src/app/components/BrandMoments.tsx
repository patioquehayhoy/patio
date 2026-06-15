import { PhoneFrame, StatusBar } from "./PhoneFrame";
import { PatioMark } from "./PatioMark";
import { motion } from "motion/react";
import { RandomImage } from "./RandomImage";
import { Bookmark, MapPin } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function BrandMoments() {
  return (
    <div style={{ maxWidth: 1400, margin: "120px auto 0" }}>
      <div style={{ marginBottom: 56 }}>
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
          Marca · Momentos físicos
        </div>
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.96,
            color: "#111214",
            marginBottom: 16,
            maxWidth: 800,
          }}
        >
          La P en el teléfono.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 17,
            color: "#4A4A47",
            lineHeight: 1.45,
            maxWidth: 580,
            letterSpacing: "-0.005em",
          }}
        >
          Icono, splash, lock screen y notificaciones. Lo que la marca toca
          fuera de la app.
        </p>
      </div>

      {/* Icon scales */}
      <div
        style={{
          padding: "48px",
          borderRadius: 28,
          background: "#FFFFFF",
          border: "1px solid rgba(17,18,20,0.06)",
          marginBottom: 24,
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div className="flex items-end gap-6">
          <IconWithLabel size={180} label="1024" />
          <IconWithLabel size={120} label="180" />
          <IconWithLabel size={80} label="120" />
          <IconWithLabel size={60} label="60" />
        </div>
        <div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8A8A85",
              marginBottom: 10,
            }}
          >
            App icon · iOS
          </div>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#111214",
              marginBottom: 14,
              lineHeight: 1.05,
            }}
          >
            P de Patio, con un punto.
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 14,
              color: "#4A4A47",
              lineHeight: 1.5,
              letterSpacing: "-0.005em",
              maxWidth: 480,
              marginBottom: 18,
            }}
          >
            La P geométrica con un punto debajo: el patio, el lugar donde
            sucede la comida. Gradient orgánico accent → ink para sentirse
            cocinada por el sol, no plana.
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <PatioMark size={32} monochrome tone="ink" />
              <span style={{ fontFamily: SF_TEXT, fontSize: 12, color: "#8A8A85" }}>
                Mono · ink
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PatioMark size={32} monochrome tone="light" />
              <span style={{ fontFamily: SF_TEXT, fontSize: 12, color: "#8A8A85" }}>
                Mono · light
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Phone moments grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32,
          justifyItems: "center",
          marginBottom: 24,
        }}
      >
        <PhoneFrame label="Home screen" caption="Tu app entre las demás">
          <HomeScreen />
        </PhoneFrame>
        <PhoneFrame label="Splash" caption="Primer launch · 1.2s">
          <SplashScreen />
        </PhoneFrame>
        <PhoneFrame label="Lock screen · Push" caption="3 fonditas tuyas publicaron">
          <LockScreenPush />
        </PhoneFrame>
      </div>
    </div>
  );
}

function IconWithLabel({ size, label }: { size: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <PatioMark size={size} />
      <div
        style={{
          fontFamily: "'SF Mono', monospace",
          fontSize: 11,
          color: "#8A8A85",
          letterSpacing: "-0.005em",
        }}
      >
        {label}px
      </div>
    </div>
  );
}

function HomeScreen() {
  // Mock iOS home with wallpaper + app grid + Patio icon highlighted
  const apps = [
    { name: "Mensajes", color: "#34C759" },
    { name: "Mapa", color: "#5AC8FA" },
    { name: "Cámara", color: "#1c1c1e" },
    { name: "Patio", patio: true },
    { name: "Música", color: "#FA243C" },
    { name: "Notas", color: "#FFCC00" },
    { name: "Ajustes", color: "#8E8E93" },
    { name: "App Store", color: "#0A84FF" },
  ];

  return (
    <div className="absolute inset-0" style={{ overflow: "hidden" }}>
      <RandomImage
        seed={1}
        objectPosition="center"
        overlay="linear-gradient(180deg, rgba(17,18,20,0.5) 0%, rgba(17,18,20,0.75) 60%, rgba(17,18,20,0.9) 100%)"
      />
      <StatusBar dark />

      {/* search pill */}
      <div
        className="absolute"
        style={{
          top: 64,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "6px 18px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.25)",
          fontFamily: SF_TEXT,
          fontSize: 13,
          color: "#fff",
          fontWeight: 500,
        }}
      >
        Buscar
      </div>

      {/* app grid */}
      <div
        className="absolute"
        style={{
          left: 28,
          right: 28,
          top: 180,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "26px 18px",
        }}
      >
        {apps.map((a) => (
          <div key={a.name} className="flex flex-col items-center gap-1.5">
            {a.patio ? (
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <PatioMark size={62} />
              </motion.div>
            ) : (
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 14,
                  background: a.color,
                  boxShadow: "0 4px 12px -4px rgba(0,0,0,0.3)",
                }}
              />
            )}
            <span
              style={{
                fontFamily: SF_TEXT,
                fontSize: 11,
                color: "#fff",
                fontWeight: a.patio ? 600 : 500,
                letterSpacing: "-0.005em",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              {a.name}
            </span>
          </div>
        ))}
      </div>

      {/* dock */}
      <div
        className="absolute"
        style={{
          left: 16,
          right: 16,
          bottom: 28,
          padding: "16px 20px",
          borderRadius: 32,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        {["#0A84FF", "#34C759", "#5856D6", "#FF9500"].map((c, i) => (
          <div
            key={i}
            style={{ width: 56, height: 56, borderRadius: 13, background: c }}
          />
        ))}
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #FBE7DD 0%, #F8F8F5 50%, #F0EBE3 100%)",
        overflow: "hidden",
      }}
    >
      <StatusBar dark />

      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          right: "10%",
          height: "60%",
          background:
            "radial-gradient(circle at center, rgba(242,97,47,0.18) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div
        className="absolute flex flex-col items-center"
        style={{ left: 0, right: 0, top: 280 }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
        >
          <PatioMark size={104} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#111214",
            marginTop: 28,
            lineHeight: 1,
          }}
        >
          Patio
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            fontWeight: 500,
            color: "#8A8A85",
            marginTop: 8,
            letterSpacing: "0.04em",
          }}
        >
          ¿Qué hay hoy de comer?
        </motion.div>
      </div>

      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 50,
          textAlign: "center",
          fontFamily: SF_TEXT,
          fontSize: 11,
          color: "#8A8A85",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Hecho en CDMX
      </div>
    </div>
  );
}

function LockScreenPush() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: "#0a0b0d",
        overflow: "hidden",
      }}
    >
      <RandomImage
        seed={5}
        objectPosition="center 20%"
        overlay="linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.85) 100%)"
      />

      {/* Lock screen clock */}
      <div
        className="absolute text-center"
        style={{ top: 78, left: 0, right: 0 }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "-0.005em",
          }}
        >
          martes, 7 de junio
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 84,
            fontWeight: 200,
            color: "#fff",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            marginTop: 4,
          }}
        >
          13:02
        </div>
      </div>

      {/* Notifications stack */}
      <div
        className="absolute"
        style={{
          left: 12,
          right: 12,
          top: 308,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <NotifCard
          time="ahora"
          title="Lupita acaba de publicar"
          body="Tinga · Bistec a la mexicana · $55"
        />
        <NotifCard
          time="hace 12 min"
          title="Doña Mago abrió"
          body="Hoy hay mole verde 🌿 $70"
          stacked
        />
        <NotifCard
          time="hace 38 min"
          title="3 fonditas guardadas publicaron"
          body="Toca para ver el resumen del día"
          stacked
          deep
        />
      </div>
    </div>
  );
}

function NotifCard({
  time,
  title,
  body,
  stacked,
  deep,
}: {
  time: string;
  title: string;
  body: string;
  stacked?: boolean;
  deep?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: deep ? 0.5 : stacked ? 0.75 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      style={{
        padding: "12px 14px",
        borderRadius: 18,
        background: "rgba(40,40,42,0.7)",
        backdropFilter: "blur(30px) saturate(160%)",
        WebkitBackdropFilter: "blur(30px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        gap: 11,
        transform: deep ? "scale(0.94)" : stacked ? "scale(0.97)" : "scale(1)",
      }}
    >
      <PatioMark size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "-0.005em",
            }}
          >
            PATIO
          </span>
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {time}
          </span>
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.005em",
            marginTop: 1,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "-0.005em",
            marginTop: 1,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {body}
        </div>
      </div>
    </motion.div>
  );
}
