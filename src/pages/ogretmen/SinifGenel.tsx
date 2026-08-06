import { useEffect, useMemo, useState } from "react";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";
import { kocOgrencileri } from "../../lib/ogrenciYonetimQueries";
import { Card, StatusDot } from "../../components/ui";

interface OgrenciOzet {
  ogrenci_id: string;
  ad_soyad: string;
  aktif: boolean;
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

function ozetleriHesapla(satirlar: SinifSonucSatiri[], aktifHaritasi: Map<string, boolean>) {
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
      ogrenci_id: id, ad_soyad: o.ad_soyad, aktif: aktifHaritasi.get(id) ?? true,
      dogru: o.dogru, yanlis: o.yanlis, bos: o.bos,
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
  const [aktifHaritasi, setAktifHaritasi] = useState<Map<string, boolean>>(new Map());
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([sinifSonuclariniGetir(), kocOgrencileri()])
      .then(([s, o]) => {
        setSatirlar(s);
        const map = new Map<string, boolean>();
        for (const ogr of o) map.set(ogr.id, ogr.aktif);
        setAktifHaritasi(map);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const { ogrenciler, konular } = useMemo(() => ozetleriHesapla(satirlar, aktifHaritasi), [satirlar, aktifHaritasi]);

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
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Nete göre sıralı öğrenci listesi</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrenciler — Nete Göre</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ad</th>
              <th>En Zayıf Konu</th>
              <th>Net</th>
              <th>D</th>
              <th>Y</th>
              <th>B</th>
            </tr>
          </thead>
          <tbody>
            {ogrenciler.map((o, i) => (
              <tr key={o.ogrenci_id}>
                <td style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "rgba(15,27,45,0.25)" }}>{i + 1}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot active={o.aktif} />
                    <span style={{ fontWeight: 500 }}>{o.ad_soyad}</span>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: "#C4503A" }}>{o.enZayifKonu}</td>
                <td><span className="metric-value" style={{ fontSize: 20, fontWeight: 700 }}>{o.net}</span></td>
                <td className="tabular" style={{ color: "#2A9D8F", fontWeight: 600 }}>{o.dogru}</td>
                <td className="tabular" style={{ color: "#C4503A", fontWeight: 600 }}>{o.yanlis}</td>
                <td className="tabular" style={{ color: "#9A9FA8", fontWeight: 600 }}>{o.bos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Ağırlık Verilmesi Gereken Konular</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {konular.map((k) => (
            <div key={k.konu_adi} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{k.konu_adi}</span>
              <div style={{ height: 6, width: 120, background: "rgba(15,27,45,0.07)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(k.zayifOgrenciSayisi / ogrenciler.length) * 100}%`, background: "#C4503A", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(15,27,45,0.5)", minWidth: 60, textAlign: "right" }}>{k.zayifOgrenciSayisi}/{ogrenciler.length} öğrenci</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
