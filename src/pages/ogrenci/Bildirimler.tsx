import { useEffect, useState } from "react";
import { kendiTekrarHavuzunuGetir, kendiSonuclariniGetir } from "../../lib/ogrenciQueries";
import { gorevleriGetir } from "../../lib/gorevQueries";
import { tekrarPlanlariniGetir } from "../../lib/tekrarPlanQueries";
import { yanlislariGetir } from "../../lib/yanlisQueries";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Hatirlatma {
  ikon: string;
  baslik: string;
  detay: string;
  oncelik: "yuksek" | "normal";
}

export default function Bildirimler() {
  const [hatirlatmalar, setHatirlatmalar] = useState<Hatirlatma[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([
      kendiTekrarHavuzunuGetir(),
      gorevleriGetir(),
      tekrarPlanlariniGetir(),
      yanlislariGetir(),
      kendiSonuclariniGetir(),
    ])
      .then(([havuz, gorevler, planlar, yanlislar, sonuclar]) => {
        const liste: Hatirlatma[] = [];
        const bugun = bugunIso();

        const kalanTekrar = havuz.filter((h) => !h.cozuldu).length;
        if (kalanTekrar > 0) {
          liste.push({ ikon: "🔁", baslik: `${kalanTekrar} soru tekrar havuzunda`, detay: "Yanlış/boş bıraktığın soruları tekrar etmeyi unutma.", oncelik: "yuksek" });
        }

        const bugunBitmemis = gorevler.filter((g) => g.tarih === bugun && !g.tamamlandi);
        if (bugunBitmemis.length > 0) {
          liste.push({ ikon: "✅", baslik: `${bugunBitmemis.length} bugünkü görev tamamlanmamış`, detay: bugunBitmemis.map((g) => g.baslik).join(" · "), oncelik: "normal" });
        }

        const bugunkuTekrar = planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi);
        if (bugunkuTekrar.length > 0) {
          liste.push({ ikon: "🗓️", baslik: `${bugunkuTekrar.length} tekrar bugün sırada`, detay: bugunkuTekrar.map((p) => p.aciklama).join(" · "), oncelik: "yuksek" });
        }

        const cozulmemis = yanlislar.filter((y) => !y.cozuldu).length;
        if (cozulmemis > 0) {
          liste.push({ ikon: "📝", baslik: `${cozulmemis} çözülmemiş yanlış arşivde`, detay: "Yanlışlar sekmesinden tekrarına ekleyebilirsin.", oncelik: "normal" });
        }

        const konuMap = new Map<string, { dogru: number; toplam: number }>();
        for (const s of sonuclar) {
          const m = konuMap.get(s.konu_adi) ?? { dogru: 0, toplam: 0 };
          m.toplam++;
          if (s.durum === "dogru") m.dogru++;
          konuMap.set(s.konu_adi, m);
        }
        const zayif = Array.from(konuMap.entries()).filter(([, v]) => v.toplam > 0 && (v.dogru / v.toplam) * 100 < 55).map(([k]) => k);
        if (zayif.length > 0) {
          liste.push({ ikon: "⚠️", baslik: `${zayif.length} konuda performansın düşük`, detay: zayif.slice(0, 4).join(" · "), oncelik: "normal" });
        }

        setHatirlatmalar(liste);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Bildirimler</h1>

      {hatirlatmalar.length === 0 ? (
        <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Şu an bekleyen bir hatırlatma yok. Her şey yolunda!</p>
        </div>
      ) : (
        hatirlatmalar.map((h, i) => (
          <div key={h.baslik} className="card stagger-item" style={{
            marginBottom: 12,
            animationDelay: `${0.05 + i * 0.06}s`,
            borderLeft: h.oncelik === "yuksek" ? "4px solid var(--yanlis)" : "4px solid var(--gold)",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 20 }}>{h.ikon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{h.baslik}</p>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{h.detay}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
