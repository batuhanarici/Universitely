import { useEffect, useState } from "react";
import { kendiTekrarHavuzunuGetir, kendiSonuclariniGetir } from "../../lib/ogrenciQueries";
import { gorevleriGetir } from "../../lib/gorevQueries";
import { tekrarPlanlariniGetir } from "../../lib/tekrarPlanQueries";
import { yanlislariGetir } from "../../lib/yanlisQueries";
import { Card, Badge, EmptyState } from "../../components/ui";
import { Icon } from "../../components/Icon";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Hatirlatma {
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
          liste.push({ baslik: `${kalanTekrar} soru tekrar havuzunda`, detay: "Yanlış/boş bıraktığın soruları tekrar etmeyi unutma.", oncelik: "yuksek" });
        }

        const bugunBitmemis = gorevler.filter((g) => g.tarih === bugun && !g.tamamlandi);
        if (bugunBitmemis.length > 0) {
          liste.push({ baslik: `${bugunBitmemis.length} bugünkü görev tamamlanmamış`, detay: bugunBitmemis.map((g) => g.baslik).join(" · "), oncelik: "normal" });
        }

        const bugunkuTekrar = planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi);
        if (bugunkuTekrar.length > 0) {
          liste.push({ baslik: `${bugunkuTekrar.length} tekrar bugün sırada`, detay: bugunkuTekrar.map((p) => p.aciklama).join(" · "), oncelik: "yuksek" });
        }

        const cozulmemis = yanlislar.filter((y) => !y.cozuldu).length;
        if (cozulmemis > 0) {
          liste.push({ baslik: `${cozulmemis} çözülmemiş yanlış arşivde`, detay: "Yanlışlar sekmesinden tekrarına ekleyebilirsin.", oncelik: "normal" });
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
          liste.push({ baslik: `${zayif.length} konuda performansın düşük`, detay: zayif.slice(0, 4).join(" · "), oncelik: "normal" });
        }

        setHatirlatmalar(liste);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Bildirimler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Bekleyen hatırlatmalar</p>
      </div>

      {hatirlatmalar.length === 0 ? (
        <Card>
          <EmptyState icon="✅" title="Her şey yolunda!" desc="Bekleyen hatırlatma yok. Harika bir gün!" />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {hatirlatmalar.map((h, i) => {
            const yuksek = h.oncelik === "yuksek";
            return (
              <Card
                key={`${h.baslik}-${i}`}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  borderLeft: yuksek ? "4px solid #B05342" : "4px solid #E4BB60",
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2, color: yuksek ? "#B05342" : "#A07C20" }}>
                  <Icon name={yuksek ? "alert" : "bell"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0F1B2D" }}>{h.baslik}</p>
                    <Badge variant={yuksek ? "brick" : "gold"}>{yuksek ? "Öncelikli" : "Normal"}</Badge>
                  </div>
                  <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.6)", marginTop: 4 }}>{h.detay}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
