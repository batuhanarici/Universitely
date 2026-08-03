import { useEffect, useState } from "react";
import type { DenemeSablonu, Deneme, DenemeTuru } from "../../types/database";
import { sablonlariGetirDetayli, denemeOlustur, denemeleriGetir } from "../../lib/denemeQueries";

type SablonDetayli = DenemeSablonu & { ders_adi: string };
type DenemeDetayli = Deneme & { sablon_adi: string };

const TURLER: { deger: DenemeTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "brans", etiket: "Branş" },
];

export default function DenemeOlustur() {
  const [sablonlar, setSablonlar] = useState<SablonDetayli[]>([]);
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [sablonId, setSablonId] = useState("");
  const [ad, setAd] = useState("");
  const [tarih, setTarih] = useState(() => new Date().toISOString().slice(0, 10));
  const [tur, setTur] = useState<DenemeTuru>("tyt");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  async function verileriYenile() {
    const [s, d] = await Promise.all([sablonlariGetirDetayli(), denemeleriGetir()]);
    setSablonlar(s);
    setDenemeler(d);
    if (s.length > 0 && !sablonId) setSablonId(s[0].id);
  }

  useEffect(() => {
    verileriYenile().finally(() => setYukleniyor(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleKaydet() {
    if (!ad.trim() || !sablonId || !tarih) return;
    setKaydediliyor(true);
    try {
      await denemeOlustur(ad.trim(), tarih, sablonId, tur);
      setAd("");
      await verileriYenile();
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Deneme Oluştur</h1>

      {sablonlar.length === 0 ? (
        <p style={{ color: "var(--yanlis)" }}>Önce en az bir deneme şablonu oluşturman lazım — "Deneme Şablonu Oluştur" ekranına git.</p>
      ) : (
        <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder='Deneme adı, örn. "Hız Yayınları TYT Deneme 4"' className="input" />
            <div style={{ display: "flex", gap: 10 }}>
              <select value={sablonId} onChange={(e) => setSablonId(e.target.value)} className="input" style={{ flex: 1 }}>
                {sablonlar.map((s) => <option key={s.id} value={s.id}>{s.ad} ({s.ders_adi})</option>)}
              </select>
              <select value={tur} onChange={(e) => setTur(e.target.value as DenemeTuru)} className="input" style={{ width: 110 }}>
                {TURLER.map((t) => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
              </select>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className="input" />
            </div>
            <button onClick={handleKaydet} disabled={kaydediliyor || !ad.trim()} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              {kaydediliyor ? "Kaydediliyor…" : "Denemeyi Oluştur"}
            </button>
          </div>
        </div>
      )}

      <div className="card stagger-item" style={{ marginTop: 20, animationDelay: "0.1s" }}>
        <h2 className="card-title">Oluşturulan Denemeler</h2>
        {denemeler.length === 0 && <p style={{ color: "var(--muted)" }}>Henüz deneme yok.</p>}
        {denemeler.map((d, i) => (
          <div key={d.id} className="stagger-item" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
            <div>
              <p style={{ fontSize: 14 }}>{d.ad}</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{d.sablon_adi}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              {d.tur && <span className="chip" style={{ padding: "2px 8px", fontSize: 11 }}>{d.tur.toUpperCase()}</span>}
              <p className="mono" style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{d.tarih}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--muted)" }}>
        Not: Şu an sadece deneme kaydı oluşturuluyor. Soru sonuçlarının (D/Y/B) girilmesi, optik okuyucu import modülü hazır olunca otomatik yapılacak.
      </p>
    </div>
  );
}
