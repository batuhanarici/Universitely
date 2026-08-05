import { useEffect, useMemo, useState } from "react";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { kocSonuclariniGetir } from "../../lib/kocAraclariQueries";
import AnimatedNumber from "../../components/AnimatedNumber";
import ProgressBar from "../../components/ProgressBar";
import { pdfYazdir, csvIndir } from "../../lib/exportUtils";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function gunEkle(iso: string, gun: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
}

interface OgrenciRaporu {
  ogrenci_id: string;
  ad_soyad: string;
  denemeler: { ad: string; net: number }[];
}

export default function OgretmenRapor() {
  const [sonuclar, setSonuclar] = useState<Awaited<ReturnType<typeof kocSonuclariniGetir>>>([]);
  const [ogrenciler, setOgrenciler] = useState<{ id: string; ad_soyad: string }[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kocSonuclariniGetir(), ogrencileriGetir()])
      .then(([s, o]) => {
        setSonuclar(s);
        setOgrenciler(o);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const rapor = useMemo(() => {
    const bugun = bugunIso();
    const ilk = gunEkle(bugun, -6);

    const sonYedi = sonuclar.filter((s) => {
      const gun = (s.tarih ?? "").slice(0, 10);
      return gun >= ilk && gun <= bugun;
    });

    const denemeMap = new Map<string, { ad: string; tarih: string; dogru: number; yanlis: number }>();
    const dersMap = new Map<string, { dogru: number; toplam: number }>();
    for (const s of sonYedi) {
      const key = `${s.ogrenci_id}|${s.deneme_id}`;
      if (!denemeMap.has(key)) denemeMap.set(key, { ad: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
      const o = denemeMap.get(key)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      if (!dersMap.has(s.ders_adi)) dersMap.set(s.ders_adi, { dogru: 0, toplam: 0 });
      const d = dersMap.get(s.ders_adi)!;
      d.toplam++;
      if (s.durum === "dogru") d.dogru++;
    }

    const adMap = new Map(ogrenciler.map((o) => [o.id, o.ad_soyad]));
    const ogrenciDenemeler = new Map<string, { ad: string; net: number }[]>();
    for (const [key, d] of denemeMap) {
      const ogr = key.split("|")[0];
      const net = Math.round((d.dogru - d.yanlis / 4) * 10) / 10;
      if (!ogrenciDenemeler.has(ogr)) ogrenciDenemeler.set(ogr, []);
      ogrenciDenemeler.get(ogr)!.push({ ad: d.ad, net });
    }

    const ogrencilerRapor: OgrenciRaporu[] = [];
    for (const [ogr, denemeler] of ogrenciDenemeler) {
      const sirali = denemeler.sort((a, b) => b.net - a.net);
      ogrencilerRapor.push({ ogrenci_id: ogr, ad_soyad: adMap.get(ogr) ?? "Öğrenci", denemeler: sirali });
    }
    ogrencilerRapor.sort((a, b) => {
      const an = a.denemeler.length ? a.denemeler.reduce((t, d) => t + d.net, 0) / a.denemeler.length : 0;
      const bn = b.denemeler.length ? b.denemeler.reduce((t, d) => t + d.net, 0) / b.denemeler.length : 0;
      return bn - an;
    });

    const ortalamaNet = ogrencilerRapor.length
      ? ogrencilerRapor.reduce((a, o) => a + (o.denemeler.reduce((t, d) => t + d.net, 0) / Math.max(o.denemeler.length, 1)), 0) / ogrencilerRapor.length
      : null;

    const dersler = Array.from(dersMap.entries())
      .map(([ad, d]) => ({ ad, yuzde: d.toplam === 0 ? 0 : Math.round((d.dogru / d.toplam) * 100) }))
      .sort((a, b) => a.yuzde - b.yuzde);

    return {
      denemeSayisi: denemeMap.size,
      ogrencilerRapor,
      ortalamaNet,
      dersler,
      ilk,
      bugun,
    };
  }, [sonuclar, ogrenciler]);

  function pdfIndir() {
    const tarih = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    const satirlar: (string | number)[][] = [
      ["Öğrenci", "Deneme Sayısı", "Ortalama Net"],
      ...rapor.ogrencilerRapor.map((o) => [
        o.ad_soyad,
        o.denemeler.length,
        o.denemeler.length ? Math.round((o.denemeler.reduce((a, d) => a + d.net, 0) / o.denemeler.length) * 10) / 10 : 0,
      ]),
    ];
    pdfYazdir("Sınıf Haftalık Rapor", `${tarih} · ${rapor.ilk} → ${rapor.bugun}`, satirlar);
  }

  function csvIndirHandle() {
    const satirlar: (string | number)[][] = [
      ["Öğrenci", "Deneme Adı", "Net"],
      ...rapor.ogrencilerRapor.flatMap((o) =>
        o.denemeler.map((d) => [o.ad_soyad, d.ad, d.net])
      ),
    ];
    csvIndir("sinif-haftalik-rapor", satirlar);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>Sınıf Haftalık Rapor</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={pdfIndir} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>PDF</button>
          <button onClick={csvIndirHandle} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>CSV</button>
        </div>
      </div>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>
          Son 7 gün · {rapor.ilk} → {rapor.bugun}
        </p>
        {rapor.denemeSayisi === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu hafta girilen deneme sonucu yok.</p>
        ) : (
          <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={ogrenciler.length} /></p>
              <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>öğrenci</p>
            </div>
            <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={rapor.denemeSayisi} /></p>
              <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>deneme sonucu</p>
            </div>
            <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
                {rapor.ortalamaNet !== null ? <AnimatedNumber value={Math.round(rapor.ortalamaNet * 10) / 10} decimals={1} /> : "—"} net
              </p>
              <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>sınıf ortalaması</p>
            </div>
          </div>
        )}
      </div>

      {rapor.dersler.length > 0 && (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
          <h2 className="card-title">Ders Bazlı Başarı (hafta)</h2>
          {rapor.dersler.map((d, i) => (
            <div key={d.ad} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
              <span style={{ width: 120, fontSize: 13, color: "var(--ink)" }}>{d.ad}</span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${d.yuzde}%`, background: d.yuzde < 55 ? "var(--yanlis)" : d.yuzde >= 80 ? "var(--dogru)" : "var(--gold-dim)" }} />
              </div>
              <span className="mono" style={{ width: 42, textAlign: "right", fontSize: 12.5, color: "var(--muted)" }}>{d.yuzde}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Öğrenci Sıralaması</h2>
        {rapor.ogrencilerRapor.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu hafta verisi olan öğrenci yok.</p>}
        {rapor.ogrencilerRapor.map((o, i) => {
          const ort = o.denemeler.length ? o.denemeler.reduce((a, d) => a + d.net, 0) / o.denemeler.length : 0;
          return (
            <div key={o.ogrenci_id} className="stagger-item" style={{ padding: "10px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono" style={{ width: 22, fontSize: 12.5, color: "var(--muted)" }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{o.ad_soyad}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 3 }}>
                    {o.denemeler.map((d) => (
                      <span key={d.ad} className="chip" style={{ fontSize: 10.5 }}>{d.ad} · {d.net} net</span>
                    ))}
                  </div>
                </div>
                <div style={{ width: 130 }}>
                  <ProgressBar oran={Math.min(Math.max((ort / 30) * 100, 0), 100)} color="var(--gold-dim)" delay={300} />
                </div>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {o.denemeler.length ? Math.round(ort * 10) / 10 : "—"} net
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
