import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { kitapAta, ogrenciKitaplariGetir, kitapSil } from "../../lib/kaynakQueries";
import type { KaynakTuru, Kitap } from "../../types/database";
import ProgressBar from "../../components/ProgressBar";

const TURLER: { deger: KaynakTuru; etiket: string }[] = [
  { deger: "kitap", etiket: "Kitap" },
  { deger: "soru_bankasi", etiket: "Soru Bankası" },
  { deger: "deneme", etiket: "Deneme" },
  { deger: "video", etiket: "Video" },
];

export default function KaynakAta() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [ad, setAd] = useState("");
  const [kaynakTuru, setKaynakTuru] = useState<KaynakTuru>("kitap");
  const [toplam, setToplam] = useState("");
  const [bitisHedefi, setBitisHedefi] = useState("");

  useEffect(() => {
    kocOgrencileri()
      .then((o) => {
        setOgrenciler(o);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!ogrenciId) {
      setKitaplar([]);
      return;
    }
    ogrenciKitaplariGetir(ogrenciId).then(setKitaplar).catch(() => {});
  }, [ogrenciId]);

  async function handleAta() {
    if (!ogrenciId || !ad.trim()) return;
    await kitapAta(ogrenciId, {
      ad: ad.trim(),
      kaynak_turu: kaynakTuru,
      toplam: Number(toplam) || 0,
      baslangic_tarihi: new Date().toISOString().slice(0, 10),
      bitis_hedefi: bitisHedefi || null,
    });
    setAd("");
    setToplam("");
    setBitisHedefi("");
    setKitaplar(await ogrenciKitaplariGetir(ogrenciId));
  }

  async function handleSil(id: string) {
    setKitaplar((ks) => ks.filter((x) => x.id !== id));
    await kitapSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Kaynak Ata</h1>

      {ogrenciler.length === 0 ? (
        <div className="card stagger-item">
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </div>
      ) : (
        <>
          <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
            <h2 className="card-title">Öğrenci</h2>
            <select className="input" style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </select>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
            <h2 className="card-title">Yeni Kaynak Atam</h2>
            <input className="input" style={{ width: "100%" }} value={ad} onChange={(e) => setAd(e.target.value)} placeholder='Kaynak adı, örn. "345 TYT Matematik"' onKeyDown={(e) => e.key === "Enter" && handleAta()} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <select className="input" value={kaynakTuru} onChange={(e) => setKaynakTuru(e.target.value as KaynakTuru)} style={{ flex: 1, minWidth: 130 }}>
                {TURLER.map((t) => (
                  <option key={t.deger} value={t.deger}>{t.etiket}</option>
                ))}
              </select>
              <input className="input" type="number" min={0} placeholder="Toplam sayfa/soru" value={toplam} onChange={(e) => setToplam(e.target.value)} style={{ flex: 1, minWidth: 120 }} />
              <input className="input" type="date" value={bitisHedefi} onChange={(e) => setBitisHedefi(e.target.value)} style={{ flex: 1, minWidth: 140 }} title="Bitiş hedefi" />
              <button onClick={handleAta} disabled={!ad.trim()} className="btn btn-primary">Ata</button>
            </div>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Atanan Kaynaklar</h2>
            {kitaplar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu öğrenciye henüz kaynak atanmamış.</p>}
            {kitaplar.map((k, i) => {
              const yuzde = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
              return (
                <div key={k.id} className="stagger-item" style={{ padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{k.ad}</p>
                      <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {TURLER.find((t) => t.deger === k.kaynak_turu)?.etiket} · {k.ilerleme}/{k.toplam} ({yuzde}%)
                      </p>
                    </div>
                    <button onClick={() => handleSil(k.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Kaldır</button>
                  </div>
                  <ProgressBar oran={yuzde} color="var(--gold-dim)" delay={i * 60} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
