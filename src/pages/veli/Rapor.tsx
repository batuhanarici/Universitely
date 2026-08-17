import { Card, Btn, KPICard } from "../../components/ui";
import { pdfYazdir } from "../../lib/exportUtils";
import { useVeliVeri } from "./veliContext";
import { useVeliDerived } from "./veliDerived";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Rapor() {
  const { yukleniyor, veri } = useVeliVeri();
  const d = useVeliDerived();

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const ayEtiketi = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const aySaat = Math.round((d.ozet.aySure / 60) * 10) / 10;

  function haftalikPdf() {
    const satirlar: (string | number)[][] = [["Gün", "Süre (dk)", "Soru", "Görevler"]];
    const bugun = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(bugun);
      dd.setDate(bugun.getDate() - i);
      const iso = dd.toISOString().slice(0, 10);
      const sure = veri.calismalar.filter((c) => c.tarih === iso).reduce((a, c) => a + (c.sure_dk || 0), 0);
      const soru = veri.calismalar.filter((c) => c.tarih === iso).reduce((a, c) => a + (c.soru_sayisi || 0), 0);
      const gorevler = veri.gorevler.filter((g) => g.tarih === iso);
      const tam = gorevler.filter((g) => g.tamamlandi).length;
      const ad = iso.slice(8) + "." + iso.slice(5, 7);
      satirlar.push([ad, sure, soru, gorevler.length === 0 ? "—" : `${tam}/${gorevler.length}`]);
    }
    satirlar.push(["TOPLAM", d.ozet.haftaSure, d.ozet.haftaSoru, `${d.ozet.haftaGorevTam}/${d.ozet.haftaGorevTam + d.ozet.haftaGorevKalan}`]);
    pdfYazdir("Haftalık Gelişim Raporu", `${veri.cocuk_adi} · ${bugunIso()}`, satirlar);
  }

  function aylikPdf() {
    const satirlar: (string | number)[][] = [
      ["Metrik", "Değer"],
      ["Toplam Çalışma (saat)", aySaat],
      ["Toplam Soru", d.ozet.aySoru],
      ["Deneme Sayısı", d.ozet.ayDenemeAdet],
      ["Ortalama Net (30 gün)", d.ozet.ayOrt === null ? "—" : Math.round(d.ozet.ayOrt * 10) / 10],
      ["Konu İlerlemesi (%)", d.konuIlerleme.yuzde],
    ];
    for (const dd of d.dersler) {
      satirlar.push([`Başarı · ${dd.ad} (%)`, dd.yuzde]);
    }
    satirlar.push(["", ""]);
    satirlar.push(["Deneme", "Net"]);
    for (const de of d.denemeler) {
      satirlar.push([de.ad, de.net]);
    }
    pdfYazdir("Aylık Gelişim Raporu", `${veri.cocuk_adi} · Son 30 gün`, satirlar);
  }

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Rapor</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>İndirilebilir gelişim raporları</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Haftalık PDF Raporu</h3>
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", marginBottom: 14 }}>
          Son 7 günün çalışma süresi, soru sayısı ve görev tamamlama oranlarını içerir.
        </p>
        <Btn variant="primary" onClick={haftalikPdf}>Haftalık Raporu PDF Yazdır</Btn>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Aylık Gelişim Raporu · {ayEtiketi}</h3>
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <KPICard label="Çalışma" value={aySaat} sub="saat" />
          <KPICard label="Soru" value={d.ozet.aySoru} />
          <KPICard label="Deneme" value={d.ozet.ayDenemeAdet} />
          {d.ozet.ayOrt !== null ? (
            <KPICard label="Ort. Net" value={Math.round(d.ozet.ayOrt * 10) / 10} decimals={1} color="#E4BB60" />
          ) : (
            <div className="card tape-accent" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Ort. Net</p>
              <p className="metric-value" style={{ fontSize: 36, fontWeight: 700, color: "#E4BB60", lineHeight: 1 }}>—</p>
            </div>
          )}
        </div>
        <Btn variant="ghost" onClick={aylikPdf}>Aylık Raporu PDF Yazdır</Btn>
      </Card>
    </div>
  );
}
