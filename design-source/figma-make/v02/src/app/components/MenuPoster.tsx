import { X } from "lucide-react";
import { motion } from "motion/react";
import { MenuOfDay, priceSummary } from "../data/menu";
import { MenuCard } from "./MenuCard";
import { PatioMark } from "./PatioMark";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

// Tarjeta vertical de marca: lo que se comparte como imagen (WhatsApp / stories).
// Reusa MenuCard para que coincida exactamente con lo que ve el foodie.
export function MenuPoster({ menu }: { menu: MenuOfDay }) {
  const price = priceSummary(menu);

  return (
    <div
      style={{
        width: 300,
        borderRadius: 26,
        background: "#F8F8F5",
        overflow: "hidden",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Encabezado de marca */}
      <div style={{ padding: "22px 22px 16px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <PatioMark size={30} tone="ink" />
          <span
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#111214",
            }}
          >
            ¿Qué hay hoy?
          </span>
        </div>

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
          {menu.dateLabel}
        </div>
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "#111214",
            marginBottom: 4,
          }}
        >
          {menu.businessName}
        </div>
        <div style={{ fontFamily: SF_TEXT, fontSize: 13, color: "#4A4A47" }}>
          {[menu.businessType, menu.area].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Menú */}
      <div
        style={{
          margin: "0 22px",
          padding: "18px",
          borderRadius: 18,
          background: "#FFFFFF",
          border: "1px solid rgba(17,18,20,0.06)",
        }}
      >
        <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8A8A85",
            }}
          >
            Menú del día
          </span>
          {price && (
            <span
              style={{
                fontFamily: SF_DISPLAY,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#F2612F",
              }}
            >
              {price}
            </span>
          )}
        </div>
        <MenuCard menu={menu} theme="light" variant="poster" />
      </div>

      {/* Firma */}
      <div
        style={{
          padding: "16px 22px 20px",
          textAlign: "center",
          fontFamily: SF_DISPLAY,
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#111214",
        }}
      >
        Saaaaaaabes.
      </div>
    </div>
  );
}

// Overlay a pantalla completa que muestra el póster con fondo oscuro y cierre.
export function MenuPosterOverlay({
  menu,
  onClose,
}: {
  menu: MenuOfDay;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        zIndex: 60,
        background: "rgba(8,9,11,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuPoster menu={menu} />
      </motion.div>

      <button
        onClick={onClose}
        style={{
          marginTop: 22,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={20} color="#F8F8F5" strokeWidth={2.2} />
      </button>
    </motion.div>
  );
}
