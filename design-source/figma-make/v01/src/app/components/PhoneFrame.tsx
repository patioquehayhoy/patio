import { ReactNode } from "react";

export function PhoneFrame({
  children,
  label,
  caption,
  tone = "light",
}: {
  children: ReactNode;
  label: string;
  caption?: string;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div className="flex flex-col items-center gap-4">
      {label && <div className="text-center">
        <div
          style={{
            fontFamily: "'SF Pro Display', -apple-system, system-ui, sans-serif",
            letterSpacing: "-0.01em",
            color: "#111214",
          }}
        >
          {label}
        </div>
        {caption && (
          <div
            style={{
              fontFamily: "'SF Pro Text', -apple-system, system-ui, sans-serif",
              color: "#8A8A85",
              marginTop: 2,
            }}
          >
            {caption}
          </div>
        )}
      </div>}
      <div
        className="relative"
        style={{
          width: 390,
          height: 844,
          borderRadius: 56,
          padding: 12,
          background:
            "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)",
          boxShadow:
            "0 50px 100px -20px rgba(0,0,0,0.25), 0 30px 60px -30px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 44,
            background: isDark ? "#111214" : "#F8F8F5",
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-50"
            style={{
              top: 11,
              width: 124,
              height: 36,
              borderRadius: 24,
              background: "#000",
            }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? "#fff" : "#111214";
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between z-40"
      style={{
        padding: "18px 32px 0",
        fontFamily: "'SF Pro Text', system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 600,
        color,
        letterSpacing: "-0.01em",
      }}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="11" viewBox="0 0 18 11" fill={color}>
          <rect x="0" y="6" width="3" height="5" rx="0.5" />
          <rect x="5" y="4" width="3" height="7" rx="0.5" />
          <rect x="10" y="2" width="3" height="9" rx="0.5" />
          <rect x="15" y="0" width="3" height="11" rx="0.5" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke={color} strokeWidth="1">
          <path d="M1 4.5C3 2.5 5.5 1.5 8 1.5C10.5 1.5 13 2.5 15 4.5" />
          <path d="M3 6.5C4.5 5 6.2 4.3 8 4.3C9.8 4.3 11.5 5 13 6.5" />
          <circle cx="8" cy="9" r="1" fill={color} />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={color} opacity="0.5" />
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill={color} />
          <rect x="23" y="4" width="1.5" height="4" rx="0.5" fill={color} opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
