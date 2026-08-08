export default function KurulumEkrani() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ maxWidth: 480, borderLeft: "4px solid var(--color-gold)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: 10 }}>
          Kurulum gerekli
        </p>
        <h1 className="display" style={{ fontSize: 20, color: "var(--color-ink)", marginBottom: 10 }}>Supabase bağlantısı tanımlı değil</h1>
        <p style={{ fontSize: 13.5, color: "var(--color-gray)", lineHeight: 1.6 }}>
          Kök dizindeki <code className="mono">.env</code> dosyasına aşağıdaki değişkenleri ekleyip uygulamayı yeniden başlat:
        </p>
        <pre className="mono" style={{ background: "var(--color-surface-dim)", padding: 12, borderRadius: 8, fontSize: 12, margin: "12px 0", overflowX: "auto" }}>
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
        </pre>
        <p style={{ fontSize: 12.5, color: "var(--color-gray)" }}>
          Değerleri Supabase &gt; Ayarlar &gt; API anahtarları sayfasından alabilirsin. Uygulama, ortam değişkenleri eksikken
          bu ekranı gösterir ve çöker.
        </p>
      </div>
    </div>
  );
}