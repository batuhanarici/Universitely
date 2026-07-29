import { useEffect, useMemo, useState } from "react";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";
import AnimatedNumber from "../../components/AnimatedNumber";
import ProgressBar from "../../components/ProgressBar";

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
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Sınıf Genel Durumu</h1>
        <p style={{ color: "var(--muted)" }}>Henüz hiçbir öğrenci için sonuç girilmemiş.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Sınıf Genel Durumu</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Öğrenciler (nete göre sıralı)</h2>
        {ogrenciler.map((o, i) => (
          <div key={o.ogrenci_id} className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.1 + i * 0.05}s` }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{o.ad_soyad}</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>En zayıf konu: {o.enZayifKonu} ({o.enZayifOran}%)</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
                <AnimatedNumber value={o.net} decimals={1} />
              </p>
              <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{o.dogru}D {o.yanlis}Y {o.bos}B</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card stagger-item" style={{ marginTop: 20, animationDelay: "0.15s" }}>
        <h2 className="card-title">Sınıf Genelinde En Çok Ağırlık Verilmesi Gereken Konular</h2>
        {konular.map((k, i) => (
          <div key={k.konu_adi} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.05}s` }}>
            <span style={{ width: 130, fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{k.konu_adi}</span>
            <ProgressBar oran={(k.zayifOgrenciSayisi / ogrenciler.length) * 100} color={k.zayifOgrenciSayisi > 0 ? "var(--yanlis)" : "var(--dogru)"} delay={i * 60} />
            <span className="mono" style={{ width: 130, textAlign: "right", fontSize: 12, color: "var(--muted)" }}>
              {k.zayifOgrenciSayisi} / {ogrenciler.length} öğrenci
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
