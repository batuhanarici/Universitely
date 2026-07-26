import { useEffect, useState } from "react";
import type { DenemeSablonu, Deneme } from "../../types/database";
import {
  sablonlariGetirDetayli,
  denemeOlustur,
  denemeleriGetir,
} from "../../lib/denemeQueries";

type SablonDetayli = DenemeSablonu & { ders_adi: string };
type DenemeDetayli = Deneme & { sablon_adi: string };

export default function DenemeOlustur() {
  const [sablonlar, setSablonlar] = useState<SablonDetayli[]>([]);
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [sablonId, setSablonId] = useState("");
  const [ad, setAd] = useState("");
  const [tarih, setTarih] = useState(() => new Date().toISOString().slice(0, 10));
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
      await denemeOlustur(ad.trim(), tarih, sablonId);
      setAd("");
      await verileriYenile();
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>Deneme Oluştur</h1>

      {sablonlar.length === 0 ? (
        <p style={{ color: "#b5482a", marginTop: 16 }}>
          Önce en az bir deneme şablonu oluşturman lazım — "Deneme Şablonu Oluştur" ekranına git.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <input
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder='Deneme adı, örn. "Hız Yayınları TYT Deneme 4"'
              style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={sablonId}
                onChange={(e) => setSablonId(e.target.value)}
                style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
              >
                {sablonlar.map((s) => (
                  <option key={s.id} value={s.id}>{s.ad} ({s.ders_adi})</option>
                ))}
              </select>
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
              />
            </div>
            <button
              onClick={handleKaydet}
              disabled={kaydediliyor || !ad.trim()}
              style={{ padding: "10px 18px", borderRadius: 6, background: "#1B2A4A", color: "white", border: "none", alignSelf: "flex-start" }}
            >
              {kaydediliyor ? "Kaydediliyor…" : "Denemeyi Oluştur"}
            </button>
          </div>
        </>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, color: "#555" }}>Oluşturulan Denemeler</h2>
        {denemeler.length === 0 && <p style={{ color: "#999" }}>Henüz deneme yok.</p>}
        <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
          {denemeler.map((d) => (
            <div
              key={d.id}
              style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderTop: "1px solid #eee" }}
            >
              <div>
                <p style={{ fontSize: 14 }}>{d.ad}</p>
                <p style={{ fontSize: 12, color: "#999" }}>{d.sablon_adi}</p>
              </div>
              <span style={{ fontSize: 13, color: "#777" }}>{d.tarih}</span>
            </div>
          ))}
        </div>
      </section>

      <p style={{ marginTop: 24, fontSize: 13, color: "#999" }}>
        Not: Şu an sadece deneme kaydı oluşturuluyor. Soru sonuçlarının (D/Y/B) girilmesi, optik
        okuyucu import modülü hazır olunca otomatik yapılacak.
      </p>
    </div>
  );
}
