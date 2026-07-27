import { useEffect, useMemo, useState } from "react";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";

const RUST = "#B5482A";
const TEAL = "#2E7D6B";
const INK = "#1B2A4A";

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
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
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
    if (!ogrenciMap.has(s.ogrenci_id)) {
      ogrenciMap.set(s.ogrenci_id, { ad_soyad: s.ad_soyad, dogru: 0, yanlis: 0, bos: 0 });
    }
    const oo = ogrenciMap.get(s.ogrenci_id)!;
    if (s.durum === "dogru") oo.dogru++;
    else if (s.durum === "yanlis") oo.yanlis++;
    else oo.bos++;

    if (!ogrenciKonuMap.has(s.ogrenci_id)) ogrenciKonuMap.set(s.ogrenci_id, new Map());
    const konuMap = ogrenciKonuMap.get(s.ogrenci_id)!;
    if (!konuMap.has(s.konu_adi)) konuMap.set(s.konu_adi, { dogru: 0, yanlis: 0, bos: 0 });
    const ok = konuMap.get(s.konu_adi)!;
    if (s.durum === "dogru") ok.dogru++;
    else if (s.durum === "yanlis") ok.yanlis++;
    else ok.bos++;

    if (!konuGenelMap.has(s.konu_adi)) konuGenelMap.set(s.konu_adi, { dogru: 0, yanlis: 0, bos: 0 });
    const kg = konuGenelMap.get(s.konu_adi)!;
    if (s.durum === "dogru") kg.dogru++;
    else if (s.durum === "yanlis") kg.yanlis++;
    else kg.bos++;
  }

  const ogrenciler: OgrenciOzet[] = Array.from(ogrenciMap.entries()).map(([id, o]) => {
    const konuMap = ogrenciKonuMap.get(id)!;
    let enZayifKonu = "—";
    let enZayifOran = 101;
    for (const [konu, k] of konuMap.entries()) {
      const oran = oranHesapla(k.dogru, k.yanlis, k.bos);
      if (oran < enZayifOran) {
        enZayifOran = oran;
        enZayifKonu = konu;
      }
    }
    return {
      ogrenci_id: id,
      ad_soyad: o.ad_soyad,
      dogru: o.dogru,
      yanlis: o.yanlis,
      bos: o.bos,
      net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10,
      enZayifKonu,
      enZayifOran,
    };
  }).sort((a, b) => b.net - a.net);

  const konular: KonuOzet[] = Array.from(konuGenelMap.entries()).map(([konu, k]) => {
    let zayifSayisi = 0;
    for (const konuMap of ogrenciKonuMap.values()) {
      const ok = konuMap.get(konu);
      if (ok && oranHesapla(ok.dogru, ok.yanlis, ok.bos) < 55) zayifSayisi++;
    }
    return {
      konu_adi: konu,
      toplamDogru: k.dogru,
      toplamYanlis: k.yanlis,
      toplamBos: k.bos,
      oran: oranHesapla(k.dogru, k.yanlis, k.bos),
      zayifOgrenciSayisi: zayifSayisi,
    };
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
    return <p style={{ textAlign: "center", marginTop: 60, color: "#999" }}>Henüz hiçbir öğrenci için sonuç girilmemiş.</p>;
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>Sınıf Genel Durumu</h1>

      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: 16, marginTop: 20 }}>
        <h2 style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>Öğrenciler (nete göre sıralı)</h2>
        {ogrenciler.map((o) => (
          <div key={o.ogrenci_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f2f2f2" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{o.ad_soyad}</p>
              <p style={{ fontSize: 12, color: "#999" }}>
                En zayıf konu: {o.enZayifKonu} ({o.enZayifOran}%)
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: INK }}>{o.net}</p>
              <p style={{ fontSize: 11, color: "#999" }}>{o.dogru}D {o.yanlis}Y {o.bos}B</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: 16, marginTop: 20 }}>
        <h2 style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>
          Sınıf Genelinde En Çok Ağırlık Verilmesi Gereken Konular
        </h2>
        {konular.map((k) => (
          <div key={k.konu_adi} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
            <span style={{ width: 120, fontSize: 13, color: "#333" }}>{k.konu_adi}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#f0f0f0", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(k.zayifOgrenciSayisi / ogrenciler.length) * 100}%`,
                  height: "100%",
                  background: k.zayifOgrenciSayisi > 0 ? RUST : TEAL,
                }}
              />
            </div>
            <span style={{ width: 130, textAlign: "right", fontSize: 12, color: "#777" }}>
              {k.zayifOgrenciSayisi} / {ogrenciler.length} öğrenci zayıf
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
