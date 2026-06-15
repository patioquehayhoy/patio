import { Map, Bookmark, User, Sparkles, BarChart3 } from "lucide-react";

const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

type TabItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const FOODIE_TABS: TabItem[] = [
  { id: "map", label: "Hoy", icon: <Map size={20} strokeWidth={2} /> },
  { id: "saved", label: "Guardados", icon: <Bookmark size={20} strokeWidth={2} /> },
  { id: "me", label: "Yo", icon: <User size={20} strokeWidth={2} /> },
];

const FONDERO_TABS: TabItem[] = [
  { id: "publish", label: "Hoy", icon: <Sparkles size={20} strokeWidth={2} /> },
  { id: "history", label: "Historial", icon: <BarChart3 size={20} strokeWidth={2} /> },
  { id: "me", label: "Fonda", icon: <User size={20} strokeWidth={2} /> },
];

export function TabBar({
  variant,
  active,
  glass,
}: {
  variant: "foodie" | "fondero";
  active: string;
  glass?: boolean;
}) {
  const tabs = variant === "foodie" ? FOODIE_TABS : FONDERO_TABS;
  const isDark = variant === "fondero";

  return (
    <div
      className="absolute z-40"
      style={{
        left: 12,
        right: 12,
        bottom: 14,
        padding: "8px 10px",
        borderRadius: 28,
        background: isDark
          ? "rgba(20,21,24,0.78)"
          : glass
          ? "rgba(255,255,255,0.78)"
          : "rgba(248,248,245,0.92)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.85)",
        boxShadow: isDark
          ? "0 10px 30px -10px rgba(0,0,0,0.5)"
          : "0 10px 30px -10px rgba(17,18,20,0.18)",
        display: "flex",
        gap: 4,
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        const accent = isDark ? "#FF6A3D" : "#F2612F";
        const ink = isDark ? "#F8F8F5" : "#111214";
        const mute = isDark ? "rgba(248,248,245,0.4)" : "#8A8A85";
        return (
          <button
            key={t.id}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: 20,
              border: "none",
              background: isActive
                ? isDark
                  ? "rgba(255,106,61,0.14)"
                  : "rgba(242,97,47,0.1)"
                : "transparent",
              color: isActive ? accent : mute,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            {t.icon}
            <span
              style={{
                fontFamily: SF_TEXT,
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.005em",
                color: isActive ? accent : isDark ? "rgba(248,248,245,0.55)" : ink,
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
      {/* iOS home indicator */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -10,
          transform: "translateX(-50%)",
          width: 134,
          height: 5,
          borderRadius: 3,
          background: isDark ? "rgba(248,248,245,0.5)" : "rgba(17,18,20,0.35)",
        }}
      />
    </div>
  );
}
