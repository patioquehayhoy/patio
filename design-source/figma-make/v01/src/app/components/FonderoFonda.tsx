import { StatusBar } from "./PhoneFrame";
import { MapPin, Clock, ChevronRight, LogOut, HelpCircle, Camera, Edit3 } from "lucide-react";
import { TabBar } from "./TabBar";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function FonderoFonda() {
  return (
    <div className="absolute inset-0" style={{ background: "#111214" }}>
      <StatusBar dark />

      {/* hero band */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          overflow: "hidden",
        }}
      >
        <RandomImage
          seed={6}
          objectPosition="center"
          overlay="linear-gradient(180deg, rgba(17,18,20,0.4) 0%, rgba(17,18,20,0.5) 60%, #111214 100%)"
        />
      </div>

      <div
        className="absolute"
        style={{ left: 22, right: 22, top: 130, zIndex: 5 }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FF6A3D",
            marginBottom: 6,
          }}
        >
          Tu fonda
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#F8F8F5",
            marginBottom: 8,
          }}
        >
          Fonda Lupita
        </div>
        <div
          className="flex items-center gap-3"
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "rgba(248,248,245,0.55)",
            letterSpacing: "-0.005em",
          }}
        >
          <span className="flex items-center gap-1">
            <MapPin size={12} strokeWidth={2} />
            Roma Norte
          </span>
          <span style={{ color: "rgba(248,248,245,0.2)" }}>·</span>
          <span className="flex items-center gap-1">
            <Clock size={12} strokeWidth={2} />
            13–17h · Lun–Vie
          </span>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: 250,
          left: 18,
          right: 18,
          bottom: 110,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Streak card */}
        <div
          style={{
            padding: "18px 18px 16px",
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(255,106,61,0.15) 0%, rgba(255,106,61,0.04) 100%)",
            border: "1px solid rgba(255,106,61,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "#FF6A3D",
              lineHeight: 0.9,
              minWidth: 56,
            }}
          >
            14
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: SF_TEXT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#FF6A3D",
                marginBottom: 3,
              }}
            >
              Días seguidos publicando
            </div>
            <div
              style={{
                fontFamily: SF_TEXT,
                fontSize: 13,
                color: "rgba(248,248,245,0.65)",
                letterSpacing: "-0.005em",
                lineHeight: 1.35,
              }}
            >
              Tu mejor racha. Mañana cumples 3 semanas.
            </div>
          </div>
        </div>

        <Group>
          <DRow
            icon={<Edit3 size={16} color="#FF6A3D" strokeWidth={2} />}
            title="Información de la fonda"
            sub="Nombre, dirección, horario"
          />
          <DRow
            icon={<Camera size={16} color="rgba(248,248,245,0.7)" strokeWidth={2} />}
            title="Foto de portada"
            sub="Sin foto · usando ambiente Patio"
          />
          <DRow
            icon={<Clock size={16} color="rgba(248,248,245,0.7)" strokeWidth={2} />}
            title="Horario por día"
            sub="Recordatorios automáticos"
            last
          />
        </Group>

        <Group>
          <DRow
            icon={<HelpCircle size={16} color="rgba(248,248,245,0.7)" strokeWidth={2} />}
            title="Soporte"
            sub="WhatsApp con el equipo"
          />
          <DRow
            icon={<LogOut size={16} color="rgba(248,248,245,0.6)" strokeWidth={2} />}
            title="Cerrar sesión"
            last
          />
        </Group>
      </div>

      <TabBar variant="fondero" active="me" />
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function DRow({
  icon,
  title,
  sub,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "12px 14px",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: "rgba(255,255,255,0.06)",
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
            fontSize: 14,
            fontWeight: 500,
            color: "#F8F8F5",
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
              fontSize: 11.5,
              color: "rgba(248,248,245,0.5)",
              marginTop: 2,
              letterSpacing: "-0.005em",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      <ChevronRight size={14} color="rgba(248,248,245,0.4)" strokeWidth={2} />
    </div>
  );
}
