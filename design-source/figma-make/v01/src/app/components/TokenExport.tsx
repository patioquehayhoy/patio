import { useState } from "react";
import { Copy, Check } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";
const SF_MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', monospace";

const TOKENS_JSON = `{
  "patio": {
    "color": {
      "bg":         { "value": "#F8F8F5" },
      "surface":    { "value": "#FFFFFF" },
      "ink":        { "value": "#111214" },
      "ink-soft":   { "value": "#4A4A47" },
      "ink-mute":   { "value": "#8A8A85" },
      "line":       { "value": "rgba(17,18,20,0.08)" },
      "accent":     { "value": "#F2612F" },
      "accent-dark":{ "value": "#FF6A3D" },
      "accent-soft":{ "value": "#FBE7DD" },
      "glass":      { "value": "rgba(255,255,255,0.62)" }
    },
    "radius": {
      "chip":  { "value": 14 },
      "card":  { "value": 18 },
      "sheet": { "value": 28 },
      "phone": { "value": 44 }
    },
    "spacing": {
      "xs":  { "value": 4 },
      "sm":  { "value": 8 },
      "md":  { "value": 12 },
      "lg":  { "value": 16 },
      "xl":  { "value": 22 },
      "2xl": { "value": 32 },
      "3xl": { "value": 56 }
    },
    "motion": {
      "sheet-spring":     { "stiffness": 380, "damping": 32 },
      "press-scale":      { "to": 0.96, "duration": 120, "ease": "easeOut" },
      "enter-editorial":  { "y": 12, "duration": 320, "ease": [0.25,1,0.5,1] },
      "pin-pulse":        { "scale": [1, 1.06, 1], "duration": 1800 }
    }
  }
}`;

const TAILWIND_JS = `// tailwind.config.js · NativeWind ready
module.exports = {
  theme: {
    extend: {
      colors: {
        patio: {
          bg:          "#F8F8F5",
          surface:     "#FFFFFF",
          ink:         "#111214",
          "ink-soft":  "#4A4A47",
          "ink-mute":  "#8A8A85",
          accent:      "#F2612F",
          "accent-d":  "#FF6A3D",
          "accent-s":  "#FBE7DD",
        },
      },
      borderRadius: {
        chip:  "14px",
        card:  "18px",
        sheet: "28px",
      },
      fontFamily: {
        display: ["SF Pro Display", "system-ui"],
        text:    ["SF Pro Text", "system-ui"],
      },
    },
  },
}`;

type Tab = "json" | "tailwind";

export function TokenExport() {
  const [tab, setTab] = useState<Tab>("json");
  const [copied, setCopied] = useState(false);

  const content = tab === "json" ? TOKENS_JSON : TAILWIND_JS;

  const handleCopy = () => {
    navigator.clipboard?.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "80px auto 0",
        padding: "48px 48px 48px",
        borderRadius: 36,
        background: "#111214",
        display: "grid",
        gridTemplateColumns: "1fr 1.5fr",
        gap: 48,
        alignItems: "start",
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
          Export · Listo para Expo
        </div>
        <h2
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: "#F8F8F5",
            marginBottom: 18,
          }}
        >
          Copia, pega, corre.
        </h2>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 15,
            color: "rgba(248,248,245,0.55)",
            lineHeight: 1.5,
            marginBottom: 28,
            letterSpacing: "-0.005em",
          }}
        >
          Los mismos tokens que ves arriba, exportados como Design Tokens (W3C)
          o directo en config de NativeWind.
        </p>

        <div className="flex flex-col gap-1.5">
          {[
            { label: "Funciona con Style Dictionary", on: true },
            { label: "Funciona con Tokens Studio (Figma)", on: true },
            { label: "NativeWind v4 compatible", on: true },
            { label: "Sin dependencias runtime", on: true },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2"
              style={{
                fontFamily: SF_TEXT,
                fontSize: 13,
                color: "rgba(248,248,245,0.7)",
                letterSpacing: "-0.005em",
              }}
            >
              <Check size={13} color="#FF6A3D" strokeWidth={2.5} />
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderRadius: 22,
          background: "#0a0b0d",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="flex gap-1">
            <TabBtn active={tab === "json"} onClick={() => setTab("json")}>
              tokens.json
            </TabBtn>
            <TabBtn active={tab === "tailwind"} onClick={() => setTab("tailwind")}>
              tailwind.config.js
            </TabBtn>
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 11px",
              borderRadius: 10,
              background: copied ? "#1F9D55" : "rgba(255,106,61,0.15)",
              border: `1px solid ${copied ? "#1F9D55" : "rgba(255,106,61,0.3)"}`,
              color: copied ? "#fff" : "#FF6A3D",
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 180ms ease",
            }}
          >
            {copied ? <Check size={12} strokeWidth={2.6} /> : <Copy size={12} strokeWidth={2.4} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "20px 22px",
            fontFamily: SF_MONO,
            fontSize: 12.5,
            lineHeight: 1.65,
            color: "#E8E8E3",
            overflow: "auto",
            maxHeight: 480,
            letterSpacing: "-0.005em",
          }}
        >
          {syntaxHighlight(content)}
        </pre>
      </div>
    </div>
  );
}

function TabBtn({
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
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        background: active ? "rgba(255,255,255,0.06)" : "transparent",
        border: "none",
        color: active ? "#F8F8F5" : "rgba(248,248,245,0.45)",
        fontFamily: SF_MONO,
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function syntaxHighlight(code: string) {
  // Simple highlight: strings orange, numbers accent, keys soft
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"') j++;
      const isKey = code.slice(j + 1).match(/^\s*:/);
      const str = code.slice(i, j + 1);
      parts.push(
        <span key={key++} style={{ color: isKey ? "#F8F8F5" : "#FF6A3D" }}>
          {str}
        </span>,
      );
      i = j + 1;
    } else if (/[0-9]/.test(ch) && !/[a-zA-Z]/.test(code[i - 1] || "")) {
      let j = i;
      while (j < code.length && /[0-9.]/.test(code[j])) j++;
      parts.push(
        <span key={key++} style={{ color: "#FBE7DD" }}>
          {code.slice(i, j)}
        </span>,
      );
      i = j;
    } else if (code.slice(i, i + 2) === "//") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      parts.push(
        <span key={key++} style={{ color: "rgba(248,248,245,0.35)" }}>
          {code.slice(i, j)}
        </span>,
      );
      i = j;
    } else {
      parts.push(
        <span key={key++} style={{ color: "rgba(248,248,245,0.7)" }}>
          {ch}
        </span>,
      );
      i++;
    }
  }
  return parts;
}
