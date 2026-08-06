import { useEffect, useMemo, useState } from "react";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { kocSonuclariniGetir } from "../../lib/kocAraclariQueries";
import { pdfYazdir, csvIndir } from "../../lib/exportUtils";
import { Card, KPICard, ProgressBar, Btn } from "../../components/ui";

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

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Sınıf Haftalık Rapor</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14 }}>Son 7 gün · {rapor.ilk} → {rapor.bugun}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="gold" size="sm" onClick={pdfIndir}>PDF</Btn>
          <Btn variant="gold" size="sm" onClick={csvIndirHandle}>CSV</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <KPICard label="Öğrenci" value={ogrenciler.length} />
        <KPICard label="Deneme sonucu" value={rapor.denemeSayisi} />
        <KPICard label="Sınıf ortalaması" value={rapor.ortalamaNet !== null ? Math.round(rapor.ortalamaNet * 10) / 10 : 0} decimals={1} />
      </div>

      {rapor.denemeSayisi === 0 && (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu hafta girilen deneme sonucu yok.</p>
        </Card>
      )}

      {rapor.dersler.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Ders Bazlı Başarı (hafta)</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rapor.dersler.map((d) => (
              <div key={d.ad} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                <span style={{ width: 120, fontSize: 13 }}>{d.ad}</span>
                <div style={{ flex: 1 }}><ProgressBar pct={d.yuzde} color={d.yuzde < 55 ? "#C4503A" : d.yuzde >= 80 ? "#2A9D8F" : "#A07C20"} /></div>
                <span className="tabular" style={{ width: 42, textAlign: "right", fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>{d.yuzde}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Öğrenci Sıralaması</h3>
        {rapor.ogrencilerRapor.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu hafta verisi olan öğrenci yok.</p>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rapor.ogrencilerRapor.map((o, i) => {
            const ort = o.denemeler.length ? o.denemeler.reduce((a, d) => a + d.net, 0) / o.denemeler.length : 0;
            return (
              <div key={o.ogrenci_id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="tabular" style={{ width: 22, fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>{i + 1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500 }}>{o.ad_soyad}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 3 }}>
                      {o.denemeler.map((d) => (
                        <span key={d.ad} className="badge badge-gray" style={{ fontSize: 10.5 }}>{d.ad} · {d.net} net</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: 130 }}><ProgressBar pct={Math.min(Math.max((ort / 30) * 100, 0), 100)} color="#A07C20" /></div>
                  <span className="tabular" style={{ fontSize: 14, fontWeight: 700 }}>
                    {o.denemeler.length ? Math.round(ort * 10) / 10 : "—"} net
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
