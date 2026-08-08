const KELIMELER = [
  "D/Y/B sonuç girişi",
  "Konu bazlı zayıflık analizi",
  "Tekrar havuzu",
  "Veli paneli",
  "Koç paneli",
  "Net takibi",
  "Haftalık özet",
  "%55 zayıflık eşiği",
];

function Row({ ters }: { ters?: boolean }) {
  const items = [...KELIMELER, ...KELIMELER, ...KELIMELER];
  return (
    <div className={`lp-strip-track${ters ? " lp-strip-reverse" : ""}`} aria-hidden="true">
      {items.map((k, i) => (
        <span className="lp-strip-item" key={`${k}-${i}`}>
          {k}
          <span className="lp-strip-sep" />
        </span>
      ))}
    </div>
  );
}

/** Bölüm aralarını dolduran, zıt yönlerde akan ürün anahtar kelime şeridi. */
export default function KeywordStrip() {
  return (
    <div className="lp-strip">
      <Row />
      <Row ters />
    </div>
  );
}
