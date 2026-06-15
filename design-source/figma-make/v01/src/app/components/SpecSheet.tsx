const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";
const SF_MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', monospace";

export function SpecSheet() {
  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "120px auto 0",
        padding: "56px 56px 64px",
        borderRadius: 36,
        background: "#FFFFFF",
        border: "1px solid rgba(17,18,20,0.06)",
        boxShadow: "0 30px 80px -30px rgba(17,18,20,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div>
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
            Sistema · v0.1 · Handoff Expo
          </div>
          <h2
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 0.95,
              color: "#111214",
              maxWidth: 700,
            }}
          >
            Tokens, espaciado y motion.
          </h2>
        </div>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "#8A8A85",
            textAlign: "right",
            maxWidth: 280,
            letterSpacing: "-0.005em",
          }}
        >
          Todo aquí se traduce 1:1 a React Native con NativeWind o StyleSheet.
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        {/* COLOR */}
        <Section title="Color" subtitle="Paleta cerrada · sin amarillo">
          <TokenTable
            rows={[
              ["patio.bg", "#F8F8F5", "Lienzo Foodie"],
              ["patio.surface", "#FFFFFF", "Cards, menús"],
              ["patio.ink", "#111214", "Texto, Fondero bg"],
              ["patio.ink/soft", "#4A4A47", "Subtítulos"],
              ["patio.ink/mute", "#8A8A85", "Captions"],
              ["patio.line", "rgba(17,18,20,0.08)", "Borders, dashes"],
              ["patio.accent", "#F2612F", "Light accent"],
              ["patio.accent/dark", "#FF6A3D", "Dark accent"],
              ["patio.accent/soft", "#FBE7DD", "Backgrounds tibios"],
              ["patio.glass", "rgba(255,255,255,0.62)", "Capas glass"],
            ]}
          />
        </Section>

        {/* TYPE */}
        <Section title="Tipografía" subtitle="SF Pro · jerarquía editorial extrema">
          <TypeRow size={48} weight={800} tracking="-0.035em" label="Display / Hero" sample="¿Qué hay hoy?" />
          <TypeRow size={36} weight={800} tracking="-0.03em" label="Title / Page" sample="Fonda Lupita" />
          <TypeRow size={22} weight={700} tracking="-0.02em" label="Section" sample="Menú del día" />
          <TypeRow size={15} weight={400} tracking="-0.01em" label="Body" sample="Tinga de pollo · Bistec a la mexicana" font="text" />
          <TypeRow size={11} weight={700} tracking="0.12em" upper label="Eyebrow" sample="MENÚ DEL DÍA · HOY" font="text" />
          <TypeRow size={12} weight={500} tracking="0" label="Caption" sample="420 m · 5 min" font="text" color="#8A8A85" />
        </Section>

        {/* SPACING */}
        <Section title="Espaciado" subtitle="Base 4 · pasos editoriales">
          <SpacingBar value={4} label="xs" />
          <SpacingBar value={8} label="sm" />
          <SpacingBar value={12} label="md" />
          <SpacingBar value={16} label="lg" />
          <SpacingBar value={22} label="xl · gutter screen" />
          <SpacingBar value={32} label="2xl · section" />
          <SpacingBar value={56} label="3xl · hero" />
        </Section>

        {/* RADIUS + ELEVATION */}
        <Section title="Radios & elevación" subtitle="Glass orgánico · sombras suaves">
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
            <RadiusChip radius={14} label="chip · 14" />
            <RadiusChip radius={18} label="card · 18" />
            <RadiusChip radius={28} label="sheet · 28" />
          </div>
          <ElevationRow
            label="elev/glass"
            shadow="0 8px 24px -8px rgba(17,18,20,0.12)"
            note="Bottom-sheets, search bars"
          />
          <ElevationRow
            label="elev/card"
            shadow="0 4px 12px -4px rgba(17,18,20,0.1)"
            note="Pins, chips elevados"
          />
          <ElevationRow
            label="elev/cta-accent"
            shadow="0 10px 30px -10px rgba(255,106,61,0.5)"
            note="CTA Fondero"
            accent
          />
        </Section>

        {/* MOTION */}
        <Section title="Motion" subtitle="Spring iOS · sin distracciones" full>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <MotionCard
              name="sheet.spring"
              detail="stiffness 380 · damping 32"
              use="Bottom-sheet Foodie"
            />
            <MotionCard
              name="press.scale"
              detail="0.96 · 120ms · easeOut"
              use="CTAs y chips"
            />
            <MotionCard
              name="enter.editorial"
              detail="opacity + y(12) · 320ms · easeOutQuart"
              use="Aparición de menú"
            />
            <MotionCard
              name="pin.pulse"
              detail="scale 1 → 1.08 · 1.8s loop"
              use="Pin abierto ahora"
            />
            <MotionCard
              name="success.confetti"
              detail="solo Fondero al publicar"
              use="Refuerzo positivo"
            />
            <MotionCard
              name="glass.parallax"
              detail="map y * 0.3 al arrastrar sheet"
              use="Profundidad real"
            />
          </div>
        </Section>

        {/* COMPONENTS */}
        <Section title="Componentes base" subtitle="11 primitivos cubren el 90% de la app" full>
          <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              "ButtonAccent",
              "ButtonInk",
              "ButtonGlass",
              "ChipFilter",
              "GlassCard",
              "MenuRow",
              "CourseInput",
              "PinPrice",
              "BottomSheet",
              "StatusDot",
              "EyebrowLabel",
            ].map((c) => (
              <div
                key={c}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#F8F8F5",
                  border: "1px solid rgba(17,18,20,0.06)",
                  fontFamily: SF_MONO,
                  fontSize: 13,
                  color: "#111214",
                  letterSpacing: "-0.01em",
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  full,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? "span 2" : "auto" }}>
      <div className="flex items-baseline gap-3 mb-6">
        <h3
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#111214",
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "#8A8A85",
            letterSpacing: "-0.005em",
          }}
        >
          {subtitle}
        </span>
      </div>
      {children}
    </div>
  );
}

function TokenTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(17,18,20,0.06)",
        overflow: "hidden",
      }}
    >
      {rows.map(([name, hex, note], i) => (
        <div
          key={name}
          className="flex items-center gap-3"
          style={{
            padding: "10px 14px",
            borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(17,18,20,0.05)",
            background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF7",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: hex,
              border: "1px solid rgba(17,18,20,0.08)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: SF_MONO, fontSize: 12, color: "#111214", flex: 1 }}>
            {name}
          </span>
          <span style={{ fontFamily: SF_MONO, fontSize: 11, color: "#8A8A85" }}>{hex}</span>
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              color: "#8A8A85",
              minWidth: 110,
              textAlign: "right",
            }}
          >
            {note}
          </span>
        </div>
      ))}
    </div>
  );
}

function TypeRow({
  size,
  weight,
  tracking,
  label,
  sample,
  font = "display",
  upper,
  color = "#111214",
}: {
  size: number;
  weight: number;
  tracking: string;
  label: string;
  sample: string;
  font?: "display" | "text";
  upper?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid rgba(17,18,20,0.06)",
        display: "flex",
        alignItems: "baseline",
        gap: 20,
      }}
    >
      <div style={{ width: 120, flexShrink: 0 }}>
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#8A8A85",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontFamily: SF_MONO, fontSize: 11, color: "#111214" }}>
          {size}/{weight}
        </div>
      </div>
      <div
        style={{
          fontFamily: font === "display" ? SF_DISPLAY : SF_TEXT,
          fontSize: size,
          fontWeight: weight,
          letterSpacing: tracking,
          color,
          textTransform: upper ? "uppercase" : "none",
          lineHeight: 1.05,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {sample}
      </div>
    </div>
  );
}

function SpacingBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-4" style={{ marginBottom: 10 }}>
      <div style={{ width: 60, fontFamily: SF_MONO, fontSize: 12, color: "#111214" }}>
        {value}px
      </div>
      <div
        style={{
          height: 16,
          width: value * 2,
          background: "#F2612F",
          borderRadius: 4,
        }}
      />
      <div style={{ fontFamily: SF_TEXT, fontSize: 12, color: "#8A8A85" }}>{label}</div>
    </div>
  );
}

function RadiusChip({ radius, label }: { radius: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        style={{
          width: "100%",
          aspectRatio: 1,
          background: "linear-gradient(135deg, #FBE7DD 0%, #F2612F 100%)",
          borderRadius: radius,
        }}
      />
      <div style={{ fontFamily: SF_MONO, fontSize: 11, color: "#111214" }}>{label}</div>
    </div>
  );
}

function ElevationRow({
  label,
  shadow,
  note,
  accent,
}: {
  label: string;
  shadow: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: accent ? "#F2612F" : "#FFFFFF",
          border: accent ? "none" : "1px solid rgba(17,18,20,0.06)",
          boxShadow: shadow,
          flexShrink: 0,
        }}
      />
      <div className="flex-1">
        <div style={{ fontFamily: SF_MONO, fontSize: 12, color: "#111214" }}>{label}</div>
        <div style={{ fontFamily: SF_TEXT, fontSize: 11, color: "#8A8A85", marginTop: 1 }}>
          {note}
        </div>
      </div>
    </div>
  );
}

function MotionCard({
  name,
  detail,
  use,
}: {
  name: string;
  detail: string;
  use: string;
}) {
  return (
    <div
      style={{
        padding: "16px 16px 14px",
        borderRadius: 16,
        background: "#F8F8F5",
        border: "1px solid rgba(17,18,20,0.06)",
      }}
    >
      <div
        style={{
          fontFamily: SF_MONO,
          fontSize: 12,
          fontWeight: 600,
          color: "#F2612F",
          marginBottom: 6,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 14,
          color: "#111214",
          letterSpacing: "-0.01em",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {detail}
      </div>
      <div
        style={{
          fontFamily: SF_TEXT,
          fontSize: 12,
          color: "#8A8A85",
          letterSpacing: "-0.005em",
        }}
      >
        {use}
      </div>
    </div>
  );
}
