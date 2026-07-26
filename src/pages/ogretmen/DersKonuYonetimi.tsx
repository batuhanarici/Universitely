import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import { dersleriGetir, dersEkle, konulariGetir, konuEkle } from "../../lib/queries";

export default function DersKonuYonetimi() {
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [seciliDersId, setSeciliDersId] = useState<string>("");
  const [konular, setKonular] = useState<Konu[]>([]);
  const [yeniDersAdi, setYeniDersAdi] = useState("");
  const [yeniKonuAdi, setYeniKonuAdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    dersleriGetir()
      .then((d) => {
        setDersler(d);
        if (d.length > 0) setSeciliDersId(d[0].id);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!seciliDersId) {
      setKonular([]);
      return;
    }
    konulariGetir(seciliDersId).then(setKonular);
  }, [seciliDersId]);

  async function handleDersEkle() {
    if (!yeniDersAdi.trim()) return;
    const yeni = await dersEkle(yeniDersAdi.trim());
    setDersler((d) => [...d, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniDersAdi("");
    setSeciliDersId(yeni.id);
  }

  async function handleKonuEkle() {
    if (!yeniKonuAdi.trim() || !seciliDersId) return;
    const yeni = await konuEkle(seciliDersId, yeniKonuAdi.trim());
    setKonular((k) => [...k, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniKonuAdi("");
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>Ders / Konu Yönetimi</h1>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 15, color: "#555" }}>Dersler</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={yeniDersAdi}
            onChange={(e) => setYeniDersAdi(e.target.value)}
            placeholder="örn. Matematik"
            style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button onClick={handleDersEkle} style={{ padding: "8px 14px", borderRadius: 6 }}>
            Ekle
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {dersler.map((d) => (
            <button
              key={d.id}
              onClick={() => setSeciliDersId(d.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: d.id === seciliDersId ? "#1B2A4A" : "white",
                color: d.id === seciliDersId ? "white" : "#333",
              }}
            >
              {d.ad}
            </button>
          ))}
        </div>
      </section>

      {seciliDersId && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 15, color: "#555" }}>
            Konular — {dersler.find((d) => d.id === seciliDersId)?.ad}
          </h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={yeniKonuAdi}
              onChange={(e) => setYeniKonuAdi(e.target.value)}
              placeholder="örn. Türev"
              style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <button onClick={handleKonuEkle} style={{ padding: "8px 14px", borderRadius: 6 }}>
              Ekle
            </button>
          </div>
          <ul style={{ paddingLeft: 18 }}>
            {konular.map((k) => (
              <li key={k.id} style={{ padding: "3px 0" }}>{k.ad}</li>
            ))}
            {konular.length === 0 && <p style={{ color: "#999" }}>Henüz konu eklenmedi.</p>}
          </ul>
        </section>
      )}
    </div>
  );
}
