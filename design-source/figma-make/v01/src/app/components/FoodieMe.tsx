import { StatusBar } from "./PhoneFrame";
import {
  Bell,
  MapPin,
  Heart,
  Settings,
  ChevronRight,
  Send,
  Shield,
} from "lucide-react";
import { TabBar } from "./TabBar";
import { PatioMark } from "./PatioMark";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FoodieMe() {
  return (
    <div className="absolute inset-0" style={{ background: "#F8F8F5" }}>
      <StatusBar dark />

      <div style={{ padding: "62px 22px 12px" }}>
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
          Tu Patio
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#111214",
          }}
        >
          Foodie sin nombre.
        </div>
      </div>

      <div style={{ padding: "12px 18px 110px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Stats card */}
        <div
          style={{
            padding: "20px",
            borderRadius: 22,
            background: "linear-gradient(135deg, #FFFFFF 0%, #FBE7DD 100%)",
            border: "1px solid rgba(17,18,20,0.06)",
            boxShadow: "0 10px 28px -10px rgba(242,97,47,0.15)",
          }}
        >
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            <Stat n="12" l="fonditas vistas" />
            <Divider />
            <Stat n="4" l="guardadas" />
            <Divider />
            <Stat n="38" l="km caminados" />
          </div>
        </div>

        <Group label="Notificaciones">
          <Row
            icon={<Bell size={17} color="#F2612F" strokeWidth={2} />}
            title="Avísame cuando publiquen"
            sub="Activado para tus 4 guardadas"
            toggle
            on
          />
          <Row
            icon={<MapPin size={17} color="#F2612F" strokeWidth={2} />}
            title="Sugerencias cercanas"
            sub="Sólo entre 13–16 hrs"
            toggle
            on
          />
        </Group>

        <Group label="Patio">
          <Row
            icon={<Send size={17} color="#4A4A47" strokeWidth={2} />}
            title="Invitar a un amigo"
            sub="Compártelo por WhatsApp"
          />
          <Row
            icon={<Heart size={17} color="#4A4A47" strokeWidth={2} />}
            title="¿Tienes una fonda?"
            sub="Únete como fondero"
            accent
          />
          <Row
            icon={<Shield size={17} color="#4A4A47" strokeWidth={2} />}
            title="Privacidad"
            sub="Tu ubicación nunca sale del teléfono"
          />
          <Row
            icon={<Settings size={17} color="#4A4A47" strokeWidth={2} />}
            title="Ajustes"
            last
          />
        </Group>

        <div className="flex items-center justify-center gap-2" style={{ paddingTop: 12 }}>
          <PatioMark size={18} monochrome tone="ink" />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              color: "#8A8A85",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Patio · v0.1 · CDMX
          </span>
        </div>
      </div>

      <TabBar variant="foodie" active="me" glass />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#111214",
          lineHeight: 1,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 10.5,
          color: "#8A8A85",
          marginTop: 4,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {l}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: "rgba(17,18,20,0.08)", margin: "4px 0" }} />;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#8A8A85",
          padding: "0 6px 8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          borderRadius: 18,
          background: "#FFFFFF",
          border: "1px solid rgba(17,18,20,0.06)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  icon,
  title,
  sub,
  toggle,
  on,
  accent,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  toggle?: boolean;
  on?: boolean;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "14px 16px",
        borderBottom: last ? "none" : "1px solid rgba(17,18,20,0.05)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: accent ? "#FBE7DD" : "rgba(17,18,20,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 14.5,
            fontWeight: 500,
            color: accent ? "#F2612F" : "#111214",
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              color: "#8A8A85",
              marginTop: 2,
              letterSpacing: "-0.005em",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {toggle ? (
        <div
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            background: on ? "#1F9D55" : "#cbced4",
            padding: 2,
            display: "flex",
            justifyContent: on ? "flex-end" : "flex-start",
            transition: "all 200ms ease",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      ) : (
        <ChevronRight size={16} color="#8A8A85" strokeWidth={2} />
      )}
    </div>
  );
}
