import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import img1 from "../../imports/ChatGPT_Image_Jun_6__2026__09_38_52_PM.png";
import img2 from "../../imports/ChatGPT_Image_Jun_6__2026__09_42_02_PM.png";
import img3 from "../../imports/ChatGPT_Image_Jun_7__2026__03_53_02_PM.png";
import img4 from "../../imports/ChatGPT_Image_Jun_7__2026__03_53_09_PM.png";
import img5 from "../../imports/ChatGPT_Image_Jun_7__2026__03_53_12_PM.png";
import img6 from "../../imports/ChatGPT_Image_Jun_7__2026__03_53_15_PM.png";
import img7 from "../../imports/ChatGPT_Image_Jun_7__2026__03_53_17_PM.png";
import img8 from "../../imports/ChatGPT_Image_Jun_7__2026__03_53_19_PM.png";

export const PATIO_IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8];

function pickRandom(exclude?: string) {
  const pool = exclude ? PATIO_IMAGES.filter((i) => i !== exclude) : PATIO_IMAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function RandomImage({
  rotate = false,
  intervalMs = 5000,
  className,
  style,
  objectPosition = "center",
  seed,
  overlay,
  desaturate,
}: {
  rotate?: boolean;
  intervalMs?: number;
  className?: string;
  style?: React.CSSProperties;
  objectPosition?: string;
  seed?: number;
  overlay?: string;
  desaturate?: boolean;
}) {
  const initial = useMemo(() => {
    if (typeof seed === "number") return PATIO_IMAGES[seed % PATIO_IMAGES.length];
    return pickRandom();
  }, [seed]);

  const [current, setCurrent] = useState<string>(initial);

  useEffect(() => {
    if (!rotate) return;
    const id = setInterval(() => {
      setCurrent((prev) => pickRandom(prev));
    }, intervalMs);
    return () => clearInterval(id);
  }, [rotate, intervalMs]);

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={current}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            filter: desaturate ? "saturate(0.35) brightness(0.85)" : undefined,
          }}
        />
      </AnimatePresence>
      {overlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: overlay,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
