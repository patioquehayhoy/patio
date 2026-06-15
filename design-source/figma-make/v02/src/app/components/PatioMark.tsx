export function PatioMark({
  size = 120,
  // `monochrome` kept for backward-compat; the mark is ALWAYS monochrome now
  // (no orange backgrounds — brand rule).
  monochrome,
  tone = "ink",
  rounded = true,
}: {
  size?: number;
  monochrome?: boolean;
  tone?: "ink" | "light";
  rounded?: boolean;
}) {
  const radius = rounded ? size * 0.225 : 0;

  // Only two valid lockups:
  //  - "ink":   dark tile  (#111214) + light "P" (#F8F8F5)
  //  - "light": light tile (#F8F8F5) + dark  "P" (#111214)
  const isLight = tone === "light";
  const bg = isLight ? "#F8F8F5" : "#111214";
  const markColor = isLight ? "#111214" : "#F8F8F5";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        position: "relative",
        overflow: "hidden",
        boxShadow: isLight
          ? "inset 0 0 0 1px rgba(17,18,20,0.08)"
          : "inset 0 0 0 1px rgba(248,248,245,0.06)",
      }}
    >
      {/* Real Patio "P" — official path */}
      <svg
        viewBox="0 0 432 432"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <path
          fill={markColor}
          d="M305.39,144.31h-146.32l-79.65,111.6h0l-22.68,31.78h53.9c14.24-19.95,37.23-31.78,61.73-31.78h53.36c54.35,0,116.44-25.03,138.4-55.8,21.96-30.77-4.39-55.8-58.75-55.8ZM247.52,225.4h-92.41l36.1-50.58h92.41c24.63,0,36.57,11.34,26.62,25.29-9.95,13.94-38.09,25.29-62.72,25.29Z"
        />
      </svg>
    </div>
  );
}
