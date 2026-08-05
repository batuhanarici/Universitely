import { useEffect, useState } from "react";
import { motorVerisiniGetir, onerileriUret, type Oneri } from "../../lib/oneriMotoru";

const RENK: Record<Oneri["oncelik"], { arka: string; yazi: string; etiket: string }> = {
  yuksek: { arka: "rgba(255,214,102,0.18)", yazi: "var(--gold-dim)", etiket: "Öncelikli" },
  orta: { arka: "#f5f2ec", yazi: "#8a6d3b", etiket: "Dikkat" },
  dusuk: { arka: "rgba(46,183,124,0.12)", yazi: "var(--dogru)", etiket: "İyi Gidiyorsun" },
};

export default function Oneriler() {
  const [oneriler, setOneriler] = useState<Oneri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  async function yukle(yenile: boolean) {
    if (yenile) setYenileniyor(true);
    try {
      const v = await motorVerisiniGetir();
      setOneriler(onerileriUret(v));
    } catch {
      setOneriler([]);
    } finally {
      setYukleniyor(false);
      setYenileniyor(false);
    }
  }

  useEffect(() => {
    yukle(false);
  }, []);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>AI Koçum</h1>
        <button onClick={() => yukle(true)} disabled={yenileniyor} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>
          {yenileniyor ? "Analiz…" : "Yenile"}
        </button>
      </div>

      <p className="stagger-item mono" style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 16 }}>
        {oneriler.length === 0
          ? "Verilerine göre henüz bir öneri üretilemedi. Biraz veri girdikçe (deneme sonucu, çalışma, yanlış) öneriler burada belirecek."
          : "Verilerine göre üretilen bugünkü odak noktaların."}
      </p>

      {oneriler.map((on, i) => {
        const r = RENK[on.oncelik];
        return (
          <div
            key={i}
            className="card stagger-item"
            style={{ marginBottom: 12, animationDelay: `${0.05 + i * 0.05}s`, borderLeft: `3px solid ${on.oncelik === "yuksek" ? "var(--gold-dim)" : on.oncelik === "orta" ? "#c8b183" : "var(--dogru)"}` }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{on.ikon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{on.kategori}</span>
                  <span className="mono" style={{ fontSize: 11, color: r.yazi, background: r.arka, padding: "2px 8px", borderRadius: 999 }}>{r.etiket}</span>
                </div>
                <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{on.baslik}</p>
                <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{on.detay}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
