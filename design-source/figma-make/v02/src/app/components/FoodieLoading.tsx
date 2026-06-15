import { StatusBar } from "./PhoneFrame";
import { motion } from "motion/react";

const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

const shimmer = {
  background:
    "linear-gradient(90deg, rgba(17,18,20,0.05) 0%, rgba(17,18,20,0.1) 50%, rgba(17,18,20,0.05) 100%)",
  backgroundSize: "200% 100%",
};

export function FoodieLoading() {
  return (
    <div className="absolute inset-0" style={{ background: "#F8F8F5", overflow: "hidden" }}>
      <StatusBar dark />

      {/* faded map */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #E8EBE3 0%, #DCE2D4 50%, #D2DACB 100%)",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 390 844" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
          <g stroke="#F8F8F5" strokeWidth="14">
            <line x1="-20" y1="380" x2="410" y2="360" />
            <line x1="240" y1="-20" x2="260" y2="860" />
          </g>
        </svg>
      </div>

      {/* search bar skeleton */}
      <div
        className="absolute"
        style={{
          top: 62,
          left: 16,
          right: 16,
          padding: "12px 14px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.8)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Shimmer w={18} h={18} r={9} />
        <Shimmer w={160} h={14} r={4} />
      </div>

      {/* Loading spinner pulsing pin */}
      <motion.div
        className="absolute"
        style={{
          left: "50%",
          top: 380,
          transform: "translate(-50%, -50%)",
          width: 80,
          height: 80,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 40,
            background: "#F2612F",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 40,
            background: "#F2612F",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "#F2612F",
            boxShadow: "0 6px 16px -4px rgba(242,97,47,0.5)",
          }}
        />
      </motion.div>

      <div
        className="absolute text-center"
        style={{ left: 0, right: 0, top: 470 }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#F2612F",
          }}
        >
          Buscando alrededor
        </div>
      </div>

      {/* bottom sheet skeleton */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 8,
          background: "rgba(248,248,245,0.92)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          border: "1px solid rgba(255,255,255,0.7)",
          padding: "16px 20px 28px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 5,
            borderRadius: 3,
            background: "rgba(17,18,20,0.15)",
            margin: "0 auto 18px",
          }}
        />
        <div className="flex items-center gap-2 mb-3">
          <Shimmer w={120} h={11} r={4} />
        </div>
        <Shimmer w={180} h={28} r={6} />
        <div style={{ height: 18 }} />
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(17,18,20,0.05)",
          }}
        >
          <div style={{ marginBottom: 10 }}><Shimmer w="100%" h={12} r={4} /></div>
          <div style={{ marginBottom: 10 }}><Shimmer w="90%" h={12} r={4} /></div>
          <div style={{ marginBottom: 10 }}><Shimmer w="80%" h={12} r={4} /></div>
          <Shimmer w="70%" h={12} r={4} />
        </div>
      </div>
    </div>
  );
}

function Shimmer({
  w,
  h,
  r = 4,
}: {
  w: number | string;
  h: number;
  r?: number;
}) {
  return (
    <motion.div
      animate={{ backgroundPosition: ["0% 0%", "-200% 0%"] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      style={{
        width: w,
        height: h,
        borderRadius: r,
        ...shimmer,
      }}
    />
  );
}
