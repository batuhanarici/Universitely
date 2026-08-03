import { useEffect, useMemo, useState } from "react";
import { kitaplariGetir, kitapEkle, kitapGuncelle, kitapSil } from "../../lib/kaynakQueries";
import type { KaynakTuru, Kitap } from "../../types/database";
import ProgressBar from "../../components/ProgressBar";

const TURLER: { deger: KaynakTuru; etiket: string }[] = [
  { deger: "kitap", etiket: "Kitap" },
  { deger: "soru_bankasi", etiket: "Soru Bankası" },
  { deger: "deneme", etiket: "Deneme" },
  { deger: "video", etiket: "Video" },
];

function gunSayisi(tarih: string): number {
  return Math.round((new Date(tarih + "T00:00:00").getTime() - Date.now()) / 86400000);
}

export default function Kaynaklar() {
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [ad, setAd] = useState("");
  const [kaynakTuru, setKaynakTuru] = useState<KaynakTuru>("kitap");
  const [toplam, setToplam] = useState("");
  const [bitisHedefi, setBitisHedefi] = useState("");

  useEffect(() => {
    kitaplariGetir().then(setKitaplar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle() {
    if (!ad.trim()) return;
    const yeni = await kitapEkle({
      ad: ad.trim(),
      kaynak_turu: kaynakTuru,
      toplam: Number(toplam) || 0,
      baslangic_tarihi: new Date().toISOString().slice(0, 10),
      bitis_hedefi: bitisHedefi || null,
    });
    setKitaplar((k) => [yeni, ...k]);
    setAd("");
    setToplam("");
    setBitisHedefi("");
  }

  async function ilerlemeyiGuncelle(k: Kitap, miktar: number) {
    const yeni = Math.max(0, Math.min(k.toplam, k.ilerleme + miktar));
    if (yeni === k.ilerleme) return;
    setKitaplar((ks) => ks.map((x) => (x.id === k.id ? { ...x, ilerleme: yeni } : x)));
    await kitapGuncelle(k.id, { ilerleme: yeni });
  }

  async function handleSil(id: string) {
    setKitaplar((ks) => ks.filter((x) => x.id !== id));
    await kitapSil(id);
  }

  const genel = useMemo(() => {
    const toplamToplam = kitaplar.reduce((a, k) => a + k.toplam, 0);
    const toplamIlerleme = kitaplar.reduce((a, k) => a + k.ilerleme, 0);
    return {
      yuzde: toplamToplam === 0 ? 0 : Math.round((toplamIlerleme / toplamToplam) * 100),
      toplamIlerleme,
      toplamToplam,
    };
  }, [kitaplar]);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Kaynaklar</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Kaynak Ekle</h2>
        <input className="input" style={{ width: "100%" }} value={ad} onChange={(e) => setAd(e.target.value)} placeholder='Kaynak adı, örn. "345 TYT Matematik"' onKeyDown={(e) => e.key === "Enter" && handleEkle()} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <select className="input" value={kaynakTuru} onChange={(e) => setKaynakTuru(e.target.value as KaynakTuru)} style={{ flex: 1 }}>
            {TURLER.map((t) => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
          </select>
          <input className="input" type="number" min={0} placeholder="Toplam sayfa/soru" value={toplam} onChange={(e) => setToplam(e.target.value)} style={{ flex: 1 }} />
          <input className="input" type="date" value={bitisHedefi} onChange={(e) => setBitisHedefi(e.target.value)} style={{ flex: 1 }} title="Bitiş hedefi" />
          <button onClick={handleEkle} disabled={!ad.trim()} className="btn btn-primary">Ekle</button>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Genel İlerleme</h2>
          <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>{genel.toplamIlerleme}/{genel.toplamToplam} ({genel.yuzde}%)</span>
        </div>
        <ProgressBar oran={genel.yuzde} color="var(--gold-dim)" delay={100} />
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Kaynaklarım</h2>
        {kitaplar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz kaynak eklenmemiş.</p>}
        {kitaplar.map((k, i) => {
          const yuzde = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
          const kalanGun = k.bitis_hedefi ? gunSayisi(k.bitis_hedefi) : null;
          const gunlukHedef = kalanGun !== null && kalanGun > 0 ? Math.max(1, Math.ceil((k.toplam - k.ilerleme) / kalanGun)) : null;
          const renk = k.bitis_hedefi && kalanGun !== null && kalanGun < 0 ? "var(--yanlis)" : yuzde >= 80 ? "var(--dogru)" : "var(--gold-dim)";
          return (
            <div key={k.id} className="stagger-item" style={{ padding: "12px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{k.ad}</p>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {TURLER.find((t) => t.deger === k.kaynak_turu)?.etiket}
                    {kalanGun !== null && ` · ${kalanGun >= 0 ? `${kalanGun} gün kaldı` : `${Math.abs(kalanGun)} gün geçti`}`}
                    {gunlukHedef !== null && ` · günlük ~${gunlukHedef} ilerleme`}
                  </p>
                </div>
                <button onClick={() => handleSil(k.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>{k.ilerleme}/{k.toplam}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button onClick={() => ilerlemeyiGuncelle(k, -1)} className="btn" style={{ padding: "4px 10px", background: "var(--paper-dim)", color: "var(--ink)" }}>−</button>
                <ProgressBar oran={yuzde} color={renk} delay={i * 60} />
                <button onClick={() => ilerlemeyiGuncelle(k, 1)} className="btn" style={{ padding: "4px 10px", background: "var(--ink)", color: "var(--gold-glow)" }}>+</button>
                <span className="mono" style={{ width: 42, textAlign: "right", fontSize: 12.5, color: "var(--muted)" }}>{yuzde}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
