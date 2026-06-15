import { StatusBar } from "./PhoneFrame";
import { Bookmark, MapPin, Clock } from "lucide-react";
import { TabBar } from "./TabBar";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

const SAVED = [
  {
    name: "Fonda Lupita",
    area: "Roma Norte · 420 m",
    today: "Tinga · Bistec a la mexicana",
    price: "$55",
    open: true,
    seed: 2,
  },
  {
    name: "Cocina Doña Mago",
    area: "Condesa · 1.2 km",
    today: "Mole verde · Pollo en pipián",
    price: "$70",
    open: true,
    seed: 4,
  },
  {
    name: "El Comedor de Ana",
    area: "Juárez · 800 m",
    today: null,
    price: null,
    open: false,
    nextOpen: "Mañana 13:00",
    seed: 6,
  },
  {
    name: "Fonda 5 de Mayo",
    area: "Centro · 2.4 km",
    today: "Chiles rellenos · Albóndigas",
    price: "$48",
    open: true,
    seed: 0,
  },
];

export function FoodieSaved() {
  return (
    <div className="absolute inset-0" style={{ background: "#F8F8F5" }}>
      <StatusBar dark />

      <div
        style={{
          padding: "62px 22px 16px",
        }}
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
          4 fonditas
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#111214",
            marginBottom: 4,
          }}
        >
          Tus guardados
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "#8A8A85",
          }}
        >
          2 con menú hoy · 1 cerrada · 1 esperando
        </div>
      </div>

      <div
        style={{
          padding: "0 18px 100px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {SAVED.map((f, i) => (
          <SavedCard key={i} {...f} />
        ))}
      </div>

      <TabBar variant="foodie" active="saved" glass />
    </div>
  );
}

function SavedCard({
  name,
  area,
  today,
  price,
  open,
  nextOpen,
  seed,
}: {
  name: string;
  area: string;
  today: string | null;
  price: string | null;
  open: boolean;
  nextOpen?: string;
  seed: number;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: "1px solid rgba(17,18,20,0.06)",
        padding: 12,
        display: "flex",
        gap: 12,
        opacity: open ? 1 : 0.62,
      }}
    >
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          background: "#111214",
        }}
      >
        <RandomImage seed={seed} objectPosition="center 30%" desaturate={!open} />
      </div>
      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: open ? "#1F9D55" : "#8A8A85",
            }}
          />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: open ? "#1F9D55" : "#8A8A85",
            }}
          >
            {open ? "Hoy hay menú" : "Sin menú hoy"}
          </span>
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#111214",
            lineHeight: 1.1,
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        {today ? (
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 13,
              color: "#4A4A47",
              letterSpacing: "-0.005em",
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {today}
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5"
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              color: "#8A8A85",
              marginBottom: 6,
            }}
          >
            <Clock size={11} strokeWidth={2.2} />
            {nextOpen}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1"
            style={{ fontFamily: SF_TEXT, fontSize: 12, color: "#8A8A85" }}
          >
            <MapPin size={11} strokeWidth={2.2} />
            {area}
          </div>
          {price && (
            <span
              style={{
                fontFamily: SF_DISPLAY,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#F2612F",
              }}
            >
              {price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
