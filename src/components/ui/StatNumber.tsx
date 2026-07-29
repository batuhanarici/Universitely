export default function StatNumber({
  deger,
  etiket,
  renk = "var(--color-gold)",
  boyut = 42,
}: {
  deger: string | number;
  etiket: string;
  renk?: string;
  boyut?: number;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: boyut,
          fontWeight: 600,
          color: renk,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {deger}
      </div>
      <div style={{ fontSize: 12, color: "rgba(245,246,244,0.65)", marginTop: 4, letterSpacing: 0.3 }}>
        {etiket}
      </div>
    </div>
  );
}
