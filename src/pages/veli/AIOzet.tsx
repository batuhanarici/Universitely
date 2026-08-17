import { Card } from "../../components/ui";
import { useVeliVeri } from "./veliContext";
import { useVeliDerived } from "./veliDerived";

interface OzetKart {
  label: string;
  ikon: string;
  baslik: string;
  metin: string;
  renk: string;
}

export default function AIOzet() {
  const { yukleniyor, veri } = useVeliVeri();
  const d = useVeliDerived();

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const kartlar: OzetKart[] = (() => {
    const m: OzetKart[] = [];

    if (d.denemeler.length > 0) {
      const son = d.denemeler[d.denemeler.length - 1];
      const onceki = d.denemeler.slice(0, -1).map((x) => x.net);
      const oncekiOrt = onceki.length ? onceki.reduce((a, b) => a + b, 0) / onceki.length : null;
      const yukseliyor = oncekiOrt === null || son.net >= oncekiOrt;
      m.push({
        label: "Net Trendi",
        ikon: yukseliyor ? "📈" : "📉",
        baslik: yukseliyor ? `Son denemede ${son.net} net ile yükseliş var` : `Son denemede düşüş: ${son.net} net`,
        metin: `Önceki ortalama: ${oncekiOrt === null ? "—" : Math.round(oncekiOrt * 10) / 10}. ${yukseliyor ? "Harika bir gelişme! Devam edilmesi önerilir." : "Zayıf derslere odaklanmak gerekiyor."}`,
        renk: yukseliyor ? "#2A9D8F" : "#C4503A",
      });
    }

    const haftaSaat = Math.round((d.ozet.haftaSure / 60) * 10) / 10;
    m.push({
      label: "Çalışma Temposu",
      ikon: d.ozet.haftaSure > 210 ? "⚡" : "⏰",
      baslik: d.ozet.haftaSure > 0 ? `Bu hafta ${haftaSaat} saat çalışıldı — ${d.ozet.haftaSure > 210 ? "düzenli" : "az"}` : "Bu hafta çalışma kaydı yok",
      metin: d.ozet.haftaSure > 210
        ? "Çalışma temposu hedefin üzerinde. Bu ritmi korumak çok önemli."
        : d.ozet.haftaSure > 0
        ? "Haftada en az 3.5 saat çalışma hedefleniyor. Desteğe ihtiyaç olabilir."
        : "Çocuğun bu hafta hiç çalışma kaydı girmemiş. Koçla görüşme önerilir.",
      renk: d.ozet.haftaSure > 210 ? "#2A9D8F" : "#E4BB60",
    });

    if (d.dersler.length > 0) {
      const guclu = d.dersler[d.dersler.length - 1];
      const zayif = d.dersler[0];
      m.push({
        label: "Güçlü / Zayıf Ders",
        ikon: "🎯",
        baslik: `En güçlü: ${guclu.ad} (%${guclu.yuzde}) · En zayıf: ${zayif.ad} (%${zayif.yuzde})`,
        metin: `${zayif.ad} için koçla birlikte özel çalışma planı yapılması önerilir.`,
        renk: "#0F1B2D",
      });
    }

    if (veri.profil?.hedef_net != null && d.ort !== null) {
      const fark = Math.round((veri.profil.hedef_net - d.ort) * 10) / 10;
      m.push({
        label: "Hedefe Uzaklık",
        ikon: "🏹",
        baslik: `Hedef: ${veri.profil.hedef_net} net · Mevcut: ${Math.round(d.ort * 10) / 10} net`,
        metin: fark <= 0
          ? "Hedef netine ulaşmış veya aşmış görünüyor. Tebrikler!"
          : `Hedefe ${fark} net uzaklık var. ${fark < 20 ? "Hedef yaklaşıyor!" : "Odaklanmış çalışma gerekiyor."}`,
        renk: "#E4BB60",
      });
    }

    m.push({
      label: "Konu İlerlemesi",
      ikon: "📚",
      baslik: `${d.konuIlerleme.biten}/${d.konuIlerleme.toplam} konu tamamlandı (%${d.konuIlerleme.yuzde})`,
      metin: "Kalan konular programa dahil edilmeli. Koç konu takibini yapıyor.",
      renk: "#2A9D8F",
    });

    return m;
  })();

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">AI Özet</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Çocuğunuzun gelişim özeti</p>
      </div>

      <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {kartlar.map((c) => (
          <Card key={c.label} style={{ display: "flex", gap: 16, borderLeft: `3px solid ${c.renk}`, borderRadius: "0 10px 10px 0" }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{c.ikon}</div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>{c.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0F1B2D", marginBottom: 6 }}>{c.baslik}</p>
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.65)", lineHeight: 1.6 }}>{c.metin}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
