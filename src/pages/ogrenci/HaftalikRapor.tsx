import { useEffect, useMemo, useState } from "react";
import { motorVerisiniGetir, bugunIso, gunEkle, type MotorVerisi } from "../../lib/oneriMotoru";
import AnimatedNumber from "../../components/AnimatedNumber";
import ProgressBar from "../../components/ProgressBar";
import { pdfYazdir } from "../../lib/exportUtils";

function gunEtiketi(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function HaftalikRapor() {
  const [veri, setVeri] = useState<MotorVerisi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kopyalandi, setKopyalandi] = useState(false);

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
    const odakMax = odak.length > 0 ? odak[0][1] : 1;

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
        ? haftalikDenemeler.reduce((a, d) => a + (d.dogru - d.yanlis / 4), 0) / haftalikDenemeler.length
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
        ? `Hafta içinde ${haftalikDenemeler.length} denemede ortalaman ${Math.round(ortalamaNet * 10) / 10} net. `
        : "Bu hafta deneme sonucun girilmedi. ") +
      `Kaynak ilerlemen toplam %${kaynakYuzde}.`;

    return {
      gunler,
      maxDk,
      haftalikCalismaDk,
      gunlukOrt,
      odak,
      odakMax,
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

  async function kopyala() {
    if (!rapor) return;
    const metin = `ÜNİVERSİTELY HAFTALIK RAPOR\n${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}\n\n` + rapor.ozet;
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1800);
    } catch {}
  }

  function pdfIndir() {
    if (!rapor) return;
    const tarih = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    pdfYazdir("Haftalık Rapor", tarih, [
      ["Ölçüt", "Değer"],
      ["Özet", rapor.ozet],
      ["Toplam Çalışma", `${Math.round((rapor.haftalikCalismaDk / 60) * 10) / 10} saat (günde ort. ${rapor.gunlukOrt} dk)`],
      ["Görev Tamamlama", `${rapor.tamamlanan}/${rapor.haftalikGorevler.length}`],
      ["Deneme Ortalaması", `${rapor.ortalamaNet !== null ? rapor.ortalamaNet : "—"} net (${rapor.haftalikDenemeler.length} deneme)`],
      ["Kaynak İlerlemesi", `%${rapor.kaynakYuzde}`],
      ["En Çok Çalışılan", rapor.odak.length > 0 ? rapor.odak.map(([konu, dk]) => `${konu} (${dk}dk)`).join(" · ") : "—"],
    ]);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;
  if (!rapor) return <p className="mono" style={{ color: "var(--muted)" }}>Rapor üretilemedi.</p>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>Haftalık Rapor</h1>
        <button onClick={kopyala} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)", marginRight: 8 }}>
          {kopyalandi ? "Kopyalandı ✓" : "Raporu Kopyala"}
        </button>
        <button onClick={pdfIndir} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>PDF</button>
      </div>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Özet</h2>
        <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>{rapor.ozet}</p>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Günlük Çalışma Süresi (son 7 gün)</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 130, marginTop: 10 }}>
          {rapor.gunler.map((g) => {
            const yuzde = Math.round((g.dk / rapor.maxDk) * 100);
            return (
              <div key={g.tarih} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{g.dk > 0 ? `${g.dk}dk` : ""}</span>
                <div
                  style={{
                    width: "100%", maxWidth: 44, height: `${Math.max(yuzde, 2)}%`, minHeight: 3,
                    background: g.dk > 0 ? "var(--gold-dim)" : "#ececec", borderRadius: 6,
                    transition: "height 0.6s ease",
                  }}
                />
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{gunEtiketi(g.tarih)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, animationDelay: "0.15s" }}>
        <div className="card" style={{ marginTop: 0 }}>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>Toplam Çalışma</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            <AnimatedNumber value={Math.round((rapor.haftalikCalismaDk / 60) * 10) / 10} decimals={1} /> saat
          </p>
          <p className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>günde ort. {rapor.gunlukOrt} dk</p>
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>Görev Tamamlama</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            <AnimatedNumber value={rapor.tamamlanan} />/{rapor.haftalikGorevler.length}
          </p>
          <p className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>haftalık görev</p>
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>Deneme Ortalaması</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            {rapor.ortalamaNet !== null ? <AnimatedNumber value={Math.round(rapor.ortalamaNet * 10) / 10} decimals={1} /> : "—"} net
          </p>
          <p className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{rapor.haftalikDenemeler.length} deneme</p>
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>Kaynak İlerlemesi</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            <AnimatedNumber value={rapor.kaynakYuzde} suffix="%" />
          </p>
          <ProgressBar oran={rapor.kaynakYuzde} color="var(--gold-dim)" delay={300} />
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
        <h2 className="card-title">En Çok Çalıştığın Konular</h2>
        {rapor.odak.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu hafta konu bazlı çalışma kaydı yok.</p>}
        {rapor.odak.map(([konu, dk], i) => (
          <div key={konu} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.25 + i * 0.05}s` }}>
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)" }}>{konu}</span>
            <div className="progress-track" style={{ width: 140 }}>
              <div className="progress-fill" style={{ width: `${Math.round((dk / rapor.odakMax) * 100)}%`, background: "var(--gold-dim)" }} />
            </div>
            <span className="mono" style={{ width: 48, textAlign: "right", fontSize: 12.5, color: "var(--muted)" }}>{dk}dk</span>
          </div>
        ))}
      </div>

      <div className="stagger-item" style={{ display: "flex", gap: 12, marginTop: 16, animationDelay: "0.25s" }}>
        <div className="card" style={{ marginTop: 0, flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--dogru)" }}>{rapor.cozulenYanlis}</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>çözülen yanlış</p>
        </div>
        <div className="card" style={{ marginTop: 0, flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--gold-dim)" }}>{rapor.tamamlananTekrar}</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>yapılan tekrar</p>
        </div>
      </div>
    </div>
  );
}
