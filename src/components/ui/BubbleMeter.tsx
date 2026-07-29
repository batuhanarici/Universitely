interface Props {
  oran: number; // 0-100
  toplamBalon?: number;
  boyut?: number;
  gecikmeBaslangic?: number;
}

function tierRenk(oran: number) {
  if (oran < 55) return "var(--color-alert)";
  if (oran < 80) return "var(--color-gold-deep)";
  return "var(--color-success)";
}

export default function BubbleMeter({ oran, toplamBalon = 10, boyut = 11, gecikmeBaslangic = 0 }: Props) {
  const doluSayisi = Math.round((oran / 100) * toplamBalon);
  const renk = tierRenk(oran);

  return (
    <div style={{ display: "flex", gap: 4 }} aria-label={`Yüzde ${oran} başarı`}>
      {Array.from({ length: toplamBalon }).map((_, i) => {
        const dolu = i < doluSayisi;
        return (
          <span
            key={i}
            className="bubble-pop"
            style={{
              animationDelay: `${gecikmeBaslangic + i * 35}ms`,
              width: boyut,
              height: boyut,
              borderRadius: "50%",
              display: "inline-block",
              background: dolu ? renk : "transparent",
              border: `1.5px solid ${dolu ? renk : "var(--color-line)"}`,
              boxSizing: "border-box",
            }}
          />
        );
      })}
    </div>
  );
}
