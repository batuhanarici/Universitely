import { useEffect, useMemo, useState } from "react";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";
import { Card, ProgressBar } from "../../components/ui";
import { AnimatedNumber } from "../../components/ui";

interface OgrenciOzet {
  ogrenci_id: string;
  ad_soyad: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  enZayifKonu: string;
  enZayifOran: number;
}

interface KonuOzet {
  konu_adi: string;
  oran: number;
  zayifOgrenciSayisi: number;
}

function oranHesapla(dogru: number, yanlis: number, bos: number) {
  const toplam = dogru + yanlis + bos;
  return toplam === 0 ? 0 : Math.round((dogru / toplam) * 100);
}

function ozetleriHesapla(satirlar: SinifSonucSatiri[]) {
  const ogrenciMap = new Map<string, { ad_soyad: string; dogru: number; yanlis: number; bos: number }>();
  const ogrenciKonuMap = new Map<string, Map<string, { dogru: number; yanlis: number; bos: number }>>();
  const konuGenelMap = new Map<string, { dogru: number; yanlis: number; bos: number }>();

  for (const s of satirlar) {
    if (!ogrenciMap.has(s.ogrenci_id)) ogrenciMap.set(s.ogrenci_id, { ad_soyad: s.ad_soyad, dogru: 0, yanlis: 0, bos: 0 });
    const oo = ogrenciMap.get(s.ogrenci_id)!;
    if (s.durum === "dogru") oo.dogru++; else if (s.durum === "yanlis") oo.yanlis++; else oo.bos++;

    if (!ogrenciKonuMap.has(s.ogrenci_id)) ogrenciKonuMap.set(s.ogrenci_id, new Map());
    const konuMap = ogrenciKonuMap.get(s.ogrenci_id)!;
    if (!konuMap.has(s.konu_adi)) konuMap.set(s.konu_adi, { dogru: 0, yanlis: 0, bos: 0 });
    const ok = konuMap.get(s.konu_adi)!;
    if (s.durum === "dogru") ok.dogru++; else if (s.durum === "yanlis") ok.yanlis++; else ok.bos++;

    if (!konuGenelMap.has(s.konu_adi)) konuGenelMap.set(s.konu_adi, { dogru: 0, yanlis: 0, bos: 0 });
    const kg = konuGenelMap.get(s.konu_adi)!;
    if (s.durum === "dogru") kg.dogru++; else if (s.durum === "yanlis") kg.yanlis++; else kg.bos++;
  }

  const ogrenciler: OgrenciOzet[] = Array.from(ogrenciMap.entries()).map(([id, o]) => {
    const konuMap = ogrenciKonuMap.get(id)!;
    let enZayifKonu = "—";
    let enZayifOran = 101;
    for (const [konu, k] of konuMap.entries()) {
      const oran = oranHesapla(k.dogru, k.yanlis, k.bos);
      if (oran < enZayifOran) { enZayifOran = oran; enZayifKonu = konu; }
    }
    return {
      ogrenci_id: id, ad_soyad: o.ad_soyad, dogru: o.dogru, yanlis: o.yanlis, bos: o.bos,
      net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10,
      enZayifKonu, enZayifOran,
    };
  }).sort((a, b) => b.net - a.net);

  const konular: KonuOzet[] = Array.from(konuGenelMap.entries()).map(([konu]) => {
    let zayifSayisi = 0;
    for (const konuMap of ogrenciKonuMap.values()) {
      const ok = konuMap.get(konu);
      if (ok && oranHesapla(ok.dogru, ok.yanlis, ok.bos) < 55) zayifSayisi++;
    }
    const g = konuGenelMap.get(konu)!;
    return { konu_adi: konu, oran: oranHesapla(g.dogru, g.yanlis, g.bos), zayifOgrenciSayisi: zayifSayisi };
  }).sort((a, b) => b.zayifOgrenciSayisi - a.zayifOgrenciSayisi || a.oran - b.oran);

  return { ogrenciler, konular };
}

export default function SinifGenel() {
  const [satirlar, setSatirlar] = useState<SinifSonucSatiri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    sinifSonuclariniGetir().then(setSatirlar).finally(() => setYukleniyor(false));
  }, []);

  const { ogrenciler, konular } = useMemo(() => ozetleriHesapla(satirlar), [satirlar]);

  if (yukleniyor) return <p style={{ textAlign: "center", marginTop: 60 }}>Yükleniyor…</p>;

  if (satirlar.length === 0) {
    return (
      <div>
        <h1 className="page-title">Sınıf Genel Durumu</h1>
        <p style={{ color: "rgba(15,27,45,0.5)" }}>Henüz hiçbir öğrenci için sonuç girilmemiş.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Sınıf Genel Durumu</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>{ogrenciler.length} öğrenci · nete göre sıralı</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrenciler</h3>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ogrenciler.map((o) => (
            <div key={o.ogrenci_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{o.ad_soyad}</p>
                <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>En zayıf konu: {o.enZayifKonu} ({o.enZayifOran}%)</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="metric-value" style={{ fontSize: 16, fontWeight: 700 }}>
                  <AnimatedNumber value={o.net} decimals={1} />
                </p>
                <p className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{o.dogru}D {o.yanlis}Y {o.bos}B</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Sınıf Genelinde En Çok Ağırlık Verilmesi Gereken Konular</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {konular.map((k) => (
            <div key={k.konu_adi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 140, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.konu_adi}</span>
              <div style={{ flex: 1 }}><ProgressBar pct={(k.zayifOgrenciSayisi / ogrenciler.length) * 100} color={k.zayifOgrenciSayisi > 0 ? "#C4503A" : "#2A9D8F"} /></div>
              <span className="tabular" style={{ width: 120, textAlign: "right", fontSize: 12, color: "rgba(15,27,45,0.5)" }}>
                {k.zayifOgrenciSayisi} / {ogrenciler.length} öğrenci
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
