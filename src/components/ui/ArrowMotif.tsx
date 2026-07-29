export default function ArrowMotif({ renk = "var(--color-gold)", genislik = 260, yukseklik = 140 }) {
  // Logo'daki ok motifinin sadeleştirilmiş, yükselen bir çizgi grafiği hali
  const yol = "M6 132 C 40 120, 70 96, 95 100 C 120 104, 130 70, 158 60 C 186 50, 196 24, 224 14";
  return (
    <svg
      width={genislik}
      height={yukseklik}
      viewBox="0 0 240 140"
      fill="none"
      style={{ position: "absolute", right: 0, top: 0, opacity: 0.9, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <path
        d={yol}
        stroke={renk}
        strokeWidth={3}
        strokeLinecap="round"
        className="arrow-draw"
        style={{ ["--arrow-length" as any]: 320 }}
      />
      <path d="M210 10 L224 14 L214 26" stroke={renk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        className="arrow-draw" style={{ ["--arrow-length" as any]: 40, animationDelay: "0.9s" }} fill="none" />
    </svg>
  );
}
