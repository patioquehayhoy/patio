import { StatusBar } from "./PhoneFrame";
import { Search, X, Clock, MapPin, TrendingUp } from "lucide-react";
import { RandomImage } from "./RandomImage";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

const RESULTS = [
  { name: "Fonda Lupita", menu: "Tinga · Chiles rellenos", price: "$55", dist: "420 m", seed: 0 },
  { name: "El Caldero", menu: "Caldo tlalpeño · Bistec", price: "$60", dist: "650 m", seed: 1 },
  { name: "Fonda Doña Mago", menu: "Mole verde · Cecina", price: "$65", dist: "820 m", seed: 4 },
  { name: "La Comilona", menu: "Pancita · Pozole rojo", price: "$48", dist: "1.1 km", seed: 5 },
];

export function FoodieSearch({ empty = false }: { empty?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#F8F8F5" }}>
      <StatusBar dark />

      {/* Search bar */}
      <div
        className="absolute"
        style={{
          top: 58,
          left: 16,
          right: 16,
          padding: "12px 14px",
          borderRadius: 22,
          background: "#FFFFFF",
          border: "1px solid rgba(17,18,20,0.06)",
          boxShadow: "0 6px 18px -10px rgba(17,18,20,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={18} color="#F2612F" strokeWidth={2.4} />
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "#111214",
            flex: 1,
            letterSpacing: "-0.005em",
          }}
        >
          {empty ? "sushi vegano" : "caldo"}
          <span
            style={{
              display: "inline-block",
              width: 1.5,
              height: 16,
              background: "#F2612F",
              marginLeft: 2,
              verticalAlign: "-3px",
            }}
          />
        </span>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: "rgba(17,18,20,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={12} color="#4A4A47" strokeWidth={2.4} />
        </div>
      </div>

      {empty ? <EmptyState /> : <Results />}
    </div>
  );
}

function Results() {
  return (
    <div
      className="absolute"
      style={{ top: 118, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
    >
      <div className="flex items-center justify-between" style={{ padding: "8px 22px 14px" }}>
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#8A8A85",
          }}
        >
          4 fonditas · hoy
        </span>
        <span
          className="flex items-center gap-1"
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            color: "#F2612F",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <TrendingUp size={11} strokeWidth={2.4} />
          Más cerca
        </span>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {RESULTS.map((r) => (
          <div
            key={r.name}
            style={{
              padding: 12,
              borderRadius: 18,
              background: "#FFFFFF",
              border: "1px solid rgba(17,18,20,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                overflow: "hidden",
                position: "relative",
                background: "#EFEFE9",
                flexShrink: 0,
              }}
            >
              <RandomImage seed={r.seed} objectPosition="center" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: SF_DISPLAY,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#111214",
                  lineHeight: 1.15,
                  marginBottom: 2,
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: 11.5,
                  color: "#8A8A85",
                  letterSpacing: "-0.005em",
                  marginBottom: 4,
                }}
              >
                {r.menu}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-0.5"
                  style={{
                    fontFamily: SF_TEXT,
                    fontSize: 11,
                    color: "#8A8A85",
                  }}
                >
                  <MapPin size={9} strokeWidth={2.2} />
                  {r.dist}
                </span>
                <span style={{ color: "rgba(17,18,20,0.15)" }}>·</span>
                <span
                  className="flex items-center gap-0.5"
                  style={{
                    fontFamily: SF_TEXT,
                    fontSize: 11,
                    color: "#1F9D55",
                    fontWeight: 600,
                  }}
                >
                  <Clock size={9} strokeWidth={2.4} />
                  abierto
                </span>
              </div>
            </div>
            <div
              style={{
                fontFamily: SF_DISPLAY,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#F2612F",
              }}
            >
              {r.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="absolute flex flex-col items-center text-center"
      style={{ top: 180, left: 32, right: 32 }}
    >
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 46,
          background: "linear-gradient(135deg, #FBE7DD 0%, #F8F8F5 100%)",
          border: "1px solid rgba(242,97,47,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
          boxShadow: "0 12px 30px -12px rgba(242,97,47,0.25)",
        }}
      >
        <Search size={32} color="#F2612F" strokeWidth={2} />
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#F2612F",
          marginBottom: 8,
        }}
      >
        Sin resultados
      </div>
      <div
        style={{
          fontFamily: SF_DISPLAY,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: "#111214",
          marginBottom: 10,
        }}
      >
        Nadie está sirviendo eso hoy.
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 14,
          color: "#4A4A47",
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          marginBottom: 22,
        }}
      >
        Patio busca en menús del día, no en catálogos.
        Prueba algo más cercano a la comida corrida.
      </div>

      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#8A8A85",
          marginBottom: 12,
        }}
      >
        Prueba con
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {["caldo", "tinga", "mole", "pozole", "veggie"].map((t) => (
          <div
            key={t}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              background: "#FFFFFF",
              border: "1px solid rgba(17,18,20,0.08)",
              fontFamily: SF_TEXT,
              fontSize: 13,
              color: "#111214",
              fontWeight: 500,
              letterSpacing: "-0.005em",
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
