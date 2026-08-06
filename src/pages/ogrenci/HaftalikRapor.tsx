import { useEffect, useMemo, useState } from "react";
import { motorVerisiniGetir, bugunIso, gunEkle, type MotorVerisi } from "../../lib/oneriMotoru";
import { Card, KPICard, Btn, AnimatedNumber, useToast } from "../../components/ui";
import { pdfYazdir } from "../../lib/exportUtils";

function gunEtiketi(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export default function HaftalikRapor() {
  const { toast, show } = useToast();
  const [veri, setVeri] = useState<MotorVerisi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    motorVerisiniGetir().then(setVeri).catch(() => setVeri(null)).finally(() => setYukleniyor(false));
  }, []);

  const rapor = useMemo(() => {
    if (!veri) return null;
    const bugun = bugunIso();
    const ilk = gunEkle(bugun, -6);

    const gunler: { tarih: string; dk: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const g = gunEkle(bugun, -i);
      gunler.push({ tarih: g, dk: 0 });
    }
    for (const c of veri.calismalar) {
      if (c.tarih >= ilk && c.tarih <= bugun) {
        const g = gunler.find((x) => x.tarih === c.tarih);
        if (g) g.dk += c.sure_dk;
      }
    }
    const maxDk = Math.max(...gunler.map((g) => g.dk), 1);

    const haftalikCalismaDk = gunler.reduce((a, g) => a + g.dk, 0);
    const gunlukOrt = Math.round(haftalikCalismaDk / 7);

    const konuOdak = new Map<string, number>();
    for (const c of veri.calismalar) {
      if (c.tarih >= ilk && c.tarih <= bugun && c.konu_adi) {
        konuOdak.set(c.konu_adi, (konuOdak.get(c.konu_adi) ?? 0) + c.sure_dk);
      }
    }
    const odak = Array.from(konuOdak.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const haftalikGorevler = veri.gorevler.filter((g) => g.tarih >= ilk && g.tarih <= bugun);
    const tamamlanan = haftalikGorevler.filter((g) => g.tamamlandi).length;

    const denemeMap = new Map<string, { ad: string; tarih: string; dogru: number; yanlis: number }>();
    for (const s of veri.sonuclar) {
      if (!denemeMap.has(s.deneme_id)) {
        denemeMap.set(s.deneme_id, { ad: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
      }
      const o = denemeMap.get(s.deneme_id)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
    }
    const haftalikDenemeler = Array.from(denemeMap.values()).filter((d) => d.tarih >= ilk && d.tarih <= bugun);
    const ortalamaNet =
      haftalikDenemeler.length > 0
        ? Math.round((haftalikDenemeler.reduce((a, d) => a + (d.dogru - d.yanlis / 4), 0) / haftalikDenemeler.length) * 10) / 10
        : null;

    const kitaplarToplam = veri.kitaplar.reduce((a, k) => a + k.toplam, 0);
    const kitaplarIlerleme = veri.kitaplar.reduce((a, k) => a + k.ilerleme, 0);
    const kaynakYuzde = kitaplarToplam === 0 ? 0 : Math.round((kitaplarIlerleme / kitaplarToplam) * 100);

    const cozulenYanlis = veri.yanlislar.filter((y) => y.cozuldu).length;
    const tamamlananTekrar = veri.planlar.filter((p) => p.yapildi).length;

    const ozet =
      `Bu hafta toplam ${Math.round((haftalikCalismaDk / 60) * 10) / 10} saat çalıştın (günde ortalama ${gunlukOrt} dk). ` +
      (odak.length > 0 ? `En çok ${odak[0][0]} üzerine yoğunlaştın. ` : "Düzenli bir konu odağın henüz oluşmadı. ") +
      `Haftalık ${haftalikGorevler.length} görevden ${tamamlanan} tanesini tamamladın. ` +
      (ortalamaNet !== null
        ? `Hafta içinde ${haftalikDenemeler.length} denemede ortalaman ${ortalamaNet} net. `
        : "Bu hafta deneme sonucun girilmedi. ") +
      `Kaynak ilerlemen toplam %${kaynakYuzde}.`;

    return {
      ilk,
      bugun,
      gunler,
      maxDk,
      haftalikCalismaDk,
      gunlukOrt,
      odak,
      haftalikGorevler,
      tamamlanan,
      haftalikDenemeler,
      ortalamaNet,
      kaynakYuzde,
      cozulenYanlis,
      tamamlananTekrar,
      ozet,
    };
  }, [veri]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;
  if (!rapor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Rapor üretilemedi.</p>;
  const r = rapor;

  const totalH = Math.floor(r.haftalikCalismaDk / 60);
  const gorevYuzde = r.haftalikGorevler.length === 0 ? 0 : Math.round((r.tamamlanan / r.haftalikGorevler.length) * 100);

  async function kopyala() {
    const metin = `ÜNİVERSİTELY HAFTALIK RAPOR\n${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}\n\n` + r.ozet;
    try {
      await navigator.clipboard.writeText(metin);
      show("Rapor kopyalandı ✓");
    } catch {}
  }

  function pdfIndir() {
    const tarih = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    pdfYazdir("Haftalık Rapor", tarih, [
      ["Ölçüt", "Değer"],
      ["Özet", r.ozet],
      ["Toplam Çalışma", `${Math.round((r.haftalikCalismaDk / 60) * 10) / 10} saat (günde ort. ${r.gunlukOrt} dk)`],
      ["Görev Tamamlama", `${r.tamamlanan}/${r.haftalikGorevler.length}`],
      ["Deneme Ortalaması", `${r.ortalamaNet !== null ? r.ortalamaNet : "—"} net (${r.haftalikDenemeler.length} deneme)`],
      ["Kaynak İlerlemesi", `%${r.kaynakYuzde}`],
      ["En Çok Çalışılan", r.odak.length > 0 ? r.odak.map(([konu, dk]) => `${konu} (${dk}dk)`).join(" · ") : "—"],
    ]);
  }

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Haftalık Rapor</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>{gunEtiketi(rapor.ilk)} – {gunEtiketi(rapor.bugun)}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={kopyala}>Kopyala</Btn>
          <Btn variant="primary" size="sm" onClick={pdfIndir}>PDF</Btn>
        </div>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 12, fontSize: 16 }}>Özet</h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(15,27,45,0.75)" }}>{rapor.ozet}</p>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Günlük Çalışma Süresi</h3>
        <div style={{ display: "flex", gap: 8, height: 120, alignItems: "flex-end" }}>
          {rapor.gunler.map((g) => (
            <div key={g.tarih} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span className="tabular" style={{ fontSize: 10, color: "rgba(15,27,45,0.45)", fontWeight: 600 }}>{g.dk > 0 ? g.dk : ""}</span>
              <div style={{
                width: "100%", borderRadius: "3px 3px 0 0",
                background: g.dk > 0 ? "#E4BB60" : "rgba(15,27,45,0.07)",
                height: rapor.maxDk ? `${(g.dk / rapor.maxDk) * 90}px` : 4,
                minHeight: 4,
                transition: "height 700ms ease",
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,27,45,0.5)" }}>{gunEtiketi(g.tarih).split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid-4">
        <KPICard label="Toplam Çalışma" value={totalH} sub={`${rapor.gunlukOrt} dk/gün ort.`} />
        <KPICard label="Görev Tamamlama" value={gorevYuzde} sub="% bu hafta" color="#2A9D8F" />
        {rapor.ortalamaNet !== null ? (
          <KPICard label="Deneme Ortalaması" value={rapor.ortalamaNet} sub={`${rapor.haftalikDenemeler.length} deneme`} decimals={1} color="#E4BB60" />
        ) : (
          <div className="card tape-accent" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Deneme Ortalaması</p>
            <p className="metric-value" style={{ fontSize: 36, fontWeight: 700, color: "#E4BB60", lineHeight: 1 }}>—</p>
            <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)", marginTop: 4 }}>bu hafta deneme yok</p>
          </div>
        )}
        <KPICard label="Kaynak İlerlemesi" value={rapor.kaynakYuzde} sub="% genel" color="#0F1B2D" />
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>En Çok Çalıştığın Konular</h3>
        {rapor.odak.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)", fontStyle: "italic" }}>Bu hafta konu bazlı çalışma kaydı yok.</p>
        ) : (
          rapor.odak.map(([konu, dk], i) => (
            <div key={konu} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < rapor.odak.length - 1 ? "1px solid rgba(15,27,45,0.06)" : "none" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#E4BB60", minWidth: 28 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{konu}</span>
              <span className="tabular" style={{ fontSize: 14, fontWeight: 700, color: "#0F1B2D" }}>{dk} dk</span>
            </div>
          ))
        )}
      </Card>

      <div className="grid-2">
        <Card style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Çözülen Yanlış</p>
          <span className="metric-value" style={{ fontSize: 32, fontWeight: 700, color: "#2A9D8F" }}>
            <AnimatedNumber value={rapor.cozulenYanlis} />
          </span>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Yapılan Tekrar</p>
          <span className="metric-value" style={{ fontSize: 32, fontWeight: 700, color: "#2A9D8F" }}>
            <AnimatedNumber value={rapor.tamamlananTekrar} />
          </span>
        </Card>
      </div>
    </div>
  );
}
